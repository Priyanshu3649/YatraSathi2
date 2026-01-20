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
    <div className="payments-container">
      {renderCurrentView()}
    </div>
  );
};

export default Payments;