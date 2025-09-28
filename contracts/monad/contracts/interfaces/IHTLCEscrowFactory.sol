// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IHTLCEscrowFactory
 * @notice Interface for HTLCEscrowFactory contract
 * @dev Defines the interface for HTLC escrow factory functionality
 */
interface IHTLCEscrowFactory {
    /**
     * @notice Create a new HTLC escrow using minimal proxy with deterministic address
     * @param _orderHash The order hash for the escrow (used as salt for deterministic deployment)
     * @param _hashLock The hash lock for the escrow
     * @param _token The token address
     * @param _maker The maker address
     * @param _taker The taker address
     * @param _resolver The resolver address
     * @param _amount The amount to escrow
     * @param _safetyDeposit The safety deposit amount
     * @param _timeLocks The time locks array
     * @return escrow The address of the created escrow
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
    ) external payable returns (address escrow);

    /**
     * @notice Get the escrow address for a given order hash
     * @param _orderHash The order hash
     * @return The escrow address (deterministic address)
     */
    function getEscrow(bytes32 _orderHash) external view returns (address);

    /**
     * @notice Check if an escrow exists for a given order hash
     * @param _orderHash The order hash
     * @return True if escrow exists
     */
    function escrowExists(bytes32 _orderHash) external view returns (bool);

    /**
     * @notice Get the implementation contract address
     * @return The implementation address
     */
    function getImplementation() external view returns (address);
}