// Receipt Form Component - Money coming in
// Implements the ASCII wireframe layout as specified

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useKeyboardNavigation } from '../../contexts/KeyboardNavigationContext';
import useKeyboardNav from '../../hooks/useKeyboardNavigation';
import SaveConfirmationModal from '../common/SaveConfirmationModal';

const ReceiptForm = ({ onBack }) => {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    receipt_no: '',
    date: new Date().toISOString().split('T')[0],
    type: 'Credit',
    customer_name: '',
    customer_id: '',
    customer_phone: '',
    account_name: '',
    amount: '',
    ref_number: ''
  });

  // Audit data for the form (following booking/billing pattern)
  const [auditData, setAuditData] = useState({
    enteredOn: new Date().toISOString(),
    enteredBy: user?.us_usid || 'ADMIN',
    modifiedOn: '',
    modifiedBy: user?.us_usid || 'ADMIN',
    closedOn: '',
    closedBy: ''
  });

  // Customer-related data (fetched from backend)
  const [customerData, setCustomerData] = useState({
    balance: 0,
    total_credit: 0,
    total_debit: 0,
    loading: false
  });

  // Payment Records State
  const [paymentRecords, setPaymentRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Customer search
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  
  // Mode state
  const [mode, setMode] = useState('form'); // 'form' or 'records'
  
  const [accounts] = useState([
    'Cash Account',
    'Bank Account - SBI',
    'Bank Account - HDFC',
    'Customer Account',
    'Supplier Account'
  ]);

  // Define field order for keyboard navigation (memoized to prevent re-renders)
  const fieldOrder = useMemo(() => [
    'receipt_no',
    'date',
    'type',
    'customer_search',
    'customer_name',
    'customer_phone',
    'account_name',
    'amount',
    'ref_number',
    'save_button'
  ], []);

  // Records mode field order
  const recordsFieldOrder = useMemo(() => [
    'back_to_form_button',
    'records_search',
    'export_button'
  ], []);

  const {
    formRef,
    saveConfirmationOpen,
    handleKeyDown,
    focusSpecificField
  } = useKeyboardNav({
    fieldOrder: mode === 'form' ? fieldOrder : recordsFieldOrder,
    autoFocus: true,
    onSave: handleSave,
    onCancel: onBack
  });

  const { saveConfirmationOpen: globalSaveOpen } = useKeyboardNavigation();

  // Load initial data (only run when mode changes)
  useEffect(() => {
    if (!formData.receipt_no && mode === 'form') {
      generateReceiptNo();
    }
    
    // Focus first field when mode changes
    if (mode === 'form') {
      setTimeout(() => {
        focusSpecificField('receipt_no');
      }, 100);
    } else {
      setTimeout(() => {
        focusSpecificField('back_to_form_button');
      }, 100);
    }
  }, [mode, focusSpecificField]);

  const generateReceiptNo = useCallback(() => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const prefix = formData.type === 'Debit' ? 'DR' : 'CR';
    setFormData(prev => ({
      ...prev,
      receipt_no: `${prefix}${year}${month}${day}${random}`
    }));
  }, [formData.type]);

  const calculateCustomerTotals = useCallback(() => {
    // If no customer selected, reset to zeros
    if (!formData.customer_name) {
      setCustomerData({
        balance: 0,
        total_credit: 0,
        total_debit: 0,
        loading: false
      });
      return;
    }

    // Use mock financial data based on customer name (for demo purposes)
    const mockFinancialData = {
      'Raj Kumar': { balance: 12500.00, total_credit: 35000.00, total_debit: 22500.00 },
      'Priya Sharma': { balance: -5000.00, total_credit: 15000.00, total_debit: 20000.00 },
      'Amit Patel': { balance: 8750.00, total_credit: 22000.00, total_debit: 13250.00 }
    };
    
    const baseData = mockFinancialData[formData.customer_name] || {
      balance: 0.00,
      total_credit: 0.00,
      total_debit: 0.00
    };
    
    const amount = parseFloat(formData.amount) || 0;
    
    // Calculate what the new totals would be after this transaction
    let newTotalDebit = baseData.total_debit;
    let newTotalCredit = baseData.total_credit;
    
    if (formData.type === 'Debit') {
      newTotalDebit = baseData.total_debit + amount;
    } else {
      newTotalCredit = baseData.total_credit + amount;
    }
    
    const newBalance = newTotalCredit - newTotalDebit;
    
    setCustomerData({
      ...baseData,
      total_debit: newTotalDebit,
      total_credit: newTotalCredit,
      balance: newBalance,
      loading: false
    });
    
  }, [formData.customer_name, formData.type, formData.amount]);

  // Calculate customer totals when customer, type or amount changes
  useEffect(() => {
    calculateCustomerTotals();
  }, [formData.customer_name, formData.type, formData.amount, calculateCustomerTotals]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
    
    // Clear customer data when customer changes
    if (field === 'customer_name' || field === 'customer_id') {
      setCustomerData({
        balance: 0,
        total_credit: 0,
        total_debit: 0
      });
    }
  };

  const handleCustomerSearch = async (searchValue) => {
    if (searchValue.length < 2) {
      setSearchResults([]);
      return;
    }
    
    // Mock customer search results
    const mockCustomers = [
      { us_usid: 'CUST001', us_fname: 'Raj', us_lname: 'Kumar', us_mobile: '9876543210' },
      { us_usid: 'CUST002', us_fname: 'Priya', us_lname: 'Sharma', us_mobile: '9876543211' },
      { us_usid: 'CUST003', us_fname: 'Amit', us_lname: 'Patel', us_mobile: '9876543212' }
    ];
    
    const filtered = mockCustomers.filter(customer => 
      customer.us_fname.toLowerCase().includes(searchValue.toLowerCase()) ||
      customer.us_lname.toLowerCase().includes(searchValue.toLowerCase()) ||
      customer.us_mobile.includes(searchValue)
    );
    
    setSearchResults(filtered);
  };

  const selectCustomer = (customer) => {
    setFormData(prev => ({
      ...prev,
      customer_name: customer.us_fname + ' ' + customer.us_lname,
      customer_id: customer.us_usid,
      customer_phone: customer.us_mobile || ''
    }));
    setSearchResults([]);
    setShowCustomerSearch(false);
    
    // Load customer financial data
    loadCustomerFinancialData(customer.us_usid);
  };

  const loadCustomerFinancialData = async (customerId) => {
    try {
      setCustomerData(prev => ({ ...prev, loading: true }));
      
      // In a real implementation, this would fetch from backend API
      // For now, using realistic mock data based on customer
      const mockFinancialData = {
        'CUST001': { balance: 12500.00, total_credit: 35000.00, total_debit: 22500.00 },
        'CUST002': { balance: -5000.00, total_credit: 15000.00, total_debit: 20000.00 },
        'CUST003': { balance: 8750.00, total_credit: 22000.00, total_debit: 13250.00 }
      };
      
      const financialData = mockFinancialData[customerId] || {
        balance: 0.00,
        total_credit: 0.00,
        total_debit: 0.00
      };
      
      setCustomerData({
        ...financialData,
        loading: false
      });
      
    } catch (error) {
      console.error('Error loading customer financial data:', error);
      setCustomerData({
        balance: 0.00,
        total_credit: 0.00,
        total_debit: 0.00,
        loading: false
      });
    }
  };

  async function handleSave() {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Validation
      if (!formData.customer_name || !formData.amount || !formData.account_name) {
        setError('Customer name, amount, and account name are required');
        setLoading(false);
        return;
      }

      if (parseFloat(formData.amount) <= 0) {
        setError('Amount must be greater than zero');
        setLoading(false);
        return;
      }

      // Update audit data
      const currentTime = new Date().toISOString();
      setAuditData(prev => ({
        ...prev,
        modifiedOn: currentTime,
        modifiedBy: user?.us_usid || 'ADMIN'
      }));
      
      // Create new payment record
      const newRecord = {
        id: Date.now(),
        receipt_no: formData.receipt_no,
        date: formData.date,
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        account_name: formData.account_name,
        amount: parseFloat(formData.amount),
        type: formData.type,
        ref_number: formData.ref_number,
        debit_amount: formData.type === 'Debit' ? parseFloat(formData.amount) : 0,
        credit_amount: formData.type === 'Credit' ? parseFloat(formData.amount) : 0,
        // Add audit data
        createdOn: auditData.enteredOn,
        createdBy: auditData.enteredBy,
        modifiedOn: currentTime,
        modifiedBy: user?.us_usid || 'ADMIN'
      };

      // Add to records immediately
      setPaymentRecords(prev => [newRecord, ...prev]);
      setSuccess('Receipt saved successfully!');
      
      // Reset form
      setFormData({
        receipt_no: '',
        date: new Date().toISOString().split('T')[0],
        type: 'Credit',
        customer_name: '',
        customer_id: '',
        customer_phone: '',
        account_name: '',
        amount: '',
        ref_number: ''
      });
      
      // Reset audit data
      setAuditData({
        enteredOn: currentTime,
        enteredBy: user?.us_usid || 'ADMIN',
        modifiedOn: '',
        modifiedBy: user?.us_usid || 'ADMIN',
        closedOn: '',
        closedBy: ''
      });
      
      setCustomerData({
        balance: 0,
        total_credit: 0,
        total_debit: 0
      });
      
      generateReceiptNo();
      
    } catch (err) {
      setError(err.message || 'Failed to save receipt');
    } finally {
      setLoading(false);
    }
  }

  // Group payments by customer for display
  const groupedPayments = useMemo(() => {
    const groups = {};
    paymentRecords.forEach(record => {
      const key = record.customer_name || 'Unknown Customer';
      if (!groups[key]) {
        groups[key] = {
          customer_name: key,
          customer_phone: record.customer_phone,
          records: [],
          total_debit: 0,
          total_credit: 0
        };
      }
      groups[key].records.push(record);
      groups[key].total_debit += record.debit_amount || 0;
      groups[key].total_credit += record.credit_amount || 0;
    });
    return Object.values(groups);
  }, [paymentRecords]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const renderFormSection = () => (
    <div className="payment-section-container">
      <div className="section-header">
        <h3>Receipt Entry Form</h3>
        <div className="section-actions">
          <button 
            name="save_button"
            className="btn-primary"
            onClick={handleSave}
            disabled={loading}
            ref={el => {
              if (el && mode === 'form') {
                // Ensure save button is focusable
                el.tabIndex = 0;
              }
            }}
          >
            {loading ? 'Saving...' : 'Save Receipt'}
          </button>
          <button 
            name="view_records_button"
            className="btn-secondary"
            onClick={() => setMode('records')}
          >
            View Records
          </button>
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      <div className="form-grid" ref={formRef} onKeyDown={handleKeyDown}>
        {/* Receipt No and Date */}
        <div className="form-row">
          <div className="field-group">
            <label>Receipt No.:</label>
            <input
              type="text"
              name="receipt_no"
              value={formData.receipt_no}
              readOnly
              className="form-input readonly"
            />
          </div>
          <div className="field-group">
            <label>Date:</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              className="form-input"
            />
          </div>
        </div>
        
        {/* Type */}
        <div className="form-row">
          <div className="field-group full-width">
            <label>Type:</label>
            <select
              name="type"
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              className="form-input"
            >
              <option value="Debit">Debit</option>
              <option value="Credit">Credit</option>
            </select>
          </div>
        </div>
        
        {/* Customer Search */}
        <div className="form-row">
          <div className="field-group full-width">
            <label>Customer Search:</label>
            <div className="customer-search-container">
              <input
                type="text"
                name="customer_search"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  handleCustomerSearch(e.target.value);
                  setShowCustomerSearch(e.target.value.length >= 2);
                }}
                placeholder="Search customer by name or phone..."
                className="form-input"
              />
              {showCustomerSearch && searchResults.length > 0 && (
                <div className="customer-dropdown">
                  {searchResults.map(customer => (
                    <div
                      key={customer.us_usid}
                      className="customer-option"
                      onClick={() => selectCustomer(customer)}
                    >
                      <div className="customer-name">
                        {customer.us_fname} {customer.us_lname}
                      </div>
                      <div className="customer-phone">
                        {customer.us_mobile || 'No phone'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Customer Details */}
        <div className="form-row">
          <div className="field-group">
            <label>Customer Name:</label>
            <input
              type="text"
              name="customer_name"
              value={formData.customer_name}
              onChange={(e) => handleInputChange('customer_name', e.target.value)}
              placeholder="Enter customer name"
              className="form-input"
            />
          </div>
          <div className="field-group">
            <label>Customer Phone:</label>
            <input
              type="tel"
              name="customer_phone"
              value={formData.customer_phone}
              onChange={(e) => handleInputChange('customer_phone', e.target.value)}
              placeholder="Enter phone number"
              className="form-input"
            />
          </div>
        </div>
        
        {/* Account and Amount */}
        <div className="form-row">
          <div className="field-group">
            <label>Account Name:</label>
            <select
              name="account_name"
              value={formData.account_name}
              onChange={(e) => handleInputChange('account_name', e.target.value)}
              className="form-input"
            >
              <option value="">Select Account</option>
              {accounts.map(account => (
                <option key={account} value={account}>{account}</option>
              ))}
            </select>
          </div>
          <div className="field-group">
            <label>Amount:</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              placeholder="Enter amount"
              step="0.01"
              min="0"
              className="form-input"
            />
          </div>
        </div>
        
        {/* Reference Number */}
        <div className="form-row">
          <div className="field-group full-width">
            <label>Unique Reference Number:</label>
            <input
              type="text"
              name="ref_number"
              value={formData.ref_number}
              onChange={(e) => handleInputChange('ref_number', e.target.value)}
              placeholder="Enter reference number"
              className="form-input"
            />
          </div>
        </div>
        
        {/* Customer Financial Details */}
        <div className="customer-financials">
          <h4>Customer Financial Details</h4>
          <div className="financial-grid">
            <div className="financial-item">
              <span className="label">Balance:</span>
              <span className="value">{formatCurrency(customerData.balance)}</span>
            </div>
            <div className="financial-item">
              <span className="label">Total Credit:</span>
              <span className="value credit">{formatCurrency(customerData.total_credit)}</span>
            </div>
            <div className="financial-item">
              <span className="label">Total Debit:</span>
              <span className="value debit">{formatCurrency(customerData.total_debit)}</span>
            </div>
          </div>
        </div>
        
        {/* Audit Details */}
        <div className="audit-details">
          <h4>Audit Details</h4>
          <div className="audit-grid">
            <div className="audit-item">
              <span className="label">Entered By:</span>
              <span className="value">{auditData.enteredBy}</span>
            </div>
            <div className="audit-item">
              <span className="label">Entered On:</span>
              <span className="value">
                {auditData.enteredOn ? new Date(auditData.enteredOn).toLocaleString() : 'N/A'}
              </span>
            </div>
            <div className="audit-item">
              <span className="label">Modified By:</span>
              <span className="value">{auditData.modifiedBy}</span>
            </div>
            <div className="audit-item">
              <span className="label">Modified On:</span>
              <span className="value">
                {auditData.modifiedOn ? new Date(auditData.modifiedOn).toLocaleString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderRecordsSection = () => (
    <div className="payment-section-container">
      <div className="section-header">
        <h3>Receipt Records</h3>
        <div className="section-actions">
          <button 
            name="back_to_form_button"
            className="btn-primary"
            onClick={() => setMode('form')}
          >
            New Receipt
          </button>
          <input
            name="records_search"
            type="text"
            placeholder="Search records..."
            className="form-input"
            style={{ width: '200px' }}
          />
          <button 
            name="export_button"
            className="btn-secondary"
          >
            Export
          </button>
          <button 
            className="btn-secondary"
            onClick={onBack}
          >
            Back to Menu
          </button>
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="records-container">
        {groupedPayments.length === 0 ? (
          <div className="no-records">
            <p>No receipt records found</p>
          </div>
        ) : (
          groupedPayments.map((group, index) => (
            <div key={index} className="customer-group">
              <div className="group-header">
                <h4>{group.customer_name}</h4>
                <div className="group-summary">
                  <span className="phone">{group.customer_phone}</span>
                  <span className="total-debit">Total Debit: {formatCurrency(group.total_debit)}</span>
                  <span className="total-credit">Total Credit: {formatCurrency(group.total_credit)}</span>
                </div>
              </div>
              
              <div className="records-table-container">
                <table className="records-table">
                  <thead>
                    <tr>
                      <th>Receipt No</th>
                      <th>Date</th>
                      <th>Account Name</th>
                      <th>Debit Amount</th>
                      <th>Credit Amount</th>
                      <th>Reference</th>
                      <th>Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.records.map((record, recordIndex) => (
                      <tr key={recordIndex}>
                        <td>{record.receipt_no}</td>
                        <td>{record.date}</td>
                        <td>{record.account_name}</td>
                        <td className="amount debit">
                          {record.debit_amount > 0 ? formatCurrency(record.debit_amount) : '-'}
                        </td>
                        <td className="amount credit">
                          {record.credit_amount > 0 ? formatCurrency(record.credit_amount) : '-'}
                        </td>
                        <td>{record.ref_number || 'N/A'}</td>
                        <td>
                          <span className={`type-badge ${record.type.toLowerCase()}`}>
                            {record.type}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="payment-form-page">
      {mode === 'form' && renderFormSection()}
      {mode === 'records' && renderRecordsSection()}
      
      {/* Save Confirmation Modal */}
      {(saveConfirmationOpen || globalSaveOpen) && (
        <SaveConfirmationModal
          onConfirm={handleSave}
          onCancel={() => {}}
          message="Save this receipt entry?"
        />
      )}
      
      <style>{`
        .payment-form-page {
          padding: 16px;
          max-width: 1200px;
          margin: 0 auto;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }
        
        .payment-section-container {
          background: white;
          border: 1px solid #ddd;
          border-radius: 6px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 2px solid #000080;
        }
        
        .section-header h3 {
          margin: 0;
          color: #000080;
          font-size: 18px;
          font-weight: 600;
        }
        
        .section-actions {
          display: flex;
          gap: 12px;
        }
        
        .btn-primary, .btn-secondary {
          padding: 8px 16px;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s ease;
        }
        
        .btn-primary {
          background: #000080;
          color: white;
          border-color: #000080;
        }
        
        .btn-primary:hover:not(:disabled) {
          background: #000066;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0,0,128,0.2);
        }
        
        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        
        .btn-secondary {
          background: white;
          color: #333;
          border-color: #ccc;
        }
        
        .btn-secondary:hover {
          background: #f8f9fa;
          border-color: #999;
        }
        
        .form-grid {
          display: grid;
          gap: 20px;
        }
        
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        
        .form-row .full-width {
          grid-column: 1 / -1;
        }
        
        .field-group {
          display: flex;
          flex-direction: column;
        }
        
        .field-group label {
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 6px;
          color: #333;
        }
        
        .form-input {
          padding: 10px 12px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 14px;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        
        .form-input:focus {
          outline: none;
          border-color: #000080;
          box-shadow: 0 0 0 3px rgba(0,0,128,0.1);
        }
        
        .form-input.readonly {
          background-color: #f8f9fa;
          cursor: not-allowed;
          color: #666;
        }
        
        .customer-search-container {
          position: relative;
        }
        
        .customer-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #ccc;
          border-radius: 4px;
          max-height: 250px;
          overflow-y: auto;
          z-index: 1000;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          margin-top: 2px;
        }
        
        .customer-option {
          padding: 12px 16px;
          cursor: pointer;
          border-bottom: 1px solid #eee;
          transition: background-color 0.1s ease;
        }
        
        .customer-option:hover {
          background: #f8f9fa;
        }
        
        .customer-option:last-child {
          border-bottom: none;
        }
        
        .customer-name {
          font-weight: 600;
          font-size: 14px;
          color: #333;
        }
        
        .customer-phone {
          font-size: 12px;
          color: #666;
          margin-top: 2px;
        }
        
        .customer-financials {
          background: #f8f9fa;
          padding: 16px;
          border-radius: 6px;
          border: 1px solid #e9ecef;
          margin-top: 12px;
        }
        
        .customer-financials h4 {
          margin: 0 0 16px 0;
          color: #333;
          font-size: 16px;
          font-weight: 600;
        }
        
        .financial-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        
        .financial-item {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          padding: 8px 12px;
          background: white;
          border-radius: 4px;
          border: 1px solid #dee2e6;
        }
        
        .financial-item .label {
          font-weight: 600;
          color: #495057;
        }
        
        .financial-item .value {
          font-weight: 700;
          color: #000080;
        }
        
        .financial-item .value.credit {
          color: #28a745;
        }
        
        .financial-item .value.debit {
          color: #dc3545;
        }
        
        .audit-details {
          background: #f8f9fa;
          padding: 16px;
          border-radius: 6px;
          border: 1px solid #e9ecef;
          margin-top: 12px;
        }
        
        .audit-details h4 {
          margin: 0 0 16px 0;
          color: #333;
          font-size: 16px;
          font-weight: 600;
        }
        
        .audit-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        
        .audit-item {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          padding: 8px 12px;
          background: white;
          border-radius: 4px;
          border: 1px solid #dee2e6;
        }
        
        .audit-item .label {
          font-weight: 600;
          color: #495057;
        }
        
        .audit-item .value {
          color: #666;
        }
        
        .records-container {
          margin-top: 20px;
        }
        
        .customer-group {
          margin-bottom: 28px;
          border: 1px solid #ddd;
          border-radius: 6px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .group-header {
          background: #000080;
          padding: 16px 20px;
          color: white;
        }
        
        .group-header h4 {
          margin: 0 0 10px 0;
          color: white;
          font-size: 18px;
          font-weight: 600;
        }
        
        .group-summary {
          display: flex;
          gap: 24px;
          font-size: 14px;
          color: #e9ecef;
        }
        
        .group-summary .phone {
          font-weight: 600;
          color: white;
        }
        
        .group-summary .total-debit {
          color: #ff6b6b;
          font-weight: 600;
        }
        
        .group-summary .total-credit {
          color: #51cf66;
          font-weight: 600;
        }
        
        .records-table-container {
          overflow-x: auto;
          background: white;
        }
        
        .records-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }
        
        .records-table th,
        .records-table td {
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }
        
        .records-table th {
          background: #f8f9fa;
          font-weight: 600;
          color: #495057;
          text-transform: uppercase;
          font-size: 12px;
          letter-spacing: 0.5px;
        }
        
        .records-table tbody tr:hover {
          background: #f8f9fa;
        }
        
        .records-table td.amount {
          font-weight: 700;
          font-size: 15px;
        }
        
        .records-table td.amount.debit {
          color: #dc3545;
        }
        
        .records-table td.amount.credit {
          color: #28a745;
        }
        
        .type-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .type-badge.debit {
          background: #f8d7da;
          color: #721c24;
        }
        
        .type-badge.credit {
          background: #d4edda;
          color: #155724;
        }
        
        .no-records {
          text-align: center;
          padding: 48px;
          color: #666;
          font-size: 16px;
        }
        
        .error-message {
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          color: #721c24;
          padding: 12px 16px;
          border-radius: 6px;
          margin-bottom: 20px;
          font-size: 14px;
          font-weight: 500;
        }
        
        .success-message {
          background: #d4edda;
          border: 1px solid #c3e6cb;
          color: #155724;
          padding: 12px 16px;
          border-radius: 6px;
          margin-bottom: 20px;
          font-size: 14px;
          font-weight: 500;
        }
        
        @media (max-width: 768px) {
          .payment-form-page {
            padding: 12px;
          }
          
          .form-row {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          
          .financial-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          
          .audit-grid {
            grid-template-columns: 1fr;
            gap: 8px;
          }
          
          .group-summary {
            flex-direction: column;
            gap: 8px;
          }
          
          .section-actions {
            flex-direction: column;
            gap: 8px;
          }
          
          .btn-primary, .btn-secondary {
            width: 100%;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
};

export default ReceiptForm;