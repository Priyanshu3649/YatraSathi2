// Record Action Menu Component
// Keyboard-driven action menu for records as per YatraSathi specification

import React, { useState, useEffect, useRef } from 'react';
import { setupFocusTrap } from '../../utils/focusManager';

const RecordActionMenu = ({ 
  isOpen, 
  onClose, 
  onAction, 
  record, 
  position = { x: 0, y: 0 },
  actions = []
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef(null);

  // Default actions for booking records
  const defaultActions = [
    { key: 'view', label: 'View Booking', icon: '👁️' },
    { key: 'edit', label: 'Edit Booking', icon: '✏️' },
    { key: 'billing', label: 'Generate Billing', icon: '💰' },
    { key: 'payment', label: 'Update Payment Status', icon: '💳' },
    { key: 'passengers', label: 'View Passengers', icon: '👥' },
    { key: 'cancel', label: 'Cancel Booking', icon: '❌' },
    { key: 'print', label: 'Print Booking', icon: '🖨️' }
  ];

  const menuActions = actions.length > 0 ? actions : defaultActions;

  // Setup focus trap when menu opens
  useEffect(() => {
    if (isOpen && menuRef.current) {
      const cleanup = setupFocusTrap(menuRef);
      
      // Focus the menu container
      setTimeout(() => {
        if (menuRef.current) {
          menuRef.current.focus();
        }
      }, 100);
      
      return cleanup;
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (event) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex(prev => (prev + 1) % menuActions.length);
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex(prev => (prev - 1 + menuActions.length) % menuActions.length);
        break;
      case 'Enter':
        event.preventDefault();
        handleAction(menuActions[selectedIndex]);
        break;
      case 'Escape':
        event.preventDefault();
        onClose();
        break;
      case 'Tab':
        // Allow tab to cycle through menu items
        event.preventDefault();
        setSelectedIndex(prev => (prev + 1) % menuActions.length);
        break;
      default:
        // Handle number keys for quick selection
        const num = parseInt(event.key);
        if (num >= 1 && num <= menuActions.length) {
          event.preventDefault();
          setSelectedIndex(num - 1);
          handleAction(menuActions[num - 1]);
        }
        break;
    }
  };

  // Handle action selection
  const handleAction = (action) => {
    if (onAction) {
      onAction(action.key, record);
    }
    onClose();
  };

  // Handle mouse hover for visual feedback
  const handleMouseEnter = (index) => {
    setSelectedIndex(index);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay to capture clicks outside menu */}
      <div 
        className="record-action-overlay"
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9998,
          background: 'transparent'
        }}
      />
      
      {/* Action Menu */}
      <div
        ref={menuRef}
        className="record-action-menu"
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="menu"
        aria-label="Record Actions"
        style={{
          position: 'fixed',
          left: position.x,
          top: position.y,
          zIndex: 9999,
          background: 'white',
          border: '2px solid #333',
          borderRadius: '4px',
          boxShadow: '4px 4px 8px rgba(0,0,0,0.3)',
          minWidth: '200px',
          fontFamily: 'monospace',
          fontSize: '12px'
        }}
      >
        <div className="record-action-header" style={{
          background: '#f0f0f0',
          padding: '4px 8px',
          borderBottom: '1px solid #ccc',
          fontWeight: 'bold',
          fontSize: '11px'
        }}>
          Record Actions
        </div>
        
        <div className="record-action-list">
          {menuActions.map((action, index) => (
            <div
              key={action.key}
              className={`record-action-item ${index === selectedIndex ? 'selected' : ''}`}
              onClick={() => handleAction(action)}
              onMouseEnter={() => handleMouseEnter(index)}
              role="menuitem"
              style={{
                padding: '6px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: index === selectedIndex ? '#0066cc' : 'transparent',
                color: index === selectedIndex ? 'white' : 'black',
                borderBottom: index < menuActions.length - 1 ? '1px solid #eee' : 'none'
              }}
            >
              <span className="action-icon" style={{ fontSize: '14px' }}>
                {action.icon}
              </span>
              <span className="action-label">
                {action.label}
              </span>
              <span className="action-shortcut" style={{ 
                marginLeft: 'auto', 
                fontSize: '10px', 
                opacity: 0.7 
              }}>
                {index + 1}
              </span>
            </div>
          ))}
        </div>
        
        <div className="record-action-footer" style={{
          background: '#f8f8f8',
          padding: '4px 8px',
          borderTop: '1px solid #ccc',
          fontSize: '10px',
          color: '#666',
          textAlign: 'center'
        }}>
          ↑↓ Navigate • Enter Select • Esc Close • 1-{menuActions.length} Quick Select
        </div>
      </div>
    </>
  );
};

export default RecordActionMenu;