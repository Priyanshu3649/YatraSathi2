// Save Confirmation Modal
// Keyboard-accessible modal for form save confirmation

import React, { useEffect, useRef } from 'react';
import { useKeyboardNavigation } from '../../contexts/KeyboardNavigationContext';
import { setupFocusTrap } from '../../utils/focusManager';

const SaveConfirmationModal = ({ isOpen, onConfirm, onCancel, message = null }) => {
  const modalRef = useRef(null);
  const yesButtonRef = useRef(null);
  const noButtonRef = useRef(null);
  
  const defaultMessage = "You have reached the end of the form. Save this record?";
  const displayMessage = message || defaultMessage;

  // Setup focus trap when modal opens
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const cleanup = setupFocusTrap(modalRef);
      
      // Focus Yes button by default
      setTimeout(() => {
        if (yesButtonRef.current) {
          yesButtonRef.current.focus();
        }
      }, 100);
      
      return cleanup;
    }
  }, [isOpen]);

  // Handle keyboard navigation within modal
  const handleKeyDown = (event) => {
    switch (event.key) {
      case 'Enter':
        event.preventDefault();
        onConfirm();
        break;
      case 'Escape':
        event.preventDefault();
        onCancel();
        break;
      case 'Tab':
        // Tab cycles between Yes and No buttons
        event.preventDefault();
        if (document.activeElement === yesButtonRef.current) {
          noButtonRef.current?.focus();
        } else {
          yesButtonRef.current?.focus();
        }
        break;
      case 'ArrowLeft':
      case 'ArrowRight':
        // Arrow keys also cycle between buttons
        event.preventDefault();
        if (document.activeElement === yesButtonRef.current) {
          noButtonRef.current?.focus();
        } else {
          yesButtonRef.current?.focus();
        }
        break;
      default:
        break;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="save-confirmation-overlay">
      <div 
        className="save-confirmation-modal"
        ref={modalRef}
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-confirmation-title"
        aria-describedby="save-confirmation-message"
      >
        <div className="save-confirmation-content">
          <h3 id="save-confirmation-title" className="save-confirmation-title">
            Confirm Save
          </h3>
          
          <p id="save-confirmation-message" className="save-confirmation-message">
            {displayMessage}
          </p>
          
          <div className="save-confirmation-buttons">
            <button
              ref={yesButtonRef}
              className="save-confirmation-button save-confirmation-yes"
              onClick={onConfirm}
              autoFocus
            >
              Yes (Enter)
            </button>
            
            <button
              ref={noButtonRef}
              className="save-confirmation-button save-confirmation-no"
              onClick={onCancel}
            >
              No (Esc)
            </button>
          </div>
          
          <div className="save-confirmation-help">
            <small>
              Press Enter to save, Esc to cancel, Tab to switch between options
            </small>
          </div>
        </div>
      </div>
      
      <style>{`
        .save-confirmation-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }
        
        .save-confirmation-modal {
          background: white;
          border: 2px solid #333;
          border-radius: 4px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          min-width: 400px;
          max-width: 500px;
          padding: 0;
          font-family: monospace;
        }
        
        .save-confirmation-content {
          padding: 20px;
        }
        
        .save-confirmation-title {
          margin: 0 0 16px 0;
          font-size: 16px;
          font-weight: bold;
          color: #333;
          text-align: center;
        }
        
        .save-confirmation-message {
          margin: 0 0 20px 0;
          font-size: 14px;
          color: #555;
          text-align: center;
          line-height: 1.4;
        }
        
        .save-confirmation-buttons {
          display: flex;
          gap: 12px;
          justify-content: center;
          margin-bottom: 12px;
        }
        
        .save-confirmation-button {
          padding: 8px 16px;
          border: 1px solid #ccc;
          background: #f5f5f5;
          font-family: monospace;
          font-size: 12px;
          cursor: pointer;
          min-width: 100px;
          transition: all 0.2s;
        }
        
        .save-confirmation-button:hover,
        .save-confirmation-button:focus {
          background: #e0e0e0;
          border-color: #999;
          outline: 2px solid #007acc;
          outline-offset: 2px;
        }
        
        .save-confirmation-yes {
          background: #e8f5e8;
          border-color: #4caf50;
        }
        
        .save-confirmation-yes:hover,
        .save-confirmation-yes:focus {
          background: #d4edda;
          border-color: #28a745;
        }
        
        .save-confirmation-no {
          background: #ffeaea;
          border-color: #f44336;
        }
        
        .save-confirmation-no:hover,
        .save-confirmation-no:focus {
          background: #f8d7da;
          border-color: #dc3545;
        }
        
        .save-confirmation-help {
          text-align: center;
          color: #666;
          font-size: 11px;
        }
        
        /* Screen reader only class */
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
      `}</style>
    </div>
  );
};

export default SaveConfirmationModal;