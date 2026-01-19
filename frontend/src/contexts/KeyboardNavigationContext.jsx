// Global Keyboard Navigation Context
// Manages keyboard-first interaction for the entire application

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

const KeyboardNavigationContext = createContext();

export const useKeyboardNavigation = () => {
  const context = useContext(KeyboardNavigationContext);
  if (!context) {
    throw new Error('useKeyboardNavigation must be used within a KeyboardNavigationProvider');
  }
  return context;
};

export const KeyboardNavigationProvider = ({ children }) => {
  // Global keyboard navigation state
  const [state, setState] = useState({
    isNewMode: true,                    // Form is in new record mode
    isPassengerLoopActive: false,       // Passenger entry loop is active
    currentFocusedField: null,          // Track current field
    formState: 'editing',               // editing, validating, saving, complete
    lastTabTimestamp: 0,                // Track double-tab detection
    focusOrder: [],                     // Business logic field order
    currentFieldIndex: 0,               // Current position in focus order
    saveConfirmationOpen: false,        // Save confirmation modal state
    validationErrors: {},               // Current validation errors
    focusTrapped: false                 // Focus trap active
  });

  // Refs for focus management
  const focusTrapRef = useRef(null);
  const lastFocusedElement = useRef(null);
  const doubleTabTimer = useRef(null);

  // Update state helper
  const updateState = useCallback((updates) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Set focus order for current form
  const setFocusOrder = useCallback((fields) => {
    updateState({ 
      focusOrder: fields,
      currentFieldIndex: 0
    });
  }, [updateState]);

  // Get current field info
  const getCurrentField = useCallback(() => {
    const { focusOrder, currentFieldIndex } = state;
    return focusOrder[currentFieldIndex] || null;
  }, [state.focusOrder, state.currentFieldIndex]);

  // Move to next field in order
  const moveToNextField = useCallback(() => {
    const { focusOrder, currentFieldIndex } = state;
    const nextIndex = currentFieldIndex + 1;
    
    if (nextIndex < focusOrder.length) {
      updateState({ currentFieldIndex: nextIndex });
      return focusOrder[nextIndex];
    }
    return null; // End of form
  }, [state.focusOrder, state.currentFieldIndex, updateState]);

  // Move to previous field in order
  const moveToPreviousField = useCallback(() => {
    const { currentFieldIndex, focusOrder } = state;
    const prevIndex = Math.max(0, currentFieldIndex - 1);
    updateState({ currentFieldIndex: prevIndex });
    return focusOrder[prevIndex] || null;
  }, [state.currentFieldIndex, state.focusOrder, updateState]);

  // Set focus on specific field
  const setFocusOnField = useCallback((fieldName) => {
    const element = document.querySelector(`[name="${fieldName}"], [data-field="${fieldName}"]`);
    if (element) {
      element.focus();
      updateState({ currentFocusedField: fieldName });
      
      // Update current field index
      const fieldIndex = state.focusOrder.indexOf(fieldName);
      if (fieldIndex >= 0) {
        updateState({ currentFieldIndex: fieldIndex });
      }
    }
  }, [state.focusOrder, updateState]);

  // Detect double-tab for loop exit
  const detectDoubleTab = useCallback(() => {
    const now = Date.now();
    const timeDiff = now - state.lastTabTimestamp;
    
    // Double-tab detected if within 500ms
    if (timeDiff < 500) {
      return true;
    }
    
    updateState({ lastTabTimestamp: now });
    return false;
  }, [state.lastTabTimestamp, updateState]);

  // Handle global tab navigation
  const handleTabNavigation = useCallback((event, currentField, isShiftTab = false) => {
    const isDoubleTab = detectDoubleTab();
    
    // If in passenger loop, handle special logic
    if (state.isPassengerLoopActive) {
      return handlePassengerLoopTab(event, currentField, isShiftTab, isDoubleTab);
    }

    // Normal form navigation
    if (isShiftTab) {
      const prevField = moveToPreviousField();
      if (prevField) {
        event.preventDefault();
        setFocusOnField(prevField);
      }
    } else {
      const nextField = moveToNextField();
      if (nextField) {
        event.preventDefault();
        setFocusOnField(nextField);
      } else {
        // End of form - trigger save confirmation
        event.preventDefault();
        triggerSaveConfirmation();
      }
    }
  }, [detectDoubleTab, state.isPassengerLoopActive, moveToPreviousField, moveToNextField, setFocusOnField]);

  // Handle passenger loop tab logic
  const handlePassengerLoopTab = useCallback((event, currentField, isShiftTab, isDoubleTab) => {
    // This will be implemented in the passenger entry hook
    // For now, just prevent default
    event.preventDefault();
  }, []);

  // Handle Enter key globally
  const handleEnterKey = useCallback((event, currentField) => {
    const element = event.target;
    
    // If it's a button, let it handle naturally
    if (element.tagName === 'BUTTON') {
      return;
    }
    
    // If it's in a dropdown/select, let it handle naturally
    if (element.tagName === 'SELECT' || element.getAttribute('role') === 'combobox') {
      return;
    }
    
    // Otherwise, treat Enter as Tab
    event.preventDefault();
    handleTabNavigation(event, currentField, false);
  }, [handleTabNavigation]);

  // Handle Escape key globally
  const handleEscapeKey = useCallback((event) => {
    if (state.saveConfirmationOpen) {
      // Close save confirmation
      updateState({ saveConfirmationOpen: false });
      return;
    }
    
    if (state.focusTrapped) {
      // Exit focus trap
      exitFocusTrap();
      return;
    }
    
    // Close any open dropdowns or modals
    const openDropdowns = document.querySelectorAll('[aria-expanded="true"]');
    openDropdowns.forEach(dropdown => {
      dropdown.setAttribute('aria-expanded', 'false');
    });
  }, [state.saveConfirmationOpen, state.focusTrapped, updateState]);

  // Trigger save confirmation modal
  const triggerSaveConfirmation = useCallback(() => {
    updateState({ 
      saveConfirmationOpen: true,
      focusTrapped: true
    });
  }, [updateState]);

  // Handle save confirmation
  const handleSaveConfirmation = useCallback((confirmed) => {
    updateState({ 
      saveConfirmationOpen: false,
      focusTrapped: false
    });
    
    if (confirmed) {
      // Trigger save logic (will be handled by specific forms)
      return { action: 'save' };
    } else {
      // Return focus to last field
      const lastField = state.focusOrder[state.focusOrder.length - 1];
      if (lastField) {
        setFocusOnField(lastField);
      }
      return { action: 'cancel' };
    }
  }, [updateState, state.focusOrder, setFocusOnField]);

  // Set up focus trap
  const setupFocusTrap = useCallback((containerRef) => {
    focusTrapRef.current = containerRef;
    lastFocusedElement.current = document.activeElement;
    updateState({ focusTrapped: true });
  }, [updateState]);

  // Exit focus trap
  const exitFocusTrap = useCallback(() => {
    if (lastFocusedElement.current) {
      lastFocusedElement.current.focus();
    }
    focusTrapRef.current = null;
    updateState({ focusTrapped: false });
  }, [updateState]);

  // Prevent focus escape
  const preventFocusEscape = useCallback((event) => {
    if (!state.focusTrapped || !focusTrapRef.current) return;
    
    const focusableElements = focusTrapRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    if (event.key === 'Tab') {
      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }
  }, [state.focusTrapped]);

  // Set initial focus on page load
  const setInitialFocus = useCallback((formRef) => {
    if (!formRef.current) return;
    
    // Find first focusable element in business logic order
    const firstField = state.focusOrder[0];
    if (firstField) {
      setTimeout(() => {
        setFocusOnField(firstField);
      }, 100); // Small delay to ensure DOM is ready
    }
  }, [state.focusOrder, setFocusOnField]);

  // Global keyboard event handler
  useEffect(() => {
    const handleGlobalKeyDown = (event) => {
      // Handle focus trap
      if (state.focusTrapped) {
        preventFocusEscape(event);
      }
      
      // Global keyboard shortcuts
      switch (event.key) {
        case 'Escape':
          handleEscapeKey(event);
          break;
        case 'F10':
          // Quick save shortcut
          event.preventDefault();
          triggerSaveConfirmation();
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [state.focusTrapped, state.saveConfirmationOpen, preventFocusEscape, handleEscapeKey, triggerSaveConfirmation]);

  // Context value
  const contextValue = {
    // State
    ...state,
    
    // Actions
    updateState,
    setFocusOrder,
    getCurrentField,
    moveToNextField,
    moveToPreviousField,
    setFocusOnField,
    detectDoubleTab,
    
    // Event handlers
    handleTabNavigation,
    handleEnterKey,
    handleEscapeKey,
    
    // Save confirmation
    triggerSaveConfirmation,
    handleSaveConfirmation,
    
    // Focus management
    setupFocusTrap,
    exitFocusTrap,
    setInitialFocus,
    preventFocusEscape
  };

  return (
    <KeyboardNavigationContext.Provider value={contextValue}>
      {children}
    </KeyboardNavigationContext.Provider>
  );
};

export default KeyboardNavigationProvider;