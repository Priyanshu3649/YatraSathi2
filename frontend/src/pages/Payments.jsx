import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { paymentAPI, customerAPI } from '../services/api';
import '../styles/vintage-erp-theme.css';
import '../styles/classic-enterprise-global.css';
import '../styles/vintage-admin-panel.css';
import '../styles/dynamic-admin-panel.css';
import '../styles/vintage-erp-global.css';

// Utility functions for financial year and accounting period
const getFinancialYear = (date) => {
  const d = date ? new Date(date) : new Date();
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  
  // Financial year runs from April to March (April = 04, March = 03)
  if (month >= 4) {
    return `${year}-${String(year + 1).slice(-2)}`;
  } else {
    return `${year - 1}-${String(year).slice(-2)}`;
  }
};

const getAccountingPeriod = (date) => {
  const d = date ? new Date(date) : new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const Payments = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // State for form fields mapped to ptXpayment table
  const [formData, setFormData] = useState({
    pt_ptid: '',          // Payment ID
    pt_custid: '',        // Customer ID
    customerName: '',     // Customer Name
    pt_totalamt: '',      // Total Received Amount
    pt_amount: '',        // Payment Amount
    pt_allocatedamt: '',  // Allocated Amount
    pt_unallocamt: '',    // Unallocated Amount
    pt_status: 'RECEIVED', // Payment Status
    pt_mode: 'CASH',      // Payment Mode
    pt_refno: '',         // Reference No
    pt_paydt: new Date().toISOString().split('T')[0], // Payment Date
    pt_rcvdt: '',         // Received Date
    pt_finyear: '',       // Financial Year
    pt_period: '',        // Accounting Period
    pt_locked: 0,         // Locked flag
    edtm: '',             // Entered On
    eby: user?.us_usid || 'ADMIN', // Entered By
    mdtm: '',             // Modified On
    mby: ''               // Modified By
  });

  // Customer lookup state
  const [customerLookup, setCustomerLookup] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  
  // Fetch customer lookup
  const fetchCustomerLookup = async (searchTerm) => {
    // Don't search if the term is empty after trimming
    if (!searchTerm || searchTerm.trim().length === 0) {
      setCustomerLookup([]);
      setShowCustomerDropdown(false);
      return;
    }
    
    try {
      // Call the customer API to search for customers
      const customers = await customerAPI.searchCustomers(searchTerm.trim());
      
      // Format the results
      const formattedResults = Array.isArray(customers?.data) ? 
        customers.data.map(customer => ({
          id: customer.id || customer.cu_usid || customer.customerId || customer.cu_custno || '',
          name: customer.name || customer.customerName || customer.cu_name || customer.cu_custname || '',
          display: `${customer.id || customer.cu_usid || customer.customerId || customer.cu_custno || ''} - ${customer.name || customer.customerName || customer.cu_name || customer.cu_custname || ''}`
        })) : [];
      
      setCustomerLookup(formattedResults);
      setShowCustomerDropdown(formattedResults.length > 0); // Only show dropdown if there are results
    } catch (error) {
      console.error('Error fetching customer lookup:', error);
      setCustomerLookup([]);
      setShowCustomerDropdown(false);
      // Don't re-throw to avoid blocking UI
    }
  };
  
  // Debounce function
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  };
  
  // Debounced customer search
  const debouncedCustomerSearch = useCallback(debounce(fetchCustomerLookup, 300), []);

  // Filter state
  const [filters, setFilters] = useState({
    pt_ptid: '',
    pt_cusid: '',
    pt_status: '',
    pt_mode: '',
    pt_finyear: '',
    pt_period: '',
    pt_locked: '',
    pt_date_from: '',
    pt_date_to: '',
    pt_amount_min: '',
    pt_amount_max: ''
  });

  // Inline filter state
  const [inlineFilters, setInlineFilters] = useState({});

  // Selected payment for form
  const [selectedPayment, setSelectedPayment] = useState(null);

  // Editing state - true when editing an existing record or creating new
  const [isEditing, setIsEditing] = useState(false);

  // Validation state
  const [validationErrors, setValidationErrors] = useState({});

  // State for filtered payments
  const [filteredPayments, setFilteredPayments] = useState([]);
    
  // Navigation helper function to find index of selected payment
  const getSelectedPaymentIndex = () => {
    if (!selectedPayment) return -1;
    return filteredPayments.findIndex(p => p.pt_ptid === selectedPayment.pt_ptid);
  };

  // Navigation functions
  const goToFirstRecord = () => {
    if (filteredPayments.length > 0) {
      handleRowSelect(filteredPayments[0]);
    }
  };

  const goToPreviousRecord = () => {
    const currentIndex = getSelectedPaymentIndex();
    if (currentIndex > 0) {
      handleRowSelect(filteredPayments[currentIndex - 1]);
    }
  };

  const goToNextRecord = () => {
    const currentIndex = getSelectedPaymentIndex();
    if (currentIndex < filteredPayments.length - 1) {
      handleRowSelect(filteredPayments[currentIndex + 1]);
    }
  };

  const goToLastRecord = () => {
    if (filteredPayments.length > 0) {
      handleRowSelect(filteredPayments[filteredPayments.length - 1]);
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...payments];
    
    // Apply inline filters
    Object.entries(inlineFilters).forEach(([column, value]) => {
      if (value !== undefined && value !== '') {
        filtered = filtered.filter(record => {
          const recordValue = record[column];
          if (recordValue == null) return false;
          
          // For dates, convert to string for comparison
          if (column.includes('date') || column.includes('dt') || column.includes('paydt')) {
            return new Date(recordValue).toISOString().split('T')[0].includes(value.toLowerCase());
          }
          
          // For numbers, convert to string for comparison
          if (typeof recordValue === 'number') {
            return recordValue.toString().includes(value.toLowerCase());
          }
          
          // For strings, do case-insensitive comparison
          return recordValue.toString().toLowerCase().includes(value.toLowerCase());
        });
      }
    });
    
    setFilteredPayments(filtered);
  }, [payments, inlineFilters]);
  
  // Auto-select first record when payments data changes
  useEffect(() => {
    if (filteredPayments.length > 0 && !selectedPayment) {
      handleRowSelect(filteredPayments[0]);
    }
  }, [filteredPayments]); // Only trigger when payments change, not selectedPayment

  // Keyboard navigation effect
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Only handle navigation if we have payments and are not in an input field
      if (filteredPayments.length === 0 || document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'SELECT') {
        return;
      }
      
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          goToNextRecord();
          break;
        case 'ArrowUp':
          event.preventDefault();
          goToPreviousRecord();
          break;
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedPayment, filteredPayments]);

  // Fetch payments when component mounts
  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      let response;
      
      if (user && user.us_usertype === 'admin') {
        response = await paymentAPI.getAllPayments();
      } else {
        response = await paymentAPI.getMyPayments();
      }
      
      // Handle new API response format { success: true, payments: [...] }
      const paymentsData = response.payments || response || [];
      setPayments(Array.isArray(paymentsData) ? paymentsData : []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to fetch payments');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNew = () => {
    setFormData({
      pt_ptid: '',
      pt_custid: '',
      customerName: '',
      pt_totalamt: '',
      pt_amount: '',
      pt_allocatedamt: '',
      pt_unallocamt: '', // Will be calculated automatically
      pt_status: 'RECEIVED',
      pt_mode: 'CASH',
      pt_refno: '',
      pt_paydt: new Date().toISOString().split('T')[0],
      pt_rcvdt: '',
      pt_finyear: getFinancialYear(new Date()),       // Auto-populate financial year
      pt_period: getAccountingPeriod(new Date()),     // Auto-populate accounting period
      pt_locked: 0,
      edtm: '',
      eby: user?.us_usid || 'ADMIN',
      mdtm: '',
      mby: ''
    });
    setSelectedPayment(null);
    setIsEditing(true); // Set editing mode to true for new record
    
    // Reset validation errors
    setValidationErrors({});
    
    // Reset customer lookup
    setCustomerLookup([]);
    setShowCustomerDropdown(false);
  };

  const handleEdit = (payment) => {
    setFormData({
      pt_ptid: payment.pt_ptid || payment.id || '',
      pt_custid: payment.pt_custid || payment.customerId || '',
      customerName: payment.customerName || '',
      pt_totalamt: payment.pt_totalamt != null ? payment.pt_totalamt.toString() : '',
      pt_amount: payment.pt_amount != null ? payment.pt_amount.toString() : '',
      pt_allocatedamt: payment.pt_allocatedamt != null ? payment.pt_allocatedamt.toString() : '',
      pt_unallocamt: payment.pt_unallocamt != null ? payment.pt_unallocamt.toString() : '',
      pt_status: payment.pt_status || payment.status || 'RECEIVED',
      pt_mode: payment.pt_mode || payment.mode || 'CASH',
      pt_refno: payment.pt_refno || payment.reference || '',
      pt_paydt: payment.pt_paydt?.split('T')[0] || payment.paymentDate?.split('T')[0] || new Date().toISOString().split('T')[0],
      pt_rcvdt: payment.pt_rcvdt?.split('T')[0] || payment.receivedDate?.split('T')[0] || '',
      pt_finyear: payment.pt_finyear || payment.financialYear || '',
      pt_period: payment.pt_period || payment.accountingPeriod || '',
      pt_locked: payment.pt_locked || payment.locked || 0,
      edtm: payment.edtm || payment.enteredOn || '',
      eby: payment.eby || payment.enteredBy || user?.us_usid || 'ADMIN',
      mdtm: payment.mdtm || payment.modifiedOn || '',
      mby: payment.mby || payment.modifiedBy || ''
    });
    setSelectedPayment(payment);
    setIsEditing(true); // Set editing mode to true when editing
    
    // Reset validation errors
    setValidationErrors({});
    
    // Reset customer lookup
    setCustomerLookup([]);
    setShowCustomerDropdown(false);
  };

  const handleSave = async () => {
    // Validate before saving
    const errors = {};
    
    // Check if amount is positive
    if (!formData.pt_amount || parseFloat(formData.pt_amount) <= 0) {
      errors.pt_amount = 'Amount must be greater than 0';
    }
    
    // Check if payment date is provided
    if (!formData.pt_paydt) {
      errors.pt_paydt = 'Payment date is required';
    }
    
    // Check if payment mode is provided
    if (!formData.pt_mode) {
      errors.pt_mode = 'Payment mode is required';
    }
    
    // Check if customer is provided
    if (!formData.pt_custid) {
      errors.pt_custid = 'Customer is required';
    }
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    try {
      // Prepare payment data for API call
      const paymentData = {
        customerId: formData.pt_custid,
        customerName: formData.customerName,
        totalAmount: parseFloat(formData.pt_totalamt) || 0,
        amount: parseFloat(formData.pt_amount) || 0,
        allocatedAmount: parseFloat(formData.pt_allocatedamt) || 0,
        unallocatedAmount: parseFloat(formData.pt_unallocamt) || 0,
        status: formData.pt_status,
        mode: formData.pt_mode,
        reference: formData.pt_refno,
        paymentDate: formData.pt_paydt,
        receivedDate: formData.pt_rcvdt,
        financialYear: formData.pt_finyear,
        accountingPeriod: formData.pt_period,
        locked: formData.pt_locked
      };
      
      if (selectedPayment) {
        // Update existing payment
        if (selectedPayment.pt_locked === 1) {
          setError('Cannot edit locked payment');
          return;
        }
        await paymentAPI.updatePayment(selectedPayment.pt_ptid, paymentData);
      } else {
        // Create new payment
        await paymentAPI.createPayment(paymentData);
      }
      
      fetchPayments();
      setIsEditing(false); // Set editing mode to false after saving
      handleNew(); // Reset form
      setValidationErrors({});
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to save payment');
    }
  };

  const handleDelete = async (paymentId) => {
    if (window.confirm('Are you sure you want to delete this payment? This action cannot be undone.')) {
      try {
        // First get the payment to check if it's locked
        const payment = payments.find(p => p.pt_ptid === paymentId);
        if (payment && payment.pt_locked === 1) {
          setError('Cannot delete locked payment');
          return;
        }
        
        await paymentAPI.deletePayment(paymentId);
        fetchPayments();
        if (selectedPayment && selectedPayment.pt_ptid === paymentId) {
          handleNew();
        }
        setError('');
      } catch (err) {
        setError(err.message || 'Failed to delete payment');
      }
    }
  };

  const handleFilterApply = () => {
    // Apply filters to payment data
    fetchPayments();
  };

  const handleFilterClear = () => {
    setFilters({
      pt_ptid: '',
      pt_cusid: '',
      pt_customername: '',
      pt_status: '',
      pt_mode: '',
      pt_finyear: '',
      pt_period: '',
      pt_locked: '',
      pt_date_from: '',
      pt_date_to: '',
      pt_amount_min: '',
      pt_amount_max: ''
    });
    setInlineFilters({});
  };

  const handleRowSelect = (payment) => {
    handleEdit(payment);
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'RECEIVED':
        return 'status-received';
      case 'PARTIAL':
        return 'status-partial';
      case 'ADJUSTED':
        return 'status-adjusted';
      default:
        return '';
    }
  };

  const getModeDisplay = (mode) => {
    const modes = {
      'CASH': 'Cash',
      'ONLINE': 'UPI',
      'CARD': 'Card',
      'BANK_TRANSFER': 'Bank',
      'CHEQUE': 'Bank',
      'BANK': 'Bank'
    };
    return modes[mode] || mode;
  };
  
  // Handle inline filter changes
  const handleInlineFilterChange = (column, value) => {
    setInlineFilters(prev => ({
      ...prev,
      [column]: value
    }));
  };

  // Handle customer ID change
  const handleCustomerIdChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      pt_custid: value,
      customerName: value ? '' : prev.customerName // Clear customer name if ID is being entered
    }));
    
    // Fetch customer name by ID if a valid ID is entered
    if (value.trim().length > 0) {
      fetchCustomerNameById(value);
    }
    
    // Fetch customer suggestions if search term is long enough
    if (value.trim().length >= 1) { // Changed from 3 to 1 to allow single character search
      debouncedCustomerSearch(value.trim());
    } else {
      setCustomerLookup([]);
      setShowCustomerDropdown(false);
    }
  };
  
  
  // Handle customer selection from dropdown
  const handleCustomerSelect = (customer) => {
    setFormData(prev => ({
      ...prev,
      pt_custid: customer.id,
      customerName: customer.name || customer.display?.split(' - ')[1] || ''
    }));
    setCustomerLookup([]);
    setShowCustomerDropdown(false);
    
    // Also fetch detailed customer info to populate any additional fields
    fetchCustomerNameById(customer.id);
  };
  
  // Handle customer name change
  const handleCustomerNameChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      customerName: value,
      pt_custid: value ? '' : prev.pt_custid // Clear customer ID if name is being entered
    }));
    
    // Fetch customer ID by name if a valid name is entered
    if (value.trim().length > 0) {
      fetchCustomerIdByName(value);
    }
    
    // Fetch customer suggestions if search term is long enough
    if (value.trim().length >= 1) { // Changed from 3 to 1 to allow single character search
      debouncedCustomerSearch(value.trim()); // Use the same function for both name and ID
    } else {
      setCustomerLookup([]);
      setShowCustomerDropdown(false);
    }
  };
  

  
  // Fetch customer name by ID (only called after selection)
  const fetchCustomerNameById = async (customerId) => {
    try {
      const customer = await customerAPI.getCustomerById(customerId);
      const customerName = customer.data?.name || customer.data?.customerName || customer.data?.cu_name || customer.data?.cu_custname || '';
      setFormData(prev => ({
        ...prev,
        customerName: customerName
      }));
    } catch (error) {
      console.error('Error fetching customer by ID:', error);
    }
  };
  
  // Fetch customer ID by name
  const fetchCustomerIdByName = async (customerName) => {
    try {
      const customers = await customerAPI.searchCustomers(customerName);
      const customer = Array.isArray(customers?.data) && customers.data.find(c => 
        (c.name && c.name.toLowerCase().includes(customerName.toLowerCase())) ||
        (c.customerName && c.customerName.toLowerCase().includes(customerName.toLowerCase())) ||
        (c.cu_name && c.cu_name.toLowerCase().includes(customerName.toLowerCase())) ||
        (c.cu_custname && c.cu_custname.toLowerCase().includes(customerName.toLowerCase()))
      );
      if (customer) {
        setFormData(prev => ({
          ...prev,
          pt_custid: customer.id || customer.cu_usid || customer.customerId || customer.cu_custno || ''
        }));
      }
    } catch (error) {
      console.error('Error searching customers by name:', error);
    }
  };
  
  // Handle payment amount change and recalculate unallocated amount
  const handlePaymentAmountChange = (e) => {
    const value = e.target.value;
    setFormData(prev => {
      const amount = parseFloat(value) || 0;
      const allocatedAmount = parseFloat(prev.pt_allocatedamt) || 0;
      const unallocatedAmount = amount - allocatedAmount;
      
      return {
        ...prev,
        pt_amount: value,
        pt_unallocamt: unallocatedAmount.toFixed(2) // Calculate unallocated amount
      };
    });
  };
  
  // Handle allocated amount change and recalculate unallocated amount
  const handleAllocatedAmountChange = (e) => {
    const value = e.target.value;
    setFormData(prev => {
      const amount = parseFloat(prev.pt_amount) || 0;
      const allocatedAmount = parseFloat(value) || 0;
      const unallocatedAmount = amount - allocatedAmount;
      
      return {
        ...prev,
        pt_allocatedamt: value,
        pt_unallocamt: unallocatedAmount.toFixed(2) // Calculate unallocated amount
      };
    });
  };

  if (loading) {
    return (
      <div className="erp-admin-container">
        <div className="erp-loading">Loading payments...</div>
      </div>
    );
  }

  return (
    <div className="erp-admin-container">
      {/* Toolbar */}
      <div className="erp-toolbar">
        <button className="erp-icon-button" onClick={goToFirstRecord} disabled={payments.length === 0 || getSelectedPaymentIndex() <= 0} title="First Record">|◀</button>
        <button className="erp-icon-button" onClick={goToPreviousRecord} disabled={payments.length === 0 || getSelectedPaymentIndex() <= 0} title="Previous Record">◀</button>
        <button className="erp-icon-button" onClick={goToNextRecord} disabled={payments.length === 0 || getSelectedPaymentIndex() >= payments.length - 1} title="Next Record">▶</button>
        <button className="erp-icon-button" onClick={goToLastRecord} disabled={payments.length === 0 || getSelectedPaymentIndex() >= payments.length - 1} title="Last Record">▶|</button>
        <div className="erp-tool-separator"></div>
        <button className="erp-button" onClick={handleNew} title="New">New</button>
        <button className="erp-button" onClick={() => selectedPayment ? handleEdit(selectedPayment) : alert('Please select a payment first')} disabled={!selectedPayment || (user?.us_usertype !== 'admin' && user?.us_usertype !== 'employee') || (selectedPayment && selectedPayment.pt_locked === 1)} title="Edit">Edit</button>
        <button className="erp-button" onClick={() => selectedPayment ? handleDelete(selectedPayment.pt_ptid) : alert('Please select a payment first')} disabled={!selectedPayment || user?.us_usertype !== 'admin' || (selectedPayment && selectedPayment.pt_locked === 1)} title="Delete">Delete</button>
        <div className="erp-tool-separator"></div>
        <button className="erp-button" onClick={handleSave} title="Save">Save</button>
        <div className="erp-tool-separator"></div>
        <button className="erp-button" onClick={fetchPayments} title="Refresh">Refresh</button>
        <div className="erp-tool-separator"></div>
        <button className="erp-button" title="Export">Export</button>
        <button className="erp-button" title="Print">Print</button>
      </div>

      <div className="erp-main-content">
        <div className="erp-center-content">
          {/* Form Section - Static */}
          <div className="erp-form-section">
            <div className="erp-panel-header">Payment Details</div>
            
            <div className="erp-form-grid">
              <label className="erp-form-label">Payment ID</label>
              <input 
                type="text" 
                name="pt_ptid" 
                value={formData.pt_ptid || ''} 
                onChange={(e) => setFormData({...formData, pt_ptid: e.target.value})}
                readOnly
                className="erp-input"
              />
              <label className="erp-form-label required">Customer ID</label>
              <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
                <input 
                  type="text" 
                  name="pt_custid" 
                  value={formData.pt_custid || ''} 
                  onChange={handleCustomerIdChange}
                  className="erp-input"
                  placeholder="Search customer ID..."
                  disabled={formData.pt_locked === 1}
                />
                {showCustomerDropdown && (
                  <div className="erp-dropdown" style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    zIndex: 1000,
                    maxHeight: '150px',
                    overflowY: 'auto',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                  }}>
                    {customerLookup.map(customer => (
                      <div 
                        key={customer.id}
                        className="erp-dropdown-item"
                        style={{
                          padding: '4px 8px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #eee'
                        }}
                        onMouseDown={() => handleCustomerSelect(customer)}
                      >
                        {customer.display}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <label className="erp-form-label required">Customer Name</label>
              <input
                type="text"
                name="customerName"
                value={formData.customerName || ''}
                onChange={handleCustomerNameChange}
                className="erp-input"
                placeholder="Customer name..."
                disabled={formData.pt_locked === 1}
              />
              <label className="erp-form-label">Total Received Amount</label>
              <input 
                type="number" 
                name="pt_totalamt" 
                value={formData.pt_totalamt || ''} 
                onChange={(e) => setFormData({...formData, pt_totalamt: e.target.value})}
                className="erp-input"
                disabled={formData.pt_locked === 1}
              />
              <label className="erp-form-label required">Payment Amount</label>
              <input 
                type="number" 
                name="pt_amount" 
                value={formData.pt_amount || ''} 
                onChange={handlePaymentAmountChange}
                className={`erp-input ${validationErrors.pt_amount ? 'error' : ''}`}
                disabled={formData.pt_locked === 1}
              />
              {validationErrors.pt_amount && (
                <div className="error-message" style={{ gridColumn: '1 / span 2', color: 'red', fontSize: '12px' }}>{validationErrors.pt_amount}</div>
              )}
              <label className="erp-form-label">Allocated Amount</label>
              <input 
                type="number" 
                name="pt_allocatedamt" 
                value={formData.pt_allocatedamt || ''} 
                onChange={handleAllocatedAmountChange}
                className="erp-input"
                disabled={formData.pt_locked === 1}
              />
              <label className="erp-form-label">Unallocated Amount</label>
              <input 
                type="number" 
                name="pt_unallocamt" 
                value={formData.pt_unallocamt || ''} 
                className="erp-input"
                readOnly
              />
              <label className="erp-form-label">Payment Status</label>
              <select 
                name="pt_status" 
                value={formData.pt_status || 'RECEIVED'} 
                onChange={(e) => setFormData({...formData, pt_status: e.target.value})}
                className="erp-input"
                disabled={formData.pt_locked === 1}
              >
                <option value="RECEIVED">RECEIVED</option>
                <option value="PARTIAL">PARTIAL</option>
                <option value="ADJUSTED">ADJUSTED</option>
              </select>
              <label className="erp-form-label required">Payment Mode</label>
              <select 
                name="pt_mode" 
                value={formData.pt_mode || 'CASH'} 
                onChange={(e) => setFormData({...formData, pt_mode: e.target.value})}
                className={`erp-input ${validationErrors.pt_mode ? 'error' : ''}`}
                disabled={formData.pt_locked === 1}
              >
                <option value="CASH">Cash</option>
                <option value="ONLINE">UPI</option>
                <option value="CARD">Card</option>
                <option value="BANK">Bank</option>
                <option value="CHEQUE">Bank</option>
              </select>
              {validationErrors.pt_mode && (
                <div className="error-message" style={{ gridColumn: '1 / span 2', color: 'red', fontSize: '12px' }}>{validationErrors.pt_mode}</div>
              )}
              <label className="erp-form-label">Reference No</label>
              <input 
                type="text" 
                name="pt_refno" 
                value={formData.pt_refno || ''} 
                onChange={(e) => setFormData({...formData, pt_refno: e.target.value})}
                className="erp-input"
                disabled={formData.pt_locked === 1}
              />
              <label className="erp-form-label required">Payment Date</label>
              <input 
                type="date" 
                name="pt_paydt" 
                value={formData.pt_paydt || ''} 
                onChange={(e) => setFormData({...formData, pt_paydt: e.target.value})}
                className={`erp-input ${validationErrors.pt_paydt ? 'error' : ''}`}
                disabled={formData.pt_locked === 1}
              />
              {validationErrors.pt_paydt && (
                <div className="error-message" style={{ gridColumn: '1 / span 2', color: 'red', fontSize: '12px' }}>{validationErrors.pt_paydt}</div>
              )}
              <label className="erp-form-label">Received Date</label>
              <input 
                type="date" 
                name="pt_rcvdt" 
                value={formData.pt_rcvdt || ''} 
                onChange={(e) => setFormData({...formData, pt_rcvdt: e.target.value})}
                className="erp-input"
                disabled={formData.pt_locked === 1}
              />
              <label className="erp-form-label">Financial Year</label>
              <input 
                type="text" 
                name="pt_finyear" 
                value={formData.pt_finyear || ''} 
                onChange={(e) => setFormData({...formData, pt_finyear: e.target.value})}
                className="erp-input"
                disabled={formData.pt_locked === 1}
                placeholder="e.g. 2025-26"
              />
              <label className="erp-form-label">Accounting Period</label>
              <input 
                type="text" 
                name="pt_period" 
                value={formData.pt_period || ''} 
                onChange={(e) => setFormData({...formData, pt_period: e.target.value})}
                className="erp-input"
                disabled={formData.pt_locked === 1}
                placeholder="e.g. YYYY-MM"
              />
              <label className="erp-form-label">Locked</label>
              <select 
                name="pt_locked" 
                value={formData.pt_locked || 0} 
                onChange={(e) => setFormData({...formData, pt_locked: parseInt(e.target.value)})}
                className="erp-input"
                disabled={formData.pt_locked === 1}
              >
                <option value={0}>No</option>
                <option value={1}>Yes</option>
              </select>
            </div>
            
            {/* Audit Section */}
            <div className="erp-audit-section">
              <div className="erp-audit-row">
                <label className="erp-audit-label">Entered On</label>
                <input type="text" className="erp-audit-input" value={formData.edtm || ''} readOnly />
                <label className="erp-audit-label">Entered By</label>
                <input type="text" className="erp-audit-input" value={formData.eby || ''} readOnly />
              </div>
              <div className="erp-audit-row">
                <label className="erp-audit-label">Modified On</label>
                <input type="text" className="erp-audit-input" value={formData.mdtm || ''} readOnly />
                <label className="erp-audit-label">Modified By</label>
                <input type="text" className="erp-audit-input" value={formData.mby || ''} readOnly />
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Filter Panel */}
        <div className="erp-filter-panel">
          <div className="erp-filter-header">
            <div className="erp-filter-title">
              Filter Criteria
            </div>
          </div>
          
          <div className="erp-filter-section">
            <div className="erp-filter-row">
              <div className="erp-filter-field">
                <label className="erp-filter-label">Payment ID</label>
                <input 
                  type="text" 
                  name="pt_ptid" 
                  className="erp-filter-input" 
                  value={filters.pt_ptid || ''} 
                  onChange={(e) => setFilters({...filters, pt_ptid: e.target.value})}
                  placeholder="Search payment ID..."
                />
              </div>
            </div>
            
            <div className="erp-filter-row">
              <div className="erp-filter-field">
                <label className="erp-filter-label">Customer ID</label>
                <input 
                  type="text" 
                  name="pt_cusid" 
                  className="erp-filter-input" 
                  value={filters.pt_cusid || ''} 
                  onChange={(e) => setFilters({...filters, pt_cusid: e.target.value})}
                  placeholder="Search customer ID..."
                />
              </div>
              
              <div className="erp-filter-field">
                <label className="erp-filter-label">Customer Name</label>
                <input 
                  type="text" 
                  name="pt_customername" 
                  className="erp-filter-input" 
                  value={filters.pt_customername || ''} 
                  onChange={(e) => setFilters({...filters, pt_customername: e.target.value})}
                  placeholder="Search customer name..."
                />
              </div>
            </div>
            
            <div className="erp-filter-row">
              <div className="erp-filter-field">
                <label className="erp-filter-label">Status</label>
                <select 
                  name="pt_status" 
                  className="erp-filter-select" 
                  value={filters.pt_status || ''} 
                  onChange={(e) => setFilters({...filters, pt_status: e.target.value})}
                >
                  <option value="">All</option>
                  <option value="RECEIVED">RECEIVED</option>
                  <option value="PARTIAL">PARTIAL</option>
                  <option value="ADJUSTED">ADJUSTED</option>
                </select>
              </div>
              
              <div className="erp-filter-field">
                <label className="erp-filter-label">Payment Mode</label>
                <select 
                  name="pt_mode" 
                  className="erp-filter-select" 
                  value={filters.pt_mode || ''} 
                  onChange={(e) => setFilters({...filters, pt_mode: e.target.value})}
                >
                  <option value="">All</option>
                  <option value="CASH">Cash</option>
                  <option value="ONLINE">UPI</option>
                  <option value="CARD">Card</option>
                  <option value="BANK">Bank</option>
                  <option value="CHEQUE">Bank</option>
                </select>
              </div>
            </div>
            
            <div className="erp-filter-row">
              <div className="erp-filter-field">
                <label className="erp-filter-label">Financial Year</label>
                <input 
                  type="text" 
                  name="pt_finyear" 
                  className="erp-filter-input" 
                  value={filters.pt_finyear || ''} 
                  onChange={(e) => setFilters({...filters, pt_finyear: e.target.value})}
                  placeholder="e.g. 2025-26"
                />
              </div>
              
              <div className="erp-filter-field">
                <label className="erp-filter-label">Period</label>
                <input 
                  type="text" 
                  name="pt_period" 
                  className="erp-filter-input" 
                  value={filters.pt_period || ''} 
                  onChange={(e) => setFilters({...filters, pt_period: e.target.value})}
                  placeholder="e.g. YYYY-MM"
                />
              </div>
            </div>
            
            <div className="erp-filter-row">
              <div className="erp-filter-field">
                <label className="erp-filter-label">Locked</label>
                <select 
                  name="pt_locked" 
                  className="erp-filter-select" 
                  value={filters.pt_locked || ''} 
                  onChange={(e) => setFilters({...filters, pt_locked: e.target.value})}
                >
                  <option value="">All</option>
                  <option value="0">No</option>
                  <option value="1">Yes</option>
                </select>
              </div>
              
              <div className="erp-filter-field">
                <label className="erp-filter-label">Amount Range From</label>
                <input 
                  type="number" 
                  name="pt_amount_min" 
                  className="erp-filter-input" 
                  value={filters.pt_amount_min || ''} 
                  onChange={(e) => setFilters({...filters, pt_amount_min: e.target.value})}
                  placeholder="Min amount"
                />
              </div>
            </div>
            
            <div className="erp-filter-row">
              <div className="erp-filter-field">
                <label className="erp-filter-label">Amount Range To</label>
                <input 
                  type="number" 
                  name="pt_amount_max" 
                  className="erp-filter-input" 
                  value={filters.pt_amount_max || ''} 
                  onChange={(e) => setFilters({...filters, pt_amount_max: e.target.value})}
                  placeholder="Max amount"
                />
              </div>
              
              <div className="erp-filter-field">
                <label className="erp-filter-label">Date From</label>
                <input 
                  type="date" 
                  name="pt_date_from" 
                  className="erp-filter-input" 
                  value={filters.pt_date_from || ''} 
                  onChange={(e) => setFilters({...filters, pt_date_from: e.target.value})}
                />
              </div>
            </div>
            
            <div className="erp-filter-row">
              <div className="erp-filter-field">
                <label className="erp-filter-label">Date To</label>
                <input 
                  type="date" 
                  name="pt_date_to" 
                  className="erp-filter-input" 
                  value={filters.pt_date_to || ''} 
                  onChange={(e) => setFilters({...filters, pt_date_to: e.target.value})}
                />
              </div>
            </div>
          </div>
          
          <div className="erp-filter-actions" style={{ marginTop: '12px', display: 'flex', gap: '4px' }}>
            <button 
              className="erp-button erp-filter-btn erp-filter-btn-primary" 
              style={{ flex: 1 }}
              onClick={handleFilterApply}
              title="Apply filter criteria"
            >
              Apply Filters
            </button>
            <button 
              className="erp-button erp-filter-btn erp-filter-btn-clear" 
              style={{ flex: 1 }}
              onClick={handleFilterClear}
              title="Clear all filters and reload data"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Grid Section - Scrollable */}
      <div className="erp-grid-section">
        <div className="erp-panel-header">Payment Records</div>
        
        {error && <div className="alert alert-error">{error}</div>}
        
        <div className="erp-grid-container" style={{ maxHeight: 'calc(100vh - 450px)', overflowY: 'auto' }}>
          <table className="erp-table">
            <thead>
              <tr>
                <th style={{ width: '30px' }}></th>
                <th style={{ width: '100px' }}>Payment ID</th>
                <th style={{ width: '120px' }}>Customer ID</th>
                <th style={{ width: '150px' }}>Customer Name</th>
                <th style={{ width: '100px' }}>Total Received Amount</th>
                <th style={{ width: '100px' }}>Payment Amount</th>
                <th style={{ width: '100px' }}>Allocated Amount</th>
                <th style={{ width: '100px' }}>Unallocated Amount</th>
                <th style={{ width: '80px' }}>Status</th>
                <th style={{ width: '80px' }}>Mode</th>
                <th style={{ width: '100px' }}>Reference No</th>
                <th style={{ width: '100px' }}>Payment Date</th>
                <th style={{ width: '100px' }}>Financial Year</th>
                <th style={{ width: '80px' }}>Locked</th>
              </tr>
              {/* Inline Filter Row */}
              <tr className="inline-filter-row">
                <td></td>
                <td>
                  <input
                    type="text"
                    className="inline-filter-input"
                    value={inlineFilters['pt_ptid'] || ''}
                    onChange={(e) => handleInlineFilterChange('pt_ptid', e.target.value)}
                    placeholder="Filter ID..."
                    style={{ width: '100%', padding: '2px', fontSize: '12px', backgroundColor: '#f0f0f0' }}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className="inline-filter-input"
                    value={inlineFilters['pt_custid'] || ''}
                    onChange={(e) => handleInlineFilterChange('pt_custid', e.target.value)}
                    placeholder="Filter customer ID..."
                    style={{ width: '100%', padding: '2px', fontSize: '12px', backgroundColor: '#f0f0f0' }}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className="inline-filter-input"
                    value={inlineFilters['customerName'] || ''}
                    onChange={(e) => handleInlineFilterChange('customerName', e.target.value)}
                    placeholder="Filter customer name..."
                    style={{ width: '100%', padding: '2px', fontSize: '12px', backgroundColor: '#f0f0f0' }}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="inline-filter-input"
                    value={inlineFilters['pt_totalamt'] || ''}
                    onChange={(e) => handleInlineFilterChange('pt_totalamt', e.target.value)}
                    placeholder="Filter amount..."
                    style={{ width: '100%', padding: '2px', fontSize: '12px', backgroundColor: '#f0f0f0' }}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="inline-filter-input"
                    value={inlineFilters['pt_amount'] || ''}
                    onChange={(e) => handleInlineFilterChange('pt_amount', e.target.value)}
                    placeholder="Filter amount..."
                    style={{ width: '100%', padding: '2px', fontSize: '12px', backgroundColor: '#f0f0f0' }}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="inline-filter-input"
                    value={inlineFilters['pt_allocatedamt'] || ''}
                    onChange={(e) => handleInlineFilterChange('pt_allocatedamt', e.target.value)}
                    placeholder="Filter amount..."
                    style={{ width: '100%', padding: '2px', fontSize: '12px', backgroundColor: '#f0f0f0' }}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="inline-filter-input"
                    value={inlineFilters['pt_unallocamt'] || ''}
                    onChange={(e) => handleInlineFilterChange('pt_unallocamt', e.target.value)}
                    placeholder="Filter amount..."
                    style={{ width: '100%', padding: '2px', fontSize: '12px', backgroundColor: '#f0f0f0' }}
                  />
                </td>
                <td>
                  <select
                    className="inline-filter-input"
                    value={inlineFilters['pt_status'] || ''}
                    onChange={(e) => handleInlineFilterChange('pt_status', e.target.value)}
                    style={{ width: '100%', padding: '2px', fontSize: '12px', backgroundColor: '#f0f0f0' }}
                  >
                    <option value="">All</option>
                    <option value="RECEIVED">RECEIVED</option>
                    <option value="PARTIAL">PARTIAL</option>
                    <option value="ADJUSTED">ADJUSTED</option>
                  </select>
                </td>
                <td>
                  <select
                    className="inline-filter-input"
                    value={inlineFilters['pt_mode'] || ''}
                    onChange={(e) => handleInlineFilterChange('pt_mode', e.target.value)}
                    style={{ width: '100%', padding: '2px', fontSize: '12px', backgroundColor: '#f0f0f0' }}
                  >
                    <option value="">All</option>
                    <option value="CASH">Cash</option>
                    <option value="ONLINE">UPI</option>
                    <option value="CARD">Card</option>
                    <option value="BANK">Bank</option>
                    <option value="CHEQUE">Bank</option>
                  </select>
                </td>
                <td>
                  <input
                    type="text"
                    className="inline-filter-input"
                    value={inlineFilters['pt_refno'] || ''}
                    onChange={(e) => handleInlineFilterChange('pt_refno', e.target.value)}
                    placeholder="Filter ref..."
                    style={{ width: '100%', padding: '2px', fontSize: '12px', backgroundColor: '#f0f0f0' }}
                  />
                </td>
                <td>
                  <input
                    type="date"
                    className="inline-filter-input"
                    value={inlineFilters['pt_paydt'] || ''}
                    onChange={(e) => handleInlineFilterChange('pt_paydt', e.target.value)}
                    style={{ width: '100%', padding: '2px', fontSize: '12px', backgroundColor: '#f0f0f0' }}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className="inline-filter-input"
                    value={inlineFilters['pt_finyear'] || ''}
                    onChange={(e) => handleInlineFilterChange('pt_finyear', e.target.value)}
                    placeholder="Filter year..."
                    style={{ width: '100%', padding: '2px', fontSize: '12px', backgroundColor: '#f0f0f0' }}
                  />
                </td>
                <td>
                  <select
                    className="inline-filter-input"
                    value={inlineFilters['pt_locked'] || ''}
                    onChange={(e) => handleInlineFilterChange('pt_locked', e.target.value)}
                    style={{ width: '100%', padding: '2px', fontSize: '12px', backgroundColor: '#f0f0f0' }}
                  >
                    <option value="">All</option>
                    <option value="0">No</option>
                    <option value="1">Yes</option>
                  </select>
                </td>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => (
                <tr 
                  key={payment.pt_ptid} 
                  onClick={() => handleRowSelect(payment)}
                  className={selectedPayment && selectedPayment.pt_ptid === payment.pt_ptid ? 'selected' : (payment.pt_unallocamt > 0 ? 'pending-allocation' : '')}
                  style={payment.pt_unallocamt > 0 ? { backgroundColor: '#fff8dc' } : {}}
                >
                  <td><input type="checkbox" checked={!!(selectedPayment && selectedPayment.pt_ptid === payment.pt_ptid)} onChange={() => {}} /></td>
                  <td>{payment.pt_ptid ? payment.pt_ptid : ''}</td>
                  <td>{payment.pt_custid ? payment.pt_custid : ''}</td>
                  <td>{payment.customerName || payment.pt_customername || ''}</td>
                  <td className="text-right">{(payment.pt_totalamt != null && payment.pt_totalamt !== '' ? parseFloat(payment.pt_totalamt) : 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</td>
                  <td className="text-right">{(payment.pt_amount != null && payment.pt_amount !== '' ? parseFloat(payment.pt_amount) : 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</td>
                  <td className="text-right">{(payment.pt_allocatedamt != null && payment.pt_allocatedamt !== '' ? parseFloat(payment.pt_allocatedamt) : 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</td>
                  <td className="text-right">{(payment.pt_unallocamt != null && payment.pt_unallocamt !== '' ? parseFloat(payment.pt_unallocamt) : 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</td>
                  <td><span className={`status-badge ${getStatusClass(payment.pt_status || payment.status || '')}`}>
                    {payment.pt_status || payment.status || ''}
                  </span></td>
                  <td>{getModeDisplay(payment.pt_mode || payment.mode)}</td>
                  <td>{payment.pt_refno || payment.reference || ''}</td>
                  <td>{payment.pt_paydt ? new Date(payment.pt_paydt).toLocaleDateString() : ''}</td>
                  <td>{payment.pt_finyear || payment.financialYear || ''}</td>
                  <td>{payment.pt_locked === 1 ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredPayments.length === 0 && (
            <div className="no-records" style={{ padding: '20px', textAlign: 'center' }}>No payment records found</div>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="erp-status-bar">
        <div className="erp-status-item">{selectedPayment ? 'Selected' : 'Ready'}</div>
        <div className="erp-status-item">Records: {filteredPayments.length !== payments.length ? `${filteredPayments.length}/${payments.length}` : filteredPayments.length}</div>
        <div className="erp-status-item">Position: {selectedPayment ? `${filteredPayments.findIndex(p => p.pt_ptid === selectedPayment.pt_ptid) + 1} of ${filteredPayments.length}` : '- / -'}</div>
        <div className="erp-status-item">User: {user?.us_usid || 'Unknown'}</div>
        <div className="status-panel">YatraSathi ERP System</div>
      </div>
    </div>
  );
};

export default Payments;