import React, { useState, useEffect } from 'react';

/**
 * Contra Section Component
 * Handles contra entry records and operations
 */
const ContraSection = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('list'); // 'list', 'form', 'view'
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    entry_no: '',
    date: new Date().toISOString().split('T')[0],
    from_account: '',
    to_account: '',
    amount: '',
    narration: '',
    ref_number: ''
  });

  // Load contra records
  const loadRecords = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Simulate API call - would be actual fetch in real implementation
      const mockData = [
        {
          id: 1,
          entry_no: 'CT241201001',
          date: '2024-12-01',
          from_account: 'Cash Account',
          to_account: 'Bank Account',
          amount: 50000.00,
          narration: 'Cash transfer to bank',
          ref_number: 'REF001'
        },
        {
          id: 2,
          entry_no: 'CT241201002',
          date: '2024-12-01',
          from_account: 'Bank Account',
          to_account: 'Petty Cash',
          amount: 10000.00,
          narration: 'Withdrawal for petty cash',
          ref_number: 'REF002'
        }
      ];
      
      setRecords(mockData);
    } catch (err) {
      setError('Failed to load contra records');
    } finally {
      setLoading(false);
    }
  };

  // Generate auto-entry number
  useEffect(() => {
    const generateEntryNo = () => {
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `CT${year}${month}${day}${random}`;
    };
    
    if (!formData.entry_no && mode === 'form') {
      setFormData(prev => ({
        ...prev,
        entry_no: generateEntryNo()
      }));
    }
  }, [mode, formData.entry_no]);

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Save contra record
  const handleSave = async () => {
    setLoading(true);
    setError('');
    
    try {
      if (!formData.from_account || !formData.to_account || !formData.amount) {
        setError('From account, To account, and Amount are required');
        setLoading(false);
        return;
      }
      
      const newRecord = {
        id: records.length + 1,
        ...formData
      };
      
      setRecords(prev => [...prev, newRecord]);
      setMode('list');
      resetForm();
      
    } catch (err) {
      setError('Failed to save contra record');
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      entry_no: '',
      date: new Date().toISOString().split('T')[0],
      from_account: '',
      to_account: '',
      amount: '',
      narration: '',
      ref_number: ''
    });
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
    <div className="contra-form">
      <div className="form-header">
        <h3>Contra Entry Form</h3>
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
            <label>From Account:</label>
            <input
              type="text"
              value={formData.from_account}
              onChange={(e) => handleInputChange('from_account', e.target.value)}
              placeholder="Enter source account"
            />
          </div>
          
          <div className="form-group">
            <label>To Account:</label>
            <input
              type="text"
              value={formData.to_account}
              onChange={(e) => handleInputChange('to_account', e.target.value)}
              placeholder="Enter destination account"
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
            <label>Reference Number:</label>
            <input
              type="text"
              value={formData.ref_number}
              onChange={(e) => handleInputChange('ref_number', e.target.value)}
              placeholder="Enter reference number"
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group full-width">
            <label>Narration:</label>
            <textarea
              value={formData.narration}
              onChange={(e) => handleInputChange('narration', e.target.value)}
              placeholder="Enter narration/description"
              rows="3"
            />
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
    <div className="contra-list">
      <div className="list-header">
        <h3>Contra Entries</h3>
        <button 
          className="action-button new-button"
          onClick={() => setMode('form')}
        >
          New Contra Entry
        </button>
      </div>
      
      <div className="records-grid">
        <table className="records-table">
          <thead>
            <tr>
              <th>Entry No</th>
              <th>Date</th>
              <th>From Account</th>
              <th>To Account</th>
              <th>Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map(record => (
              <tr key={record.id}>
                <td>{record.entry_no}</td>
                <td>{record.date}</td>
                <td>{record.from_account}</td>
                <td>{record.to_account}</td>
                <td>{formatCurrency(record.amount)}</td>
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
    <div className="contra-view">
      <div className="view-header">
        <h3>Contra Entry Details</h3>
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
            <span className="label">From Account:</span>
            <span className="value">{selectedRecord.from_account}</span>
          </div>
          <div className="detail-row">
            <span className="label">To Account:</span>
            <span className="value">{selectedRecord.to_account}</span>
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
            <span className="label">Narration:</span>
            <span className="value">{selectedRecord.narration || 'N/A'}</span>
          </div>
        </div>
      )}
    </div>
  );

  // Main render
  return (
    <div className="contra-section">
      {error && (
        <div className="alert alert-error">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {mode === 'form' && renderForm()}
      {mode === 'list' && renderList()}
      {mode === 'view' && renderView()}
      
      <style jsx>{`
        .contra-section {
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
        .contra-form {
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
          margin: 0;
          color: #000080;
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
        
        .form-group.full-width {
          grid-column: 1 / -1;
        }
        
        .form-group label {
          font-size: 12px;
          font-weight: bold;
          margin-bottom: 4px;
          color: #333;
        }
        
        .form-group input,
        .form-group textarea {
          padding: 6px 8px;
          border: 1px solid #ccc;
          border-radius: 3px;
          font-size: 12px;
        }
        
        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #000080;
          box-shadow: 0 0 0 2px rgba(0,0,128,0.1);
        }
        
        .readonly-input {
          background-color: #f5f5f5;
          cursor: not-allowed;
        }
        
        .form-actions {
          display: flex;
          gap: 8px;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #eee;
        }
        
        /* List Styles */
        .contra-list {
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
        
        /* View Styles */
        .contra-view {
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
        }
      `}</style>
    </div>
  );
};

export default ContraSection;