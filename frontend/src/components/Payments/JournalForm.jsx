import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useKeyboardNavigation } from '../../contexts/KeyboardNavigationContext';
import { usePagination } from '../../hooks/usePagination';
import PaginationControls from '../common/PaginationControls';
import SaveConfirmationModal from '../common/SaveConfirmationModal';
import { paymentAPI } from '../../services/api'; // Or journalAPI if available
import '../../styles/vintage-erp-theme.css';

const JournalForm = ({ onBack }) => {
  const { user } = useAuth();
  const {
    registerForm,
    unregisterForm,
    setActiveForm,
    handleManualFocus
  } = useKeyboardNavigation();
  
  const [formData, setFormData] = useState({
    journal_no: '',
    date: new Date().toISOString().split('T')[0],
    debit_account: '',
    credit_account: '',
    amount: '',
    ref_number: '',
    narration: ''
  });

  const [journalRecords, setJournalRecords] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('form'); 
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  
  const {
    page,
    limit,
    pagination,
    updatePagination,
    setPage,
    setLimit
  } = usePagination(1, 50);

  const fieldOrder = useMemo(() => [
    'date', 
    'debit_account', 
    'credit_account', 
    'amount', 
    'ref_number', 
    'narration'
  ], []);

  useEffect(() => {
    if (mode === 'form') {
      registerForm('journal', fieldOrder);
      setActiveForm('journal');
      return () => unregisterForm('journal');
    }
  }, [mode, fieldOrder, registerForm, unregisterForm, setActiveForm]);

  const fetchJournals = useCallback(async () => {
    try {
      setLoading(true);
      // Assuming paymentAPI can handle journal or use specific API
      const response = await paymentAPI.getAllPayments({ page, limit, type: 'Journal' });
      setJournalRecords(response.data || []);
      updatePagination(response.pagination);
    } catch (err) {
      console.error('Error fetching journals:', err);
      setError('Failed to load journal history');
    } finally {
      setLoading(false);
    }
  }, [page, limit, updatePagination]);

  useEffect(() => {
    if (mode === 'records') {
        fetchJournals();
    }
  }, [mode, fetchJournals]);

  useEffect(() => {
    if (!formData.journal_no && mode === 'form') {
      const date = new Date();
      setFormData(prev => ({
        ...prev,
        journal_no: `JN${date.getTime().toString().slice(-8)}`
      }));
    }
  }, [mode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSave = async () => {
    if (!formData.debit_account || !formData.credit_account || !formData.amount) {
      setError('Required fields are missing (Debit Account, Credit Account, Amount)');
      return;
    }
    
    try {
        setLoading(true);
        setError('');
        
        const payload = {
            py_entry_type: 'Journal',
            py_bank_account: formData.debit_account, // Receiving account (Debit)
            py_from_account: formData.credit_account, // Giving account (Credit)
            py_amount: formData.amount,
            py_ref_number: formData.ref_number,
            py_narration: formData.narration || `Journal: ${formData.debit_account} / ${formData.credit_account}`
        };

        await paymentAPI.createPayment(payload);
        
        setSuccess('Journal entry saved successfully');
        setShowSaveModal(false);
        setTimeout(() => {
            setSuccess('');
            onBack();
        }, 1500);
    } catch (err) {
        console.error('Error saving journal:', err);
        setError(err.message || 'Failed to save journal entry');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="erp-page-container journal-form-view">
      <div className="layout-action-bar">
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="erp-button primary" onClick={() => setShowSaveModal(true)} disabled={loading}>
            {loading ? 'Saving...' : 'Save (F10)'}
          </button>
          <button className="erp-button" onClick={() => setMode(mode === 'form' ? 'records' : 'form')}>
            {mode === 'form' ? 'View Records' : 'Back to Form'}
          </button>
          <button className="erp-button" onClick={onBack}>Cancel (Esc)</button>
        </div>
        <div style={{ flex: 1 }}></div>
        <div className="erp-status-badge">JOURNAL | {mode.toUpperCase()}</div>
      </div>

      <div className="layout-content-wrapper" style={{ padding: '20px', overflowY: 'auto' }}>
        {mode === 'form' ? (
          <div className="erp-container" style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div className="erp-panel-header">JOURNAL VOUCHER ENTRY (ADJUSTMENT)</div>
            <div className="erp-form-content" style={{ padding: '24px', background: '#f5f5f5' }}>
              {error && <div className="erp-error-banner" style={{ marginBottom: '15px' }}>{error}</div>}
              {success && <div className="erp-success-banner" style={{ marginBottom: '15px' }}>{success}</div>}
              
              <div className="erp-form-row-compact-2">
                <div className="erp-form-group">
                  <label className="erp-form-label">Journal No.</label>
                  <input type="text" className="erp-input" value={formData.journal_no} readOnly tabIndex="-1" />
                </div>
                <div className="erp-form-group">
                  <label className="erp-form-label">Voucher Date</label>
                  <input 
                    type="date" 
                    name="date"
                    className="erp-input" 
                    value={formData.date} 
                    onChange={handleInputChange} 
                    onFocus={() => handleManualFocus('journal', 'date')}
                  />
                </div>
              </div>

              <div className="erp-form-row-compact-2" style={{ marginTop: '10px' }}>
                <div className="erp-form-group">
                  <label className="erp-form-label required">Debit Account (By)</label>
                  <input 
                    type="text" 
                    name="debit_account"
                    className="erp-input" 
                    value={formData.debit_account} 
                    onChange={handleInputChange} 
                    placeholder="Account to be Debited" 
                    onFocus={() => handleManualFocus('journal', 'debit_account')}
                  />
                </div>
                <div className="erp-form-group">
                  <label className="erp-form-label required">Credit Account (To)</label>
                  <input 
                    type="text" 
                    name="credit_account"
                    className="erp-input" 
                    value={formData.credit_account} 
                    onChange={handleInputChange} 
                    placeholder="Account to be Credited" 
                    onFocus={() => handleManualFocus('journal', 'credit_account')}
                  />
                </div>
              </div>

              <div className="erp-form-row-compact-2" style={{ marginTop: '10px' }}>
                <div className="erp-form-group">
                  <label className="erp-form-label required">Amount (₹)</label>
                  <input 
                    type="number" 
                    name="amount"
                    className="erp-input" 
                    value={formData.amount} 
                    onChange={handleInputChange} 
                    style={{ fontWeight: 'bold' }}
                    onFocus={() => handleManualFocus('journal', 'amount')}
                  />
                </div>
                <div className="erp-form-group">
                  <label className="erp-form-label">Ref Number</label>
                  <input 
                    type="text" 
                    name="ref_number"
                    className="erp-input" 
                    value={formData.ref_number} 
                    onChange={handleInputChange}
                    onFocus={() => handleManualFocus('journal', 'ref_number')}
                  />
                </div>
              </div>

              <div className="erp-form-group" style={{ marginTop: '15px' }}>
                <label className="erp-form-label" style={{ display: 'block', textAlign: 'left', marginBottom: '4px' }}>Journal Narration</label>
                <textarea 
                  name="narration"
                  className="erp-input" 
                  value={formData.narration} 
                  onChange={handleInputChange} 
                  rows="2" 
                  style={{ width: '100%', resize: 'none' }}
                  onFocus={() => handleManualFocus('journal', 'narration')}
                />
              </div>

              <div className="erp-panel-footer" style={{ marginTop: '20px', padding: '10px', background: '#eee', fontSize: '11px', color: '#666' }}>
                VOUCHER AUDIT: ENTERED BY {user?.us_name || 'ADMIN'} | {new Date().toLocaleString()}
              </div>
            </div>
          </div>
        ) : (
          <div className="erp-grid-section">
            <div className="erp-panel-header">JOURNAL VOUCHER HISTORY</div>
            <div className="erp-grid-container" style={{ minHeight: '400px' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>Loading history...</div>
              ) : (
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th style={{ width: '100px' }}>Date</th>
                      <th style={{ width: '120px' }}>Entry No</th>
                      <th>Debit Account</th>
                      <th>Credit Account</th>
                      <th className="text-right" style={{ width: '150px' }}>Amount (₹)</th>
                      <th>Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {journalRecords.length > 0 ? journalRecords.map((r, i) => (
                      <tr key={i}>
                        <td>{new Date(r.py_date || r.date || r.jr_date).toLocaleDateString()}</td>
                        <td className="font-bold">{r.py_entry_no || r.journal_no || r.jr_entry_no || r.entry_no}</td>
                        <td>{r.py_bank_account || r.debit_account || r.jr_debit_account}</td>
                        <td>{r.py_from_account || r.credit_account || r.jr_credit_account}</td>
                        <td className="text-right font-bold" style={{ color: '#555' }}>
                          ₹{parseFloat(r.py_amount || r.amount || r.jr_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td>{r.py_ref_number || r.ref_number || r.jr_ref_number}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>No historical records found</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
            <PaginationControls pagination={pagination} onPageChange={setPage} limit={limit} onLimitChange={setLimit} />
          </div>
        )}
      </div>
      
      {showSaveModal && (
        <SaveConfirmationModal 
          isOpen={true} 
          onConfirm={handleSave} 
          onCancel={() => setShowSaveModal(false)} 
        />
      )}
    </div>
  );
};

export default JournalForm;
