import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';

/**
 * Payment Section Component
 * Implements payment form with all required fields and calculations
 */
const PaymentSection = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    entry_no: '',
    date: new Date().toISOString().split('T')[0],
    entry_type: 'Debit',
    customer_name: '',
    customer_phone: '',
    amount: '',
    ref_number: '',
    bank_account: '',
    balance: 0,
    total_credit: 0,
    total_debit: 0
  });
  
  const [lastEntry, setLastEntry] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('list'); // 'list', 'form', 'view'
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Generate auto-entry number
  useEffect(() => {
    const generateEntryNo = () => {
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `PY${year}${month}${day}${random}`;
    };
    
    if (!formData.entry_no && mode === 'form') {
      setFormData(prev => ({
        ...prev,
        entry_no: generateEntryNo()
      }));
    }
  }, [mode, formData.entry_no]);

  // Calculate totals based on entry type
  useEffect(() => {
    const calculateTotals = () => {
      const amount = parseFloat(formData.amount) || 0;
      let totalDebit = 0;
      let totalCredit = 0;
      let balance = 0;

      if (formData.entry_type === 'Debit') {
        totalDebit = amount;
        balance = totalDebit - totalCredit;
      } else {
        totalCredit = amount;
        balance = totalCredit - totalDebit;
      }

      setFormData(prev => ({
        ...prev,
        total_debit: totalDebit,
        total_credit: totalCredit,
        balance: balance
      }));
    };

    calculateTotals();
  }, [formData.amount, formData.entry_type]);

  // Simulate last entry data (would come from API)
  useEffect(() => {
    // In a real implementation, this would fetch from the API
    setLastEntry({
      entry_no: 'PY241201001',
      date: '2024-12-01',
      customer_name: 'John Smith',
      amount: 15000.00,
      entry_type: 'Debit'
    });
  }, []);

  // Load payment records
  const loadRecords = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Simulate API call - would be actual fetch in real implementation
      const mockData = [
        {
          id: 1,
          entry_no: 'PY241201001',
          date: '2024-12-01',
          customer_name: 'John Smith',
          customer_phone: '9876543210',
          amount: 15000.00,
          entry_type: 'Debit',
          ref_number: 'REF001',
          bank_account: 'State Bank'
        },
        {
          id: 2,
          entry_no: 'PY241201002',
          date: '2024-12-01',
          customer_name: 'ABC Travels',
          customer_phone: '9876543211',
          amount: 25000.00,
          entry_type: 'Credit',
          ref_number: 'REF002',
          bank_account: 'ICICI Bank'
        }
      ];
      
      setRecords(mockData);
    } catch (err) {
      setError('Failed to load payment records');
    } finally {
      setLoading(false);
    }
  };

  // Save payment record
  const handleSave = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Validate required fields
      if (!formData.customer_name || !formData.amount) {
        setError('Customer name and amount are required');
        setLoading(false);
        return;
      }
      
      // In a real implementation, this would save to the API
      const newRecord = {
        id: records.length + 1,
        ...formData
      };
      
      setRecords(prev => [...prev, newRecord]);
      setMode('list');
      resetForm();
      
    } catch (err) {
      setError('Failed to save payment record');
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      entry_no: '',
      date: new Date().toISOString().split('T')[0],
      entry_type: 'Debit',
      customer_name: '',
      customer_phone: '',
      amount: '',
      ref_number: '',
      bank_account: '',
      balance: 0,
      total_credit: 0,
      total_debit: 0
    });
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  // Render form view
  const renderForm = () => (
    <div className="payment-form">
      <div className="form-header">
        <h3>Payment Entry Form</h3>
        <div className="last-entry">
          <strong>Last Entry:</strong> {lastEntry?.entry_no} ({lastEntry?.date}) - {lastEntry?.customer_name}
        </div>
      </div>
      
      <div className="form-grid">
        <div className="form-row">
          <div className="form-group">
            <label>Entry No:</label>
            <input
              type="text"
              value={formData.entry_no}
              readOnly
              className="readonly-input"
            />
          </div>
          
          <div className="form-group">
            <label>Date:</label>
            <input
              type="date"
              value={formData.date}
              readOnly
              className="readonly-input"
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Entry Type:</label>
            <select
              value={formData.entry_type}
              onChange={(e) => handleInputChange('entry_type', e.target.value)}
            >
              <option value="Debit">Debit</option>
              <option value="Credit">Credit</option>
            </select>
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Customer Name:</label>
            <input
              type="text"
              value={formData.customer_name}
              onChange={(e) => handleInputChange('customer_name', e.target.value)}
              placeholder="Enter customer name"
            />
          </div>
          
          <div className="form-group">
            <label>Customer Phone:</label>
            <input
              type="tel"
              value={formData.customer_phone}
              onChange={(e) => handleInputChange('customer_phone', e.target.value)}
              placeholder="Enter phone number"
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Amount:</label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              placeholder="Enter amount"
              step="0.01"
            />
          </div>
          
          <div className="form-group">
            <label>Ref. Number:</label>
            <input
              type="text"
              value={formData.ref_number}
              onChange={(e) => handleInputChange('ref_number', e.target.value)}
              placeholder="Enter reference number"
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Bank Account:</label>
            <input
              type="text"
              value={formData.bank_account}
              onChange={(e) => handleInputChange('bank_account', e.target.value)}
              placeholder="Enter bank account name"
            />
          </div>
        </div>
        
        <div className="calculation-section">
          <div className="calc-row">
            <span>Balance:</span>
            <span className="amount">{formatCurrency(formData.balance)}</span>
          </div>
          <div className="calc-row">
            <span>Total Credit:</span>
            <span className="amount credit">{formatCurrency(formData.total_credit)}</span>
          </div>
          <div className="calc-row">
            <span>Total Debit:</span>
            <span className="amount debit">{formatCurrency(formData.total_debit)}</span>
          </div>
        </div>
      </div>
      
      <div className="form-actions">
        <button 
          className="action-button save-button"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
        <button 
          className="action-button cancel-button"
          onClick={() => setMode('list')}
        >
          Cancel
        </button>
      </div>
    </div>
  );

  // Render list view
  const renderList = () => (
    <div className="payment-list">
      <div className="list-header">
        <h3>Payment Records</h3>
        <button 
          className="action-button new-button"
          onClick={() => setMode('form')}
        >
          New Payment
        </button>
      </div>
      
      <div className="records-grid">
        <table className="records-table">
          <thead>
            <tr>
              <th>Entry No</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Phone</th>
              <th>Amount</th>
              <th>Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map(record => (
              <tr key={record.id}>
                <td>{record.entry_no}</td>
                <td>{record.date}</td>
                <td>{record.customer_name}</td>
                <td>{record.customer_phone}</td>
                <td>{formatCurrency(record.amount)}</td>
                <td>
                  <span className={`type-badge ${record.entry_type.toLowerCase()}`}>
                    {record.entry_type}
                  </span>
                </td>
                <td>
                  <button 
                    className="action-button view-button"
                    onClick={() => {
                      setSelectedRecord(record);
                      setMode('view');
                    }}
                  >
                    View
                  </button>
                  <button className="action-button edit-button">Edit</button>
                  <button className="action-button delete-button">Delete</button>
                  <button className="action-button export-button">Export</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Render view mode
  const renderView = () => (
    <div className="payment-view">
      <div className="view-header">
        <h3>Payment Record Details</h3>
        <button 
          className="action-button back-button"
          onClick={() => setMode('list')}
        >
          Back to List
        </button>
      </div>
      
      {selectedRecord && (
        <div className="record-details">
          <div className="detail-row">
            <span className="label">Entry No:</span>
            <span className="value">{selectedRecord.entry_no}</span>
          </div>
          <div className="detail-row">
            <span className="label">Date:</span>
            <span className="value">{selectedRecord.date}</span>
          </div>
          <div className="detail-row">
            <span className="label">Entry Type:</span>
            <span className="value">
              <span className={`type-badge ${selectedRecord.entry_type.toLowerCase()}`}>
                {selectedRecord.entry_type}
              </span>
            </span>
          </div>
          <div className="detail-row">
            <span className="label">Customer Name:</span>
            <span className="value">{selectedRecord.customer_name}</span>
          </div>
          <div className="detail-row">
            <span className="label">Customer Phone:</span>
            <span className="value">{selectedRecord.customer_phone}</span>
          </div>
          <div className="detail-row">
            <span className="label">Amount:</span>
            <span className="value amount">{formatCurrency(selectedRecord.amount)}</span>
          </div>
          <div className="detail-row">
            <span className="label">Reference Number:</span>
            <span className="value">{selectedRecord.ref_number || 'N/A'}</span>
          </div>
          <div className="detail-row">
            <span className="label">Bank Account:</span>
            <span className="value">{selectedRecord.bank_account || 'N/A'}</span>
          </div>
        </div>
      )}
    </div>
  );

  // Main render
  return (
    <div className="payment-section">
      {error && (
        <div className="alert alert-error">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {mode === 'form' && renderForm()}
      {mode === 'list' && renderList()}
      {mode === 'view' && renderView()}
      
      <style jsx>{`
        .payment-section {
          padding: 16px;
        }
        
        .alert-error {
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          color: #721c24;
          padding: 8px 12px;
          border-radius: 4px;
          margin-bottom: 16px;
        }
        
        /* Form Styles */
        .payment-form {
          background: white;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 16px;
        }
        
        .form-header {
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 1px solid #eee;
        }
        
        .form-header h3 {
          margin: 0 0 8px 0;
          color: #000080;
        }
        
        .last-entry {
          font-size: 12px;
          color: #666;
        }
        
        .form-grid {
          display: grid;
          gap: 16px;
        }
        
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
        }
        
        .form-group label {
          font-size: 12px;
          font-weight: bold;
          margin-bottom: 4px;
          color: #333;
        }
        
        .form-group input,
        .form-group select {
          padding: 6px 8px;
          border: 1px solid #ccc;
          border-radius: 3px;
          font-size: 12px;
        }
        
        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: #000080;
          box-shadow: 0 0 0 2px rgba(0,0,128,0.1);
        }
        
        .readonly-input {
          background-color: #f5f5f5;
          cursor: not-allowed;
        }
        
        .calculation-section {
          background: #f8f9fa;
          padding: 12px;
          border-radius: 4px;
          border: 1px solid #e9ecef;
          margin-top: 8px;
        }
        
        .calc-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 12px;
        }
        
        .calc-row:last-child {
          margin-bottom: 0;
        }
        
        .amount {
          font-weight: bold;
          color: #000080;
        }
        
        .credit {
          color: #28a745;
        }
        
        .debit {
          color: #dc3545;
        }
        
        .form-actions {
          display: flex;
          gap: 8px;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #eee;
        }
        
        /* List Styles */
        .payment-list {
          background: white;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 16px;
        }
        
        .list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 1px solid #eee;
        }
        
        .list-header h3 {
          margin: 0;
          color: #000080;
        }
        
        .records-grid {
          overflow-x: auto;
        }
        
        .records-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }
        
        .records-table th,
        .records-table td {
          padding: 8px 12px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        
        .records-table th {
          background: #f8f9fa;
          font-weight: bold;
          color: #333;
        }
        
        .records-table tr:hover {
          background: #f8f9fa;
        }
        
        .type-badge {
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: bold;
        }
        
        .type-badge.debit {
          background: #f8d7da;
          color: #721c24;
        }
        
        .type-badge.credit {
          background: #d4edda;
          color: #155724;
        }
        
        /* View Styles */
        .payment-view {
          background: white;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 16px;
        }
        
        .view-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 1px solid #eee;
        }
        
        .view-header h3 {
          margin: 0;
          color: #000080;
        }
        
        .record-details {
          display: grid;
          gap: 12px;
        }
        
        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #f0f0f0;
        }
        
        .detail-row:last-child {
          border-bottom: none;
        }
        
        .label {
          font-weight: bold;
          color: #333;
          min-width: 120px;
        }
        
        .value {
          color: #666;
        }
        
        .value.amount {
          font-weight: bold;
          color: #000080;
          font-size: 14px;
        }
        
        /* Action Buttons */
        .action-button {
          padding: 4px 12px;
          border: 1px solid #ddd;
          background: white;
          cursor: pointer;
          font-size: 11px;
          border-radius: 3px;
          margin-right: 4px;
        }
        
        .action-button:hover {
          background: #f8f9fa;
        }
        
        .save-button {
          background: #000080;
          color: white;
          border-color: #000080;
        }
        
        .save-button:hover:not(:disabled) {
          background: #000066;
        }
        
        .save-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .new-button {
          background: #28a745;
          color: white;
          border-color: #28a745;
        }
        
        .new-button:hover {
          background: #218838;
        }
        
        .view-button {
          background: #17a2b8;
          color: white;
          border-color: #17a2b8;
        }
        
        .view-button:hover {
          background: #138496;
        }
        
        .edit-button {
          background: #ffc107;
          color: #212529;
          border-color: #ffc107;
        }
        
        .edit-button:hover {
          background: #e0a800;
        }
        
        .delete-button {
          background: #dc3545;
          color: white;
          border-color: #dc3545;
        }
        
        .delete-button:hover {
          background: #c82333;
        }
        
        .export-button {
          background: #6f42c1;
          color: white;
          border-color: #6f42c1;
        }
        
        .export-button:hover {
          background: #5a32a3;
        }
        
        .back-button {
          background: #6c757d;
          color: white;
          border-color: #6c757d;
        }
        
        .back-button:hover {
          background: #5a6268;
        }
        
        .cancel-button {
          background: #6c757d;
          color: white;
          border-color: #6c757d;
        }
        
        .cancel-button:hover {
          background: #5a6268;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
          .form-row {
            grid-template-columns: 1fr;
          }
          
          .records-table {
            font-size: 11px;
          }
          
          .records-table th,
          .records-table td {
            padding: 6px 8px;
          }
        }
      `}</style>
    </div>
  );
};

export default PaymentSection;