// Journal Form Component - Adjustments and other entries
// Implements the ASCII wireframe layout as specified

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useKeyboardNavigation } from '../../contexts/KeyboardNavigationContext';
import useKeyboardNav from '../../hooks/useKeyboardNavigation';
import SaveConfirmationModal from '../common/SaveConfirmationModal';

const JournalForm = ({ onBack }) => {
  const [formData, setFormData] = useState({
    receipt_no: '',
    date: new Date().toISOString().split('T')[0],
    type: 'Journal',
    customer_name: 'Journal Entry',
    customer_id: 'JOURNAL001',
    customer_phone: '',
    account_name: '',
    amount: '',
    ref_number: '',
    created_by: 'USER001',
    created_at: new Date().toISOString(),
    modified_by: 'USER001',
    modified_at: new Date().toISOString()
  });

  // Customer-related data
  const [customerData, setCustomerData] = useState({
    balance: 0,
    total_credit: 0,
    total_debit: 0
  });

  // Payment Records State
  const [paymentRecords, setPaymentRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Mode state
  const [mode, setMode] = useState('form'); // 'form' or 'records'
  
  const [accounts] = useState([
    'Cash', 'Bank', 'Railway Charges', 'Service Charges', 
    'Customer Advance', 'Supplier Payment', 'Commission Income', 'Office Expenses',
    'Sales Account', 'Purchase Account', 'Expenses', 'Income'
  ]);

  // Define field order for keyboard navigation (memoized to prevent re-renders)
  const fieldOrder = useMemo(() => [
    'receipt_no',
    'date',
    'type',
    'debit_account',
    'credit_account',
    'amount',
    'ref_number',
    'save_button',
    'view_records_button'
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
    const prefix = 'JOU';
    setFormData(prev => ({
      ...prev,
      receipt_no: `${prefix}${year}${month}${day}${random}`
    }));
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      modified_at: new Date().toISOString()
    }));
    setError('');
  };

  async function handleSave() {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Validation
      if (!formData.account_name || !formData.amount) {
        setError('Account and amount are required');
        setLoading(false);
        return;
      }

      if (parseFloat(formData.amount) <= 0) {
        setError('Amount must be greater than zero');
        setLoading(false);
        return;
      }

      // Create new payment record
      const newRecord = {
        id: Date.now(),
        receipt_no: formData.receipt_no,
        date: formData.date,
        customer_name: 'Journal Entry',
        customer_phone: '',
        account_name: formData.account_name,
        amount: parseFloat(formData.amount),
        type: 'Journal',
        ref_number: formData.ref_number,
        debit_amount: parseFloat(formData.amount),
        credit_amount: parseFloat(formData.amount)
      };

      // Add to records immediately
      setPaymentRecords(prev => [newRecord, ...prev]);
      setSuccess('Journal entry saved successfully!');
      
      // Reset form
      setFormData({
        receipt_no: '',
        date: new Date().toISOString().split('T')[0],
        type: 'Journal',
        customer_name: 'Journal Entry',
        customer_id: 'JOURNAL001',
        customer_phone: '',
        account_name: '',
        amount: '',
        ref_number: '',
        created_by: 'USER001',
        created_at: new Date().toISOString(),
        modified_by: 'USER001',
        modified_at: new Date().toISOString()
      });
      
      generateReceiptNo();
      
    } catch (err) {
      setError(err.message || 'Failed to save journal entry');
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
        <h3>Journal Entry Form</h3>
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
            {loading ? 'Saving...' : 'Save Journal'}
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
        
        {/* Account Selection */}
        <div className="form-row">
          <div className="field-group">
            <label>Debit Account:</label>
            <select
              name="debit_account"
              value={formData.account_name}
              onChange={(e) => handleInputChange('account_name', e.target.value)}
              className="form-input"
            >
              <option value="">Select Debit Account</option>
              {accounts.map(account => (
                <option key={account} value={account}>{account}</option>
              ))}
            </select>
          </div>
          <div className="field-group">
            <label>Credit Account:</label>
            <select
              name="credit_account"
              className="form-input"
              disabled
            >
              <option value="">Auto-selected</option>
            </select>
          </div>
        </div>
        
        {/* Amount and Reference */}
        <div className="form-row">
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
          <div className="field-group">
            <label>Reference Number:</label>
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
        
        {/* Customer Info (Fixed for Journal) */}
        <div className="form-row">
          <div className="field-group full-width">
            <label>Customer:</label>
            <input
              type="text"
              value="Journal Entry"
              readOnly
              className="form-input readonly"
            />
          </div>
        </div>
        
        {/* Audit Details */}
        <div className="audit-details">
          <h4>Audit Details</h4>
          <div className="audit-grid">
            <div className="audit-item">
              <span className="label">Created By:</span>
              <span className="value">{formData.created_by}</span>
            </div>
            <div className="audit-item">
              <span className="label">Created At:</span>
              <span className="value">
                {new Date(formData.created_at).toLocaleString()}
              </span>
            </div>
            <div className="audit-item">
              <span className="label">Modified By:</span>
              <span className="value">{formData.modified_by}</span>
            </div>
            <div className="audit-item">
              <span className="label">Modified At:</span>
              <span className="value">
                {new Date(formData.modified_at).toLocaleString()}
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
        <h3>Journal Records</h3>
        <div className="section-actions">
          <button 
            name="back_to_form_button"
            className="btn-primary"
            onClick={() => setMode('form')}
          >
            New Journal
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
            <p>No journal records found</p>
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
                          <span className="type-badge journal">
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
          message="Save this journal entry?"
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
        
        .type-badge.journal {
          background: #cce5ff;
          color: #004085;
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

export default JournalForm;