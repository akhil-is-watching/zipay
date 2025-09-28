// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {IHTLCEscrow} from "../interfaces/IHTLCEscrow.sol";

/// @notice Custom errors for gas efficiency
error EscrowAlreadyExists();
error EscrowCreationFailed();
error InvalidAddress();
error Unauthorized();
error InvalidAmount();
error InvalidTimeLocks();
error InvalidOrderHash();
error InsufficientSafetyDeposit();
error InsufficientBalance();
error InvalidSecret();
error TimeLockActive();
error InvalidResolver();
error AlreadyWithdrawn();
error AlreadyCancelled();

/**
 * @title HTLCEscrowFactory
 * @author Your Name
 * @notice Factory contract for creating minimal proxy clones of HTLCEscrow
 * @dev Uses EIP-1167 minimal proxy pattern for gas-efficient deployment with deterministic addresses
 * @custom:security-contact security@yourcompany.com
 */
contract HTLCEscrowFactory is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    
    /// @notice The implementation contract address for HTLCEscrow
    address public immutable IMPLEMENTATION;
    
    /**
     * @notice Emitted when a new escrow is created
     * @param orderHash The unique identifier for the order
     * @param escrow The address of the created escrow
     * @param token The ERC20 token contract address
     * @param maker The address that created the order
     * @param taker The address that can claim the order
     * @param amount The amount of tokens to be swapped
     * @param safetyDeposit The ETH safety deposit amount
     */
    event EscrowCreated(
        bytes32 indexed orderHash,
        address indexed escrow,
        address indexed token,
        address maker,
        address taker,
        uint256 amount,
        uint256 safetyDeposit
    );
    
    /**
     * @notice Emitted when the implementation contract is updated
     * @param oldImplementation The previous implementation address
     * @param newImplementation The new implementation address
     */
    event ImplementationUpdated(address indexed oldImplementation, address indexed newImplementation);
    
    /**
     * @notice Constructor that deploys the implementation contract
     * @dev The implementation contract is deployed once and used for all clones
     */
    constructor(address _implementation) Ownable(msg.sender) {
        // Deploy the implementation contract
        IMPLEMENTATION = _implementation;
    }
    
    /**
     * @notice Create a new HTLC escrow using minimal proxy with deterministic address
     * @dev Uses CREATE2 with orderHash as salt for deterministic addresses
     * @param _orderHash The order hash for the escrow (used as salt for deterministic deployment)
     * @param _hashLock The hash of the secret preimage
     * @param _token The ERC20 token contract address
     * @param _maker The address that created the order
     * @param _taker The address that can claim the order
     * @param _resolver The address authorized to resolve the order
     * @param _amount The amount of tokens to be swapped
     * @param _safetyDeposit The ETH safety deposit amount
     * @param _timeLocks Array of time lock values [deployedAt, withdrawal, cancellation]
     * @return escrow The address of the created escrow
     * @custom:security Protected by reentrancy guard and input validation
     */
    function createEscrow(
        bytes32 _orderHash,
        bytes32 _hashLock,
        address _token,
        address _maker,
        address _taker,
        address _resolver,
        uint256 _amount,
        uint256 _safetyDeposit,
        uint256[3] memory _timeLocks
    ) external payable nonReentrant returns (address escrow) {
        // Batch address validation for gas efficiency
        if (_token == address(0) || _maker == address(0) || _taker == address(0) || _resolver == address(0)) {
            revert InvalidAddress();
        }

        // Validate amounts
        if (_amount == 0) revert InvalidAmount();

        // Validate time locks
        if (_timeLocks[1] <= _timeLocks[0] || _timeLocks[2] <= _timeLocks[0]) {
            revert InvalidTimeLocks();
        }
        
        // Check if escrow already exists by checking if the deterministic address has code
        address predictedAddress = Clones.predictDeterministicAddress(IMPLEMENTATION, _orderHash, address(this));
        if (_hasCode(predictedAddress)) {
            revert EscrowAlreadyExists();
        }
        
        // Create minimal proxy with deterministic address using orderHash as salt
        escrow = Clones.cloneDeterministic(IMPLEMENTATION, _orderHash);
        
        if (escrow == address(0)) {
            revert EscrowCreationFailed();
        }
        
        // Check if tokens are already in the escrow (e.g., transferred via Permit2)
        // If not, transfer from factory to escrow
        uint256 escrowBalance = IERC20(_token).balanceOf(escrow);
        if (escrowBalance < _amount) {
            uint256 needed = _amount - escrowBalance;
            IERC20(_token).safeTransfer(escrow, needed);
        }
        
        // Initialize the escrow
        IHTLCEscrow(escrow).initialize{value: msg.value}(
            _orderHash,
            _hashLock,
            _token,
            _maker,
            _taker,
            _resolver,
            _amount,
            _safetyDeposit,
            _timeLocks
        );
        
        emit EscrowCreated(_orderHash, escrow, _token, _maker, _taker, _amount, _safetyDeposit);
        
        return escrow;
    }
    
    /**
     * @notice Get the deterministic escrow address for a given order hash
     * @dev Returns the same address that will be created for the given orderHash
     * @param _orderHash The order hash
     * @return The deterministic escrow address
     */
    function getEscrow(bytes32 _orderHash) external view returns (address) {
        return Clones.predictDeterministicAddress(IMPLEMENTATION, _orderHash, address(this));
    }
    
    /**
     * @notice Check if an escrow exists for a given order hash
     * @dev Checks if the deterministic address has deployed code
     * @param _orderHash The order hash
     * @return True if escrow exists, false otherwise
     */
    function escrowExists(bytes32 _orderHash) external view returns (bool) {
        address escrowAddress = Clones.predictDeterministicAddress(IMPLEMENTATION, _orderHash, address(this));
        return _hasCode(escrowAddress);
    }
    
    /**
     * @notice Get the implementation contract address
     * @dev Returns the address of the implementation contract used for all clones
     * @return The implementation contract address
     */
    function getImplementation() external view returns (address) {
        return IMPLEMENTATION;
    }
    
    /**
     * @notice Internal function to check if an address has code deployed
     * @dev Uses extcodesize to determine if an address contains deployed code
     * @param _addr The address to check
     * @return True if the address has code, false otherwise
     */
    function _hasCode(address _addr) internal view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(_addr)
        }
        return size > 0;
    }
}
