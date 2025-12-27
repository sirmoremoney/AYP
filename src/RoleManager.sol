// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IRoleManager} from "./interfaces/IRoleManager.sol";

/**
 * @title RoleManager
 * @notice Centralized role management and pause control for the vault ecosystem
 * @dev Manages Owner, Operator roles and pause states
 *
 * =============================================================================
 * ARCHITECTURAL RATIONALE
 * =============================================================================
 *
 * The vault ecosystem uses an external RoleManager rather than inheriting
 * OpenZeppelin's Ownable or Pausable directly. This deliberate design choice:
 *
 *   1. MULTI-ROLE GOVERNANCE: Supports Owner, Operator, and Guardian roles
 *      with distinct permissions. OpenZeppelin Ownable only supports one admin.
 *
 *   2. GOVERNANCE UPGRADEABILITY: Governance logic can be upgraded without
 *      redeploying the Vault. The Vault holds assets; separating governance
 *      reduces upgrade risk to user funds.
 *
 *   3. SEPARATION OF CONCERNS: The Vault focuses purely on asset custody and
 *      accounting. Authority assumptions are not hard-coded into the custody layer.
 *
 *   4. THREE-STATE PAUSE: Supports paused, depositsPaused, and withdrawalsPaused
 *      independently. OpenZeppelin Pausable only provides a single pause state.
 *
 *   5. ASYMMETRIC PAUSE/UNPAUSE: Operators can pause (fast emergency response),
 *      but only Owner can unpause (prevents operator abuse). This pattern is
 *      not directly supported by OpenZeppelin Pausable.
 *
 * =============================================================================
 * ROLE HIERARCHY
 * =============================================================================
 *
 * Owner (Governance):
 *   - Full control: can unpause, set operators, transfer ownership
 *   - Implicit operator privileges
 *   - Two-step ownership transfer for safety
 *
 * Operator (Day-to-Day):
 *   - Can pause (not unpause) for emergency response
 *   - Can fulfill withdrawals
 *   - Cannot change governance settings
 *
 * =============================================================================
 */
contract RoleManager is IRoleManager {
    // ============ Storage ============

    /// @notice Current owner with full administrative privileges
    address public owner;
    /// @notice Address nominated to become the new owner (two-step transfer pattern)
    /// @dev Must call acceptOwnership() to complete the transfer
    address public pendingOwner;

    /// @notice Mapping of addresses authorized as operators
    /// @dev Operators can fulfill withdrawals but cannot change configuration
    mapping(address => bool) public operators;

    /// @notice Global pause flag - when true, all vault operations are blocked
    bool public paused;
    /// @notice Deposits-only pause - when true, deposits blocked but withdrawals allowed
    bool public depositsPaused;
    /// @notice Withdrawals-only pause - when true, withdrawals blocked but deposits allowed
    bool public withdrawalsPaused;

    // ============ Errors ============

    /// @notice Thrown when non-owner calls an owner-only function
    error OnlyOwner();
    /// @notice Thrown when non-operator calls an operator-only function
    error OnlyOperator();
    /// @notice Thrown when zero address is provided where not allowed
    error ZeroAddress();
    /// @notice Thrown when acceptOwnership() called by non-pending owner
    error NotPendingOwner();

    // ============ Constructor ============

    /**
     * @notice Initialize the RoleManager
     * @param _owner Initial owner address
     */
    constructor(address _owner) {
        if (_owner == address(0)) revert ZeroAddress();
        owner = _owner;

        // Owner is also an operator by default
        operators[_owner] = true;
        emit OperatorUpdated(_owner, true);
    }

    // ============ Modifiers ============

    /// @notice Restricts function access to the current owner only
    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    /// @notice Restricts function access to operators OR the owner
    /// @dev Owner implicitly has operator privileges even if not in operators mapping
    modifier onlyOperator() {
        if (!operators[msg.sender] && msg.sender != owner) revert OnlyOperator();
        _;
    }

    // ============ View Functions ============

    /**
     * @notice Check if an address is an operator
     * @param account Address to check
     * @return True if operator
     */
    function isOperator(address account) external view returns (bool) {
        return operators[account] || account == owner;
    }

    // ============ Operator Functions ============

    /**
     * @notice Pause all operations
     * @dev Callable by operator or owner for fast response
     */
    function pause() external onlyOperator {
        paused = true;
        emit Paused(msg.sender);
    }

    /**
     * @notice Pause deposits only
     * @dev Callable by operator or owner
     */
    function pauseDeposits() external onlyOperator {
        depositsPaused = true;
        emit DepositsPaused(msg.sender);
    }

    /**
     * @notice Pause withdrawals only
     * @dev Callable by operator or owner
     */
    function pauseWithdrawals() external onlyOperator {
        withdrawalsPaused = true;
        emit WithdrawalsPaused(msg.sender);
    }

    // ============ Owner Functions ============

    /**
     * @notice Unpause all operations
     * @dev Only owner can unpause to prevent operator abuse
     */
    function unpause() external onlyOwner {
        paused = false;
        emit Unpaused(msg.sender);
    }

    /**
     * @notice Unpause deposits
     * @dev Only owner can unpause
     */
    function unpauseDeposits() external onlyOwner {
        depositsPaused = false;
        emit DepositsUnpaused(msg.sender);
    }

    /**
     * @notice Unpause withdrawals
     * @dev Only owner can unpause
     */
    function unpauseWithdrawals() external onlyOwner {
        withdrawalsPaused = false;
        emit WithdrawalsUnpaused(msg.sender);
    }

    /**
     * @notice Set operator status for an address
     * @param operator Address to update
     * @param status New operator status
     */
    function setOperator(address operator, bool status) external onlyOwner {
        if (operator == address(0)) revert ZeroAddress();
        operators[operator] = status;
        emit OperatorUpdated(operator, status);
    }

    /**
     * @notice Start two-step ownership transfer
     * @param newOwner Address of the new owner
     */
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        pendingOwner = newOwner;
        emit OwnershipTransferStarted(owner, newOwner);
    }

    /**
     * @notice Accept ownership transfer
     * @dev Must be called by the pending owner
     * @dev Automatically revokes old owner's explicit operator status for security
     */
    function acceptOwnership() external {
        if (msg.sender != pendingOwner) revert NotPendingOwner();

        address oldOwner = owner;

        // Revoke old owner's explicit operator status (security: prevents lingering access)
        if (operators[oldOwner]) {
            operators[oldOwner] = false;
            emit OperatorUpdated(oldOwner, false);
        }

        emit OwnershipTransferred(oldOwner, msg.sender);

        owner = msg.sender;
        pendingOwner = address(0);
    }
}
