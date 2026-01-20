import React, { useState, useEffect, useRef, useCallback } from 'react';
import './RecordActionMenu.css';

const RecordActionMenu = ({ 
  isOpen, 
  onClose, 
  position, 
  record, 
  actions = [],
  onActionSelect 
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef(null);

  // Focus trap and keyboard navigation
  useEffect(() => {
    if (isOpen && menuRef.current) {
      menuRef.current.focus();
    }
  }, [isOpen]);

  const handleKeyDown = useCallback((e) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % actions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + actions.length) % actions.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (actions[selectedIndex] && !actions[selectedIndex].disabled) {
          onActionSelect(actions[selectedIndex].action, record);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
      default:
        break;
    }
  }, [isOpen, selectedIndex, actions, onActionSelect, record, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="record-action-menu"
      ref={menuRef}
      tabIndex={-1}
      style={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        zIndex: 1000
      }}
    >
      <div className="menu-content">
        {actions.map((action, index) => (
          <div
            key={action.action}
            className={`menu-item ${index === selectedIndex ? 'selected' : ''} ${action.disabled ? 'disabled' : ''}`}
            onClick={() => {
              if (!action.disabled) {
                onActionSelect(action.action, record);
              }
            }}
          >
            {action.label}
            {action.disabled && action.reason && (
              <div className="disabled-reason">{action.reason}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecordActionMenu;