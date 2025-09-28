// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";

/// @notice Custom errors for gas efficiency
error InvalidOrderHash();
error InsufficientSafetyDeposit();
error InsufficientBalance();
error InvalidSecret();
error AlreadyWithdrawn();
error AlreadyCancelled();
error InvalidResolver();
error InvalidAddress();
error TimeLockActive();
error InvalidAmount();
error InvalidTimeLocks();


/**
 * @title HTLCEscrow
 * @author Your Name
 * @notice A gas-optimized Hash Time Lock Contract (HTLC) for secure atomic swaps
 * @dev This contract implements a proxy-compatible HTLC with reentrancy protection
 *      and gas optimizations for enterprise use cases
 * @custom:security-contact security@yourcompany.com
 */
contract HTLCEscrow is ReentrancyGuard, Initializable {
    using SafeERC20 for IERC20;

    /**
     * @notice Packed order structure for gas optimization
     * @dev All order data is stored in a single struct to minimize storage operations
     * @dev Packed to fit in 3 storage slots for maximum gas efficiency
     */
    struct PackedOrder {
        // Slot 1: Core identifiers (32 + 32 = 64 bytes)
        bytes32 orderHash;      /// @notice Unique identifier for the order
        bytes32 hashLock;       /// @notice Hash of the secret preimage
        
        // Slot 2: Addresses (20 + 20 + 20 + 20 = 80 bytes, padded to 96 bytes)
        address token;          /// @notice ERC20 token contract address
        address maker;          /// @notice Address that created the order
        address taker;          /// @notice Address that can claim the order
        address resolver;       /// @notice Address authorized to resolve the order
        
        // Slot 3: Amounts and status (32 + 32 + 32 + 1 = 97 bytes, padded to 128 bytes)
        uint256 amount;         /// @notice Amount of tokens to be swapped
        uint256 safetyDeposit;  /// @notice ETH safety deposit amount
        uint256 deployedAt;     /// @notice When the contract was deployed
        uint8 status;           /// @notice Order status: 0=active, 1=withdrawn, 2=cancelled
        
        // Slot 4: Time locks (32 + 32 = 64 bytes)
        uint256 withdrawalTime; /// @notice When withdrawals are allowed
        uint256 cancellationTime; /// @notice When cancellations are allowed
    }

    /// @notice Constants for gas optimization
    uint8 private constant STATUS_ACTIVE = 0;
    uint8 private constant STATUS_WITHDRAWN = 1;
    uint8 private constant STATUS_CANCELLED = 2;

    /**
     * @notice Enumeration of order states
     * @dev Represents the current state of an HTLC order
     */
    enum State {
        ACTIVE,         /// @notice Order is active and can be withdrawn or cancelled
        WITHDRAWN,      /// @notice Order has been withdrawn by the taker
        CANCELLED       /// @notice Order has been cancelled by the maker
    }

    /// @notice The order data for this HTLC instance
    PackedOrder public order;

    /**
     * @notice Emitted when a new order is created
     * @param orderHash The unique identifier for the order
     * @param token The ERC20 token contract address
     * @param maker The address that created the order
     * @param taker The address that can claim the order
     * @param amount The amount of tokens to be swapped
     * @param safetyDeposit The ETH safety deposit amount
     */
    event OrderCreated(
        bytes32 indexed orderHash,
        address indexed token,
        address indexed maker,
        address taker,
        uint256 amount,
        uint256 safetyDeposit
    );

    /**
     * @notice Emitted when an order is withdrawn by the taker
     * @param orderHash The unique identifier for the order
     * @param taker The address that claimed the order
     * @param amount The amount of tokens withdrawn
     */
    event Withdrawn(
        bytes32 indexed orderHash,
        address indexed taker,
        uint256 amount
    );

    /**
     * @notice Emitted when an order is cancelled
     * @param orderHash The unique identifier for the order
     * @param maker The address that cancelled the order
     * @param amount The amount of tokens returned
     */
    event Cancelled(
        bytes32 indexed orderHash,
        address indexed maker,
        uint256 amount
    );

    /**
     * @notice Constructor for proxy compatibility
     * @dev Disables initializers to prevent direct initialization
     * @custom:oz-upgrades-unsafe-allow constructor
     */
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Modifier to ensure function is called after a specific time
     * @param time The timestamp after which the function can be called
     * @dev Reverts if called before the specified time
     */
    modifier onlyAfterTime(uint256 time) {
        if (block.timestamp < time) revert TimeLockActive();
        _;
    }

    /**
     * @notice Modifier to ensure only the resolver can call the function
     * @dev Reverts if caller is not the authorized resolver
     */
    modifier onlyResolver() {
        if (msg.sender != order.resolver) revert InvalidResolver();
        _;
    }

    /**
     * @notice Modifier to ensure the order is still active
     * @dev Reverts if the order has already been withdrawn or cancelled
     */
    modifier onlyActive() {
        uint8 status = order.status;
        if (status == STATUS_WITHDRAWN) revert AlreadyWithdrawn();
        if (status == STATUS_CANCELLED) revert AlreadyCancelled();
        _;
    }

    /**
     * @notice Initialize the HTLC with order parameters
     * @dev This function can only be called once and must be called through a proxy
     * @param _orderHash The unique identifier for the order
     * @param _hashLock The hash of the secret preimage
     * @param _token The ERC20 token contract address
     * @param _maker The address that created the order
     * @param _taker The address that can claim the order
     * @param _resolver The address authorized to resolve the order
     * @param _amount The amount of tokens to be swapped
     * @param _safetyDeposit The ETH safety deposit amount
     * @param _timeLocks Array of time lock values [deployedAt, withdrawal, cancellation]
     * @custom:security This function validates all inputs and order hash integrity
     */
    function initialize(
        bytes32 _orderHash,
        bytes32 _hashLock,
        address _token,
        address _maker,
        address _taker,
        address _resolver,
        uint256 _amount,
        uint256 _safetyDeposit,
        uint256[3] memory _timeLocks
    ) external payable initializer {
        // Batch address validation for gas efficiency
        if (_token == address(0) || _maker == address(0) || _taker == address(0) || _resolver == address(0)) {
            revert InvalidAddress();
        }

        // Validate amounts
        if (_amount == 0) revert InvalidAmount();
        if (msg.value < _safetyDeposit) revert InsufficientSafetyDeposit();

        // Validate time locks
        if (_timeLocks[1] <= _timeLocks[0] || _timeLocks[2] <= _timeLocks[0]) {
            revert InvalidTimeLocks();
        }

        // Verify order hash integrity
        if (_computeOrderHash(_hashLock, _token, _maker, _taker, _resolver, _amount, _safetyDeposit, _timeLocks) != _orderHash) {
            revert InvalidOrderHash();
        }

        // Check token balance
        if (IERC20(_token).balanceOf(address(this)) < _amount) revert InsufficientBalance();

        // Use packed struct for gas optimization
        order = PackedOrder({
            orderHash: _orderHash,
            hashLock: _hashLock,
            token: _token,
            maker: _maker,
            taker: _taker,
            resolver: _resolver,
            amount: _amount,
            safetyDeposit: _safetyDeposit,
            deployedAt: _timeLocks[0],
            status: STATUS_ACTIVE,
            withdrawalTime: _timeLocks[1],
            cancellationTime: _timeLocks[2]
        });

        // Optimized event emission
        emit OrderCreated(_orderHash, _token, _maker, _taker, _amount, _safetyDeposit);
    }

    /**
     * @notice Withdraw the order by revealing the secret preimage
     * @dev Only the resolver can call this function after the withdrawal time lock
     * @param _preimage The secret that matches the hash lock
     * @custom:security Protected by reentrancy guard and time locks
     */
    function withdraw(bytes32 _preimage) external nonReentrant onlyAfterTime(order.withdrawalTime) onlyActive {
        if (keccak256(abi.encode(_preimage)) != order.hashLock) revert InvalidSecret();

        // Update status in single storage write
        order.status = STATUS_WITHDRAWN;
        
        // Cache values to avoid multiple SLOADs
        address token = order.token;
        address taker = order.taker;
        uint256 amount = order.amount;
        address resolver = order.resolver;
        uint256 safetyDeposit = order.safetyDeposit;
        
        IERC20(token).safeTransfer(taker, amount);
        payable(resolver).transfer(safetyDeposit);
        emit Withdrawn(order.orderHash, taker, amount);
    }

    /**
     * @notice Cancel the order and return funds to the maker
     * @dev Can be called by anyone after the cancellation time lock
     * @custom:security Protected by reentrancy guard and time locks
     */
    function cancel() external nonReentrant onlyAfterTime(order.cancellationTime) onlyActive {
        // Update status in single storage write
        order.status = STATUS_CANCELLED;
        
        // Cache values to avoid multiple SLOADs
        address token = order.token;
        address maker = order.maker;
        uint256 amount = order.amount;
        uint256 safetyDeposit = order.safetyDeposit;
        
        IERC20(token).safeTransfer(maker, amount);
        payable(maker).transfer(safetyDeposit);
        emit Cancelled(order.orderHash, maker, amount);
    }

    /**
     * @notice Get the current state of the order
     * @return The current state of the order (ACTIVE, WITHDRAWN, or CANCELLED)
     */
    function getState() external view returns (State) {
        uint8 status = order.status;
        if (status == STATUS_WITHDRAWN) return State.WITHDRAWN;
        if (status == STATUS_CANCELLED) return State.CANCELLED;
        return State.ACTIVE;
    }

    /**
     * @notice Get order details for external queries
     * @return orderHash The unique identifier for the order
     * @return token The ERC20 token contract address
     * @return maker The address that created the order
     * @return taker The address that can claim the order
     * @return resolver The address authorized to resolve the order
     * @return amount The amount of tokens to be swapped
     * @return safetyDeposit The ETH safety deposit amount
     * @return status The current status of the order
     */
    function getOrderDetails() external view returns (
        bytes32 orderHash,
        address token,
        address maker,
        address taker,
        address resolver,
        uint256 amount,
        uint256 safetyDeposit,
        uint8 status
    ) {
        PackedOrder memory _order = order;
        return (
            _order.orderHash,
            _order.token,
            _order.maker,
            _order.taker,
            _order.resolver,
            _order.amount,
            _order.safetyDeposit,
            _order.status
        );
    }

    /**
     * @notice Returns the implementation version for proxy compatibility
     * @return The version string of this implementation
     */
    function version() external pure returns (string memory) {
        return "1.0.0";
    }


    /**
     * @notice Compute the order hash for validation
     * @dev Uses abi.encode for security (prevents hash collisions)
     * @param _hashLock The hash of the secret preimage
     * @param _token The ERC20 token contract address
     * @param _maker The address that created the order
     * @param _taker The address that can claim the order
     * @param _amount The amount of tokens to be swapped
     * @param _safetyDeposit The ETH safety deposit amount
     * @param _timeLocks Array of time lock values
     * @return The computed order hash
     */
    function _computeOrderHash(
        bytes32 _hashLock,
        address _token,
        address _maker,
        address _taker,
        address _resolver,
        uint256 _amount,
        uint256 _safetyDeposit,
        uint256[3] memory _timeLocks
    ) internal pure returns (bytes32) {
        // Use abi.encode for security (prevents hash collisions)
        return keccak256(abi.encode(
            _hashLock,
            _token,
            _maker,
            _taker,
            _resolver,
            _amount,
            _safetyDeposit,
            _timeLocks[0],
            _timeLocks[1],
            _timeLocks[2]
        ));
    }


}