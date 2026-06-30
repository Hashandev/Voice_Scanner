import React, { useState } from 'react';

export default function TransactionList({ transactions, onDeleteTransaction }) {
  const [filter, setFilter] = useState('all');

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-IN', options);
  };

  const filteredTransactions = transactions.filter(t => {
    if (filter === 'credit') return t.type === 'credit';
    if (filter === 'debit') return t.type === 'debit';
    return true;
  });

  return (
    <div className="list-container glass-panel">
      <div className="list-header">
        <h3>Transaction History</h3>
        <div className="filter-buttons">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={`filter-btn ${filter === 'credit' ? 'active' : ''}`}
            onClick={() => setFilter('credit')}
          >
            Credits
          </button>
          <button 
            className={`filter-btn ${filter === 'debit' ? 'active' : ''}`}
            onClick={() => setFilter('debit')}
          >
            Debits
          </button>
        </div>
      </div>

      <div className="transaction-scroll">
        {filteredTransactions.length === 0 ? (
          <div className="no-transactions">
            <span className="no-tx-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>
                <path d="M12 6v12"/>
              </svg>
            </span>
            <p>No transactions found.</p>
            <span className="no-tx-sub">Speak a transaction to get started!</span>
          </div>
        ) : (
          filteredTransactions.map((tx) => (
            <div key={tx._id} className="transaction-item animate-fade-in">
              <div className="tx-left">
                <div className={`tx-icon-circle ${tx.type}`}>
                  {tx.type === 'credit' ? '↑' : '↓'}
                </div>
                <div className="tx-details">
                  <span className="tx-desc">{tx.description}</span>
                  <div className="tx-meta">
                    <span className="tx-category">{tx.category}</span>
                    <span className="tx-divider">•</span>
                    <span className="tx-date">{formatDate(tx.createdAt)}</span>
                  </div>
                  {tx.rawTranscription && tx.rawTranscription !== 'Manual entry' && (
                    <span className="tx-transcript">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '4px', verticalAlign: 'middle' }}>
                        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" fill="currentColor"/>
                        <path d="M19 10v1a7 7 0 0 1-14 0v-1"/>
                        <line x1="12" x2="12" y1="19" y2="22"/>
                      </svg>
                      "{tx.rawTranscription}"
                    </span>
                  )}
                </div>
              </div>
              
              <div className="tx-right">
                <span className={`tx-amount ${tx.type}`}>
                  {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
                </span>
                <button 
                  onClick={() => onDeleteTransaction(tx._id)}
                  className="tx-delete-btn"
                  title="Delete Transaction"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18"/>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <style>{`
        .list-container {
          max-width: 600px;
          margin: 0 auto;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          max-height: 500px;
        }
        .list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.25rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .list-header h3 {
          font-size: 1.15rem;
          font-weight: 600;
        }
        .filter-buttons {
          display: flex;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.03);
          padding: 0.25rem;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .filter-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          padding: 0.35rem 0.75rem;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          border-radius: 8px;
          transition: var(--transition-smooth);
        }
        .filter-btn:hover {
          color: var(--text-main);
        }
        .filter-btn.active {
          background: var(--gradient-primary);
          color: white;
          box-shadow: 0 4px 10px rgba(124, 58, 237, 0.2);
        }
        .transaction-scroll {
          overflow-y: auto;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          padding-right: 0.25rem;
        }
        .no-transactions {
          text-align: center;
          padding: 3rem 1rem;
          color: var(--text-muted);
        }
        .no-tx-icon {
          font-size: 2.5rem;
          display: block;
          margin-bottom: 1rem;
          opacity: 0.5;
        }
        .no-tx-sub {
          font-size: 0.75rem;
          display: block;
          margin-top: 0.25rem;
        }
        .transaction-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.85rem 1rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 14px;
          transition: var(--transition-smooth);
        }
        .transaction-item:hover {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(124, 58, 237, 0.2);
          transform: translateY(-2px);
        }
        .tx-left {
          display: flex;
          align-items: flex-start;
          gap: 0.85rem;
          flex: 1;
        }
        .tx-icon-circle {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          font-size: 1rem;
          font-weight: bold;
          flex-shrink: 0;
          margin-top: 0.15rem;
        }
        .tx-icon-circle.credit {
          background: var(--success-bg);
          color: var(--success);
          border: 1px solid rgba(16, 185, 129, 0.2);
        }
        .tx-icon-circle.debit {
          background: var(--danger-bg);
          color: var(--danger);
          border: 1px solid rgba(239, 68, 68, 0.2);
        }
        .tx-details {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          flex: 1;
        }
        .tx-desc {
          font-weight: 600;
          font-size: 0.925rem;
          color: var(--text-main);
          word-break: break-word;
        }
        .tx-meta {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .tx-category {
          background: rgba(255, 255, 255, 0.05);
          padding: 0.1rem 0.4rem;
          border-radius: 4px;
          font-size: 0.7rem;
        }
        .tx-transcript {
          font-size: 0.75rem;
          color: var(--secondary);
          font-style: italic;
          margin-top: 0.15rem;
        }
        .tx-right {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-left: 0.5rem;
        }
        .tx-amount {
          font-family: var(--font-title);
          font-weight: 700;
          font-size: 1.05rem;
        }
        .tx-amount.credit {
          color: var(--success);
        }
        .tx-amount.debit {
          color: var(--danger);
        }
        .tx-delete-btn {
          background: transparent;
          border: none;
          cursor: pointer;
          font-size: 1.1rem;
          opacity: 0;
          transition: var(--transition-smooth);
          padding: 0.2rem;
        }
        .transaction-item:hover .tx-delete-btn {
          opacity: 0.6;
        }
        .transaction-item:hover .tx-delete-btn:hover {
          opacity: 1;
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
}
