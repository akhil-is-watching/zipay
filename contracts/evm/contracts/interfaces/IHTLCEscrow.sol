// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IHTLCEscrow
 * @notice Interface for HTLCEscrow contract
 * @dev Defines the interface for HTLC escrow functionality
 */
interface IHTLCEscrow {
    /**
     * @notice Enumeration of order states
     * @dev Represents the current state of an HTLC order
     */
    enum State {
        ACTIVE,         /// @notice Order is active and can be withdrawn or cancelled
        WITHDRAWN,      /// @notice Order has been withdrawn by the taker
        CANCELLED       /// @notice Order has been cancelled by the maker
    }

    /**
     * @notice Initialize the HTLC with order parameters
     * @param _orderHash The unique identifier for the order
     * @param _hashLock The hash of the secret preimage
     * @param _token The ERC20 token contract address
     * @param _maker The address that created the order
     * @param _taker The address that can claim the order
     * @param _resolver The address authorized to resolve the order
     * @param _amount The amount of tokens to be swapped
     * @param _safetyDeposit The ETH safety deposit amount
     * @param _timeLocks Array of time lock values [deployedAt, withdrawal, cancellation]
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
    ) external payable;

    /**
     * @notice Withdraw the order by revealing the secret preimage
     * @param _preimage The secret that matches the hash lock
     */
    function withdraw(bytes32 _preimage) external;

    /**
     * @notice Cancel the order and return funds to the maker
     */
    function cancel() external;

    /**
     * @notice Get the current state of the order
     * @return The current state of the order (ACTIVE, WITHDRAWN, or CANCELLED)
     */
    function getState() external view returns (State);

    /**
     * @notice Returns the implementation version for proxy compatibility
     * @return The version string of this implementation
     */
    function version() external pure returns (string memory);
}
