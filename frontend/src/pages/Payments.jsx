import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { paymentAPI } from '../services/api';
import { useKeyboardNavigation } from '../contexts/KeyboardNavigationContext';
import SaveConfirmationModal from '../components/common/SaveConfirmationModal';
import ContraForm from '../components/Payments/ContraForm';
import PaymentForm from '../components/Payments/PaymentForm';
import ReceiptForm from '../components/Payments/ReceiptForm';
import JournalForm from '../components/Payments/JournalForm';
import '../styles/vintage-erp-theme.css';
import '../styles/classic-enterprise-global.css';
import '../styles/vintage-admin-panel.css';
import '../styles/dynamic-admin-panel.css';
import '../styles/vintage-erp-global.css';
import '../styles/bookings.css';
import '../dense.css';

// Add inline styles for payments menu grid - COMPACT VERSION
const paymentsStyles = `
  .payments-menu-grid {
    padding: 15px;
    max-width: 900px;
    margin: 0 auto;
  }
  
  .page-title {
    font-size: 20px;
    color: #1976d2;
    margin-bottom: 5px;
    font-weight: 600;
  }
  
  .page-subtitle {
    font-size: 12px;
    color: #666;
    margin-bottom: 20px;
  }
  
  .menu-cards-container {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-bottom: 20px;
  }
  
  .menu-card {
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    padding: 16px;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .menu-card:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(0,0,0,0.15);
    background-color: #f5f5f5;
  }
  
  .menu-card:focus {
    outline: 2px solid #1976d2;
    outline-offset: 2px;
  }
  
  .menu-card-icon {
    font-size: 32px;
    flex-shrink: 0;
  }
  
  .menu-card-content {
    flex: 1;
    min-width: 0;
  }
  
  .menu-card-title {
    font-size: 15px;
    font-weight: 600;
    color: #333;
    margin: 0 0 4px 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .menu-card-description {
    font-size: 11px;
    color: #666;
    margin: 0;
    line-height: 1.3;
    display: -webkit;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .keyboard-help {
    background: #f5f5f5;
    padding: 12px;
    border-radius: 4px;
    border-left: 4px solid #1976d2;
    font-size: 12px;
  }
  
  .keyboard-help h4 {
    margin: 0 0 8px 0;
    font-size: 13px;
    color: #1976d2;
  }
  
  .keyboard-help ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 6px;
  }
  
  .keyboard-help li {
    font-size: 11px;
    color: #666;
  }
  
  .keyboard-help kbd {
    background: #fff;
    border: 1px solid #ccc;
    border-radius: 3px;
    padding: 1px 4px;
    font-family: monospace;
    font-size: 10px;
    box-shadow: 0 1px 1px rgba(0,0,0,0.1);
    margin-right: 4px;
  }
`;

const Payments = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State management
  const [activeView, setActiveView] = useState('menu'); // 'menu', 'contra', 'payment', 'receipt', 'journal'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Keyboard navigation
  const {
    announceToScreenReader
  } = useKeyboardNavigation();

  // Menu items configuration - COMPACT HORIZONTAL LAYOUT
  const menuItems = [
    { 
      id: 'contra', 
      label: 'Contra Entry', 
      icon: '💳',
      description: 'Cash to Bank / Bank to Cash transfers',
      color: '#1976d2'
    },
    { 
      id: 'payment', 
      label: 'Payment', 
      icon: '💸',
      description: 'Money going out (Payments, expenses)',
      color: '#d32f2f'
    },
    { 
      id: 'receipt', 
      label: 'Receipt', 
      icon: '💰',
      description: 'Money coming in (Customer receipts)',
      color: '#388e3c'
    },
    { 
      id: 'journal', 
      label: 'Journal Entry', 
      icon: '📝',
      description: 'Adjustments & accounting entries',
      color: '#f57c00'
    }
  ];

  // Handle menu selection
  const handleMenuSelect = (menuType) => {
    setActiveView(menuType);
    setError('');
    setSuccess('');
    announceToScreenReader(`${menuType} form opened`);
  };

  // Handle back to menu
  const handleBack = () => {
    setActiveView('menu');
    setError('');
    setSuccess('');
    announceToScreenReader('Returned to payments menu');
  };

  // Handle quit
  const handleQuit = () => {
    navigate('/dashboard');
  };

  // Render current view
  const renderCurrentView = () => {
    switch (activeView) {
      case 'contra':
        return <ContraForm onBack={handleBack} />;
      case 'payment':
        return <PaymentForm onBack={handleBack} />;
      case 'receipt':
        return <ReceiptForm onBack={handleBack} />;
      case 'journal':
        return <JournalForm onBack={handleBack} />;
      default:
        return (
          <div className="payments-menu-grid">
            <h2 className="page-title">💳 Payments Module</h2>
            <p className="page-subtitle">Select a transaction type to proceed</p>
            
            <div className="menu-cards-container">
              {menuItems.map((item, index) => (
                <div 
                  key={item.id}
                  className="menu-card"
                  onClick={() => handleMenuSelect(item.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleMenuSelect(item.id);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Select ${item.label}`}
                  style={{
                    borderLeft: `4px solid ${item.color}`
                  }}
                >
                  <div className="menu-card-icon">{item.icon}</div>
                  <div className="menu-card-content">
                    <h3 className="menu-card-title">{item.label}</h3>
                    <p className="menu-card-description">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="keyboard-help">
              <h4>⌨️ Keyboard Shortcuts</h4>
              <ul>
                <li><kbd>↑</kbd><kbd>↓</kbd> Navigate</li>
                <li><kbd>Enter</kbd> Select</li>
                <li><kbd>ESC</kbd> Back to Dashboard</li>
                <li><kbd>1-4</kbd> Quick Select</li>
              </ul>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="erp-admin-container booking-layout">
      {/* Add inline styles */}
      <style>{paymentsStyles}</style>
      
      {/* Toolbar */}
      <div className="erp-toolbar">
        <button className="erp-icon-button" onClick={handleQuit} title="Home">🏠</button>
        {activeView !== 'menu' && (
          <button className="erp-icon-button" onClick={handleBack} title="Back">↩️</button>
        )}
        <div className="erp-tool-separator"></div>
        <span className="erp-toolbar-title">
          {activeView === 'menu' ? 'Payments Module' : 
           activeView === 'contra' ? 'Contra Entry' :
           activeView === 'payment' ? 'Payment' :
           activeView === 'receipt' ? 'Receipt' : 'Journal Entry'}
        </span>
      </div>

      {/* Error Message */}
      {error && (
        <div className="message-bar error" role="alert">
          <strong>Error:</strong> {error}
          <button onClick={() => setError('')} className="close-message">×</button>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="message-bar success" role="status">
          <strong>Success:</strong> {success}
          <button onClick={() => setSuccess('')} className="close-message">×</button>
        </div>
      )}

      {/* Main Content */}
      {renderCurrentView()}

      {/* Status Bar */}
      <div className="status-bar">
        <span>Logged in as: {user?.us_name || 'User'}</span>
        <span>|</span>
        <span>{new Date().toLocaleDateString()}</span>
      </div>
    </div>
  );
};

export default Payments;