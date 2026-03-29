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
    account_credit: '',
    amount: '',
    ref_number: '',
    narration: ''
  });

  const [mode, setMode] = useState('form'); 
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const {
    page,
    limit,
    pagination,
    setPage,
    setLimit
  } = usePagination(1, 50);

  const fieldOrder = useMemo(() => [
    'journal_no', 'date', 'account_debit', 'account_credit', 'amount', 'ref_number', 'narration', 'save_button'
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

  useEffect(() => {
    if (!formData.journal_no && mode === 'form') {
      const date = new Date();
      setFormData(prev => ({
        ...prev,
        journal_no: `JR${date.getTime().toString().slice(-8)}`
      }));
    }
  }, [mode]);

  const handleSave = async () => {
    if (!formData.account_debit || !formData.account_credit || !formData.amount) {
      setError('Required fields are missing');
      return;
    }
    setSuccess('Journal entry saved successfully');
    setTimeout(() => onBack(), 1500);
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
            <div className="erp-grid-container">
              <table className="erp-table">
                <thead>
                  <tr><th>Date</th><th>Journal No</th><th>Debit Acc</th><th>Credit Acc</th><th>Amount</th></tr>
                </thead>
                <tbody>
                  <tr><td colSpan="5" style={{ textAlign: 'center' }}>No records found</td></tr>
                </tbody>
              </table>
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
