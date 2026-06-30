import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import VoiceRecorder from './components/VoiceRecorder';
import TransactionList from './components/TransactionList';

export default function App() {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({
    totalCredits: 0,
    totalDebits: 0,
    balance: 0,
    transactionCount: 0
  });

  const fetchData = async () => {
    try {
      // Fetch list
      const listRes = await fetch('/api/transactions');
      if (listRes.ok) {
        const listData = await listRes.json();
        if (Array.isArray(listData)) {
          setTransactions(listData);
        }
      } else {
        console.error('Failed to fetch transactions list:', listRes.statusText);
      }

      // Fetch summary
      const summaryRes = await fetch('/api/transactions/summary');
      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        if (summaryData && typeof summaryData.balance !== 'undefined') {
          setSummary(summaryData);
        }
      } else {
        console.error('Failed to fetch transactions summary:', summaryRes.statusText);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Error deleting transaction:', err);
    }
  };

  return (
    <div className="app-layout">
      <Navbar balance={summary.balance} />

      <main className="app-main">
        <Dashboard summary={summary} />

        <div className="interaction-area">
          <div className="section-recorder">
            <VoiceRecorder onTransactionAdded={fetchData} />
          </div>
          <div className="section-history">
            <TransactionList
              transactions={transactions}
              onDeleteTransaction={handleDelete}
            />
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <p>VoiceLedger © {new Date().getFullYear()}</p>
      </footer>

      <style>{`
        .app-layout {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }
        .app-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding-bottom: 3rem;
        }
        .interaction-area {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 2rem;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
          padding: 0 2rem;
          align-items: start;
        }
        .app-footer {
          text-align: center;
          padding: 2rem 0;
          color: var(--text-muted);
          font-size: 0.75rem;
          border-top: 1px solid rgba(255, 255, 255, 0.03);
          margin-top: auto;
        }
        @media (max-width: 900px) {
          .interaction-area {
            grid-template-columns: 1fr;
            gap: 1.5rem;
            padding: 0 1rem;
          }
        }
      `}</style>
    </div>
  );
}
