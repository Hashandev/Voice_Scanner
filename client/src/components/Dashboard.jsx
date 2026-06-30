import React from 'react';

export default function Dashboard({ summary }) {
  const { totalCredits = 0, totalDebits = 0, balance = 0, transactionCount = 0 } = summary;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="dashboard-grid">
      {/* Balance Card */}
      <div className="dashboard-card balance-main glass-panel">
        <div className="card-overlay"></div>
        <div className="card-content">
          <span className="card-label">Available Balance</span>
          <h2 className="card-value">{formatCurrency(balance)}</h2>
          <div className="card-footer">
            <span>Active Ledger Dashboard</span>
            <span className="badge">{transactionCount} Transactions</span>
          </div>
        </div>
      </div>

      {/* Credit Card */}
      <div className="dashboard-card stat-card credit-card glass-panel">
        <div className="stat-icon">↑</div>
        <div className="stat-info">
          <span className="card-label">Total Inflow (Credits)</span>
          <h3 className="card-value text-success">{formatCurrency(totalCredits)}</h3>
        </div>
      </div>

      {/* Debit Card */}
      <div className="dashboard-card stat-card debit-card glass-panel">
        <div className="stat-icon">↓</div>
        <div className="stat-info">
          <span className="card-label">Total Outflow (Debits)</span>
          <h3 className="card-value text-danger">{formatCurrency(totalDebits)}</h3>
        </div>
      </div>

      <style>{`
        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          max-width: 1200px;
          margin: 0 auto 2rem auto;
          width: 100%;
          padding: 0 2rem;
        }
        .dashboard-card {
          position: relative;
          overflow: hidden;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          border-radius: 20px;
        }
        .balance-main {
          grid-column: span 3;
          background: linear-gradient(135deg, rgba(124, 58, 237, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%);
          border-color: var(--border-accent);
        }
        .balance-main .card-value {
          font-size: 2.5rem;
          font-weight: 800;
          margin: 0.5rem 0;
          background: linear-gradient(to right, #ffffff, #e2e8f0);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .stat-card {
          flex-direction: row;
          align-items: center;
          gap: 1rem;
          grid-column: span 1;
        }
        .stat-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 12px;
          font-size: 1.5rem;
          font-weight: bold;
        }
        .credit-card .stat-icon {
          background: var(--success-bg);
          color: var(--success);
          border: 1px solid rgba(16, 185, 129, 0.2);
        }
        .debit-card .stat-icon {
          background: var(--danger-bg);
          color: var(--danger);
          border: 1px solid rgba(239, 68, 68, 0.2);
        }
        .stat-info {
          display: flex;
          flex-direction: column;
        }
        .card-label {
          font-size: 0.8rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.25rem;
        }
        .card-value {
          font-family: var(--font-title);
          font-weight: 700;
        }
        .text-success {
          color: var(--success);
        }
        .text-danger {
          color: var(--danger);
        }
        .card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.75rem;
          color: var(--text-muted);
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          padding-top: 0.75rem;
          margin-top: 0.5rem;
        }
        .badge {
          background: rgba(124, 58, 237, 0.2);
          color: var(--text-main);
          border: 1px solid rgba(124, 58, 237, 0.3);
          padding: 0.2rem 0.6rem;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 500;
        }
        @media (max-width: 900px) {
          .dashboard-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .balance-main {
            grid-column: span 2;
          }
          .stat-card {
            grid-column: span 1;
          }
        }
        @media (max-width: 600px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
            padding: 0 1rem;
            gap: 1rem;
          }
          .balance-main {
            grid-column: span 1;
          }
          .stat-card {
            grid-column: span 1;
          }
        }
      `}</style>
    </div>
  );
}
