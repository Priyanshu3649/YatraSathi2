// PASSENGER ENTRY HOOK (MANDATORY COMPLIANCE)
// Implements the exact passenger entry loop behavior as specified

import { useState, useCallback, useEffect } from 'react';
import { useKeyboardNavigation } from '../contexts/KeyboardNavigationContext';

export const usePassengerEntry = (options = {}) => {
  const {
    onPassengerSave = null,
    onPassengerValidate = null,
    onLoopExit = null,
    passengerFields = ['passenger_name', 'passenger_age', 'passenger_gender', 'passenger_berth']
  } = options;

  // Passenger state
  const [passengerData, setPassengerData] = useState({});
  const [passengerList, setPassengerList] = useState([]);
  
  const {
    isPassengerLoopActive,
    enterPassengerLoop,
    exitPassengerLoop,
    focusField,
    detectDoubleTab
  } = useKeyboardNavigation();

  // Debug: Log passenger loop state changes
  useEffect(() => {
    // State tracking for passenger loop
  }, [isPassengerLoopActive]);

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
    const requiredFields = ['passenger_name']; // At minimum, name is required
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
        focusField(passengerFields[invalidFieldIndex]);
      }
      
      console.warn(`Validation error: ${validation.error}`);
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
    focusField(passengerFields[0]);
    
    console.log(`Passenger ${newPassenger.passenger_name} added. Total passengers: ${passengerList.length + 1}`);
    
    // Callback to parent
    if (onPassengerSave) {
      onPassengerSave(newPassenger);
    }
    
    return true;
  }, [passengerData, passengerList, passengerFields, validatePassenger, focusField, onPassengerSave]);

  // Update passenger field data
  const updatePassengerField = useCallback((fieldName, value) => {
    setPassengerData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  }, []);

  // Remove passenger from list
  const removePassenger = useCallback((passengerId) => {
    setPassengerList(prev => {
      const newList = prev.filter(p => p.id !== passengerId);
      // Re-index passengers
      return newList.map((p, index) => ({ ...p, index: index + 1 }));
    });
    
    console.log('Passenger removed');
  }, []);

  // Clear all passengers
  const clearAllPassengers = useCallback(() => {
    setPassengerList([]);
    setPassengerData({});
    console.log('All passengers cleared');
  }, []);

  // Get passenger field props for form inputs
  const getFieldProps = useCallback((fieldName) => {
    return {
      name: fieldName,
      'data-field': fieldName,
      value: passengerData[fieldName] || '',
      onChange: (e) => updatePassengerField(fieldName, e.target.value),
      'aria-label': `Passenger ${fieldName}`,
      autoComplete: 'off'
    };
  }, [passengerData, updatePassengerField]);

  // Listen for passenger save events and handle double-tab detection
  useEffect(() => {
    const handleSavePassenger = () => {
      if (isPassengerLoopActive) {
        // Check for double-tab before saving
        const isDoubleTab = detectDoubleTab();
        if (isDoubleTab && !hasPassengerData()) {
          // Double-tab on empty fields - exit loop
          exitPassengerLoop();
          return;
        }
        saveCurrentPassenger();
      }
    };

    window.addEventListener('savePassenger', handleSavePassenger);
    return () => window.removeEventListener('savePassenger', handleSavePassenger);
  }, [isPassengerLoopActive, saveCurrentPassenger, detectDoubleTab, hasPassengerData, exitPassengerLoop]);

  return {
    // State
    passengerData,
    passengerList,
    isInLoop: isPassengerLoopActive,
    
    // Actions
    enterPassengerLoop,
    exitPassengerLoop,
    saveCurrentPassenger,
    updatePassengerField,
    removePassenger,
    clearAllPassengers,
    
    // Utilities
    getFieldProps,
    hasPassengerData,
    validatePassenger,
    
    // Field configuration
    passengerFields
  };
};

export default usePassengerEntry;