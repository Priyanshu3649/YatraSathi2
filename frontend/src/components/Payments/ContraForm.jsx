import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useKeyboardNavigation } from '../../contexts/KeyboardNavigationContext';
import useKeyboardNav from '../../hooks/useKeyboardNavigation';
import { usePagination } from '../../hooks/usePagination';
import PaginationControls from '../common/PaginationControls';
import SaveConfirmationModal from '../common/SaveConfirmationModal';
import '../../styles/vintage-erp-theme.css';

const ContraForm = ({ onBack }) => {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    contra_no: '',
    date: new Date().toISOString().split('T')[0],
    from_account: '',
    to_account: '',
    amount: '',
    ref_number: '',
    narration: ''
  });

  const [paymentRecords, setPaymentRecords] = useState([]); // For history
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
    'entry_no', 'date', 'from_account', 'to_account', 'amount', 'ref_number', 'save_button'
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

  const fetchContras = useCallback(async () => {
    try {
      setLoading(true);
      const response = await contraAPI.getAllContras({ page, limit });
      setPaymentRecords(response.data || []);
      updatePagination(response.pagination);
    } catch (err) {
      console.error('Error fetching contras:', err);
      setError('Failed to load contra history');
    } finally {
      setLoading(false);
    }
  }, [page, limit, updatePagination]);

  useEffect(() => {
    if (mode === 'records') {
        fetchContras();
    }
  }, [mode, fetchContras]);

  useEffect(() => {
    if (!formData.entry_no && mode === 'form') {
      const date = new Date();
      setFormData(prev => ({
        ...prev,
        entry_no: `CT${date.getTime().toString().slice(-8)}`
      }));
    }
  }, [mode]);

  const handleSave = async () => {
    if (!formData.from_account || !formData.to_account || !formData.amount) {
      setError('Required fields are missing (From Account, To Account, Amount)');
      return;
    }
    
    try {
        setLoading(true);
        setError('');
        
        const payload = {
            ct_from_account: formData.from_account,
            ct_to_account: formData.to_account,
            ct_amount: formData.amount,
            ct_ref_number: formData.ref_number,
            ct_narration: formData.narration || `Contra: ${formData.from_account} to ${formData.to_account}`
        };

        await contraAPI.createContra(payload);
        
        setSuccess('Contra entry saved successfully');
        setTimeout(() => {
            setSuccess('');
            onBack();
        }, 1500);
    } catch (err) {
        console.error('Error saving contra:', err);
        setError(err.message || 'Failed to save contra entry');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="erp-page-container contra-form-view">
      <div className="layout-action-bar">
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="erp-button primary" onClick={handleSave}>Save (F10)</button>
          <button className="erp-button" onClick={() => setMode(mode === 'form' ? 'records' : 'form')}>
            {mode === 'form' ? 'View Records' : 'Back to Form'}
          </button>
          <button className="erp-button" onClick={onBack}>Cancel (Esc)</button>
        </div>
        <div style={{ flex: 1 }}></div>
        <div className="erp-status-badge">CONTRA | {mode.toUpperCase()}</div>
      </div>

      <div className="layout-content-wrapper" style={{ padding: '20px' }}>
        {mode === 'form' ? (
          <div className="erp-container" style={{ maxWidth: '800px', margin: '0 auto' }} ref={formRef} onKeyDown={handleKeyDown}>
            <div className="erp-panel-header">CONTRA VOUCHER DETAILS</div>
            <div className="erp-form-content" style={{ padding: '20px' }}>
              {error && <div className="erp-error-banner">{error}</div>}
              {success && <div className="erp-success-banner">{success}</div>}
              
              <div className="erp-form-row-compact-2">
                <div className="erp-form-group">
                  <label className="erp-form-label">Contra No</label>
                  <input type="text" className="erp-input" value={formData.contra_no} readOnly />
                </div>
                <div className="erp-form-group">
                  <label className="erp-form-label">Date</label>
                  <input type="date" className="erp-input" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
                </div>
              </div>

              <div className="erp-form-row-compact-2" style={{ marginTop: '15px' }}>
                <div className="erp-form-group">
                  <label className="erp-form-label required">From Account (Credit)</label>
                  <input type="text" className="erp-input" value={formData.from_account} onChange={(e) => setFormData({...formData, from_account: e.target.value})} placeholder="Cash/Bank" />
                </div>
                <div className="erp-form-group">
                  <label className="erp-form-label required">To Account (Debit)</label>
                  <input type="text" className="erp-input" value={formData.to_account} onChange={(e) => setFormData({...formData, to_account: e.target.value})} placeholder="Bank/Cash" />
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
            <div className="erp-panel-header">CONTRA HISTORY</div>
            <div className="erp-grid-container" style={{ minHeight: '300px' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>Loading history...</div>
              ) : (
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Entry No</th>
                      <th>From Account</th>
                      <th>To Account</th>
                      <th className="text-right">Amount</th>
                      <th>Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentRecords.length > 0 ? paymentRecords.map((r, i) => (
                      <tr key={i}>
                        <td>{new Date(r.ct_date || r.date).toLocaleDateString()}</td>
                        <td className="font-bold">{r.ct_entry_no || r.entry_no}</td>
                        <td>{r.ct_from_account || r.from_account}</td>
                        <td>{r.ct_to_account || r.to_account}</td>
                        <td className="text-right font-bold">₹{parseFloat(r.ct_amount || r.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td>{r.ct_ref_number || r.ref_number}</td>
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

export default ContraForm;
