import React, { useState, useEffect } from 'react';

/**
 * Journal Entry Section Component
 * Handles journal entry records and operations
 */
const JournalSection = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('list');
  const [selectedRecord, setSelectedRecord] = useState(null);

  const [formData, setFormData] = useState({
    entry_no: '',
    date: new Date().toISOString().split('T')[0],
    account: '',
    entry_type: 'Debit',
    amount: '',
    narration: '',
    ref_number: '',
    voucher_type: 'Journal'
  });

  // Generate auto-entry number
  useEffect(() => {
    const generateEntryNo = () => {
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `JE${year}${month}${day}${random}`;
    };
    
    if (!formData.entry_no && mode === 'form') {
      setFormData(prev => ({
        ...prev,
        entry_no: generateEntryNo()
      }));
    }
  }, [mode, formData.entry_no]);

  // Load journal records
  const loadRecords = async () => {
    setLoading(true);
    setError('');
    
    try {
      const mockData = [
        {
          id: 1,
          entry_no: 'JE241201001',
          date: '2024-12-01',
          account: 'Office Expenses',
          entry_type: 'Debit',
          amount: 5000.00,
          narration: 'Office supplies purchase',
          ref_number: 'REF001',
          voucher_type: 'Journal'
        }
      ];
      
      setRecords(mockData);
    } catch (err) {
      setError('Failed to load journal entries');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    
    try {
      if (!formData.account || !formData.amount) {
        setError('Account and amount are required');
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
      setError('Failed to save journal entry');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      entry_no: '',
      date: new Date().toISOString().split('T')[0],
      account: '',
      entry_type: 'Debit',
      amount: '',
      narration: '',
      ref_number: '',
      voucher_type: 'Journal'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const renderForm = () => (
    <div className="journal-form">
      <div className="form-header">
        <h3>Journal Entry Form</h3>
      </div>
      
      <div className="form-grid">
        <div className="form-row">
          <div className="form-group">
            <label>Entry No:</label>
            <input type="text" value={formData.entry_no} readOnly className="readonly-input" />
          </div>
          <div className="form-group">
            <label>Date:</label>
            <input type="date" value={formData.date} readOnly className="readonly-input" />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Account:</label>
            <input
              type="text"
              value={formData.account}
              onChange={(e) => handleInputChange('account', e.target.value)}
              placeholder="Enter account name"
            />
          </div>
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
            <label>Voucher Type:</label>
            <select
              value={formData.voucher_type}
              onChange={(e) => handleInputChange('voucher_type', e.target.value)}
            >
              <option value="Cash">Cash</option>
              <option value="Bank">Bank</option>
              <option value="Contra">Contra</option>
              <option value="Purchase">Purchase</option>
              <option value="Sales">Sales</option>
              <option value="Journal">Journal</option>
            </select>
          </div>
        </div>
        
        <div className="form-row">
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
              placeholder="Enter narration"
              rows="3"
            />
          </div>
        </div>
      </div>
      
      <div className="form-actions">
        <button className="action-button save-button" onClick={handleSave} disabled={loading}>
          {loading ? 'Saving...' : 'Save'}
        </button>
        <button className="action-button cancel-button" onClick={() => setMode('list')}>
          Cancel
        </button>
      </div>
    </div>
  );

  const renderList = () => (
    <div className="journal-list">
      <div className="list-header">
        <h3>Journal Entries</h3>
        <button className="action-button new-button" onClick={() => setMode('form')}>
          New Journal Entry
        </button>
      </div>
      
      <div className="records-grid">
        <table className="records-table">
          <thead>
            <tr>
              <th>Entry No</th>
              <th>Date</th>
              <th>Account</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Voucher</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map(record => (
              <tr key={record.id}>
                <td>{record.entry_no}</td>
                <td>{record.date}</td>
                <td>{record.account}</td>
                <td>
                  <span className={`type-badge ${record.entry_type.toLowerCase()}`}>
                    {record.entry_type}
                  </span>
                </td>
                <td>{formatCurrency(record.amount)}</td>
                <td>
                  <span className="voucher-badge">{record.voucher_type}</span>
                </td>
                <td>
                  <button className="action-button view-button" onClick={() => { setSelectedRecord(record); setMode('view'); }}>
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

  const renderView = () => (
    <div className="journal-view">
      <div className="view-header">
        <h3>Journal Entry Details</h3>
        <button className="action-button back-button" onClick={() => setMode('list')}>
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
            <span className="label">Account:</span>
            <span className="value">{selectedRecord.account}</span>
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
            <span className="label">Amount:</span>
            <span className="value amount">{formatCurrency(selectedRecord.amount)}</span>
          </div>
          <div className="detail-row">
            <span className="label">Voucher Type:</span>
            <span className="value">
              <span className="voucher-badge">{selectedRecord.voucher_type}</span>
            </span>
          </div>
          <div className="detail-row">
            <span className="label">Reference:</span>
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

  return (
    <div className="journal-section">
      {error && <div className="alert alert-error"><strong>Error:</strong> {error}</div>}
      
      {mode === 'form' && renderForm()}
      {mode === 'list' && renderList()}
      {mode === 'view' && renderView()}
      
      <style jsx>{`
        .journal-section { padding: 16px; }
        .alert-error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 8px 12px; border-radius: 4px; margin-bottom: 16px; }
        
        /* Form Styles */
        .journal-form { background: white; border: 1px solid #ddd; border-radius: 4px; padding: 16px; }
        .form-header { margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid #eee; }
        .form-header h3 { margin: 0; color: #000080; }
        .form-grid { display: grid; gap: 16px; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .form-group { display: flex; flex-direction: column; }
        .form-group.full-width { grid-column: 1 / -1; }
        .form-group label { font-size: 12px; font-weight: bold; margin-bottom: 4px; color: #333; }
        .form-group input, .form-group select, .form-group textarea { padding: 6px 8px; border: 1px solid #ccc; border-radius: 3px; font-size: 12px; }
        .form-group input:focus, .form-group select:focus, .form-group textarea:focus { outline: none; border-color: #000080; box-shadow: 0 0 0 2px rgba(0,0,128,0.1); }
        .readonly-input { background-color: #f5f5f5; cursor: not-allowed; }
        .form-actions { display: flex; gap: 8px; margin-top: 16px; padding-top: 16px; border-top: 1px solid #eee; }
        
        /* List Styles */
        .journal-list { background: white; border: 1px solid #ddd; border-radius: 4px; padding: 16px; }
        .list-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid #eee; }
        .list-header h3 { margin: 0; color: #000080; }
        .records-grid { overflow-x: auto; }
        .records-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .records-table th, .records-table td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #ddd; }
        .records-table th { background: #f8f9fa; font-weight: bold; color: #333; }
        .records-table tr:hover { background: #f8f9fa; }
        .type-badge { padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: bold; }
        .type-badge.debit { background: #f8d7da; color: #721c24; }
        .type-badge.credit { background: #d4edda; color: #155724; }
        .voucher-badge { padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: bold; background: #e9ecef; color: #495057; }
        
        /* View Styles */
        .journal-view { background: white; border: 1px solid #ddd; border-radius: 4px; padding: 16px; }
        .view-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid #eee; }
        .view-header h3 { margin: 0; color: #000080; }
        .record-details { display: grid; gap: 12px; }
        .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
        .detail-row:last-child { border-bottom: none; }
        .label { font-weight: bold; color: #333; min-width: 120px; }
        .value { color: #666; }
        .value.amount { font-weight: bold; color: #000080; font-size: 14px; }
        
        /* Action Buttons */
        .action-button { padding: 4px 12px; border: 1px solid #ddd; background: white; cursor: pointer; font-size: 11px; border-radius: 3px; margin-right: 4px; }
        .action-button:hover { background: #f8f9fa; }
        .save-button { background: #000080; color: white; border-color: #000080; }
        .save-button:hover:not(:disabled) { background: #000066; }
        .save-button:disabled { opacity: 0.5; cursor: not-allowed; }
        .new-button { background: #28a745; color: white; border-color: #28a745; }
        .new-button:hover { background: #218838; }
        .view-button { background: #17a2b8; color: white; border-color: #17a2b8; }
        .view-button:hover { background: #138496; }
        .edit-button { background: #ffc107; color: #212529; border-color: #ffc107; }
        .edit-button:hover { background: #e0a800; }
        .delete-button { background: #dc3545; color: white; border-color: #dc3545; }
        .delete-button:hover { background: #c82333; }
        .export-button { background: #6f42c1; color: white; border-color: #6f42c1; }
        .export-button:hover { background: #5a32a3; }
        .back-button { background: #6c757d; color: white; border-color: #6c757d; }
        .back-button:hover { background: #5a6268; }
        .cancel-button { background: #6c757d; color: white; border-color: #6c757d; }
        .cancel-button:hover { background: #5a6268; }
        
        @media (max-width: 768px) {
          .form-row { grid-template-columns: 1fr; }
          .records-table { font-size: 11px; }
          .records-table th, .records-table td { padding: 6px 8px; }
        }
      `}</style>
    </div>
  );
};

export default JournalSection;