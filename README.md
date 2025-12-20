# USDC Savings Vault

A secure, share-based savings vault for USDC with async withdrawals, protocol fees, and formal invariant guarantees.

## Overview

The USDC Savings Vault allows users to deposit USDC and receive vault shares representing their proportional ownership. The vault uses a Net Asset Value (NAV) model where share prices adjust based on total assets under management, enabling yield distribution without token rebasing.

### Key Features

- **Share-Based Accounting**: 1 USDC = 1 share initially, price adjusts with NAV
- **Async Withdrawal Queue**: FIFO processing with configurable cooldown periods
- **Share Escrow**: Withdrawal requests lock shares to prevent double-spend attacks
- **Protocol Fees**: Collected only on profits via share dilution (no USDC transfers)
- **Modular Architecture**: Separate NavOracle and RoleManager contracts

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     USDCSavingsVault                        │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │   Deposits  │  │  Withdrawals │  │   Fee Collection  │  │
│  │  (mint)     │  │  (burn)      │  │   (mint to treas) │  │
│  └─────────────┘  └──────────────┘  └───────────────────┘  │
└───────────────────────────┬─────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   VaultShare  │   │   NavOracle   │   │  RoleManager  │
│   (ERC-20)    │   │ totalAssets() │   │   (access)    │
└───────────────┘   └───────────────┘   └───────────────┘
```

### Contracts

| Contract | Description |
|----------|-------------|
| `USDCSavingsVault` | Main vault logic: deposits, withdrawals, fees |
| `VaultShare` | ERC-20 share token with vault-only mint/burn |
| `NavOracle` | Reports total assets from off-chain strategies |
| `RoleManager` | Manages Owner/Operator roles and pause states |

## User Flows

### Deposit

```solidity
// 1. Approve USDC spending
usdc.approve(address(vault), amount);

// 2. Deposit and receive shares
uint256 shares = vault.deposit(usdcAmount);
```

Shares minted = `usdcAmount * PRECISION / sharePrice()`

### Withdrawal (2-step process)

```solidity
// Step 1: Request withdrawal (shares are escrowed)
uint256 requestId = vault.requestWithdrawal(shareAmount);

// Step 2: Wait for cooldown + operator fulfillment
// Operator calls: vault.fulfillWithdrawals(count)
// User receives USDC at current NAV
```

## Share Price Calculation

```
sharePrice = totalAssets() / totalShares()
```

Where:
- `totalAssets()` = NAV reported by NavOracle (includes off-chain strategy value)
- `totalShares()` = Total share supply (includes escrowed shares)

### Example

| State | Total Assets | Total Shares | Share Price |
|-------|--------------|--------------|-------------|
| Initial | 1,000 USDC | 1,000 shares | 1.00 USDC |
| After 10% yield | 1,100 USDC | 1,000 shares | 1.10 USDC |
| After 5% loss | 1,045 USDC | 1,000 shares | 1.045 USDC |

## Formal Invariants

The vault enforces five critical invariants:

### I.1 — Conservation of Value
USDC only exits when shares are burned at current NAV. No execution path reduces assets without reducing shares.

### I.2 — Share Escrow Safety
Withdrawal request shares are transferred to the vault and locked until fulfilled or cancelled. Prevents double-spend attacks.

### I.3 — Universal NAV Application
NAV changes apply equally to ALL shares: user-held, escrowed, and treasury shares. No class is excluded from gains or losses.

### I.4 — Fee Isolation
Fees are only on profits, capped at `MAX_FEE_RATE`, and paid via share minting. No USDC transfers for fees.

### I.5 — Withdrawal Queue Liveness
FIFO processing, never reverts on low liquidity (graceful termination).

## Roles

| Role | Capabilities |
|------|--------------|
| **Owner** | Set parameters, cancel withdrawals, force process, update addresses |
| **Operator** | Fulfill withdrawals, pause operations |
| **Multisig** | Receive/return strategy funds |
| **Treasury** | Receives fee shares |

## Configuration

| Parameter | Range | Description |
|-----------|-------|-------------|
| `feeRate` | 0 - 50% | Fee on profits (18 decimals) |
| `cooldownPeriod` | 1 - 30 days | Minimum wait before withdrawal fulfillment |
| `perUserCap` | 0 = unlimited | Maximum deposit per user |
| `globalCap` | 0 = unlimited | Maximum total AUM |
| `withdrawalBuffer` | any | USDC to retain for withdrawals |

## Development

### Build

```bash
forge build
```

### Test

```bash
forge test
```

### Deploy

```bash
forge script script/Deploy.s.sol --rpc-url <RPC_URL> --broadcast
```

## Security Considerations

1. **Share Escrow**: Critical for preventing double-spend. Shares transfer to vault on withdrawal request.

2. **NAV Manipulation**: NavOracle is trusted. Owner-only updates with high water mark tracking.

3. **Reentrancy**: State updates before external calls. No callback patterns.

4. **Overflow**: Solidity 0.8+ with explicit unchecked blocks only where safe.

5. **Access Control**: RoleManager centralizes permissions. Pause states for emergencies.

## License

MIT
