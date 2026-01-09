import { ExternalLink, Eye, Activity, Shield, TrendingUp, Users, Wallet } from 'lucide-react';
import { LiveBackingData } from '@/components/BackingData';

// Treasury multisig - holds all positions
const MULTISIG_ADDRESS = '0x0FBCe7F3678467f7F7313fcB2C9D1603431Ad666';

// Operator wallet - for apps without Safe support
const OPERATOR_ADDRESS = '0xF466ad87c98f50473Cf4Fe32CdF8db652F9E36D6';

// Explorer links
const EXPLORERS = {
  multisig: {
    etherscan: `https://etherscan.io/address/${MULTISIG_ADDRESS}`,
    hyperevm: `https://hyperevmscan.io/address/${MULTISIG_ADDRESS}`,
    lighter: `https://app.lighter.xyz/explorer/accounts/${MULTISIG_ADDRESS}`,
    pendle: `https://app.pendle.finance/trade/portfolio/${MULTISIG_ADDRESS}`,
  },
  operator: {
    hypurrscan: `https://hypurrscan.io/address/${OPERATOR_ADDRESS}`,
    hyperevm: `https://hyperevmscan.io/address/${OPERATOR_ADDRESS}`,
  },
};

export function Backing() {
  return (
    <>
      {/* Hero */}
      <section className="hero" style={{ paddingBottom: 'var(--space-2xl)' }}>
        <div className="container">
          <h1 className="hero-title">No black boxes.</h1>
          <p className="hero-subtitle">
            Every position onchain. Every trade auditable.<br />
            Trust, but verify.
          </p>
        </div>
      </section>

      {/* Wallets Section */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="wallet-cards">
            {/* Treasury Multisig */}
            <div className="wallet-card">
              <div className="wallet-card-badge">Primary</div>
              <div className="wallet-card-icon">
                <Users size={28} />
              </div>
              <h3 className="wallet-card-title">Treasury Multisig</h3>
              <p className="wallet-card-desc">
                Spot positions on HyperEVM & ETH mainnet. Margin and perp positions on Lighter.
              </p>
              <div className="wallet-card-address">
                <span>{MULTISIG_ADDRESS.slice(0, 6)}...{MULTISIG_ADDRESS.slice(-4)}</span>
                <button
                  className="wallet-copy-btn"
                  onClick={() => navigator.clipboard.writeText(MULTISIG_ADDRESS)}
                  title="Copy address"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </button>
              </div>
              <div className="wallet-card-links">
                <a href={EXPLORERS.multisig.etherscan} target="_blank" rel="noopener noreferrer">
                  Etherscan <ExternalLink size={12} />
                </a>
                <a href={EXPLORERS.multisig.hyperevm} target="_blank" rel="noopener noreferrer">
                  HyperEVM <ExternalLink size={12} />
                </a>
                <a href={EXPLORERS.multisig.lighter} target="_blank" rel="noopener noreferrer">
                  Lighter <ExternalLink size={12} />
                </a>
              </div>
            </div>

            {/* Operator Wallet */}
            <div className="wallet-card wallet-card-alt">
              <div className="wallet-card-badge wallet-card-badge-alt">Operator</div>
              <div className="wallet-card-icon">
                <Wallet size={28} />
              </div>
              <h3 className="wallet-card-title">Operator Wallet</h3>
              <p className="wallet-card-desc">
                Trades on platforms without multisig support. Holds funds briefly, then returns to multisig after completion.
              </p>
              <div className="wallet-card-address">
                <span>{OPERATOR_ADDRESS.slice(0, 6)}...{OPERATOR_ADDRESS.slice(-4)}</span>
                <button
                  className="wallet-copy-btn"
                  onClick={() => navigator.clipboard.writeText(OPERATOR_ADDRESS)}
                  title="Copy address"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </button>
              </div>
              <div className="wallet-card-links">
                <a href={EXPLORERS.operator.hypurrscan} target="_blank" rel="noopener noreferrer">
                  Hypurrscan <ExternalLink size={12} />
                </a>
                <a href={EXPLORERS.operator.hyperevm} target="_blank" rel="noopener noreferrer">
                  HyperEVM <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Data Section */}
      <LiveBackingData />

      {/* Strategy Breakdown */}
      <section className="section" style={{ background: 'white' }}>
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Capital Allocation</h2>
            <p className="section-subtitle">Delta-neutral basis trade with yield stacking</p>
          </div>

          <div className="backing-flow">
            {/* USDC Deposit */}
            <div className="backing-node backing-node-root">
              <div className="backing-node-icon">$</div>
              <div className="backing-node-content">
                <h4>USDC Deposits</h4>
                <p>100% of vault TVL</p>
              </div>
            </div>

            <div className="backing-branch">
              <div className="backing-branch-line"></div>
            </div>

            {/* Split */}
            <div className="backing-split">
              {/* Perp Collateral - 30% */}
              <div className="backing-node">
                <div className="backing-node-percent">30%</div>
                <div className="backing-node-content">
                  <h4>Perp Collateral</h4>
                  <p>Short perp for delta hedge</p>
                  <div className="backing-node-venue">
                    <Activity size={14} />
                    Hyperliquid / Lighter
                  </div>
                </div>
              </div>

              {/* Spot Purchase - 70% */}
              <div className="backing-node">
                <div className="backing-node-percent">70%</div>
                <div className="backing-node-content">
                  <h4>Spot Purchase</h4>
                  <p>ETH, HYPE, SOL</p>
                  <div className="backing-node-venue">
                    <TrendingUp size={14} />
                    Hyperliquid
                  </div>
                </div>
              </div>
            </div>

            <div className="backing-branch backing-branch-right">
              <div className="backing-branch-line"></div>
            </div>

            {/* Spot Deployment */}
            <div className="backing-split backing-split-sub">
              {/* Pendle PT - 70% of spot */}
              <div className="backing-node backing-node-sm">
                <div className="backing-node-percent-sm">49%</div>
                <div className="backing-node-content">
                  <h4>Pendle PT</h4>
                  <p>Fixed yield, &lt;2mo maturity</p>
                </div>
              </div>

              {/* Liquid Staking - 30% of spot */}
              <div className="backing-node backing-node-sm">
                <div className="backing-node-percent-sm">21%</div>
                <div className="backing-node-content">
                  <h4>Liquid Staking</h4>
                  <p>stHYPE, weETH, mSOL</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Yield Sources */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Yield Sources</h2>
            <p className="section-subtitle">Multiple streams, one vault</p>
          </div>

          <div className="backing-yields">
            <div className="backing-yield-card">
              <div className="backing-yield-icon">
                <Activity size={24} />
              </div>
              <h4>Funding Rates</h4>
              <p className="backing-yield-range">5-20%+ APR</p>
              <p className="backing-yield-desc">From short perp positions. Variable based on market sentiment.</p>
            </div>

            <div className="backing-yield-card">
              <div className="backing-yield-icon">
                <Shield size={24} />
              </div>
              <h4>Pendle PT</h4>
              <p className="backing-yield-range">5-15% APR</p>
              <p className="backing-yield-desc">Fixed yield from discounted principal tokens.</p>
            </div>

            <div className="backing-yield-card">
              <div className="backing-yield-icon">
                <TrendingUp size={24} />
              </div>
              <h4>Liquid Staking</h4>
              <p className="backing-yield-range">3-8% APR</p>
              <p className="backing-yield-desc">Native staking rewards from LST protocols.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Transparency Features */}
      <section className="section" style={{ background: 'white' }}>
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Fully Verifiable</h2>
            <p className="section-subtitle">No CEX custody, no offchain games</p>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">
                <Eye size={24} />
              </div>
              <h3 className="step-title">Public Positions</h3>
              <p className="step-description">
                All positions held in publicly viewable wallets on Hyperliquid and Ethereum.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number">
                <Activity size={24} />
              </div>
              <h3 className="step-title">Onchain Execution</h3>
              <p className="step-description">
                Every trade, every rebalance — recorded onchain and auditable by anyone.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number">
                <Shield size={24} />
              </div>
              <h3 className="step-title">No Counterparty</h3>
              <p className="step-description">
                No CEX deposits, no custodians. Your backing is always verifiable.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section" style={{ textAlign: 'center' }}>
        <div className="container-narrow">
          <h2 className="section-title">Verify it yourself.</h2>
          <p className="section-subtitle" style={{ marginBottom: 'var(--space-xl)' }}>
            Check the wallets. Audit the positions. Trust the math.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href={EXPLORERS.multisig.lighter} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
              View on Lighter <ExternalLink size={16} />
            </a>
            <a href={EXPLORERS.operator.hypurrscan} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
              View on Hypurrscan <ExternalLink size={16} />
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
