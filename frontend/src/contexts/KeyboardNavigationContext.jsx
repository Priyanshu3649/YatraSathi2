// KEYBOARD-FIRST SYSTEM IMPLEMENTATION (MANDATORY COMPLIANCE)
// Central Keyboard Engine - Single Source of Truth for ALL keyboard navigation
// NO COMPONENT MAY IMPLEMENT KEYBOARD LOGIC INDEPENDENTLY

import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';

const KeyboardNavigationContext = createContext();

export const useKeyboardNavigation = () => {
  const context = useContext(KeyboardNavigationContext);
  if (!context) {
    throw new Error('useKeyboardNavigation must be used within a KeyboardNavigationProvider');
  }
  return context;
};

export const KeyboardNavigationProvider = ({ children }) => {
  // MANDATORY STATE STRUCTURE (NON-NEGOTIABLE)
  const [keyboardState, setKeyboardState] = useState({
    activeScreen: '',
    activeFormId: '',
    focusedFieldIndex: 0,
    mode: 'NEW',
    isModalOpen: false,
    isPassengerLoopActive: false,
    lastTabTimestamp: 0,
    doubleTabDetected: false
  });

  // REGISTERED FORMS REGISTRY (LIFECYCLE-DRIVEN)
  const registeredForms = useRef(new Map());
  const focusTrapRef = useRef(null);
  const lastFocusedElement = useRef(null);

  // MANDATORY GUARD: Prevent re-registration (CRITICAL FOR STABILITY)
  const registerForm = useCallback((formId, fieldList) => {
    // ABSOLUTE RULE: Form can only register ONCE
    if (registeredForms.current.has(formId)) {
      console.warn(`Form ${formId} already registered. Ignoring duplicate registration.`);
      return;
    }
    
    console.log(`Registering form: ${formId} with fields:`, fieldList);
    registeredForms.current.set(formId, {
      fields: fieldList,
      registeredAt: Date.now()
    });
    
    // Set as active form if none is active
    setKeyboardState(prev => ({
      ...prev,
      activeFormId: prev.activeFormId || formId,
      focusedFieldIndex: 0,
      mode: 'NEW'
    }));
  }, []);

  // FORM DEREGISTRATION (CLEANUP ON UNMOUNT)
  const unregisterForm = useCallback((formId) => {
    console.log(`Unregistering form: ${formId}`);
    registeredForms.current.delete(formId);
    
    // Clear active form if it was the unregistered one
    setKeyboardState(prev => ({
      ...prev,
      activeFormId: prev.activeFormId === formId ? '' : prev.activeFormId
    }));
  }, []);

  // SET ACTIVE FORM (SCREEN SWITCHING)
  const setActiveForm = useCallback((formId) => {
    if (!registeredForms.current.has(formId)) {
      console.error(`Cannot set active form ${formId}: not registered`);
      return;
    }
    
    setKeyboardState(prev => ({
      ...prev,
      activeFormId: formId,
      focusedFieldIndex: 0,
      mode: 'NEW'
    }));
    
    // Auto-focus first field
    setTimeout(() => {
      const form = registeredForms.current.get(formId);
      if (form && form.fields.length > 0) {
        focusField(form.fields[0]);
      }
    }, 50);
  }, []);

  // FOCUS FIELD BY NAME (DETERMINISTIC)
  const focusField = useCallback((fieldName) => {
    const element = document.querySelector(`[name="${fieldName}"], [data-field="${fieldName}"]`);
    if (element) {
      element.focus();
      
      // Update field index
      const activeForm = registeredForms.current.get(keyboardState.activeFormId);
      if (activeForm) {
        const fieldIndex = activeForm.fields.indexOf(fieldName);
        if (fieldIndex >= 0) {
          setKeyboardState(prev => ({
            ...prev,
            focusedFieldIndex: fieldIndex
          }));
        }
      }
    }
  }, [keyboardState.activeFormId]);

  // HANDLE MANUAL FOCUS (USER CLICKS FIELD)
  const handleManualFocus = useCallback((fieldName) => {
    const activeForm = registeredForms.current.get(keyboardState.activeFormId);
    if (!activeForm) return;

    const fieldIndex = activeForm.fields.indexOf(fieldName);
    if (fieldIndex >= 0 && fieldIndex !== keyboardState.focusedFieldIndex) {
      console.log(`Manual focus detected: ${fieldName} (Index: ${fieldIndex})`);
      setKeyboardState(prev => ({
        ...prev,
        focusedFieldIndex: fieldIndex
      }));
    }
  }, [keyboardState.activeFormId, keyboardState.focusedFieldIndex]);

  // MOVE TO NEXT FIELD (TAB BEHAVIOR)
  const moveNext = useCallback(() => {
    const activeForm = registeredForms.current.get(keyboardState.activeFormId);
    if (!activeForm) return false;
    
    const nextIndex = keyboardState.focusedFieldIndex + 1;
    
    if (nextIndex < activeForm.fields.length) {
      // Move to next field
      setKeyboardState(prev => ({
        ...prev,
        focusedFieldIndex: nextIndex
      }));
      focusField(activeForm.fields[nextIndex]);
      return true;
    } else {
      // End of form - trigger save modal
      openModal();
      return false;
    }
  }, [keyboardState.activeFormId, keyboardState.focusedFieldIndex, focusField]);

  // MOVE TO PREVIOUS FIELD (SHIFT+TAB BEHAVIOR)
  const movePrevious = useCallback(() => {
    const activeForm = registeredForms.current.get(keyboardState.activeFormId);
    if (!activeForm) return false;
    
    const prevIndex = Math.max(0, keyboardState.focusedFieldIndex - 1);
    
    setKeyboardState(prev => ({
      ...prev,
      focusedFieldIndex: prevIndex
    }));
    focusField(activeForm.fields[prevIndex]);
    return true;
  }, [keyboardState.activeFormId, keyboardState.focusedFieldIndex, focusField]);

  // ENTER ACTION (CONTEXT-DEPENDENT)
  const enterAction = useCallback(() => {
    const activeElement = document.activeElement;
    
    // If on a grid row, open context menu
    if (activeElement && activeElement.closest('tr[data-record-id]')) {
      // Open context dropdown for record actions
      const recordId = activeElement.closest('tr').dataset.recordId;
      console.log('Opening context menu for record:', recordId);
      // This will be handled by specific components
      return { action: 'contextMenu', recordId };
    }
    
    // Otherwise, treat as Tab
    return moveNext();
  }, [moveNext]);

  // MODAL MANAGEMENT (SAVE POPUP)
  const openModal = useCallback(() => {
    setKeyboardState(prev => ({
      ...prev,
      isModalOpen: true
    }));
  }, []);

  const closeModal = useCallback(() => {
    setKeyboardState(prev => ({
      ...prev,
      isModalOpen: false
    }));
  }, []);

  // DOUBLE-TAB DETECTION (PASSENGER LOOP EXIT)
  const detectDoubleTab = useCallback(() => {
    const now = Date.now();
    const timeDiff = now - keyboardState.lastTabTimestamp;
    
    const isDoubleTab = timeDiff < 500;
    
    setKeyboardState(prev => ({
      ...prev,
      lastTabTimestamp: now,
      doubleTabDetected: isDoubleTab
    }));
    
    return isDoubleTab;
  }, [keyboardState.lastTabTimestamp]);

  // PASSENGER LOOP MANAGEMENT
  const enterPassengerLoop = useCallback(() => {
    setKeyboardState(prev => ({
      ...prev,
      isPassengerLoopActive: true
    }));
  }, []);

  const exitPassengerLoop = useCallback(() => {
    setKeyboardState(prev => ({
      ...prev,
      isPassengerLoopActive: false
    }));
    
    // Move to next field after passenger section
    const activeForm = registeredForms.current.get(keyboardState.activeFormId);
    if (activeForm) {
      // Find the field after passenger section (typically 'remarks')
      const passengerEndIndex = activeForm.fields.findIndex(field => 
        field === 'passenger_berth' || field === 'passenger_gender'
      );
      
      if (passengerEndIndex >= 0 && passengerEndIndex + 1 < activeForm.fields.length) {
        const nextField = activeForm.fields[passengerEndIndex + 1];
        setKeyboardState(prev => ({
          ...prev,
          focusedFieldIndex: passengerEndIndex + 1
        }));
        focusField(nextField);
      }
    }
  }, [keyboardState.activeFormId, focusField]);

  // GLOBAL KEYBOARD EVENT HANDLER (MANDATORY PRIMITIVES ONLY)
  const handleGlobalKeyDown = useCallback((event) => {
    // If modal is open, allow it to handle events exclusively
    if (keyboardState.isModalOpen) {
      return;
    }

    // ONLY Tab, Shift+Tab, Enter are allowed navigation primitives
    switch (event.key) {
      case 'Tab':
        event.preventDefault();
        if (event.shiftKey) {
          movePrevious();
        } else {
          if (keyboardState.isPassengerLoopActive) {
            // Special passenger loop logic
            const isDoubleTab = detectDoubleTab();
            handlePassengerTab(isDoubleTab);
          } else {
            moveNext();
          }
        }
        break;
        
      case 'Enter':
        event.preventDefault();
        enterAction();
        break;
        
      case 'Escape':
        if (keyboardState.isModalOpen) {
          closeModal();
        }
        break;
        
      case 'F10':
        event.preventDefault();
        openModal();
        break;
        
      default:
        // No other keys handled globally
        break;
    }
  }, [moveNext, movePrevious, enterAction, closeModal, openModal, keyboardState.isModalOpen, keyboardState.isPassengerLoopActive, detectDoubleTab]);

  // PASSENGER TAB LOGIC (MANDATORY IMPLEMENTATION)
  const handlePassengerTab = useCallback((isDoubleTab) => {
    const activeElement = document.activeElement;
    const fieldName = activeElement?.name || activeElement?.dataset?.field;
    
    // Check if we're on the last passenger field
    const passengerFields = ['passenger_name', 'passenger_age', 'passenger_gender', 'passenger_berth'];
    const isLastPassengerField = fieldName === 'passenger_berth';
    
    if (isLastPassengerField) {
      // Check if passenger has data
      const hasData = passengerFields.some(field => {
        const element = document.querySelector(`[name="${field}"], [data-field="${field}"]`);
        return element && element.value && element.value.trim() !== '';
      });
      
      if (hasData) {
        // Save passenger and reset fields
        console.log('Saving passenger and continuing loop');
        // This will trigger passenger save in the component
        window.dispatchEvent(new CustomEvent('savePassenger'));
        
        // Focus back to first passenger field
        setTimeout(() => {
          focusField('passenger_name');
        }, 50);
      } else if (isDoubleTab) {
        // Exit passenger loop
        console.log('Double-tab detected, exiting passenger loop');
        exitPassengerLoop();
      }
    } else {
      // Move to next passenger field
      const currentIndex = passengerFields.indexOf(fieldName);
      if (currentIndex >= 0 && currentIndex < passengerFields.length - 1) {
        focusField(passengerFields[currentIndex + 1]);
      }
    }
  }, [exitPassengerLoop, focusField]);

  // GLOBAL EVENT LISTENER (LIFECYCLE-DRIVEN)
  useEffect(() => {
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleGlobalKeyDown]);

  // CONTEXT VALUE (IMMUTABLE INTERFACE)
  const contextValue = useMemo(() => ({
    // State (READ-ONLY)
    activeScreen: keyboardState.activeScreen,
    activeFormId: keyboardState.activeFormId,
    focusedFieldIndex: keyboardState.focusedFieldIndex,
    mode: keyboardState.mode,
    isModalOpen: keyboardState.isModalOpen,
    isPassengerLoopActive: keyboardState.isPassengerLoopActive,
    
    // MANDATORY API (LIFECYCLE METHODS)
    registerForm,
    unregisterForm,
    setActiveForm,
    moveNext,
    movePrevious,
    enterAction,
    openModal,
    closeModal,
    
    // PASSENGER LOOP API
    enterPassengerLoop,
    exitPassengerLoop,
    
    // UTILITY METHODS
    focusField,
    handleManualFocus,
    detectDoubleTab,
    
    // LEGACY COMPATIBILITY (DEPRECATED - DO NOT USE)
    updateState: () => console.warn('updateState is deprecated. Use specific methods instead.'),
    setFocusOrder: () => console.warn('setFocusOrder is deprecated. Use registerForm instead.'),
    handleTabNavigation: () => console.warn('handleTabNavigation is deprecated. Handled automatically.'),
    handleEnterKey: () => console.warn('handleEnterKey is deprecated. Handled automatically.'),
    triggerSaveConfirmation: openModal,
    handleSaveConfirmation: closeModal
  }), [
    keyboardState,
    registerForm,
    unregisterForm,
    setActiveForm,
    moveNext,
    movePrevious,
    enterAction,
    openModal,
    closeModal,
    enterPassengerLoop,
    exitPassengerLoop,
    focusField,
    detectDoubleTab
  ]);

  return (
    <KeyboardNavigationContext.Provider value={contextValue}>
      {children}
    </KeyboardNavigationContext.Provider>
  );
};

export default KeyboardNavigationProvider;