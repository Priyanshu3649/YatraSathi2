import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useKeyboardForm } from '../hooks/useKeyboardForm';
import PaymentsMenu from '../components/Payments/PaymentsMenu';
import ContraForm from '../components/Payments/ContraForm';
import PaymentForm from '../components/Payments/PaymentForm';
import ReceiptForm from '../components/Payments/ReceiptForm';
import JournalForm from '../components/Payments/JournalForm';
import '../styles/payments-menu.css';
import '../styles/accounting-forms.css';

const Payments = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState('menu'); // 'menu', 'contra', 'payment', 'receipt', 'journal'
  
  // MANDATORY: Initialize keyboard navigation (COMPLIANT)
  const { isModalOpen } = useKeyboardForm({
    formId: 'PAYMENTS_MODULE',
    fields: ['menu_selection'], // Simple field for menu navigation
    onSave: () => console.log('Payments module save'),
    onCancel: () => navigate('/dashboard')
  });

  // Handle menu selection
  const handleMenuSelect = (menuType) => {
    setCurrentView(menuType);
  };

  // Handle quit/back to menu
  const handleQuit = () => {
    if (currentView === 'menu') {
      // Exit payments module entirely
      navigate('/dashboard');
    } else {
      // Return to menu
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
    <div className="payments-layout erp-page-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* 1. Header Row - Consistency with other modules */}
      <div className="layout-header">
        <div className="erp-menu-bar">
          <div className="erp-menu-item">File</div>
          <div className="erp-menu-item">Edit</div>
          <div className="erp-menu-item">View</div>
          <div className="erp-menu-item">Account</div>
          <div className="erp-menu-item">Reports</div>
          <div className="erp-menu-item">Help</div>
          <div className="erp-user-info">USER: {user?.us_name || 'ADMIN'} ⚙</div>
        </div>
      </div>

      {currentView === 'menu' ? (
        <>
          {/* Action Bar for Menu */}
          <div className="layout-action-bar">
             <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                 <button className="erp-button" onClick={() => navigate('/dashboard')}>Back to Menu</button>
             </div>
             <div style={{ flex: 1 }}></div>
             <div style={{ fontWeight: 'bold', fontSize: '12px' }}>
                 ACCOUNTING MODULE | MENU
             </div>
          </div>
          <div className="layout-content-wrapper" style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            <div className="layout-main-column" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <PaymentsMenu 
                onMenuSelect={handleMenuSelect}
                onQuit={handleQuit}
              />
            </div>
          </div>
        </>
      ) : (
        renderCurrentView()
      )}
    </div>
  );
};

export default Payments;