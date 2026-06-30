import React from 'react';

export default function Navbar({ balance }) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <header className="navbar-container">
      <div className="navbar-brand">
        <div className="logo-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" fill="currentColor"/>
            <path d="M19 10v1a7 7 0 0 1-14 0v-1"/>
            <line x1="12" x2="12" y1="19" y2="22"/>
          </svg>
        </div>
        <div className="logo-text">
          <h1>VoiceLedger</h1>
          <span>Voice-Powered Ledger</span>
        </div>
      </div>
      <div className="navbar-balance glass-panel">
        <span className="balance-label">Net Balance</span>
        <span className={`balance-value ${balance >= 0 ? 'text-success' : 'text-danger'}`}>
          {formatCurrency(balance)}
        </span>
      </div>

      <style>{`
        .navbar-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 2rem;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
        }
        .navbar-brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .logo-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: var(--gradient-primary);
          color: white;
          box-shadow: 0 0 15px var(--primary-glow);
        }
        .logo-text h1 {
          font-size: 1.5rem;
          font-weight: 800;
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .logo-text span {
          font-size: 0.75rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .navbar-balance {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          padding: 0.5rem 1.25rem;
          border-radius: 12px !important;
          background: rgba(18, 18, 35, 0.4);
        }
        .balance-label {
          font-size: 0.7rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .balance-value {
          font-size: 1.25rem;
          font-weight: 700;
          font-family: var(--font-title);
        }
        .text-success {
          color: var(--success);
        }
        .text-danger {
          color: var(--danger);
        }
        @media (max-width: 600px) {
          .navbar-container {
            flex-direction: column;
            gap: 1rem;
            padding: 1rem;
            align-items: center;
          }
          .navbar-balance {
            align-items: center;
            width: 100%;
          }
        }
      `}</style>
    </header>
  );
}
