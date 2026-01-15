import React, { useRef, useEffect } from 'react';
import useCustomerLookup from '../../hooks/useCustomerLookup';
import './CustomerLookupInput.css';

/**
 * Reusable Customer Lookup Component with bidirectional ID ↔ Name sync
 * 
 * @param {Object} props
 * @param {string} props.customerId - Controlled customer ID value
 * @param {string} props.customerName - Controlled customer name value
 * @param {Function} props.onCustomerChange - Callback when customer changes
 * @param {boolean} props.disabled - Whether inputs are disabled
 * @param {boolean} props.required - Whether fields are required
 * @param {string} props.idLabel - Label for customer ID field
 * @param {string} props.nameLabel - Label for customer name field
 */
const CustomerLookupInput = ({
  customerId: externalCustomerId,
  customerName: externalCustomerName,
  onCustomerChange,
  disabled = false,
  required = false,
  idLabel = 'Customer ID',
  nameLabel = 'Customer Name'
}) => {
  const dropdownRef = useRef(null);
  
  const {
    customerId,
    customerName,
    searchResults,
    showDropdown,
    loading,
    error,
    handleCustomerIdChange,
    handleCustomerNameChange,
    handleCustomerSelect,
    setCustomer,
    setShowDropdown
  } = useCustomerLookup({
    onCustomerSelect: (customer) => {
      if (onCustomerChange) {
        onCustomerChange(customer);
      }
    }
  });

  // Sync with external values (for controlled component behavior)
  useEffect(() => {
    if (externalCustomerId !== customerId || externalCustomerName !== customerName) {
      setCustomer(externalCustomerId, externalCustomerName);
    }
  }, [externalCustomerId, externalCustomerName]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [setShowDropdown]);

  return (
    <div className="customer-lookup-container">
      <label className="customer-lookup-label">
        {idLabel}
        {required && <span className="required-asterisk"> *</span>}
      </label>
      <div className="customer-lookup-field">
        <div className="customer-lookup-input-wrapper" ref={dropdownRef}>
          <input
            type="text"
            className="customer-lookup-input"
            value={customerId}
            onChange={(e) => handleCustomerIdChange(e.target.value)}
            disabled={disabled}
            placeholder="Enter customer ID..."
            autoComplete="off"
          />
          {loading && <span className="customer-lookup-loading">🔄</span>}
          
          {/* Dropdown for ID field */}
          {showDropdown && searchResults.length > 0 && (
            <div className="customer-lookup-dropdown">
              {searchResults.map((customer, index) => (
                <div
                  key={index}
                  className="customer-lookup-dropdown-item"
                  onClick={() => handleCustomerSelect(customer)}
                >
                  <div className="customer-dropdown-main">{customer.display}</div>
                  {customer.mobile && (
                    <div className="customer-dropdown-sub">📱 {customer.mobile}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <label className="customer-lookup-label">
        {nameLabel}
        {required && <span className="required-asterisk"> *</span>}
      </label>
      <div className="customer-lookup-field">
        <div className="customer-lookup-input-wrapper">
          <input
            type="text"
            className="customer-lookup-input"
            value={customerName}
            onChange={(e) => handleCustomerNameChange(e.target.value)}
            disabled={disabled}
            placeholder="Enter customer name..."
            autoComplete="off"
          />
          {loading && <span className="customer-lookup-loading">🔄</span>}
          
          {/* Dropdown for Name field */}
          {showDropdown && searchResults.length > 0 && (
            <div className="customer-lookup-dropdown">
              {searchResults.map((customer, index) => (
                <div
                  key={index}
                  className="customer-lookup-dropdown-item"
                  onClick={() => handleCustomerSelect(customer)}
                >
                  <div className="customer-dropdown-main">{customer.display}</div>
                  {customer.mobile && (
                    <div className="customer-dropdown-sub">📱 {customer.mobile}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="customer-lookup-error">
          ⚠️ {error}
        </div>
      )}
      
      {/* No Results Message */}
      {showDropdown && searchResults.length === 0 && !loading && (
        <div className="customer-lookup-no-results">
          No customers found
        </div>
      )}
    </div>
  );
};

export default CustomerLookupInput;
