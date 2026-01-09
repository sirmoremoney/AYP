import { ExternalLink, RefreshCw } from 'lucide-react';
import { useEvmBalances, type TokenBalance } from '@/hooks/useEvmBalances';
import { usePendlePositions, type PendlePTPosition } from '@/hooks/usePendle';

const MULTISIG_ADDRESS = '0x0FBCe7F3678467f7F7313fcB2C9D1603431Ad666';

// Format number with commas and decimals
function formatNumber(value: string | number, decimals = 2): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0.00';
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// Format USD value
function formatUsd(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '$0.00';
  return `$${formatNumber(Math.abs(num))}`;
}

// Multisig Spot Holdings Component
export function MultisigBalances() {
  const { ethBalances, hyperEvmBalances, isLoading, isError } = useEvmBalances(MULTISIG_ADDRESS);

  if (isLoading) {
    return (
      <div className="backing-data-card">
        <div className="backing-data-header">
          <h3>Spot Holdings</h3>
          <RefreshCw size={16} className="spinning" />
        </div>
        <div className="backing-data-loading">Loading balances...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="backing-data-card">
        <div className="backing-data-header">
          <h3>Spot Holdings</h3>
        </div>
        <div className="backing-data-error">Failed to load balances</div>
      </div>
    );
  }

  return (
    <div className="backing-data-card">
      <div className="backing-data-header">
        <h3>Spot Holdings</h3>
        <span className="backing-data-badge">EVM</span>
      </div>

      {ethBalances.length === 0 && hyperEvmBalances.length === 0 ? (
        <div className="backing-data-empty">No spot holdings found</div>
      ) : (
        <div className="balance-list">
          {ethBalances.length > 0 && (
            <>
              <div className="balance-chain-label">Ethereum</div>
              {ethBalances.map((bal: TokenBalance) => (
                <div key={`eth-${bal.symbol}`} className="balance-item">
                  <span className="balance-coin">{bal.symbol}</span>
                  <span className="balance-amount">
                    {parseFloat(bal.balanceFormatted) < 0.0001
                      ? '<0.0001'
                      : formatNumber(bal.balanceFormatted, 4)}
                  </span>
                </div>
              ))}
            </>
          )}
          {hyperEvmBalances.length > 0 && (
            <>
              <div className="balance-chain-label">HyperEVM</div>
              {hyperEvmBalances.map((bal: TokenBalance) => (
                <div key={`hyper-${bal.symbol}`} className="balance-item">
                  <span className="balance-coin">{bal.symbol}</span>
                  <span className="balance-amount">
                    {parseFloat(bal.balanceFormatted) < 0.0001
                      ? '<0.0001'
                      : formatNumber(bal.balanceFormatted, 4)}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      <a
        href={`https://etherscan.io/address/${MULTISIG_ADDRESS}`}
        target="_blank"
        rel="noopener noreferrer"
        className="backing-data-link"
        style={{ marginTop: 'var(--space-sm)' }}
      >
        View on Etherscan <ExternalLink size={12} />
      </a>
    </div>
  );
}

// Pendle PT Holdings Component (auto-discovers across all chains)
export function PendlePositions() {
  const { ptPositions, totalValueUsd, isLoading, isError } = usePendlePositions(MULTISIG_ADDRESS);

  if (isLoading) {
    return (
      <div className="backing-data-card">
        <div className="backing-data-header">
          <h3>Pendle PT</h3>
          <RefreshCw size={16} className="spinning" />
        </div>
        <div className="backing-data-loading">Loading PT positions...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="backing-data-card">
        <div className="backing-data-header">
          <h3>Pendle PT</h3>
          <span className="backing-data-badge">Yield</span>
        </div>
        <div className="backing-data-error">Failed to load positions</div>
      </div>
    );
  }

  return (
    <div className="backing-data-card">
      <div className="backing-data-header">
        <h3>Pendle PT</h3>
        {totalValueUsd > 0 && (
          <span className="backing-data-value">{formatUsd(totalValueUsd)}</span>
        )}
      </div>

      {ptPositions.length === 0 ? (
        <div className="backing-data-empty">No PT positions</div>
      ) : (
        <div className="pt-list">
          {ptPositions.map((pt: PendlePTPosition, idx: number) => {
            const isExpiringSoon = pt.daysUntilExpiry > 0 && pt.daysUntilExpiry <= 14;

            return (
              <div key={pt.ptAddress || idx} className="pt-item">
                <div className="pt-info">
                  <span className="pt-symbol">{pt.symbol}</span>
                  <span className={`pt-expiry ${isExpiringSoon ? 'expiring-soon' : ''}`}>
                    {pt.chainName} · Expires {pt.expiryFormatted}
                    {pt.daysUntilExpiry > 0 && ` (${pt.daysUntilExpiry}d)`}
                  </span>
                </div>
                <div className="pt-balance-info">
                  <span className="pt-balance">{formatNumber(pt.balance, 2)}</span>
                  {pt.balanceUsd > 0 && (
                    <span className="pt-balance-usd">{formatUsd(pt.balanceUsd)}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <a
        href={`https://app.pendle.finance/trade/portfolio/${MULTISIG_ADDRESS}`}
        target="_blank"
        rel="noopener noreferrer"
        className="backing-data-link"
        style={{ marginTop: 'var(--space-sm)' }}
      >
        View on Pendle <ExternalLink size={12} />
      </a>
    </div>
  );
}

// Lighter Positions Component
export function LighterPositions() {
  return (
    <div className="backing-data-card">
      <div className="backing-data-header">
        <h3>Perp Positions</h3>
        <span className="backing-data-badge">Lighter</span>
      </div>

      <div className="lighter-info">
        <p>ETH and HYPE perpetual positions are held on Lighter DEX for delta-neutral hedging.</p>
        <p className="lighter-note">View live positions and PnL on the Lighter explorer.</p>
      </div>

      <a
        href={`https://app.lighter.xyz/explorer/accounts/${MULTISIG_ADDRESS}`}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-secondary btn-sm"
        style={{ width: '100%', justifyContent: 'center', marginTop: 'var(--space-md)' }}
      >
        View Positions on Lighter <ExternalLink size={14} />
      </a>
    </div>
  );
}

// Combined Live Data Section
export function LiveBackingData() {
  return (
    <section className="section">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Live Positions</h2>
          <p className="section-subtitle">Real-time data from onchain wallets</p>
        </div>

        <div className="backing-data-grid">
          <MultisigBalances />
          <PendlePositions />
          <LighterPositions />
        </div>
      </div>
    </section>
  );
}
