import { useQuery } from '@tanstack/react-query';

const SOLANA_RPC = 'https://api.mainnet-beta.solana.com';
const JUPITER_LEND_API = 'https://lite-api.jup.ag/lend/v1/earn/positions';

export interface SolanaState {
  nativeSol: number;
  stakedSol: number;
  jupiterLendingSol: number;
  jlWsolShares: number;
  totalSol: number;
  solPrice: number;
  totalValue: number;
}

async function fetchSolPrice(): Promise<number> {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd'
    );
    if (response.ok) {
      const data = await response.json();
      return data.solana?.usd || 0;
    }
  } catch (e) {
    console.warn('Failed to fetch SOL price:', e);
  }
  return 0;
}

async function fetchNativeSolBalance(address: string): Promise<number> {
  try {
    const response = await fetch(SOLANA_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getBalance',
        params: [address],
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const lamports = data.result?.value || 0;
      return lamports / 1e9;
    }
  } catch (e) {
    console.warn('Failed to fetch SOL balance:', e);
  }
  return 0;
}

async function fetchStakedSol(address: string): Promise<number> {
  try {
    const response = await fetch(SOLANA_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'getProgramAccounts',
        params: [
          'Stake11111111111111111111111111111111111111',
          {
            encoding: 'jsonParsed',
            filters: [
              {
                memcmp: {
                  offset: 12,
                  bytes: address,
                },
              },
            ],
          },
        ],
      }),
    });

    if (response.ok) {
      const data = await response.json();
      let stakedSol = 0;
      if (data.result) {
        for (const account of data.result) {
          const info = account.account?.data?.parsed?.info;
          if (info?.stake?.delegation) {
            const lamports = parseInt(info.stake.delegation.stake || 0);
            stakedSol += lamports / 1e9;
          }
        }
      }
      return stakedSol;
    }
  } catch (e) {
    console.warn('Failed to fetch staked SOL:', e);
  }
  return 0;
}

async function fetchJupiterLendPosition(address: string): Promise<{ shares: number; underlying: number }> {
  try {
    const response = await fetch(`${JUPITER_LEND_API}?users=${address}`);
    if (response.ok) {
      const data = await response.json();
      for (const position of data) {
        // jlWSOL token (Jupiter Lend WSOL)
        if (position.token?.address === '2uQsyo1fXXQkDtcpXnLofWy88PxcvnfH2L8FPSE62FVU') {
          return {
            shares: parseInt(position.shares || 0) / 1e9,
            underlying: parseInt(position.underlyingAssets || 0) / 1e9,
          };
        }
      }
    }
  } catch (e) {
    console.warn('Failed to fetch Jupiter Lend position:', e);
  }
  return { shares: 0, underlying: 0 };
}

async function fetchSolanaState(address: string): Promise<SolanaState> {
  const [solPrice, nativeSol, stakedSol, jupiterLend] = await Promise.all([
    fetchSolPrice(),
    fetchNativeSolBalance(address),
    fetchStakedSol(address),
    fetchJupiterLendPosition(address),
  ]);

  const totalSol = nativeSol + stakedSol + jupiterLend.underlying;
  const totalValue = totalSol * solPrice;

  return {
    nativeSol,
    stakedSol,
    jupiterLendingSol: jupiterLend.underlying,
    jlWsolShares: jupiterLend.shares,
    totalSol,
    solPrice,
    totalValue,
  };
}

export function useSolanaPositions(address: string) {
  const query = useQuery({
    queryKey: ['solana-positions', address],
    queryFn: () => fetchSolanaState(address),
    enabled: !!address,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });

  return {
    data: query.data ?? {
      nativeSol: 0,
      stakedSol: 0,
      jupiterLendingSol: 0,
      jlWsolShares: 0,
      totalSol: 0,
      solPrice: 0,
      totalValue: 0,
    },
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
