// Passenger Entry Hook
// Implements the exact passenger entry loop behavior as specified

import { useState, useCallback, useRef } from 'react';
import { useKeyboardNavigation } from '../contexts/KeyboardNavigationContext';
import { moveFocusToField, announceToScreenReader } from '../utils/focusManager';

export const usePassengerEntry = (options = {}) => {
  const {
    onPassengerSave = null,
    onPassengerValidate = null,
    onLoopExit = null,
    passengerFields = ['name', 'age', 'gender', 'berth'],
    containerRef = null
  } = options;

  // Passenger state
  const [passengerData, setPassengerData] = useState({});
  const [passengerList, setPassengerList] = useState([]);
  const [isInLoop, setIsInLoop] = useState(false);
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  
  // Refs for tracking
  const lastTabTime = useRef(0);
  const emptyFieldTabCount = useRef(0);
  
  const {
    updateState,
    setFocusOnField
  } = useKeyboardNavigation();

  // Check if current passenger has any data
  const hasPassengerData = useCallback(() => {
    return Object.values(passengerData).some(value => 
      value && typeof value === 'string' && value.trim() !== ''
    );
  }, [passengerData]);

  // Validate current passenger data
  const validatePassenger = useCallback(() => {
    if (onPassengerValidate) {
      return onPassengerValidate(passengerData);
    }
    
    // Default validation - check required fields
    const requiredFields = ['name']; // At minimum, name is required
    for (const field of requiredFields) {
      if (!passengerData[field] || passengerData[field].trim() === '') {
        return {
          isValid: false,
          error: `${field} is required`,
          invalidField: field
        };
      }
    }
    
    return { isValid: true };
  }, [passengerData, onPassengerValidate]);

  // Save current passenger to list
  const saveCurrentPassenger = useCallback(() => {
    const validation = validatePassenger();
    
    if (!validation.isValid) {
      // Focus on invalid field and show error
      const invalidFieldIndex = passengerFields.indexOf(validation.invalidField);
      if (invalidFieldIndex >= 0) {
        setCurrentFieldIndex(invalidFieldIndex);
        setFocusOnField(passengerFields[invalidFieldIndex]);
      }
      
      announceToScreenReader(`Validation error: ${validation.error}`, 'assertive');
      return false;
    }
    
    // Create passenger record
    const newPassenger = {
      ...passengerData,
      id: Date.now(),
      index: passengerList.length + 1
    };
    
    // Add to list
    setPassengerList(prev => [...prev, newPassenger]);
    
    // Clear current data
    setPassengerData({});
    
    // Reset to first field
    setCurrentFieldIndex(0);
    setFocusOnField(passengerFields[0]);
    
    // Announce success
    announceToScreenReader(`Passenger ${newPassenger.name} added. Total passengers: ${passengerList.length + 1}`, 'polite');
    
    // Callback to parent
    if (onPassengerSave) {
      onPassengerSave(newPassenger);
    }
    
    return true;
  }, [passengerData, passengerList, passengerFields, validatePassenger, setFocusOnField, onPassengerSave]);

  // Detect double-tab for loop exit
  const detectDoubleTab = useCallback(() => {
    const now = Date.now();
    const timeDiff = now - lastTabTime.current;
    lastTabTime.current = now;
    
    // Double-tab detected if within 500ms
    return timeDiff < 500;
  }, []);

  // Exit passenger loop
  const exitPassengerLoop = useCallback(() => {
    setIsInLoop(false);
    updateState({ isPassengerLoopActive: false });
    
    // Clear any partial data
    setPassengerData({});
    setCurrentFieldIndex(0);
    
    // Announce exit
    announceToScreenReader(`Exited passenger entry. Total passengers: ${passengerList.length}`, 'polite');
    
    // Callback to parent for next focus
    if (onLoopExit) {
      onLoopExit();
    }
  }, [updateState, passengerList.length, onLoopExit]);

  // Enter passenger loop
  const enterPassengerLoop = useCallback(() => {
    setIsInLoop(true);
    updateState({ isPassengerLoopActive: true });
    setCurrentFieldIndex(0);
    
    // Focus first field
    setTimeout(() => {
      setFocusOnField(passengerFields[0]);
    }, 100);
    
    announceToScreenReader('Entered passenger entry mode. Add passenger details.', 'polite');
  }, [updateState, passengerFields, setFocusOnField]);

  // Handle tab navigation within passenger section
  const handlePassengerTab = useCallback((event, currentField, isShiftTab = false) => {
    event.preventDefault();
    
    const currentIndex = passengerFields.indexOf(currentField);
    const isLastField = currentIndex === passengerFields.length - 1;
    const isFirstField = currentIndex === 0;
    
    if (isShiftTab) {
      // Shift + Tab - move backwards
      if (isFirstField) {
        // At first field, exit loop or stay
        if (!hasPassengerData()) {
          exitPassengerLoop();
          return;
        }
      }
      
      // Move to previous field
      const prevIndex = Math.max(0, currentIndex - 1);
      setCurrentFieldIndex(prevIndex);
      setFocusOnField(passengerFields[prevIndex]);
      return;
    }
    
    // Forward Tab
    if (isLastField) {
      // At last field - check exit conditions
      const isDoubleTab = detectDoubleTab();
      const hasData = hasPassengerData();
      
      if (isDoubleTab && !hasData) {
        // Double-tab on empty fields - exit loop
        exitPassengerLoop();
        return;
      }
      
      if (!hasData) {
        // Single tab on empty fields - exit loop
        emptyFieldTabCount.current++;
        if (emptyFieldTabCount.current >= 1) {
          exitPassengerLoop();
          return;
        }
      } else {
        // Has data - save passenger and continue loop
        emptyFieldTabCount.current = 0;
        const saved = saveCurrentPassenger();
        if (!saved) {
          // Validation failed, stay in current field
          return;
        }
        // Successfully saved, focus returns to first field automatically
        return;
      }
    } else {
      // Move to next field
      const nextIndex = currentIndex + 1;
      setCurrentFieldIndex(nextIndex);
      setFocusOnField(passengerFields[nextIndex]);
      emptyFieldTabCount.current = 0; // Reset empty count on normal navigation
    }
  }, [passengerFields, hasPassengerData, detectDoubleTab, saveCurrentPassenger, exitPassengerLoop, setFocusOnField]);

  // Handle Enter key in passenger fields
  const handlePassengerEnter = useCallback((event, currentField) => {
    // Enter acts as Tab in passenger entry
    handlePassengerTab(event, currentField, false);
  }, [handlePassengerTab]);

  // Update passenger field data
  const updatePassengerField = useCallback((fieldName, value) => {
    setPassengerData(prev => ({
      ...prev,
      [fieldName]: value
    }));
    
    // Reset empty field count when user types
    if (value && value.trim() !== '') {
      emptyFieldTabCount.current = 0;
    }
  }, []);

  // Remove passenger from list
  const removePassenger = useCallback((passengerId) => {
    setPassengerList(prev => {
      const newList = prev.filter(p => p.id !== passengerId);
      // Re-index passengers
      return newList.map((p, index) => ({ ...p, index: index + 1 }));
    });
    
    announceToScreenReader('Passenger removed', 'polite');
  }, []);

  // Clear all passengers
  const clearAllPassengers = useCallback(() => {
    setPassengerList([]);
    setPassengerData({});
    announceToScreenReader('All passengers cleared', 'polite');
  }, []);

  // Get passenger field props for form inputs
  const getFieldProps = useCallback((fieldName) => {
    return {
      name: fieldName,
      'data-field': fieldName,
      value: passengerData[fieldName] || '',
      onChange: (e) => updatePassengerField(fieldName, e.target.value),
      onKeyDown: (e) => {
        if (e.key === 'Tab') {
          handlePassengerTab(e, fieldName, e.shiftKey);
        } else if (e.key === 'Enter') {
          handlePassengerEnter(e, fieldName);
        }
      },
      'aria-label': `Passenger ${fieldName}`,
      autoComplete: 'off'
    };
  }, [passengerData, updatePassengerField, handlePassengerTab, handlePassengerEnter]);

  // Get current field name
  const getCurrentField = useCallback(() => {
    return passengerFields[currentFieldIndex] || null;
  }, [passengerFields, currentFieldIndex]);

  return {
    // State
    passengerData,
    passengerList,
    isInLoop,
    currentFieldIndex,
    
    // Actions
    enterPassengerLoop,
    exitPassengerLoop,
    saveCurrentPassenger,
    updatePassengerField,
    removePassenger,
    clearAllPassengers,
    
    // Event handlers
    handlePassengerTab,
    handlePassengerEnter,
    
    // Utilities
    getFieldProps,
    getCurrentField,
    hasPassengerData,
    validatePassenger,
    
    // Field configuration
    passengerFields
  };
};

export default usePassengerEntry;