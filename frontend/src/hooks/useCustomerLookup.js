import { useState, useCallback, useRef, useEffect } from 'react';
import { customerAPI } from '../services/api';

/**
 * Custom hook for bidirectional customer lookup (ID ↔ Name)
 * Provides centralized logic for customer search and selection
 * 
 * @param {Object} options - Configuration options
 * @param {Function} options.onCustomerSelect - Callback when customer is selected
 * @param {number} options.debounceMs - Debounce delay in milliseconds (default: 400)
 * @returns {Object} Customer lookup state and methods
 */
const useCustomerLookup = ({ onCustomerSelect, debounceMs = 400 } = {}) => {
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const debounceTimerRef = useRef(null);
  const abortControllerRef = useRef(null);

  /**
   * Debounced search function
   */
  const debouncedSearch = useCallback((searchTerm, searchType) => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(async () => {
      if (!searchTerm || searchTerm.trim().length === 0) {
        setSearchResults([]);
        setShowDropdown(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        
        // Create new abort controller
        abortControllerRef.current = new AbortController();
        
        // Search for customers
        const results = await customerAPI.searchCustomers(searchTerm.trim());
        
        if (results && results.data && Array.isArray(results.data)) {
          const formattedResults = results.data.map(customer => ({
            id: customer.cu_usid || customer.customer_id || customer.id || customer.cu_custno,
            code: customer.cu_custno || customer.customer_code || customer.code,
            name: customer.cu_custname || customer.customer_name || customer.name || customer.us_fname,
            mobile: customer.cu_mobile || customer.mobile || customer.us_phone,
            display: `${customer.cu_custno || customer.customer_code || customer.code || customer.cu_usid} - ${customer.cu_custname || customer.customer_name || customer.name || customer.us_fname || ''}`
          }));
          
          setSearchResults(formattedResults);
          setShowDropdown(formattedResults.length > 0);
          
          // If searching by ID and exact match found, auto-populate
          if (searchType === 'id' && formattedResults.length === 1) {
            const exactMatch = formattedResults[0];
            if (exactMatch.code === searchTerm.trim() || exactMatch.id === searchTerm.trim()) {
              handleCustomerSelect(exactMatch);
            }
          }
        } else {
          setSearchResults([]);
          setShowDropdown(false);
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Customer search error:', err);
          setError('Failed to search customers');
          setSearchResults([]);
          setShowDropdown(false);
        }
      } finally {
        setLoading(false);
      }
    }, debounceMs);
  }, [debounceMs]);

  /**
   * Fetch customer by exact ID
   */
  const fetchCustomerById = useCallback(async (id) => {
    if (!id || id.trim().length === 0) return;

    try {
      setLoading(true);
      setError('');
      
      const customer = await customerAPI.getCustomerById(id.trim());
      
      if (customer && customer.data) {
        const customerData = customer.data;
        const formattedCustomer = {
          id: customerData.cu_usid || customerData.customer_id || customerData.id,
          code: customerData.cu_custno || customerData.customer_code || customerData.code,
          name: customerData.cu_custname || customerData.customer_name || customerData.name || customerData.us_fname,
          mobile: customerData.cu_mobile || customerData.mobile || customerData.us_phone
        };
        
        setCustomerName(formattedCustomer.name || '');
        
        if (onCustomerSelect) {
          onCustomerSelect(formattedCustomer);
        }
      }
    } catch (err) {
      console.error('Fetch customer error:', err);
      // Don't show error for not found - just keep fields as is
      if (err.message && !err.message.includes('404')) {
        setError('Failed to fetch customer details');
      }
    } finally {
      setLoading(false);
    }
  }, [onCustomerSelect]);

  /**
   * Handle customer ID input change
   */
  const handleCustomerIdChange = useCallback((value) => {
    setCustomerId(value);
    
    if (!value || value.trim().length === 0) {
      setCustomerName('');
      setSearchResults([]);
      setShowDropdown(false);
      if (onCustomerSelect) {
        onCustomerSelect(null);
      }
      return;
    }
    
    // Trigger search
    debouncedSearch(value, 'id');
  }, [debouncedSearch, onCustomerSelect]);

  /**
   * Handle customer name input change
   */
  const handleCustomerNameChange = useCallback((value) => {
    setCustomerName(value);
    
    if (!value || value.trim().length === 0) {
      setCustomerId('');
      setSearchResults([]);
      setShowDropdown(false);
      if (onCustomerSelect) {
        onCustomerSelect(null);
      }
      return;
    }
    
    // Trigger search
    debouncedSearch(value, 'name');
  }, [debouncedSearch, onCustomerSelect]);

  /**
   * Handle customer selection from dropdown
   */
  const handleCustomerSelect = useCallback((customer) => {
    setCustomerId(customer.code || customer.id);
    setCustomerName(customer.name);
    setSearchResults([]);
    setShowDropdown(false);
    setError('');
    
    if (onCustomerSelect) {
      onCustomerSelect(customer);
    }
  }, [onCustomerSelect]);

  /**
   * Clear customer selection
   */
  const clearCustomer = useCallback(() => {
    setCustomerId('');
    setCustomerName('');
    setSearchResults([]);
    setShowDropdown(false);
    setError('');
    
    if (onCustomerSelect) {
      onCustomerSelect(null);
    }
  }, [onCustomerSelect]);

  /**
   * Set customer programmatically (for edit mode)
   */
  const setCustomer = useCallback((id, name) => {
    setCustomerId(id || '');
    setCustomerName(name || '');
    setSearchResults([]);
    setShowDropdown(false);
    setError('');
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    // State
    customerId,
    customerName,
    searchResults,
    showDropdown,
    loading,
    error,
    
    // Methods
    handleCustomerIdChange,
    handleCustomerNameChange,
    handleCustomerSelect,
    clearCustomer,
    setCustomer,
    fetchCustomerById,
    setShowDropdown
  };
};

export default useCustomerLookup;
