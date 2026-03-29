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
    ref_number: ''
  });

  const [auditData, setAuditData] = useState({
    enteredOn: new Date().toISOString(),
    enteredBy: user?.us_usid || 'ADMIN'
  });

  const [mode, setMode] = useState('form'); 
  const [loading, setLoading] = useState(false);
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
    'receipt_no', 'date', 'type', 'customer_name', 'customer_phone', 
    'account_name', 'amount', 'ref_number', 'save_button'
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
    if (!formData.receipt_no && mode === 'form') {
      const date = new Date();
      const prefix = formData.type === 'Debit' ? 'DR' : 'CR';
      setFormData(prev => ({
        ...prev,
        receipt_no: `${prefix}${date.getTime().toString().slice(-8)}`
      }));
    }
  }, [mode]);

  const handleSave = async () => {
    if (!formData.customer_name || !formData.amount) {
      setError('Required fields are missing');
      return;
    }
    setSuccess('Receipt saved successfully');
    setTimeout(() => onBack(), 1500);
  };

  return (
    <div className="erp-page-container receipt-form-view">
      <div className="layout-action-bar">
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="erp-button primary" onClick={handleSave}>Save (F10)</button>
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
                  <input type="text" className="erp-input" value={formData.customer_name} onChange={(e) => setFormData({...formData, customer_name: e.target.value})} />
                </div>
                <div className="erp-form-group">
                  <label className="erp-form-label">Phone Number</label>
                  <input type="text" className="erp-input" value={formData.customer_phone} onChange={(e) => setFormData({...formData, customer_phone: e.target.value})} />
                </div>
              </div>

              <div className="erp-form-row-compact-3" style={{ marginTop: '15px' }}>
                <div className="erp-form-group">
                  <label className="erp-form-label required">Account</label>
                  <input type="text" className="erp-input" value={formData.account_name} onChange={(e) => setFormData({...formData, account_name: e.target.value})} placeholder="Bank/Cash" />
                </div>
                <div className="erp-form-group">
                  <label className="erp-form-label required">Amount (₹)</label>
                  <input type="number" className="erp-input" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} />
                </div>
                <div className="erp-form-group">
                  <label className="erp-form-label">Ref Number</label>
                  <input type="text" className="erp-input" value={formData.ref_number} onChange={(e) => setFormData({...formData, ref_number: e.target.value})} />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="erp-grid-section">
            <div className="erp-panel-header">RECEIPT HISTORY</div>
            <div className="erp-grid-container">
              <table className="erp-table">
                <thead>
                  <tr><th>Date</th><th>Receipt No</th><th>Customer</th><th>Amount</th><th>Type</th></tr>
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

export default ReceiptForm;
