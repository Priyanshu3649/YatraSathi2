import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useKeyboardNavigation } from '../../contexts/KeyboardNavigationContext';
import { usePagination } from '../../hooks/usePagination';
import PaginationControls from '../common/PaginationControls';
import SaveConfirmationModal from '../common/SaveConfirmationModal';
import { paymentAPI } from '../../services/api'; // Or contraAPI if available
import '../../styles/vintage-erp-theme.css';

const ContraForm = ({ onBack }) => {
  const { user } = useAuth();
  const {
    registerForm,
    unregisterForm,
    setActiveForm,
    handleManualFocus
  } = useKeyboardNavigation();
  
  const [formData, setFormData] = useState({
    contra_no: '',
    date: new Date().toISOString().split('T')[0],
    from_account: '',
    to_account: '',
    amount: '',
    ref_number: '',
    narration: ''
  });

  const [paymentRecords, setPaymentRecords] = useState([]); 
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
    'from_account', 
    'to_account', 
    'amount', 
    'ref_number', 
    'narration'
  ], []);

  useEffect(() => {
    if (mode === 'form') {
      registerForm('contra', fieldOrder);
      setActiveForm('contra');
      return () => unregisterForm('contra');
    }
  }, [mode, fieldOrder, registerForm, unregisterForm, setActiveForm]);

  const fetchContras = useCallback(async () => {
    try {
      setLoading(true);
      // Assuming paymentAPI can handle contra or use specific API
      const response = await paymentAPI.getAllPayments({ page, limit, type: 'Contra' });
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
    if (!formData.contra_no && mode === 'form') {
      const date = new Date();
      setFormData(prev => ({
        ...prev,
        contra_no: `CT${date.getTime().toString().slice(-8)}`
      }));
    }
  }, [mode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSave = async () => {
    if (!formData.from_account || !formData.to_account || !formData.amount) {
      setError('Required fields are missing (From Account, To Account, Amount)');
      return;
    }
    
    try {
        setLoading(true);
        setError('');
        
        const payload = {
            py_entry_type: 'Contra',
            py_bank_account: formData.to_account, // Receiving account (Debit)
            py_from_account: formData.from_account, // Giving account (Credit)
            py_amount: formData.amount,
            py_ref_number: formData.ref_number,
            py_narration: formData.narration || `Contra: ${formData.from_account} to ${formData.to_account}`
        };

        await paymentAPI.createPayment(payload);
        
        setSuccess('Contra entry saved successfully');
        setShowSaveModal(false);
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
          <button className="erp-button primary" onClick={() => setShowSaveModal(true)} disabled={loading}>
            {loading ? 'Saving...' : 'Save (F10)'}
          </button>
          <button className="erp-button" onClick={() => setMode(mode === 'form' ? 'records' : 'form')}>
            {mode === 'form' ? 'View Records' : 'Back to Form'}
          </button>
          <button className="erp-button" onClick={onBack}>Cancel (Esc)</button>
        </div>
        <div style={{ flex: 1 }}></div>
        <div className="erp-status-badge">CONTRA | {mode.toUpperCase()}</div>
      </div>

      <div className="layout-content-wrapper" style={{ padding: '20px', overflowY: 'auto' }}>
        {mode === 'form' ? (
          <div className="erp-container" style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div className="erp-panel-header">CONTRA VOUCHER ENTRY (FUND TRANSFER)</div>
            <div className="erp-form-content" style={{ padding: '24px', background: '#f5f5f5' }}>
              {error && <div className="erp-error-banner" style={{ marginBottom: '15px' }}>{error}</div>}
              {success && <div className="erp-success-banner" style={{ marginBottom: '15px' }}>{success}</div>}
              
              <div className="erp-form-row-compact-2">
                <div className="erp-form-group">
                  <label className="erp-form-label">Contra No.</label>
                  <input type="text" className="erp-input" value={formData.contra_no} readOnly tabIndex="-1" />
                </div>
                <div className="erp-form-group">
                  <label className="erp-form-label">Voucher Date</label>
                  <input 
                    type="date" 
                    name="date"
                    className="erp-input" 
                    value={formData.date} 
                    onChange={handleInputChange} 
                    onFocus={() => handleManualFocus('contra', 'date')}
                  />
                </div>
              </div>

              <div className="erp-form-row-compact-2" style={{ marginTop: '10px' }}>
                <div className="erp-form-group">
                  <label className="erp-form-label required">From Account (Cr)</label>
                  <input 
                    type="text" 
                    name="from_account"
                    className="erp-input" 
                    value={formData.from_account} 
                    onChange={handleInputChange} 
                    placeholder="Source (Cash/Bank)" 
                    onFocus={() => handleManualFocus('contra', 'from_account')}
                  />
                </div>
                <div className="erp-form-group">
                  <label className="erp-form-label required">To Account (Dr)</label>
                  <input 
                    type="text" 
                    name="to_account"
                    className="erp-input" 
                    value={formData.to_account} 
                    onChange={handleInputChange} 
                    placeholder="Destination (Bank/Cash)" 
                    onFocus={() => handleManualFocus('contra', 'to_account')}
                  />
                </div>
              </div>

              <div className="erp-form-row-compact-2" style={{ marginTop: '10px' }}>
                <div className="erp-form-group">
                  <label className="erp-form-label required">Transfer Amount (₹)</label>
                  <input 
                    type="number" 
                    name="amount"
                    className="erp-input" 
                    value={formData.amount} 
                    onChange={handleInputChange} 
                    style={{ fontWeight: 'bold' }}
                    onFocus={() => handleManualFocus('contra', 'amount')}
                  />
                </div>
                <div className="erp-form-group">
                  <label className="erp-form-label">Reference / Chq No.</label>
                  <input 
                    type="text" 
                    name="ref_number"
                    className="erp-input" 
                    value={formData.ref_number} 
                    onChange={handleInputChange}
                    onFocus={() => handleManualFocus('contra', 'ref_number')}
                  />
                </div>
              </div>

              <div className="erp-form-group" style={{ marginTop: '15px' }}>
                <label className="erp-form-label" style={{ display: 'block', textAlign: 'left', marginBottom: '4px' }}>Transaction Details</label>
                <textarea 
                  name="narration"
                  className="erp-input" 
                  value={formData.narration} 
                  onChange={handleInputChange} 
                  rows="2" 
                  style={{ width: '100%', resize: 'none' }}
                  onFocus={() => handleManualFocus('contra', 'narration')}
                />
              </div>

              <div className="erp-panel-footer" style={{ marginTop: '20px', padding: '10px', background: '#eee', fontSize: '11px', color: '#666' }}>
                VOUCHER AUDIT: ENTERED BY {user?.us_name || 'ADMIN'} | {new Date().toLocaleString()}
              </div>
            </div>
          </div>
        ) : (
          <div className="erp-grid-section">
            <div className="erp-panel-header">CONTRA VOUCHER HISTORY</div>
            <div className="erp-grid-container" style={{ minHeight: '400px' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>Loading history...</div>
              ) : (
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th style={{ width: '100px' }}>Date</th>
                      <th style={{ width: '120px' }}>Entry No</th>
                      <th>From Account</th>
                      <th>To Account</th>
                      <th className="text-right" style={{ width: '150px' }}>Amount (₹)</th>
                      <th>Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentRecords.length > 0 ? paymentRecords.map((r, i) => (
                      <tr key={i}>
                        <td>{new Date(r.py_date || r.date || r.ct_date).toLocaleDateString()}</td>
                        <td className="font-bold">{r.py_entry_no || r.receipt_no || r.ct_entry_no}</td>
                        <td>{r.py_from_account || r.from_account || r.ct_from_account}</td>
                        <td>{r.py_bank_account || r.account_name || r.ct_to_account}</td>
                        <td className="text-right font-bold" style={{ color: '#005fcc' }}>
                          ₹{parseFloat(r.py_amount || r.amount || r.ct_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td>{r.py_ref_number || r.ref_number || r.ct_ref_number}</td>
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

export default ContraForm;
