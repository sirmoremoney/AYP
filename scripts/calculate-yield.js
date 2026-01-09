import { createPublicClient, http, formatUnits } from 'viem';
import { mainnet } from 'viem/chains';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ============================================
// Configuration
// ============================================

const MULTISIG_ADDRESS = '0x0FBCe7F3678467f7F7313fcB2C9D1603431Ad666';
const OPERATOR_ADDRESS = '0xF466ad87c98f50473Cf4Fe32CdF8db652F9E36D6';
const VAULT_ADDRESS = '0xd53B68fB4eb907c3c1E348CD7d7bEDE34f763805';

const ETH_RPC = process.env.ETH_RPC_URL || 'https://eth.llamarpc.com';
const HYPEREVM_RPC = 'https://rpc.hyperliquid.xyz/evm';

// Token addresses
const TOKENS = {
  ethereum: {
    USDC: { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 },
    WETH: { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', decimals: 18 },
    weETH: { address: '0xCd5fE23C85820F7B72D0926FC9b05b43E359b7ee', decimals: 18 },
  },
  hyperevm: {
    USDC: { address: '0x211Cc4DD073734dA055fbF44a2b4667d5E5fE5d2', decimals: 6 },
  },
};

// CoinGecko IDs for price fetching
const COINGECKO_IDS = {
  ETH: 'ethereum',
  WETH: 'ethereum',
  weETH: 'ether-fi-staked-eth',
  HYPE: 'hyperliquid',
  USDC: 'usd-coin',
};

// ============================================
// Clients
// ============================================

const ethClient = createPublicClient({
  chain: mainnet,
  transport: http(ETH_RPC),
});

const hyperEvmClient = createPublicClient({
  chain: {
    id: 998,
    name: 'HyperEVM',
    nativeCurrency: { name: 'HYPE', symbol: 'HYPE', decimals: 18 },
    rpcUrls: { default: { http: [HYPEREVM_RPC] } },
  },
  transport: http(HYPEREVM_RPC),
});

// ============================================
// ABIs
// ============================================

const erc20Abi = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
];

const vaultAbi = [
  {
    name: 'sharePrice',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'totalSupply',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'totalAssets',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'accumulatedYield',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'int256' }],
  },
];

// ============================================
// Price Fetching
// ============================================

async function fetchPrices() {
  const ids = Object.values(COINGECKO_IDS).join(',');
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    const prices = {};
    for (const [symbol, id] of Object.entries(COINGECKO_IDS)) {
      prices[symbol] = data[id]?.usd || 0;
    }
    return prices;
  } catch (e) {
    console.error('Failed to fetch prices:', e.message);
    // Fallback prices
    return {
      ETH: 3500,
      WETH: 3500,
      weETH: 3700,
      HYPE: 25,
      USDC: 1,
    };
  }
}

// ============================================
// Balance Fetching
// ============================================

async function fetchEthereumBalances(address) {
  const balances = [];

  // Native ETH
  try {
    const ethBalance = await ethClient.getBalance({ address });
    if (ethBalance > 0n) {
      balances.push({
        symbol: 'ETH',
        balance: formatUnits(ethBalance, 18),
        chain: 'ethereum',
      });
    }
  } catch (e) {
    console.warn('Failed to fetch ETH balance:', e.message);
  }

  // ERC20 tokens
  for (const [symbol, token] of Object.entries(TOKENS.ethereum)) {
    try {
      const balance = await ethClient.readContract({
        address: token.address,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address],
      });
      if (balance > 0n) {
        balances.push({
          symbol,
          balance: formatUnits(balance, token.decimals),
          chain: 'ethereum',
        });
      }
    } catch (e) {
      console.warn(`Failed to fetch ${symbol} balance:`, e.message);
    }
  }

  return balances;
}

async function fetchHyperEvmBalances(address) {
  const balances = [];

  // Native HYPE
  try {
    const hypeBalance = await hyperEvmClient.getBalance({ address });
    if (hypeBalance > 0n) {
      balances.push({
        symbol: 'HYPE',
        balance: formatUnits(hypeBalance, 18),
        chain: 'hyperevm',
      });
    }
  } catch (e) {
    console.warn('Failed to fetch HYPE balance:', e.message);
  }

  // ERC20 tokens
  for (const [symbol, token] of Object.entries(TOKENS.hyperevm)) {
    try {
      const balance = await hyperEvmClient.readContract({
        address: token.address,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address],
      });
      if (balance > 0n) {
        balances.push({
          symbol,
          balance: formatUnits(balance, token.decimals),
          chain: 'hyperevm',
        });
      }
    } catch (e) {
      console.warn(`Failed to fetch ${symbol} on HyperEVM:`, e.message);
    }
  }

  return balances;
}

// ============================================
// Pendle PT Positions
// ============================================

async function fetchPendlePositions(address) {
  try {
    const response = await fetch(
      `https://api-v2.pendle.finance/core/v1/dashboard/positions/database/${address}`
    );

    if (!response.ok) {
      console.warn('Pendle API error:', response.status);
      return { positions: [], totalUsd: 0 };
    }

    const data = await response.json();
    const positions = [];
    let totalUsd = 0;

    if (data?.positions) {
      for (const chainPosition of data.positions) {
        for (const position of chainPosition.openPositions || []) {
          const ptData = position.pt;
          if (!ptData || parseFloat(ptData.balance) <= 0) continue;

          const balanceUsd = ptData.valuation || 0;
          totalUsd += balanceUsd;

          positions.push({
            marketId: position.marketId,
            balance: formatUnits(BigInt(ptData.balance), 18),
            balanceUsd,
          });
        }
      }
    }

    return { positions, totalUsd };
  } catch (e) {
    console.warn('Failed to fetch Pendle positions:', e.message);
    return { positions: [], totalUsd: 0 };
  }
}

// ============================================
// Lighter DEX Positions
// ============================================

const LIGHTER_ACCOUNT_INDEX = process.env.LIGHTER_ACCOUNT_INDEX || '702036';

// Market index to symbol mapping
const LIGHTER_MARKETS = {
  0: 'ETH',
  1: 'BTC',
  24: 'HYPE',
};

async function fetchLighterEquity(address) {
  try {
    // Fetch account data (collateral)
    const accountResponse = await fetch(
      `https://mainnet.zklighter.elliot.ai/api/v1/accountsByL1Address?l1_address=${address}`
    );

    let totalCollateral = 0;
    let accountIndex = LIGHTER_ACCOUNT_INDEX;

    if (accountResponse.ok) {
      const accountData = await accountResponse.json();
      const subAccounts = accountData.sub_accounts || [];

      for (const account of subAccounts) {
        totalCollateral += parseFloat(account.collateral || 0);
        if (account.index) {
          accountIndex = account.index;
        }
      }
    }

    // Fetch positions with unrealized PnL from explorer API
    const positionsResponse = await fetch(
      `https://explorer.elliot.ai/api/accounts/${accountIndex}/positions`
    );

    let unrealizedPnl = 0;
    const positions = [];

    if (positionsResponse.ok) {
      const positionsData = await positionsResponse.json();

      for (const [marketIdx, position] of Object.entries(positionsData.positions || {})) {
        const pnl = parseFloat(position.pnl || 0);
        unrealizedPnl += pnl;

        positions.push({
          market: LIGHTER_MARKETS[marketIdx] || `Market ${marketIdx}`,
          side: position.side,
          size: position.size,
          entryPrice: position.entry_price,
          unrealizedPnl: pnl,
        });
      }
    }

    // Total equity = collateral + unrealized PnL
    const totalEquity = totalCollateral + unrealizedPnl;

    return {
      collateral: totalCollateral,
      unrealizedPnl,
      equity: totalEquity,
      positions,
    };
  } catch (e) {
    console.warn('Failed to fetch Lighter equity:', e.message);
    return { collateral: 0, unrealizedPnl: 0, equity: 0, positions: [] };
  }
}

// ============================================
// Hyperliquid L1 Positions
// ============================================

async function fetchHyperliquidEquity(address) {
  try {
    const response = await fetch('https://api.hyperliquid.xyz/info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'clearinghouseState',
        user: address,
      }),
    });

    if (!response.ok) {
      console.warn('Hyperliquid API error:', response.status);
      return { equity: 0, positions: [] };
    }

    const data = await response.json();

    // Extract account equity
    const marginSummary = data.marginSummary || {};
    const equity = parseFloat(marginSummary.accountValue || 0);

    return {
      equity,
      positions: data.assetPositions || [],
    };
  } catch (e) {
    console.warn('Failed to fetch Hyperliquid equity:', e.message);
    return { equity: 0, positions: [] };
  }
}

// ============================================
// Vault Data
// ============================================

async function fetchVaultData() {
  try {
    const [sharePrice, totalSupply, totalAssets, accumulatedYield] = await Promise.all([
      ethClient.readContract({
        address: VAULT_ADDRESS,
        abi: vaultAbi,
        functionName: 'sharePrice',
      }),
      ethClient.readContract({
        address: VAULT_ADDRESS,
        abi: vaultAbi,
        functionName: 'totalSupply',
      }),
      ethClient.readContract({
        address: VAULT_ADDRESS,
        abi: vaultAbi,
        functionName: 'totalAssets',
      }),
      ethClient.readContract({
        address: VAULT_ADDRESS,
        abi: vaultAbi,
        functionName: 'accumulatedYield',
      }),
    ]);

    return {
      sharePrice: parseFloat(formatUnits(sharePrice, 6)),
      totalSupply: parseFloat(formatUnits(totalSupply, 18)),
      totalAssets: parseFloat(formatUnits(totalAssets, 6)),
      accumulatedYield: parseFloat(formatUnits(accumulatedYield, 6)),
    };
  } catch (e) {
    console.error('Failed to fetch vault data:', e.message);
    throw e;
  }
}

// ============================================
// NAV History
// ============================================

const NAV_HISTORY_PATH = join(__dirname, '..', 'data', 'nav-history.json');

function loadNavHistory() {
  try {
    if (existsSync(NAV_HISTORY_PATH)) {
      return JSON.parse(readFileSync(NAV_HISTORY_PATH, 'utf-8'));
    }
  } catch (e) {
    console.warn('Failed to load NAV history:', e.message);
  }
  return { entries: [] };
}

function saveNavHistory(history) {
  const dir = dirname(NAV_HISTORY_PATH);
  if (!existsSync(dir)) {
    import('fs').then(fs => fs.mkdirSync(dir, { recursive: true }));
  }
  writeFileSync(NAV_HISTORY_PATH, JSON.stringify(history, null, 2));
}

// ============================================
// Main Calculation
// ============================================

async function calculateYield() {
  console.log('='.repeat(60));
  console.log('YIELD CALCULATION');
  console.log('='.repeat(60));
  console.log(`Time: ${new Date().toISOString()}`);
  console.log('');

  // 1. Fetch all data in parallel
  console.log('Fetching data...');

  const [
    prices,
    multisigEthBalances,
    multisigHyperBalances,
    operatorHyperBalances,
    pendleData,
    lighterData,
    hyperliquidData,
    vaultData,
  ] = await Promise.all([
    fetchPrices(),
    fetchEthereumBalances(MULTISIG_ADDRESS),
    fetchHyperEvmBalances(MULTISIG_ADDRESS),
    fetchHyperEvmBalances(OPERATOR_ADDRESS),
    fetchPendlePositions(MULTISIG_ADDRESS),
    fetchLighterEquity(MULTISIG_ADDRESS),
    fetchHyperliquidEquity(OPERATOR_ADDRESS),
    fetchVaultData(),
  ]);

  console.log('');
  console.log('PRICES:');
  for (const [symbol, price] of Object.entries(prices)) {
    console.log(`  ${symbol}: $${price}`);
  }

  // 2. Calculate spot holdings value
  console.log('');
  console.log('SPOT HOLDINGS:');

  let spotTotalUsd = 0;
  const allSpotBalances = [
    ...multisigEthBalances,
    ...multisigHyperBalances,
    ...operatorHyperBalances,
  ];

  for (const bal of allSpotBalances) {
    const price = prices[bal.symbol] || 0;
    const usdValue = parseFloat(bal.balance) * price;
    spotTotalUsd += usdValue;
    console.log(`  ${bal.symbol} (${bal.chain}): ${parseFloat(bal.balance).toFixed(4)} × $${price} = $${usdValue.toFixed(2)}`);
  }
  console.log(`  SPOT TOTAL: $${spotTotalUsd.toFixed(2)}`);

  // 3. Pendle positions
  console.log('');
  console.log('PENDLE PT:');
  console.log(`  Positions: ${pendleData.positions.length}`);
  console.log(`  PENDLE TOTAL: $${pendleData.totalUsd.toFixed(2)}`);

  // 4. Perp positions
  console.log('');
  console.log('LIGHTER PERP POSITIONS:');
  console.log(`  Collateral:      $${lighterData.collateral.toFixed(2)}`);
  console.log(`  Unrealized PnL:  $${lighterData.unrealizedPnl.toFixed(2)}`);
  console.log(`  Total Equity:    $${lighterData.equity.toFixed(2)}`);

  if (lighterData.positions.length > 0) {
    console.log('  Positions:');
    for (const pos of lighterData.positions) {
      const pnlSign = pos.unrealizedPnl >= 0 ? '+' : '';
      console.log(`    ${pos.market} ${pos.side.toUpperCase()}: ${pos.size} @ $${pos.entryPrice} (${pnlSign}$${pos.unrealizedPnl.toFixed(2)})`);
    }
  }

  console.log('');
  console.log('HYPERLIQUID POSITIONS:');
  console.log(`  Equity: $${hyperliquidData.equity.toFixed(2)}`);

  const perpTotalUsd = lighterData.equity + hyperliquidData.equity;
  console.log('');
  console.log(`  PERP TOTAL: $${perpTotalUsd.toFixed(2)}`);

  // 5. Calculate total NAV
  const totalNav = spotTotalUsd + pendleData.totalUsd + perpTotalUsd;

  console.log('');
  console.log('='.repeat(60));
  console.log('NAV SUMMARY:');
  console.log(`  Spot holdings:    $${spotTotalUsd.toFixed(2)}`);
  console.log(`  Pendle PT:        $${pendleData.totalUsd.toFixed(2)}`);
  console.log(`  Perp equity:      $${perpTotalUsd.toFixed(2)}`);
  console.log(`  ─────────────────────────`);
  console.log(`  TOTAL NAV:        $${totalNav.toFixed(2)}`);
  console.log('='.repeat(60));

  // 6. Vault state
  console.log('');
  console.log('VAULT STATE:');
  console.log(`  Share Price (PPS):    $${vaultData.sharePrice.toFixed(6)}`);
  console.log(`  Total Shares:         ${vaultData.totalSupply.toFixed(2)}`);
  console.log(`  Vault totalAssets:    $${vaultData.totalAssets.toFixed(2)}`);
  console.log(`  Accumulated Yield:    $${vaultData.accumulatedYield.toFixed(2)}`);

  // 7. Calculate unreported yield
  const unreportedYield = totalNav - vaultData.totalAssets;

  console.log('');
  console.log('='.repeat(60));
  console.log('YIELD CALCULATION:');
  console.log(`  True NAV:             $${totalNav.toFixed(2)}`);
  console.log(`  Vault thinks NAV is:  $${vaultData.totalAssets.toFixed(2)}`);
  console.log(`  ─────────────────────────`);
  console.log(`  UNREPORTED YIELD:     $${unreportedYield.toFixed(2)}`);
  console.log('='.repeat(60));

  // 8. Load history and calculate PPS-based yield
  const history = loadNavHistory();
  const yesterday = history.entries[history.entries.length - 1];

  if (yesterday) {
    const ppsDelta = vaultData.sharePrice - yesterday.sharePrice;
    const yieldFromPps = ppsDelta * vaultData.totalSupply;

    console.log('');
    console.log('PPS-BASED YIELD (vs last recorded):');
    console.log(`  Yesterday PPS:  $${yesterday.sharePrice.toFixed(6)}`);
    console.log(`  Today PPS:      $${vaultData.sharePrice.toFixed(6)}`);
    console.log(`  PPS Delta:      $${ppsDelta.toFixed(6)}`);
    console.log(`  Total Shares:   ${vaultData.totalSupply.toFixed(2)}`);
    console.log(`  Yield (PPS × Shares): $${yieldFromPps.toFixed(2)}`);
  }

  // 9. Save today's data
  history.entries.push({
    timestamp: new Date().toISOString(),
    nav: totalNav,
    sharePrice: vaultData.sharePrice,
    totalSupply: vaultData.totalSupply,
    spotUsd: spotTotalUsd,
    pendleUsd: pendleData.totalUsd,
    perpUsd: perpTotalUsd,
    lighterCollateral: lighterData.collateral,
    lighterUnrealizedPnl: lighterData.unrealizedPnl,
  });

  // Keep last 90 days
  if (history.entries.length > 90) {
    history.entries = history.entries.slice(-90);
  }

  saveNavHistory(history);

  // 10. Output for reporting
  console.log('');
  console.log('='.repeat(60));
  console.log('TO REPORT THIS YIELD:');
  console.log(`  cast send ${VAULT_ADDRESS} "reportYieldAndCollectFees(int256)" ${Math.round(unreportedYield * 1e6)} --rpc-url ${ETH_RPC} --private-key <KEY>`);
  console.log('='.repeat(60));

  return {
    nav: totalNav,
    vaultTotalAssets: vaultData.totalAssets,
    unreportedYield,
    sharePrice: vaultData.sharePrice,
    totalSupply: vaultData.totalSupply,
    breakdown: {
      spot: spotTotalUsd,
      pendle: pendleData.totalUsd,
      perp: perpTotalUsd,
    },
  };
}

// Run
calculateYield().catch(console.error);
