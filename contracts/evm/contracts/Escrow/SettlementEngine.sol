// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IPermit2, ISignatureTransfer} from "../interfaces/IPermit2.sol";

import {IHTLCEscrowFactory} from "../interfaces/IHTLCEscrowFactory.sol";
import {IHTLCEscrow} from "../interfaces/IHTLCEscrow.sol";

/// @notice Custom errors for gas efficiency
error InvalidOrderHash();
error InsufficientAllowance();
error TransferFailed();
error EscrowCreationFailed();
error EscrowNotFound();
error InvalidAddress();
error Unauthorized();
error AlreadySettled();
error NotAuthorized();
error InvalidPermitData();
error InvalidAmount();
error InvalidTimeLocks();

/**
 * @title SettlementEngine
 * @author Your Name
 * @notice Settlement engine for atomic token transfers and escrow management using Permit2
 * @dev Handles escrow creation with Permit2, settlement via withdraw, and recovery via cancel
 * @custom:security-contact security@yourcompany.com
 */
contract SettlementEngine is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    /// @notice The HTLCEscrowFactory contract address
    IHTLCEscrowFactory public immutable FACTORY;

    /// @notice Permit2 contract address
    address public immutable PERMIT2;

    /**
     * @notice Emitted when an escrow is created using Permit2
     * @param orderHash The unique identifier for the order
     * @param escrow The address of the created escrow
     * @param maker The address that created the order
     * @param token The ERC20 token contract address
     * @param amount The amount of tokens transferred
     */
    event EscrowCreated(
        bytes32 indexed orderHash,
        address indexed escrow,
        address indexed resolver,
        address token,
        address maker,
        address taker,
        uint256 safetyDeposit,
        uint256[3] timeLocks,
        uint256 amount
    );

    /**
     * @notice Emitted when an escrow is settled via withdraw
     * @param orderHash The unique identifier for the order
     * @param escrow The address of the escrow
     * @param taker The address that claimed the order
     */
    event EscrowSettled(
        bytes32 indexed orderHash,
        address indexed escrow,
        address indexed taker
    );

    /**
     * @notice Emitted when an escrow is recovered via cancel
     * @param orderHash The unique identifier for the order
     * @param escrow The address of the escrow
     * @param maker The address that cancelled the order
     */
    event EscrowRecovered(
        bytes32 indexed orderHash,
        address indexed escrow,
        address indexed maker
    );

    /**
     * @notice Constructor that sets the factory and permit2 addresses
     * @param _factory The HTLCEscrowFactory contract address
     * @param _permit2 The Permit2 contract address
     */
    constructor(address _factory, address _permit2) Ownable(msg.sender) {
        if (_factory == address(0) || _permit2 == address(0)) {
            revert InvalidAddress();
        }
        
        FACTORY = IHTLCEscrowFactory(_factory);
        PERMIT2 = _permit2;
    }

    /**
     * @notice Create an escrow using Permit2 for token transfer
     * @dev Transfers tokens from maker to predicted escrow address using Permit2, then creates escrow
     * @param _orderHash The order hash for the escrow
     * @param _hashLock The hash of the secret preimage
     * @param _token The ERC20 token contract address
     * @param _maker The address that created the order
     * @param _taker The address that can claim the order
     * @param _resolver The address authorized to resolve the order
     * @param _amount The amount of tokens to be swapped
     * @param _safetyDeposit The ETH safety deposit amount
     * @param _timeLocks Array of time lock values [deployedAt, withdrawal, cancellation]
     * @param _permitData The Permit2 permit data containing PermitSingle struct and signature
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
        uint256[3] memory _timeLocks,
        bytes calldata _permitData
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

        // Predict the escrow address
        address predictedEscrow = FACTORY.getEscrow(_orderHash);
        
        // Check if escrow already exists
        if (FACTORY.escrowExists(_orderHash)) {
            revert EscrowCreationFailed();
        }

        // Transfer tokens from maker to predicted escrow address using Permit2
        _transferTokensWithPermit2(
            _token,
            _maker,
            predictedEscrow,
            _amount,
            _permitData
        );

        // Create the escrow at the predicted address
        escrow = FACTORY.createEscrow{value: msg.value}(
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

        // Verify the escrow was created at the expected address
        if (escrow != predictedEscrow) {
            revert EscrowCreationFailed();
        }

        emit EscrowCreated(_orderHash, escrow, _resolver, _token, _maker, _taker, _safetyDeposit, _timeLocks, _amount);

        return escrow;
    }

    /**
     * @notice Settle an escrow by calling withdraw on the HTLCEscrow contract
     * @dev Calls the withdraw function on the escrow contract to claim tokens
     * @param _orderHash The order hash for the escrow
     * @param _preimage The secret preimage that matches the hash lock
     * @custom:security Protected by reentrancy guard
     */
    function settle(bytes32 _orderHash, bytes32 _preimage) external nonReentrant {
        // Get the escrow address
        address escrowAddress = FACTORY.getEscrow(_orderHash);
        
        // Check if escrow exists
        if (!FACTORY.escrowExists(_orderHash)) {
            revert EscrowNotFound();
        }

        // Call withdraw on the HTLCEscrow contract
        IHTLCEscrow(escrowAddress).withdraw(_preimage);

        emit EscrowSettled(_orderHash, escrowAddress, msg.sender);
    }

    /**
     * @notice Recover an escrow by calling cancel on the HTLCEscrow contract
     * @dev Calls the cancel function on the escrow contract to return funds to maker
     * @param _orderHash The order hash for the escrow
     * @custom:security Protected by reentrancy guard
     */
    function recover(bytes32 _orderHash) external nonReentrant {
        // Get the escrow address
        address escrowAddress = FACTORY.getEscrow(_orderHash);
        
        // Check if escrow exists
        if (!FACTORY.escrowExists(_orderHash)) {
            revert EscrowNotFound();
        }

        // Call cancel on the HTLCEscrow contract
        IHTLCEscrow(escrowAddress).cancel();

        emit EscrowRecovered(_orderHash, escrowAddress, msg.sender);
    }

    /**
     * @notice Get the escrow address for a given order hash
     * @dev Returns the deterministic escrow address
     * @param _orderHash The order hash
     * @return The escrow address
     */
    function getEscrow(bytes32 _orderHash) external view returns (address) {
        return FACTORY.getEscrow(_orderHash);
    }

    /**
     * @notice Check if an escrow exists for a given order hash
     * @dev Checks if the deterministic address has deployed code
     * @param _orderHash The order hash
     * @return True if escrow exists, false otherwise
     */
    function escrowExists(bytes32 _orderHash) external view returns (bool) {
        return FACTORY.escrowExists(_orderHash);
    }

    /**
     * @notice Get the current state of an escrow
     * @dev Returns the state of the HTLCEscrow contract
     * @param _orderHash The order hash
     * @return The current state of the escrow
     */
    function getEscrowState(bytes32 _orderHash) external view returns (IHTLCEscrow.State) {
        address escrowAddress = FACTORY.getEscrow(_orderHash);
        return IHTLCEscrow(escrowAddress).getState();
    }

    /**
     * @notice Internal function to transfer tokens using Permit2
     * @dev Handles Permit2 permit and transfer logic
     * @param _token The ERC20 token contract address
     * @param _from The address to transfer tokens from
     * @param _to The address to transfer tokens to
     * @param _amount The amount of tokens to transfer
     * @param _permitData The Permit2 permit data containing signature and permit details
     */
    function _transferTokensWithPermit2(
        address _token,
        address _from,
        address _to,
        uint256 _amount,
        bytes calldata _permitData
    ) internal {
        // Decode the permit data to extract permit and signature
        (
            ISignatureTransfer.PermitTransferFrom memory permit,
            bytes memory signature
        ) = abi.decode(_permitData, (ISignatureTransfer.PermitTransferFrom, bytes));

        // Validate that the permit matches our requirements
        if (permit.permitted.token != _token) {
            revert InvalidPermitData();
        }
        
        if (permit.permitted.amount < _amount) {
            revert InsufficientAllowance();
        }

        // Use Permit2 to transfer tokens from user to this contract
        ISignatureTransfer(PERMIT2).permitTransferFrom(
            permit,
            ISignatureTransfer.SignatureTransferDetails({
                to: _to,
                requestedAmount: _amount
            }),
            _from,
            signature
        );
    }
} 