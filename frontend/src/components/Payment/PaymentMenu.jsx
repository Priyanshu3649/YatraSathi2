import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import PaymentSection from './PaymentSection';
import ContraSection from './ContraSection';
import ReceiptSection from './ReceiptSection';
import JournalSection from './JournalSection';
import '../../styles/vintage-erp-theme.css';
import '../../styles/classic-enterprise-global.css';

/**
 * Payment Menu Interface
 * Main container for all payment-related sections
 */
const PaymentMenu = () => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('payment');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Section configuration
  const sections = [
    { id: 'payment', label: 'Payment', icon: '💳' },
    { id: 'contra', label: 'Contra', icon: '🔄' },
    { id: 'receipt', label: 'Receipt', icon: '🧾' },
    { id: 'journal', label: 'Journal Entry', icon: '📝' }
  ];

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Tab navigation between sections
      if (e.key === 'Tab') {
        e.preventDefault();
        const currentIndex = sections.findIndex(s => s.id === activeSection);
        const nextIndex = (currentIndex + 1) % sections.length;
        setActiveSection(sections[nextIndex].id);
      }
      
      // Arrow keys for section navigation
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const currentIndex = sections.findIndex(s => s.id === activeSection);
        const direction = e.key === 'ArrowRight' ? 1 : -1;
        const nextIndex = (currentIndex + direction + sections.length) % sections.length;
        setActiveSection(sections[nextIndex].id);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeSection, sections]);

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'payment':
        return <PaymentSection />;
      case 'contra':
        return <ContraSection />;
      case 'receipt':
        return <ReceiptSection />;
      case 'journal':
        return <JournalSection />;
      default:
        return <PaymentSection />;
    }
  };

  return (
    <div className="erp-admin-container">
      {/* Title Bar */}
      <div className="title-bar">
        <div className="system-menu">💰</div>
        <div className="title-text">Payment Management System</div>
        <div className="close-button">×</div>
      </div>

      {/* Menu Bar */}
      <div className="menu-bar">
        <div className="menu-item">File</div>
        <div className="menu-item">Edit</div>
        <div className="menu-item">View</div>
        <div className="menu-item">Reports</div>
        <div className="menu-item">Export</div>
        <div className="menu-item">Help</div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        {sections.map((section) => (
          <button
            key={section.id}
            className={`tool-button ${activeSection === section.id ? 'active' : ''}`}
            onClick={() => setActiveSection(section.id)}
            disabled={loading}
          >
            {section.icon} {section.label}
          </button>
        ))}
        
        <div className="tool-separator"></div>
        
        {loading && (
          <div className="loading-indicator">
            <span className="spinner"></span>
            Processing...
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="main-content">
        {error && (
          <div className="alert alert-error">
            <strong>Error:</strong> {error}
          </div>
        )}
        
        {renderSectionContent()}
      </div>

      {/* Status Bar */}
      <div className="status-bar">
        <div className="status-item">
          User: {user?.us_fname} {user?.us_lname}
        </div>
        <div className="status-item">
          Section: {sections.find(s => s.id === activeSection)?.label}
        </div>
        <div className="status-item">
          Status: {loading ? 'Processing...' : 'Ready'}
        </div>
        <div className="status-panel">
          {loading ? 'WORKING' : 'READY'}
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        .erp-admin-container {
          height: 100vh;
          display: flex;
          flex-direction: column;
          background: #f0f0f0;
          font-family: Arial, sans-serif;
        }

        .title-bar {
          background: linear-gradient(to right, #000080, #4169e1);
          color: white;
          padding: 4px 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          border-bottom: 2px solid #000080;
        }

        .menu-bar {
          background: #e0e0e0;
          padding: 2px 8px;
          display: flex;
          border-bottom: 1px solid #c0c0c0;
          font-size: 11px;
        }

        .menu-item {
          padding: 2px 8px;
          margin-right: 2px;
          cursor: pointer;
          border: 1px solid transparent;
        }

        .menu-item:hover {
          background: #c0c0c0;
          border: 1px solid #808080;
        }

        .toolbar {
          background: #d0d0d0;
          padding: 4px 8px;
          display: flex;
          align-items: center;
          border-bottom: 1px solid #a0a0a0;
          font-size: 11px;
          flex-wrap: wrap;
          gap: 4px;
        }

        .tool-button {
          background: #e0e0e0;
          border: 1px solid #808080;
          padding: 2px 6px;
          margin-right: 4px;
          cursor: pointer;
          font-size: 11px;
          white-space: nowrap;
        }

        .tool-button:hover:not(:disabled) {
          background: #c0c0c0;
        }

        .tool-button.active {
          background: #000080;
          color: white;
          border-color: #000080;
        }

        .tool-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .tool-separator {
          width: 1px;
          height: 16px;
          background: #808080;
          margin: 0 4px;
        }

        .loading-indicator {
          display: flex;
          align-items: center;
          gap: 4px;
          color: #000080;
          font-weight: bold;
        }

        .spinner {
          width: 12px;
          height: 12px;
          border: 2px solid #c0c0c0;
          border-top: 2px solid #000080;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .main-content {
          flex: 1;
          padding: 12px;
          overflow-y: auto;
          background: white;
        }

        .alert {
          padding: 8px 12px;
          margin-bottom: 12px;
          border-radius: 3px;
          font-size: 12px;
        }

        .alert-error {
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          color: #721c24;
        }

        .status-bar {
          background: #c0c0c0;
          padding: 2px 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          border-top: 1px solid #808080;
        }

        .status-item {
          padding: 0 8px;
        }

        .status-panel {
          background: #008000;
          color: white;
          padding: 1px 6px;
          font-weight: bold;
          font-size: 10px;
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .tool-button {
            padding: 4px 8px;
            font-size: 10px;
          }
        }
      `}</style>
    </div>
  );
};

// Individual section components will be implemented separately
// PaymentSection is imported from ./PaymentSection

const ContraSection = () => {
  return (
    <div className="contra-section">
      <h3>Contra Entries</h3>
      <p>Contra section implementation will be added here with records list.</p>
    </div>
  );
};

const ReceiptSection = () => {
  return (
    <div className="receipt-section">
      <h3>Receipt Records</h3>
      <p>Receipt section implementation will be added here with records list.</p>
    </div>
  );
};

const JournalSection = () => {
  return (
    <div className="journal-section">
      <h3>Journal Entries</h3>
      <p>Journal section implementation will be added here with records list.</p>
    </div>
  );
};

export default PaymentMenu;