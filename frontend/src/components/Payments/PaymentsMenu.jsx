import React, { useState, useEffect, useRef } from 'react';
import { useKeyboardNavigation } from '../../contexts/KeyboardNavigationContext';
import '../../styles/vintage-erp-theme.css';

const PaymentsMenu = ({ onMenuSelect, onQuit }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef(null);
  
  const {
    closeModal
  } = useKeyboardNavigation();

  const menuItems = [
    { id: 'contra', label: 'Contra', description: 'Cash to Bank / Bank to Cash transfers', icon: '⇄' },
    { id: 'payment', label: 'Payment', description: 'Money going out (Payments to suppliers, expenses)', icon: '↑' },
    { id: 'receipt', label: 'Receipt', description: 'Money coming in (Receipts from customers)', icon: '↓' },
    { id: 'journal', label: 'Journal Entry', description: 'Adjustments and other accounting entries', icon: '✎' },
    { id: 'quit', label: 'Quit', description: 'Exit Payments module', icon: '✕' }
  ];

  useEffect(() => {
    if (menuRef.current) {
      menuRef.current.focus();
    }
  }, []);

  const handleKeyDown = (event) => {
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : menuItems.length - 1);
        break;
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex(prev => prev < menuItems.length - 1 ? prev + 1 : 0);
        break;
      case 'Enter':
        event.preventDefault();
        handleMenuSelection();
        break;
      case 'Escape':
        event.preventDefault();
        if (onQuit) onQuit();
        break;
      default:
        // Numeric shortcuts
        if (/^[1-5]$/.test(event.key)) {
          const index = parseInt(event.key) - 1;
          setSelectedIndex(index);
          setTimeout(() => handleMenuSelection(index), 100);
        }
        break;
    }
  };

  const handleMenuSelection = (index = selectedIndex) => {
    const selectedItem = menuItems[index];
    if (selectedItem.id === 'quit') {
      if (onQuit) onQuit();
    } else {
      if (onMenuSelect) onMenuSelect(selectedItem.id);
    }
  };

  return (
    <div className="erp-container" style={{ maxWidth: '600px', margin: '40px auto', padding: '0' }}>
      <div className="erp-panel-header" style={{ textAlign: 'center', fontSize: '16px', padding: '10px' }}>
        ACCOUNTING VOUCHER SELECTION
      </div>
      
      <div 
        className="erp-menu-list"
        ref={menuRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        style={{ outline: 'none', background: '#f5f5f5' }}
      >
        {menuItems.map((item, index) => (
          <div
            key={item.id}
            className={`erp-menu-item-row ${selectedIndex === index ? 'active' : ''}`}
            onClick={() => {
              setSelectedIndex(index);
              handleMenuSelection(index);
            }}
            style={{
              padding: '12px 20px',
              borderBottom: '1px solid #ddd',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              backgroundColor: selectedIndex === index ? 'var(--erp-blue-dark)' : 'transparent',
              color: selectedIndex === index ? 'white' : 'var(--erp-text)',
              transition: 'all 0.1s'
            }}
          >
            <span style={{ width: '30px', fontWeight: 'bold', opacity: 0.7 }}>{index + 1}.</span>
            <span style={{ width: '40px', fontSize: '18px' }}>{item.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{item.label}</div>
              <div style={{ fontSize: '11px', opacity: 0.8 }}>{item.description}</div>
            </div>
            {selectedIndex === index && <span style={{ fontWeight: 'bold' }}>➜</span>}
          </div>
        ))}
      </div>
      
      <div style={{ padding: '10px', background: '#e0e0e0', fontSize: '11px', textAlign: 'center', borderTop: '1px solid #ccc' }}>
        Use Arrow keys to navigate, Enter to select, or press 1-5
      </div>
    </div>
  );
};

export default PaymentsMenu;
