import { useQuery } from '@tanstack/react-query';
import { createPublicClient, http, formatUnits } from 'viem';
import { mainnet } from 'viem/chains';

// Define HyperEVM chain
const hyperEvm = {
  id: 998,
  name: 'HyperEVM',
  nativeCurrency: { name: 'HYPE', symbol: 'HYPE', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.hyperliquid.xyz/evm'] },
  },
  blockExplorers: {
    default: { name: 'HyperEVM Scan', url: 'https://hyperevmscan.io' },
  },
} as const;

// Public clients
const ethClient = createPublicClient({
  chain: mainnet,
  transport: http('https://eth.llamarpc.com'),
});

const hyperEvmClient = createPublicClient({
  chain: hyperEvm,
  transport: http(),
});

// Common token addresses
const ETH_TOKENS = {
  USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  stETH: '0xae7ab96520DE3A18E5e111B5EaAb831c6199003',
  weETH: '0xCd5fE23C85820F7B72D0926FC9b05b43E359b7ee',
} as const;

const HYPEREVM_TOKENS = {
  USDC: '0x211Cc4DD073734dA055fbF44a2b4667d5E5fE5d2',
} as const;

// ERC20 ABI for balanceOf
const erc20Abi = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

interface TokenBalance {
  symbol: string;
  balance: string;
  balanceFormatted: string;
  chain: 'ethereum' | 'hyperevm';
}

// Fetch ETH mainnet balances
async function fetchEthBalances(address: `0x${string}`): Promise<TokenBalance[]> {
  const balances: TokenBalance[] = [];

  try {
    // Native ETH balance
    const ethBalance = await ethClient.getBalance({ address });
    if (ethBalance > 0n) {
      balances.push({
        symbol: 'ETH',
        balance: ethBalance.toString(),
        balanceFormatted: formatUnits(ethBalance, 18),
        chain: 'ethereum',
      });
    }

    // USDC balance
    try {
      const usdcBalance = await ethClient.readContract({
        address: ETH_TOKENS.USDC,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address],
      });
      if (usdcBalance > 0n) {
        balances.push({
          symbol: 'USDC',
          balance: usdcBalance.toString(),
          balanceFormatted: formatUnits(usdcBalance, 6),
          chain: 'ethereum',
        });
      }
    } catch (e) {
      console.warn('Failed to fetch USDC balance:', e);
    }

    // weETH balance
    try {
      const weethBalance = await ethClient.readContract({
        address: ETH_TOKENS.weETH,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address],
      });
      if (weethBalance > 0n) {
        balances.push({
          symbol: 'weETH',
          balance: weethBalance.toString(),
          balanceFormatted: formatUnits(weethBalance, 18),
          chain: 'ethereum',
        });
      }
    } catch (e) {
      console.warn('Failed to fetch weETH balance:', e);
    }
  } catch (e) {
    console.error('Failed to fetch ETH balances:', e);
  }

  return balances;
}

// Fetch HyperEVM balances
async function fetchHyperEvmBalances(address: `0x${string}`): Promise<TokenBalance[]> {
  const balances: TokenBalance[] = [];

  try {
    // Native HYPE balance
    const hypeBalance = await hyperEvmClient.getBalance({ address });
    if (hypeBalance > 0n) {
      balances.push({
        symbol: 'HYPE',
        balance: hypeBalance.toString(),
        balanceFormatted: formatUnits(hypeBalance, 18),
        chain: 'hyperevm',
      });
    }

    // USDC balance on HyperEVM
    try {
      const usdcBalance = await hyperEvmClient.readContract({
        address: HYPEREVM_TOKENS.USDC,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address],
      });
      if (usdcBalance > 0n) {
        balances.push({
          symbol: 'USDC',
          balance: usdcBalance.toString(),
          balanceFormatted: formatUnits(usdcBalance, 6),
          chain: 'hyperevm',
        });
      }
    } catch (e) {
      console.warn('Failed to fetch HyperEVM USDC balance:', e);
    }
  } catch (e) {
    console.error('Failed to fetch HyperEVM balances:', e);
  }

  return balances;
}

// Combined hook
export function useEvmBalances(address: string) {
  const ethQuery = useQuery({
    queryKey: ['eth-balances', address],
    queryFn: () => fetchEthBalances(address as `0x${string}`),
    enabled: !!address,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });

  const hyperEvmQuery = useQuery({
    queryKey: ['hyperevm-balances', address],
    queryFn: () => fetchHyperEvmBalances(address as `0x${string}`),
    enabled: !!address,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });

  return {
    ethBalances: ethQuery.data ?? [],
    hyperEvmBalances: hyperEvmQuery.data ?? [],
    allBalances: [...(ethQuery.data ?? []), ...(hyperEvmQuery.data ?? [])],
    isLoading: ethQuery.isLoading || hyperEvmQuery.isLoading,
    isError: ethQuery.isError || hyperEvmQuery.isError,
  };
}

export type { TokenBalance };
