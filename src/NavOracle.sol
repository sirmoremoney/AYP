// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {INavOracle} from "./interfaces/INavOracle.sol";
import {IRoleManager} from "./interfaces/IRoleManager.sol";

/**
 * @title NavOracle
 * @notice Oracle contract for reporting total assets (NAV)
 * @dev Owner reports total assets from external on-chain strategy positions
 *
 * The oracle tracks:
 * - Current total assets (authoritative source for NAV)
 * - High water mark (informational only - Vault.feeHighWaterMark is canonical for fees)
 * - Last report timestamp
 *
 * DESIGN NOTE: The highWaterMark in this contract is for informational/monitoring
 * purposes only. The canonical high-water mark for fee calculations is stored in
 * USDCSavingsVault.feeHighWaterMark. This separation ensures fee accounting authority
 * remains within the vault contract.
 */
contract NavOracle is INavOracle {
    // ============ Storage ============

    /// @notice RoleManager contract for access control
    IRoleManager public immutable roleManager;

    /// @notice Current total assets value (NAV) in USDC (6 decimals)
    /// @dev Authoritative source for NAV; updated via reportTotalAssets()
    uint256 public totalAssets;
    /// @notice Historical peak of totalAssets (informational only)
    /// @dev Note: This is for monitoring purposes only. The vault's fee HWM
    ///      (if any) is tracked separately within the vault contract.
    uint256 public highWaterMark;
    /// @notice Timestamp of the last NAV report
    uint256 public lastReportTime;

    // ============ Errors ============

    /// @notice Thrown when non-owner calls an owner-only function
    error OnlyOwner();

    // ============ Constructor ============

    /**
     * @notice Initialize the NavOracle
     * @param _roleManager Address of the RoleManager contract
     * @dev RoleManager must be a valid contract address
     */
    constructor(address _roleManager) {
        require(_roleManager != address(0), "Zero address");
        roleManager = IRoleManager(_roleManager);
    }

    // ============ Modifiers ============

    /// @notice Restricts access to the RoleManager's current owner
    modifier onlyOwner() {
        if (msg.sender != roleManager.owner()) revert OnlyOwner();
        _;
    }

    // ============ Owner Functions ============

    /**
     * @notice Report new total assets value
     * @param newTotalAssets New total assets in USDC (6 decimals)
     * @dev Only callable by owner. Updates high water mark if new value exceeds it.
     */
    function reportTotalAssets(uint256 newTotalAssets) external onlyOwner {
        uint256 oldAssets = totalAssets;

        totalAssets = newTotalAssets;
        lastReportTime = block.timestamp;

        // Update high water mark if we've exceeded it
        if (newTotalAssets > highWaterMark) {
            highWaterMark = newTotalAssets;
            emit HighWaterMarkUpdated(newTotalAssets);
        }

        emit TotalAssetsReported(oldAssets, newTotalAssets, block.timestamp);
    }
}
