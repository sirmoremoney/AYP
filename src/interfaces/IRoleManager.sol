// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IRoleManager
 * @notice Interface for role management and pause control
 * @dev Centralizes access control for the vault ecosystem
 */
interface IRoleManager {
    // ============ Events ============

    /// @notice Emitted when an operator's status is updated
    /// @param operator Address being updated
    /// @param status True if granted operator role, false if revoked
    event OperatorUpdated(address indexed operator, bool status);
    /// @notice Emitted when all operations are paused
    /// @param by Address that triggered the pause
    event Paused(address indexed by);
    /// @notice Emitted when all operations are unpaused
    /// @param by Address that triggered the unpause
    event Unpaused(address indexed by);
    /// @notice Emitted when deposits are paused
    /// @param by Address that triggered the pause
    event DepositsPaused(address indexed by);
    /// @notice Emitted when deposits are unpaused
    /// @param by Address that triggered the unpause
    event DepositsUnpaused(address indexed by);
    /// @notice Emitted when withdrawals are paused
    /// @param by Address that triggered the pause
    event WithdrawalsPaused(address indexed by);
    /// @notice Emitted when withdrawals are unpaused
    /// @param by Address that triggered the unpause
    event WithdrawalsUnpaused(address indexed by);
    /// @notice Emitted when ownership transfer is initiated (two-step)
    /// @param previousOwner Current owner initiating transfer
    /// @param newOwner Address nominated to become new owner
    event OwnershipTransferStarted(address indexed previousOwner, address indexed newOwner);
    /// @notice Emitted when ownership transfer is completed
    /// @param previousOwner Former owner
    /// @param newOwner New owner who accepted the transfer
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // ============ View Functions ============

    /**
     * @notice Check if the system is fully paused
     * @return True if paused
     */
    function paused() external view returns (bool);

    /**
     * @notice Check if deposits are paused
     * @return True if deposits paused
     */
    function depositsPaused() external view returns (bool);

    /**
     * @notice Check if withdrawals are paused
     * @return True if withdrawals paused
     */
    function withdrawalsPaused() external view returns (bool);

    /**
     * @notice Check if an address is an operator
     * @param account Address to check
     * @return True if operator
     */
    function isOperator(address account) external view returns (bool);

    /**
     * @notice Get the owner address
     * @return Owner address
     */
    function owner() external view returns (address);

    // ============ Operator Functions ============

    /**
     * @notice Pause all operations (operator or owner)
     */
    function pause() external;

    /**
     * @notice Pause deposits only (operator or owner)
     */
    function pauseDeposits() external;

    /**
     * @notice Pause withdrawals only (operator or owner)
     */
    function pauseWithdrawals() external;

    // ============ Owner Functions ============

    /**
     * @notice Unpause all operations (owner only)
     */
    function unpause() external;

    /**
     * @notice Unpause deposits (owner only)
     */
    function unpauseDeposits() external;

    /**
     * @notice Unpause withdrawals (owner only)
     */
    function unpauseWithdrawals() external;

    /**
     * @notice Set operator status for an address
     * @param operator Address to update
     * @param status New operator status
     */
    function setOperator(address operator, bool status) external;

    /**
     * @notice Start ownership transfer
     * @param newOwner New owner address
     */
    function transferOwnership(address newOwner) external;

    /**
     * @notice Accept ownership transfer
     */
    function acceptOwnership() external;
}
