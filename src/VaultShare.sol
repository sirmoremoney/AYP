// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title VaultShare
 * @notice ERC20 token representing shares in a savings vault
 * @dev Only the vault can mint and burn shares. Name/symbol are configurable
 *      to support multiple vault types (USDC, ETH, etc.)
 *
 * OpenZeppelin Usage:
 * This contract inherits from OpenZeppelin's ERC20 because it provides pure
 * mechanical safety (standard token transfers, balances, approvals) without
 * encoding governance semantics. Access control (mint/burn) is handled by the
 * onlyVault modifier, keeping authority assumptions in the Vault layer.
 */
contract VaultShare is ERC20 {
    /// @notice The vault contract that has exclusive mint/burn/escrow privileges
    /// @dev Set once at construction and cannot be changed (immutable)
    address public immutable vault;

    /// @notice Thrown when a non-vault address attempts a vault-only operation
    error OnlyVault();

    /// @notice Restricts function access to the vault contract only
    modifier onlyVault() {
        if (msg.sender != vault) revert OnlyVault();
        _;
    }

    /**
     * @notice Initialize the vault share token
     * @param _vault Address of the vault that can mint/burn
     * @param _name Token name (e.g., "USDC Savings Vault Share")
     * @param _symbol Token symbol (e.g., "svUSDC")
     */
    constructor(
        address _vault,
        string memory _name,
        string memory _symbol
    ) ERC20(_name, _symbol) {
        if (_vault == address(0)) revert OnlyVault();
        vault = _vault;
    }

    /**
     * @notice Mint new shares to an address (only callable by vault)
     * @param to Address to mint to
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) external onlyVault {
        _mint(to, amount);
    }

    /**
     * @notice Burn shares from an address (only callable by vault)
     * @param from Address to burn from
     * @param amount Amount to burn
     */
    function burn(address from, uint256 amount) external onlyVault {
        _burn(from, amount);
    }

    /**
     * @notice Transfer tokens from one address to another
     * @param from Source address
     * @param to Destination address
     * @param amount Amount to transfer
     * @return success True if transfer succeeded
     * @dev Override allows vault to transfer without allowance for escrow operations.
     *      This is required for the withdrawal queue: when a user requests withdrawal,
     *      the vault transfers their shares to itself (escrow) without needing approval.
     *      This is safe because the vault is a trusted, immutable contract that only
     *      uses this capability for the defined escrow flow.
     */
    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        // Vault can transfer without allowance (trusted escrow contract)
        if (msg.sender == vault) {
            _transfer(from, to, amount);
            return true;
        }
        return super.transferFrom(from, to, amount);
    }
}
