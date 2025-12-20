// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IUSDCSavingsVault
 * @notice Interface for the USDC Savings Vault
 */
interface IUSDCSavingsVault {
    // ============ Structs ============

    struct WithdrawalRequest {
        address requester;
        uint256 shares;
        uint256 requestTimestamp;
    }

    // ============ Events ============

    event Deposit(address indexed user, uint256 usdcAmount, uint256 sharesMinted);
    event WithdrawalRequested(address indexed user, uint256 shares, uint256 requestId);
    event WithdrawalFulfilled(address indexed user, uint256 shares, uint256 usdcAmount, uint256 requestId);
    event WithdrawalCancelled(address indexed user, uint256 shares, uint256 requestId);
    event NAVUpdated(uint256 oldNav, uint256 newNav, uint256 feeCollected);
    event FundsForwardedToMultisig(uint256 amount);
    event FundsReceivedFromMultisig(uint256 amount);
    event OperatorUpdated(address indexed operator, bool status);
    event MultisigUpdated(address indexed oldMultisig, address indexed newMultisig);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event FeeRateUpdated(uint256 oldRate, uint256 newRate);
    event PerUserCapUpdated(uint256 oldCap, uint256 newCap);
    event GlobalCapUpdated(uint256 oldCap, uint256 newCap);
    event WithdrawalBufferUpdated(uint256 oldBuffer, uint256 newBuffer);
    event CooldownPeriodUpdated(uint256 oldPeriod, uint256 newPeriod);
    event Paused(address indexed by);
    event Unpaused(address indexed by);
    event DepositsPaused(address indexed by);
    event DepositsUnpaused(address indexed by);
    event WithdrawalsPaused(address indexed by);
    event WithdrawalsUnpaused(address indexed by);

    // ============ View Functions ============

    function sharePrice() external view returns (uint256);
    function nav() external view returns (uint256);
    function totalShares() external view returns (uint256);
    function pendingWithdrawals() external view returns (uint256);
    function withdrawalQueueLength() external view returns (uint256);
    function getWithdrawalRequest(uint256 requestId) external view returns (WithdrawalRequest memory);
    function userDeposits(address user) external view returns (uint256);

    // ============ User Functions ============

    function deposit(uint256 usdcAmount) external returns (uint256 sharesMinted);
    function requestWithdrawal(uint256 shares) external returns (uint256 requestId);

    // ============ Operator Functions ============

    function updateNAV(uint256 newNav) external;
    function processWithdrawals(uint256 count) external returns (uint256 processed, uint256 usdcPaid);
    function receiveFundsFromMultisig(uint256 amount) external;

    // ============ Owner Functions ============

    function setOperator(address operator, bool status) external;
    function setMultisig(address newMultisig) external;
    function setTreasury(address newTreasury) external;
    function setFeeRate(uint256 newFeeRate) external;
    function setPerUserCap(uint256 newCap) external;
    function setGlobalCap(uint256 newCap) external;
    function setWithdrawalBuffer(uint256 newBuffer) external;
    function setCooldownPeriod(uint256 newCooldown) external;
    function pause() external;
    function unpause() external;
    function pauseDeposits() external;
    function unpauseDeposits() external;
    function pauseWithdrawals() external;
    function unpauseWithdrawals() external;
    function forceProcessWithdrawal(uint256 requestId) external;
    function cancelWithdrawal(uint256 requestId) external;
    function manualNavAdjustment(uint256 newNav, string calldata reason) external;
}
