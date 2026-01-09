import { useQuery } from '@tanstack/react-query';
import { createPublicClient, http, formatUnits } from 'viem';

const PENDLE_API_BASE = 'https://api-v2.pendle.finance/core';

// HyperEVM client for PT contract queries
const hyperEvmClient = createPublicClient({
  chain: {
    id: 999,
    name: 'HyperEVM',
    nativeCurrency: { name: 'HYPE', symbol: 'HYPE', decimals: 18 },
    rpcUrls: { default: { http: ['https://rpc.hyperliquid.xyz/evm'] } },
  },
  transport: http(),
});

// PT ABI for expiry and symbol
const ptAbi = [
  {
    inputs: [],
    name: 'expiry',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Known PT token addresses by market (fallback when API doesn't provide)
const KNOWN_PT_ADDRESSES: Record<string, string> = {
  '999-0x433081c58a8bff30060014134eed2601e5922759': '0xCBaaB2463a6bA43A65A138a41C39d541a51810CF',
};

interface PendlePTPosition {
  chainId: number;
  chainName: string;
  symbol: string;
  marketId: string;
  ptAddress: string;
  balance: string;
  balanceUsd: number;
  expiry: number;
  expiryFormatted: string;
  daysUntilExpiry: number;
}

// Chain ID to name mapping
const CHAIN_NAMES: Record<number, string> = {
  1: 'Ethereum',
  42161: 'Arbitrum',
  10: 'Optimism',
  56: 'BNB Chain',
  137: 'Polygon',
  43114: 'Avalanche',
  998: 'HyperEVM',
  999: 'HyperEVM',
  8453: 'Base',
};

// Fetch PT details from contract
async function fetchPTDetails(ptAddress: string, chainId: number): Promise<{ symbol: string; expiry: number } | null> {
  try {
    // Only support HyperEVM for now
    if (chainId !== 999 && chainId !== 998) return null;

    const [symbol, expiry] = await Promise.all([
      hyperEvmClient.readContract({
        address: ptAddress as `0x${string}`,
        abi: ptAbi,
        functionName: 'symbol',
      }),
      hyperEvmClient.readContract({
        address: ptAddress as `0x${string}`,
        abi: ptAbi,
        functionName: 'expiry',
      }),
    ]);

    return {
      symbol: symbol as string,
      expiry: Number(expiry),
    };
  } catch (e) {
    console.warn('Failed to fetch PT details:', e);
    return null;
  }
}

// Fetch all Pendle positions for a user
async function fetchPendlePositions(address: string): Promise<PendlePTPosition[]> {
  try {
    const response = await fetch(
      `${PENDLE_API_BASE}/v1/dashboard/positions/database/${address}`
    );

    if (!response.ok) {
      console.warn('Pendle API error:', response.status);
      return [];
    }

    const data = await response.json();
    const ptPositions: PendlePTPosition[] = [];

    // Extract PT positions from the response
    if (data?.positions) {
      for (const chainPosition of data.positions) {
        const chainId = chainPosition.chainId;

        for (const position of chainPosition.openPositions || []) {
          const ptData = position.pt;
          if (!ptData || parseFloat(ptData.balance) <= 0) continue;

          const marketId = position.marketId;
          const ptAddress = KNOWN_PT_ADDRESSES[marketId] || '';

          // Get PT details from contract
          let symbol = 'PT';
          let expiry = 0;

          if (ptAddress) {
            const details = await fetchPTDetails(ptAddress, chainId);
            if (details) {
              symbol = details.symbol;
              expiry = details.expiry;
            }
          }

          const expiryDate = expiry > 0 ? new Date(expiry * 1000) : new Date();
          const daysUntilExpiry = expiry > 0
            ? Math.ceil((expiry * 1000 - Date.now()) / (1000 * 60 * 60 * 24))
            : 0;

          // Convert balance from wei to human readable
          const balanceFormatted = formatUnits(BigInt(ptData.balance), 18);

          ptPositions.push({
            chainId,
            chainName: CHAIN_NAMES[chainId] || `Chain ${chainId}`,
            symbol,
            marketId,
            ptAddress,
            balance: balanceFormatted,
            balanceUsd: ptData.valuation || 0,
            expiry,
            expiryFormatted: expiry > 0
              ? expiryDate.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'Unknown',
            daysUntilExpiry,
          });
        }
      }
    }

    // Sort by expiry date (soonest first)
    ptPositions.sort((a, b) => a.expiry - b.expiry);

    return ptPositions;
  } catch (e) {
    console.warn('Failed to fetch Pendle positions:', e);
    return [];
  }
}

// Hook to get Pendle PT positions
export function usePendlePositions(address: string) {
  const query = useQuery({
    queryKey: ['pendle-positions', address],
    queryFn: () => fetchPendlePositions(address),
    enabled: !!address,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });

  return {
    ptPositions: query.data ?? [],
    totalValueUsd: (query.data ?? []).reduce((sum, p) => sum + p.balanceUsd, 0),
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export type { PendlePTPosition };
