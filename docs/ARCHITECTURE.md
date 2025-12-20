# Architecture

## System Overview

The USDC Savings Vault is a modular DeFi protocol consisting of four main contracts that work together to provide secure, yield-bearing USDC deposits.

```
                                    ┌──────────────┐
                                    │    Users     │
                                    └──────┬───────┘
                                           │
                              deposit() / requestWithdrawal()
                                           │
                                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                        USDCSavingsVault                          │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                      Core Functions                        │  │
│  │  • deposit(usdcAmount) → shares                           │  │
│  │  • requestWithdrawal(shares) → requestId                  │  │
│  │  • fulfillWithdrawals(count) [operator]                   │  │
│  │  • cancelWithdrawal(id) [owner]                           │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    State Management                        │  │
│  │  • withdrawalQueue[] - pending withdrawal requests         │  │
│  │  • pendingWithdrawalShares - total escrowed shares        │  │
│  │  • userTotalDeposited[] - per-user deposit tracking       │  │
│  │  • lastFeeHighWaterMark - for fee calculation             │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────┬────────────────────┬────────────────────┬──────────┘
              │                    │                    │
              ▼                    ▼                    ▼
      ┌───────────────┐    ┌───────────────┐    ┌───────────────┐
      │  VaultShare   │    │   NavOracle   │    │  RoleManager  │
      │   (ERC-20)    │    │               │    │               │
      │               │    │ totalAssets() │    │ isOperator()  │
      │ mint/burn     │    │ highWaterMark │    │ paused()      │
      │ (vault only)  │    │ (owner only)  │    │ owner()       │
      └───────────────┘    └───────────────┘    └───────────────┘
```

## Contract Responsibilities

### USDCSavingsVault

The main contract handling all user-facing operations and core logic.

**Responsibilities:**
- Accept USDC deposits and mint proportional shares
- Manage async withdrawal queue with share escrow
- Enforce deposit caps (per-user and global)
- Forward excess USDC to multisig for strategy deployment
- Collect protocol fees via share dilution

**Key Design Decisions:**
- Shares are escrowed (transferred to vault) on withdrawal request, not just locked
- Fees are minted as new shares to treasury, never transferred as USDC
- Withdrawal queue uses FIFO with graceful degradation on low liquidity

### VaultShare

A minimal ERC-20 token representing vault ownership.

**Responsibilities:**
- Standard ERC-20 functionality (transfer, approve, etc.)
- Vault-only minting and burning
- Special transferFrom bypass for vault escrow operations

**Key Design Decisions:**
- Only the vault can mint/burn shares
- Vault can transferFrom without approval (required for escrow mechanism)
- 18 decimal precision matching USDC calculations

### NavOracle

External oracle for reporting total assets under management.

**Responsibilities:**
- Store and report `totalAssets()` value
- Track high water mark for fee calculations
- Owner-only updates for off-chain strategy values

**Key Design Decisions:**
- Separated from vault to allow future oracle upgrades
- High water mark prevents fee gaming on volatile NAV
- Simple design - single trusted reporter (owner)

### RoleManager

Centralized access control and pause management.

**Responsibilities:**
- Define Owner role (governance)
- Manage Operator set (day-to-day operations)
- Control pause states (global, deposits-only, withdrawals-only)

**Key Design Decisions:**
- Operators can pause but only owner can unpause
- Three granular pause states for flexibility
- Ownership transfer with 2-step acceptance pattern

## Data Flow

### Deposit Flow

```
User                    Vault                   VaultShare          NavOracle
  │                       │                         │                   │
  │── approve(USDC) ────►│                         │                   │
  │                       │                         │                   │
  │── deposit(amount) ──►│                         │                   │
  │                       │── totalAssets() ──────►│◄──────────────────│
  │                       │◄─────────────────────────────── NAV ───────│
  │                       │                         │                   │
  │                       │── mint(shares) ───────►│                   │
  │                       │◄─────────────── ok ────│                   │
  │                       │                         │                   │
  │                       │── transferFrom(USDC) ─►│ (to vault)        │
  │                       │                         │                   │
  │                       │── transfer(USDC) ─────►│ (to multisig)     │
  │◄── shares ───────────│                         │                   │
```

### Withdrawal Flow

```
User                    Vault                   VaultShare          Operator
  │                       │                         │                   │
  │── requestWithdrawal ►│                         │                   │
  │                       │── transferFrom ───────►│                   │
  │                       │   (user→vault escrow)   │                   │
  │◄── requestId ────────│                         │                   │
  │                       │                         │                   │
  │        ... cooldown period passes ...          │                   │
  │                       │                         │                   │
  │                       │◄── fulfillWithdrawals ─────────────────────│
  │                       │── burn(shares) ───────►│                   │
  │                       │◄─────────────── ok ────│                   │
  │◄── USDC ─────────────│                         │                   │
```

## Storage Layout

### USDCSavingsVault

| Slot | Variable | Type | Description |
|------|----------|------|-------------|
| 0 | multisig | address | Strategy funds recipient |
| 1 | treasury | address | Fee recipient |
| 2 | feeRate | uint256 | Fee percentage (18 dec) |
| 3 | perUserCap | uint256 | Max deposit per user |
| 4 | globalCap | uint256 | Max total AUM |
| 5 | withdrawalBuffer | uint256 | USDC to retain |
| 6 | cooldownPeriod | uint256 | Withdrawal delay |
| 7 | lastFeeHighWaterMark | uint256 | HWM for fees |
| 8 | userTotalDeposited | mapping | User → deposited |
| 9 | withdrawalQueue | array | Pending requests |
| 10 | withdrawalQueueHead | uint256 | Queue pointer |
| 11 | pendingWithdrawalShares | uint256 | Escrowed shares |

## Security Model

### Trust Assumptions

| Entity | Trust Level | Justification |
|--------|-------------|---------------|
| Owner | High | Can pause, cancel withdrawals, update parameters |
| Operator | Medium | Can fulfill withdrawals, pause (not unpause) |
| NavOracle | High | Determines share prices; owner-controlled |
| Multisig | Medium | Holds strategy funds; cannot affect share accounting |

### Attack Vectors & Mitigations

| Attack | Mitigation |
|--------|------------|
| Double-spend withdrawal | Share escrow (I.2) |
| NAV manipulation | Owner-only oracle updates, HWM |
| Fee extraction | Fees only on profit (I.4) |
| Queue starvation | Graceful degradation (I.5) |
| Reentrancy | State-before-effects pattern |

## Upgrade Path

The architecture supports future upgrades:

1. **NavOracle**: Can be replaced with Chainlink, TWAP, or multi-source oracle
2. **RoleManager**: Can add timelock, DAO governance, or multi-sig requirements
3. **Vault**: Immutable core; new versions would require migration

## Gas Optimization

- Withdrawal queue uses `head` pointer instead of array shifting
- Processed requests set `shares = 0` rather than deletion
- Batch fulfillment in single transaction
- Minimal storage reads via local variable caching
