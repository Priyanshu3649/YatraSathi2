// Payments Menu Component - ASCII Wireframe Layout
// Implements the exact menu layout as specified in the redesign plan

import React, { useState, useEffect, useRef } from 'react';
import { useKeyboardNavigation } from '../../contexts/KeyboardNavigationContext';
import '../../styles/payments-menu.css';

const PaymentsMenu = ({ onMenuSelect, onQuit }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef(null);
  
  const {
    handleEnterKey,
    handleEscapeKey
  } = useKeyboardNavigation();

  // Menu items as per ASCII wireframe specification
  const menuItems = [
    { id: 'contra', label: 'Contra', description: 'Cash to Bank / Bank to Cash transfers' },
    { id: 'payment', label: 'Payment', description: 'Money going out (Payments to suppliers, expenses)' },
    { id: 'receipt', label: 'Receipt', description: 'Money coming in (Receipts from customers)' },
    { id: 'journal', label: 'Journal Entry', description: 'Adjustments and other accounting entries' },
    { id: 'quit', label: 'Quit', description: 'Exit Payments module' }
  ];

  // Set initial focus
  useEffect(() => {
    if (menuRef.current) {
      menuRef.current.focus();
    }
  }, []);

  // Handle keyboard navigation
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
        handleEscapeKey(event);
        if (onQuit) onQuit();
        break;
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
        event.preventDefault();
        const index = parseInt(event.key) - 1;
        if (index < menuItems.length) {
          setSelectedIndex(index);
          setTimeout(() => handleMenuSelection(index), 100);
        }
        break;
      default:
        break;
    }
  };

  // Handle menu selection
  const handleMenuSelection = (index = selectedIndex) => {
    const selectedItem = menuItems[index];
    
    if (selectedItem.id === 'quit') {
      if (onQuit) onQuit();
    } else {
      if (onMenuSelect) onMenuSelect(selectedItem.id);
    }
  };

  return (
    <div className="payments-menu-container">
      {/* ASCII Wireframe Header */}
      <div className="payments-menu-header">
        <div className="ascii-border-top">┌─────────────────────────────────────────────┐</div>
        <div className="ascii-content">│                                             │</div>
        <div className="ascii-title">│                 PAYMENTS                    │</div>
        <div className="ascii-content">│                                             │</div>
      </div>

      {/* Menu Items */}
      <div 
        className="payments-menu-items"
        ref={menuRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        {menuItems.map((item, index) => (
          <div
            key={item.id}
            className={`ascii-menu-item ${index === selectedIndex ? 'selected' : ''}`}
            onClick={() => {
              setSelectedIndex(index);
              handleMenuSelection(index);
            }}
          >
            <div className="ascii-item-line">
              │{index === selectedIndex ? '               > ' : '                 '}{item.label}{' '.repeat(Math.max(0, 22 - item.label.length))}│
            </div>
          </div>
        ))}
      </div>

      {/* ASCII Wireframe Footer */}
      <div className="payments-menu-footer">
        <div className="ascii-content">│                                             │</div>
        <div className="ascii-border-bottom">└─────────────────────────────────────────────┘</div>
      </div>

      {/* Instructions */}
      <div className="payments-menu-instructions">
        <div className="instruction-line">Use ↑↓ Arrow keys to navigate</div>
        <div className="instruction-line">Press ENTER to select</div>
        <div className="instruction-line">Press ESC or select Quit to exit</div>
        <div className="instruction-line">Press 1-5 for quick selection</div>
      </div>

      {/* Selected item description */}
      {selectedIndex < menuItems.length && (
        <div className="selected-item-description">
          <strong>{menuItems[selectedIndex].label}:</strong> {menuItems[selectedIndex].description}
        </div>
      )}
    </div>
  );
};

export default PaymentsMenu;