import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useKeyboardNavigation } from '../../contexts/KeyboardNavigationContext';
import useKeyboardNav from '../../hooks/useKeyboardNavigation';
import { usePagination } from '../../hooks/usePagination';
import PaginationControls from '../common/PaginationControls';
import SaveConfirmationModal from '../common/SaveConfirmationModal';
import '../../styles/vintage-erp-theme.css';

const JournalForm = ({ onBack }) => {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    journal_no: '',
    date: new Date().toISOString().split('T')[0],
    account_debit: '',
    debit_account: '',
    credit_account: '',
    amount: '',
    ref_number: '',
    narration: ''
  });

  const [journalRecords, setJournalRecords] = useState([]); // For history
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('form'); 
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const {
    page,
    limit,
    pagination,
    updatePagination,
    setPage,
    setLimit
  } = usePagination(1, 50);

  const fieldOrder = useMemo(() => [
    'entry_no', 'date', 'debit_account', 'credit_account', 'amount', 'ref_number', 'save_button'
  ], []);

  const {
    formRef,
    saveConfirmationOpen,
    handleKeyDown
  } = useKeyboardNav({
    fieldOrder,
    autoFocus: true,
    onSave: () => handleSave(),
    onCancel: onBack
  });

  const fetchJournals = useCallback(async () => {
    try {
      setLoading(true);
      const response = await journalAPI.getAllJournals({ page, limit });
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
    if (!formData.entry_no && mode === 'form') {
      const date = new Date();
      setFormData(prev => ({
        ...prev,
        entry_no: `JN${date.getTime().toString().slice(-8)}`
      }));
    }
  }, [mode]);

  const handleSave = async () => {
    if (!formData.debit_account || !formData.credit_account || !formData.amount) {
      setError('Required fields are missing (Debit Account, Credit Account, Amount)');
      return;
    }
    
    try {
        setLoading(true);
        setError('');
        
        const payload = {
            jr_debit_account: formData.debit_account,
            jr_credit_account: formData.credit_account,
            jr_amount: formData.amount,
            jr_ref_number: formData.ref_number,
            jr_narration: formData.narration || `Journal: ${formData.debit_account} / ${formData.credit_account}`
        };

        await journalAPI.createJournal(payload);
        
        setSuccess('Journal entry saved successfully');
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
          <button className="erp-button primary" onClick={handleSave}>Save (F10)</button>
          <button className="erp-button" onClick={() => setMode(mode === 'form' ? 'records' : 'form')}>
            {mode === 'form' ? 'View Records' : 'Back to Form'}
          </button>
          <button className="erp-button" onClick={onBack}>Cancel (Esc)</button>
        </div>
        <div style={{ flex: 1 }}></div>
        <div className="erp-status-badge">JOURNAL | {mode.toUpperCase()}</div>
      </div>

      <div className="layout-content-wrapper" style={{ padding: '20px' }}>
        {mode === 'form' ? (
          <div className="erp-container" style={{ maxWidth: '800px', margin: '0 auto' }} ref={formRef} onKeyDown={handleKeyDown}>
            <div className="erp-panel-header">JOURNAL VOUCHER DETAILS</div>
            <div className="erp-form-content" style={{ padding: '20px' }}>
              {error && <div className="erp-error-banner">{error}</div>}
              {success && <div className="erp-success-banner">{success}</div>}
              
              <div className="erp-form-row-compact-2">
                <div className="erp-form-group">
                  <label className="erp-form-label">Journal No</label>
                  <input type="text" className="erp-input" value={formData.journal_no} readOnly />
                </div>
                <div className="erp-form-group">
                  <label className="erp-form-label">Date</label>
                  <input type="date" className="erp-input" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
                </div>
              </div>

              <div className="erp-form-row-compact-2" style={{ marginTop: '15px' }}>
                <div className="erp-form-group">
                  <label className="erp-form-label required">Account (Debit)</label>
                  <input type="text" className="erp-input" value={formData.account_debit} onChange={(e) => setFormData({...formData, account_debit: e.target.value})} placeholder="Expense/Asset Account" />
                </div>
                <div className="erp-form-group">
                  <label className="erp-form-label required">Account (Credit)</label>
                  <input type="text" className="erp-input" value={formData.account_credit} onChange={(e) => setFormData({...formData, account_credit: e.target.value})} placeholder="Income/Liability Account" />
                </div>
              </div>

              <div className="erp-form-row-compact-2" style={{ marginTop: '15px' }}>
                <div className="erp-form-group">
                  <label className="erp-form-label required">Amount (₹)</label>
                  <input type="number" className="erp-input" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} />
                </div>
                <div className="erp-form-group">
                  <label className="erp-form-label">Ref Number</label>
                  <input type="text" className="erp-input" value={formData.ref_number} onChange={(e) => setFormData({...formData, ref_number: e.target.value})} />
                </div>
              </div>

              <div className="erp-form-group" style={{ marginTop: '15px' }}>
                <label className="erp-form-label">Narration</label>
                <textarea className="erp-input" value={formData.narration} onChange={(e) => setFormData({...formData, narration: e.target.value})} rows="2" />
              </div>
            </div>
          </div>
        ) : (
          <div className="erp-grid-section">
            <div className="erp-panel-header">JOURNAL HISTORY</div>
            <div className="erp-grid-container" style={{ minHeight: '300px' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>Loading history...</div>
              ) : (
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Entry No</th>
                      <th>Debit Account</th>
                      <th>Credit Account</th>
                      <th className="text-right">Amount</th>
                      <th>Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {journalRecords.length > 0 ? journalRecords.map((r, i) => (
                      <tr key={i}>
                        <td>{new Date(r.jr_date || r.date).toLocaleDateString()}</td>
                        <td className="font-bold">{r.jr_entry_no || r.entry_no}</td>
                        <td>{r.jr_debit_account || r.debit_account}</td>
                        <td>{r.jr_credit_account || r.credit_account}</td>
                        <td className="text-right font-bold">₹{parseFloat(r.jr_amount || r.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td>{r.jr_ref_number || r.ref_number}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan="6" style={{ textAlign: 'center' }}>No historical records found</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
            <PaginationControls pagination={pagination} onPageChange={setPage} limit={limit} onLimitChange={setLimit} />
          </div>
        )}
      </div>
      
      {saveConfirmationOpen && (
        <SaveConfirmationModal isOpen={true} onConfirm={handleSave} onCancel={() => {}} />
      )}
    </div>
  );
};

export default JournalForm;
