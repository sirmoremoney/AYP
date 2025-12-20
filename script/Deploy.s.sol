// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {USDCSavingsVault} from "../src/USDCSavingsVault.sol";

/**
 * @title DeployScript
 * @notice Deployment script for USDCSavingsVault
 *
 * Usage:
 * forge script script/Deploy.s.sol:DeployScript --rpc-url <RPC_URL> --broadcast --verify
 *
 * Required environment variables:
 * - USDC_ADDRESS: Address of USDC token
 * - MULTISIG_ADDRESS: Address of multisig for strategy funds
 * - TREASURY_ADDRESS: Address of treasury for fees
 * - FEE_RATE: Fee rate in 18 decimals (e.g., 0.2e18 = 20%)
 * - COOLDOWN_PERIOD: Cooldown in seconds (e.g., 604800 = 7 days)
 */
contract DeployScript {
    function run() external returns (USDCSavingsVault vault) {
        // Load configuration from environment
        address usdc = vm.envAddress("USDC_ADDRESS");
        address multisig = vm.envAddress("MULTISIG_ADDRESS");
        address treasury = vm.envAddress("TREASURY_ADDRESS");
        uint256 feeRate = vm.envUint("FEE_RATE");
        uint256 cooldownPeriod = vm.envUint("COOLDOWN_PERIOD");

        vm.startBroadcast();

        vault = new USDCSavingsVault(
            usdc,
            multisig,
            treasury,
            feeRate,
            cooldownPeriod
        );

        vm.stopBroadcast();

        return vault;
    }

    // Forge VM interface for environment variables
    Vm internal constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
}

interface Vm {
    function envAddress(string calldata key) external view returns (address);
    function envUint(string calldata key) external view returns (uint256);
    function startBroadcast() external;
    function stopBroadcast() external;
}
