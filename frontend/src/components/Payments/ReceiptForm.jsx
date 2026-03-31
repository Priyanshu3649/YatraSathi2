import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useKeyboardNavigation } from '../../contexts/KeyboardNavigationContext';
import useKeyboardNav from '../../hooks/useKeyboardNavigation';
import { usePagination } from '../../hooks/usePagination';
import PaginationControls from '../common/PaginationControls';
import SaveConfirmationModal from '../common/SaveConfirmationModal';
import '../../styles/vintage-erp-theme.css';

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
    payment_mode: 'Cash', // New field
    ref_number: '',
    narration: ''
  });

  const [auditData, setAuditData] = useState({
    enteredOn: new Date().toISOString(),
    enteredBy: user?.us_usid || 'ADMIN'
  });

  const [mode, setMode] = useState('form'); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [receipts, setReceipts] = useState([]); // New state for history
  
  const {
    page,
    limit,
    pagination,
    updatePagination,
    setPage,
    setLimit
  } = usePagination(1, 50);

  const fieldOrder = useMemo(() => [
    'receipt_no', 'date', 'type', 'customer_name', 'customer_phone', 
    'account_name', 'amount', 'payment_mode', 'ref_number', 'save_button'
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

  const fetchReceipts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await receiptAPI.getAllReceipts({ page, limit });
      setReceipts(response.data || []);
      updatePagination(response.pagination);
    } catch (err) {
      console.error('Error fetching receipts:', err);
      setError('Failed to load receipts history');
    } finally {
      setLoading(false);
    }
  }, [page, limit, updatePagination]);

  useEffect(() => {
    if (mode === 'records') {
      fetchReceipts();
    }
  }, [mode, fetchReceipts]);

  useEffect(() => {
    if (!formData.receipt_no && mode === 'form') {
      const date = new Date();
      const prefix = formData.type === 'Debit' ? 'DR' : 'CR';
      setFormData(prev => ({
        ...prev,
        receipt_no: `${prefix}${date.getTime().toString().slice(-8)}`
      }));
    }
  }, [mode, formData.type]);

  const handleSave = async () => {
    if (!formData.customer_name || !formData.amount || !formData.account_name) {
      setError('Required fields are missing (Customer, Account, Amount)');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const payload = {
        rc_customer_name: formData.customer_name,
        rc_customer_phone: formData.customer_phone,
        rc_amount: formData.amount,
        rc_payment_mode: formData.payment_mode,
        rc_ref_number: formData.ref_number,
        rc_bank_account: formData.account_name,
        rc_narration: formData.narration || `Receipt from ${formData.customer_name}`
      };
      
      await receiptAPI.createReceipt(payload);
      
      setSuccess('Receipt saved successfully');
      setTimeout(() => {
        setSuccess('');
        onBack();
      }, 1500);
    } catch (err) {
      console.error('Error saving receipt:', err);
      setError(err.message || 'Failed to save receipt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="erp-page-container receipt-form-view">
      <div className="layout-action-bar">
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="erp-button primary" onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save (F10)'}
          </button>
          <button className="erp-button" onClick={() => setMode(mode === 'form' ? 'records' : 'form')}>
            {mode === 'form' ? 'View Records' : 'Back to Form'}
          </button>
          <button className="erp-button" onClick={onBack}>Cancel (Esc)</button>
        </div>
        <div style={{ flex: 1 }}></div>
        <div className="erp-status-badge">RECEIPT | {mode.toUpperCase()}</div>
      </div>

      <div className="layout-content-wrapper" style={{ padding: '20px' }}>
        {mode === 'form' ? (
          <div className="erp-container" style={{ maxWidth: '800px', margin: '0 auto' }} ref={formRef} onKeyDown={handleKeyDown}>
            <div className="erp-panel-header">RECEIPT VOUCHER DETAILS</div>
            <div className="erp-form-content" style={{ padding: '20px' }}>
              {error && <div className="erp-error-banner">{error}</div>}
              {success && <div className="erp-success-banner">{success}</div>}
              
              <div className="erp-form-row-compact-3">
                <div className="erp-form-group">
                  <label className="erp-form-label">Receipt No</label>
                  <input type="text" className="erp-input" value={formData.receipt_no} readOnly />
                </div>
                <div className="erp-form-group">
                  <label className="erp-form-label">Date</label>
                  <input type="date" className="erp-input" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
                </div>
                <div className="erp-form-group">
                  <label className="erp-form-label">Type</label>
                  <select className="erp-input" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                    <option value="Credit">Credit (Receipt In)</option>
                    <option value="Debit">Debit (Payment Out)</option>
                  </select>
                </div>
              </div>

              <div className="erp-form-row-compact-2" style={{ marginTop: '15px' }}>
                <div className="erp-form-group">
                  <label className="erp-form-label required">Customer Name</label>
                  <input type="text" className="erp-input" value={formData.customer_name} onChange={(e) => setFormData({...formData, customer_name: e.target.value})} placeholder="Search or enter name" />
                </div>
                <div className="erp-form-group">
                  <label className="erp-form-label">Phone Number</label>
                  <input type="text" className="erp-input" value={formData.customer_phone} onChange={(e) => setFormData({...formData, customer_phone: e.target.value})} />
                </div>
              </div>

              <div className="erp-form-row-compact-4" style={{ marginTop: '15px' }}>
                <div className="erp-form-group">
                  <label className="erp-form-label required">Account</label>
                  <input type="text" className="erp-input" value={formData.account_name} onChange={(e) => setFormData({...formData, account_name: e.target.value})} placeholder="Bank/Cash" />
                </div>
                <div className="erp-form-group">
                  <label className="erp-form-label required">Amount (₹)</label>
                  <input type="number" className="erp-input" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} />
                </div>
                <div className="erp-form-group">
                  <label className="erp-form-label">Payment Mode</label>
                  <select className="erp-input" value={formData.payment_mode} onChange={(e) => setFormData({...formData, payment_mode: e.target.value})}>
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Demand Draft">Demand Draft</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="Credit Card">Credit Card</option>
                  </select>
                </div>
                <div className="erp-form-group">
                  <label className="erp-form-label">Ref Number</label>
                  <input type="text" className="erp-input" value={formData.ref_number} onChange={(e) => setFormData({...formData, ref_number: e.target.value})} placeholder="UTR/Chq No" />
                </div>
              </div>
              
              <div className="erp-form-group" style={{ marginTop: '15px' }}>
                <label className="erp-form-label">Narration</label>
                <textarea 
                  className="erp-input" 
                  style={{ height: '60px', resize: 'none' }}
                  value={formData.narration}
                  onChange={(e) => setFormData({...formData, narration: e.target.value})}
                  placeholder="Additional notes..."
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="erp-grid-section">
            <div className="erp-panel-header">RECEIPT HISTORY</div>
            <div className="erp-grid-container" style={{ minHeight: '300px' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>Loading history...</div>
              ) : (
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Receipt No</th>
                      <th>Customer</th>
                      <th>Account</th>
                      <th>Mode</th>
                      <th className="text-right">Amount</th>
                      <th>Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receipts.length > 0 ? receipts.map((r, i) => (
                      <tr key={i}>
                        <td>{new Date(r.rc_date || r.date).toLocaleDateString()}</td>
                        <td className="font-bold">{r.rc_entry_no || r.receipt_no}</td>
                        <td>{r.rc_customer_name || r.customer_name}</td>
                        <td>{r.rc_bank_account || r.account_name}</td>
                        <td>{r.rc_payment_mode || r.payment_mode}</td>
                        <td className="text-right font-bold">₹{parseFloat(r.rc_amount || r.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td>{r.rc_ref_number || r.ref_number}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan="7" style={{ textAlign: 'center' }}>No historical records found</td></tr>
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

export default ReceiptForm;
