// Phone Number Lookup Hook
// Implements dual-mode customer resolution by phone number

import { useState, useCallback } from 'react';
import { customerAPI } from '../services/api';

export const usePhoneLookup = () => {
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lastLookupPhone, setLastLookupPhone] = useState('');

  // Validate phone number format (10-15 digits)
  const validatePhoneNumber = useCallback((phone) => {
    if (!phone) return { isValid: false, error: 'Phone number is required' };
    
    // Remove all non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
      return { isValid: false, error: 'Phone number must be 10-15 digits' };
    }
    
    return { isValid: true, cleanPhone };
  }, []);

  // Lookup customer by phone number (silent background fetch)
  const lookupCustomerByPhone = useCallback(async (phoneNumber) => {
    const validation = validatePhoneNumber(phoneNumber);
    if (!validation.isValid) {
      return { found: false, error: validation.error };
    }

    const { cleanPhone } = validation;
    
    // Avoid duplicate lookups
    if (cleanPhone === lastLookupPhone) {
      return { found: false, reason: 'duplicate_lookup' };
    }

    setIsLookingUp(true);
    setLastLookupPhone(cleanPhone);

    try {
      // Query customer by phone number
      const response = await customerAPI.findByPhone(cleanPhone);
      
      if (response.success && response.data) {
        // Customer found - return customer data
        return {
          found: true,
          customer: {
            internalCustomerId: response.data.us_usid || response.data.id,
            customerName: `${response.data.us_fname || ''} ${response.data.us_lname || ''}`.trim(),
            phoneNumber: cleanPhone,
            address: response.data.us_addr1 || '',
            city: response.data.us_city || '',
            state: response.data.us_state || '',
            email: response.data.us_email || ''
          }
        };
      } else {
        // Customer not found - treat as new customer
        return {
          found: false,
          reason: 'not_found',
          newCustomer: {
            phoneNumber: cleanPhone,
            customerName: '', // Will be filled by user
            source: 'PHONE_BOOKING'
          }
        };
      }
    } catch (error) {
      console.warn('Phone lookup failed:', error);
      // On error, treat as new customer (fail gracefully)
      return {
        found: false,
        reason: 'lookup_error',
        error: error.message,
        newCustomer: {
          phoneNumber: cleanPhone,
          customerName: '',
          source: 'PHONE_BOOKING'
        }
      };
    } finally {
      setIsLookingUp(false);
    }
  }, [validatePhoneNumber, lastLookupPhone]);

  // Format phone number for display
  const formatPhoneNumber = useCallback((phone) => {
    if (!phone) return '';
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX for 10 digits, or +XX-XXX-XXX-XXXX for international
    if (cleanPhone.length === 10) {
      return `(${cleanPhone.slice(0, 3)}) ${cleanPhone.slice(3, 6)}-${cleanPhone.slice(6)}`;
    } else if (cleanPhone.length > 10) {
      return `+${cleanPhone.slice(0, -10)}-${cleanPhone.slice(-10, -7)}-${cleanPhone.slice(-7, -4)}-${cleanPhone.slice(-4)}`;
    }
    
    return cleanPhone;
  }, []);

  // Clear lookup cache (for new bookings)
  const clearLookupCache = useCallback(() => {
    setLastLookupPhone('');
  }, []);

  return {
    isLookingUp,
    lookupCustomerByPhone,
    validatePhoneNumber,
    formatPhoneNumber,
    clearLookupCache
  };
};

export default usePhoneLookup;