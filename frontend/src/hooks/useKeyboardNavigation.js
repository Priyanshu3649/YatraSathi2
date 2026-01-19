// Keyboard Navigation Hook
// Provides keyboard navigation functionality for forms and components

import { useEffect, useRef, useCallback, useState } from 'react';
import { useKeyboardNavigation } from '../contexts/KeyboardNavigationContext';

export const useKeyboardNav = (options = {}) => {
  const {
    fieldOrder = [],
    autoFocus = true,
    enablePassengerLoop = false,
    onSave = null,
    onCancel = null,
    validateField = null
  } = options;

  const formRef = useRef(null);
  const {
    setFocusOrder,
    handleTabNavigation,
    handleEnterKey,
    handleEscapeKey,
    setInitialFocus,
    updateState,
    currentFocusedField,
    saveConfirmationOpen,
    handleSaveConfirmation
  } = useKeyboardNavigation();

  // Initialize keyboard navigation for this form
  useEffect(() => {
    if (fieldOrder.length > 0) {
      setFocusOrder(fieldOrder);
      
      if (autoFocus && formRef.current) {
        setInitialFocus(formRef);
      }
    }
  }, [fieldOrder, autoFocus, setFocusOrder, setInitialFocus, formRef]);

  // Handle form-specific keyboard events
  const handleKeyDown = useCallback((event) => {
    const currentField = event.target.name || event.target.dataset.field;
    
    switch (event.key) {
      case 'Tab':
        handleTabNavigation(event, currentField, event.shiftKey);
        break;
      case 'Enter':
        handleEnterKey(event, currentField);
        break;
      case 'Escape':
        handleEscapeKey(event);
        if (onCancel) onCancel();
        break;
      default:
        break;
    }
  }, [handleTabNavigation, handleEnterKey, handleEscapeKey, onCancel]);

  // Handle save confirmation response
  useEffect(() => {
    if (saveConfirmationOpen) {
      const handleSaveResponse = (confirmed) => {
        const result = handleSaveConfirmation(confirmed);
        if (result.action === 'save' && onSave) {
          onSave();
        }
      };
      
      // This will be handled by the SaveConfirmationModal component
      window.handleSaveResponse = handleSaveResponse;
    }
    
    return () => {
      // Cleanup
      if (window.handleSaveResponse) {
        delete window.handleSaveResponse;
      }
    };
  }, [saveConfirmationOpen, handleSaveConfirmation, onSave]);

  // Set up keyboard event listeners
  useEffect(() => {
    const formElement = formRef.current;
    if (formElement) {
      formElement.addEventListener('keydown', handleKeyDown);
      return () => formElement.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown]);

  // Enable passenger loop mode
  const enablePassengerLoopMode = useCallback(() => {
    updateState({ isPassengerLoopActive: true });
  }, [updateState]);

  // Disable passenger loop mode
  const disablePassengerLoopMode = useCallback(() => {
    updateState({ isPassengerLoopActive: false });
  }, [updateState]);

  // Focus specific field
  const focusField = useCallback((fieldName) => {
    const element = formRef.current?.querySelector(`[name="${fieldName}"], [data-field="${fieldName}"]`);
    if (element) {
      element.focus();
    }
  }, []);

  // Get all focusable elements in business logic order
  const getFocusableElements = useCallback(() => {
    if (!formRef.current) return [];
    
    return fieldOrder.map(fieldName => 
      formRef.current.querySelector(`[name="${fieldName}"], [data-field="${fieldName}"]`)
    ).filter(Boolean);
  }, [fieldOrder]);

  // Validate current field
  const validateCurrentField = useCallback((fieldName, value) => {
    if (validateField) {
      return validateField(fieldName, value);
    }
    return { isValid: true, error: null };
  }, [validateField]);

  return {
    formRef,
    currentFocusedField,
    saveConfirmationOpen,
    enablePassengerLoopMode,
    disablePassengerLoopMode,
    focusField,
    getFocusableElements,
    validateCurrentField,
    handleKeyDown
  };
};

// Hook specifically for passenger entry
export const usePassengerEntry = (options = {}) => {
  const {
    onPassengerSave = null,
    onPassengerValidate = null,
    passengerFields = ['name', 'age', 'gender', 'berth']
  } = options;

  const passengerRef = useRef(null);
  const {
    updateState,
    isPassengerLoopActive,
    detectDoubleTab,
    setFocusOnField
  } = useKeyboardNavigation();

  // Passenger state
  const [passengerData, setPassengerData] = useState({});
  const [passengerList, setPassengerList] = useState([]);
  const [currentPassengerIndex, setCurrentPassengerIndex] = useState(0);

  // Handle passenger tab navigation
  const handlePassengerTab = useCallback((event, currentField, isShiftTab, isDoubleTab) => {
    event.preventDefault();
    
    const currentFieldIndex = passengerFields.indexOf(currentField);
    const isLastField = currentFieldIndex === passengerFields.length - 1;
    
    if (isShiftTab) {
      // Move to previous field
      if (currentFieldIndex > 0) {
        setFocusOnField(passengerFields[currentFieldIndex - 1]);
      }
      return;
    }
    
    // Forward tab
    if (isLastField) {
      // Check for double-tab or empty fields
      const hasData = Object.values(passengerData).some(value => value && value.trim());
      
      if (isDoubleTab || !hasData) {
        // Exit passenger loop
        exitPassengerLoop();
        return;
      }
      
      // Save passenger and start new one
      saveCurrentPassenger();
    } else {
      // Move to next field
      setFocusOnField(passengerFields[currentFieldIndex + 1]);
    }
  }, [passengerFields, passengerData]);

  // Save current passenger
  const saveCurrentPassenger = useCallback(() => {
    // Validate passenger data
    if (onPassengerValidate) {
      const validation = onPassengerValidate(passengerData);
      if (!validation.isValid) {
        // Focus on invalid field
        setFocusOnField(validation.invalidField);
        return;
      }
    }
    
    // Add to passenger list
    const newPassenger = { ...passengerData, id: Date.now() };
    setPassengerList(prev => [...prev, newPassenger]);
    
    // Clear current passenger data
    setPassengerData({});
    
    // Return focus to first field
    setFocusOnField(passengerFields[0]);
    
    // Callback for parent component
    if (onPassengerSave) {
      onPassengerSave(newPassenger);
    }
  }, [passengerData, passengerFields, onPassengerSave, onPassengerValidate, setFocusOnField]);

  // Exit passenger loop
  const exitPassengerLoop = useCallback(() => {
    updateState({ isPassengerLoopActive: false });
    // Focus will be handled by parent form
  }, [updateState]);

  // Enter passenger loop
  const enterPassengerLoop = useCallback(() => {
    updateState({ isPassengerLoopActive: true });
    setFocusOnField(passengerFields[0]);
  }, [updateState, passengerFields, setFocusOnField]);

  // Update passenger data
  const updatePassengerData = useCallback((field, value) => {
    setPassengerData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Remove passenger from list
  const removePassenger = useCallback((passengerId) => {
    setPassengerList(prev => prev.filter(p => p.id !== passengerId));
  }, []);

  return {
    passengerRef,
    passengerData,
    passengerList,
    isPassengerLoopActive,
    handlePassengerTab,
    saveCurrentPassenger,
    exitPassengerLoop,
    enterPassengerLoop,
    updatePassengerData,
    removePassenger
  };
};

export default useKeyboardNav;