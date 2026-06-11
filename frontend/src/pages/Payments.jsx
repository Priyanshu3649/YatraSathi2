import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useKeyboardNavigation } from '../contexts/KeyboardNavigationContext';
import PaymentsMenu from '../components/Payments/PaymentsMenu';
import ContraForm from '../components/Payments/ContraForm';
import PaymentForm from '../components/Payments/PaymentForm';
import ReceiptForm from '../components/Payments/ReceiptForm';
import JournalForm from '../components/Payments/JournalForm';
import '../styles/vintage-erp-theme.css';

const Payments = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState('menu'); // 'menu', 'contra', 'payment', 'receipt', 'journal'
  const { setActiveForm } = useKeyboardNavigation();

  // Reset active form when returning to menu
  useEffect(() => {
    if (currentView === 'menu') {
      setActiveForm(null);
    }
  }, [currentView, setActiveForm]);

  // Handle menu selection
  const handleMenuSelect = (menuType) => {
    setCurrentView(menuType);
  };

  // Handle quit/back to menu
  const handleQuit = () => {
    if (currentView === 'menu') {
      navigate('/dashboard');
    } else {
      setCurrentView('menu');
    }
  };

  // Render current view
  const renderCurrentView = () => {
    switch (currentView) {
      case 'contra':
        return <ContraForm onBack={() => setCurrentView('menu')} />;
      case 'payment':
        return <PaymentForm onBack={() => setCurrentView('menu')} />;
      case 'receipt':
        return <ReceiptForm onBack={() => setCurrentView('menu')} />;
      case 'journal':
        return <JournalForm onBack={() => setCurrentView('menu')} />;
      default:
        return (
          <PaymentsMenu 
            onMenuSelect={handleMenuSelect}
            onQuit={handleQuit}
          />
        );
    }
  };

  return (
    <div className="erp-page-container payments-layout" style={{ height: 'calc(100vh - 130px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Fixed ERP Header */}
      <div className="layout-header">
        <div className="erp-menu-bar">
          <div className="erp-menu-item">Voucher</div>
          <div className="erp-menu-item">Transactions</div>
          <div className="erp-menu-item">Accounts</div>
          <div className="erp-menu-item">Audit</div>
          <div className="erp-menu-item">Reports</div>
          <div className="erp-menu-item">Help</div>
          <div className="erp-user-info">STATION: HQ | USER: {user?.us_name || 'ADMIN'} ⚙</div>
        </div>
      </div>

      {/* Dynamic Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {currentView === 'menu' ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div className="layout-action-bar">
               <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                   <button className="erp-button" onClick={() => navigate('/dashboard')}>Main Dashboard (Esc)</button>
               </div>
               <div style={{ flex: 1 }}></div>
               <div className="erp-status-badge">ACCOUNTING GATEWAY | READY</div>
            </div>
            <div className="layout-content-wrapper" style={{ flex: 1, overflowY: 'auto' }}>
               <PaymentsMenu 
                 onMenuSelect={handleMenuSelect}
                 onQuit={handleQuit}
               />
            </div>
          </div>
        ) : (
          renderCurrentView()
        )}
      </div>
    </div>
  );
};

export default Payments;