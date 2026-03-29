import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useKeyboardNavigation } from '../../contexts/KeyboardNavigationContext';
import useKeyboardNav from '../../hooks/useKeyboardNavigation';
import { usePagination } from '../../hooks/usePagination';
import PaginationControls from '../common/PaginationControls';
import SaveConfirmationModal from '../common/SaveConfirmationModal';
import '../../styles/vintage-erp-theme.css';

const PaymentForm = ({ onBack }) => {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    receipt_no: '',
    date: new Date().toISOString().split('T')[0],
    type: 'Debit',
    customer_name: '',
    customer_id: '',
    customer_phone: '',
    account_name: '',
    amount: '',
    ref_number: ''
  });

  const [auditData, setAuditData] = useState({
    enteredOn: new Date().toISOString(),
    enteredBy: user?.us_usid || 'ADMIN',
    modifiedOn: '',
    modifiedBy: user?.us_usid || 'ADMIN'
  });

  const [customerData, setCustomerData] = useState({
    balance: 0,
    total_credit: 0,
    total_debit: 0,
    loading: false
  });

  const [paymentRecords, setPaymentRecords] = useState([]);
  const [loading, setLoading] = useState(false);
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
  
  const [searchTerm, setSearchTerm] = useState('');
  const [mode, setMode] = useState('form'); 
  
  const [accounts] = useState([
    'Cash Account',
    'Bank Account - SBI',
    'Bank Account - HDFC',
    'Customer Account',
    'Supplier Account'
  ]);

  const fieldOrder = useMemo(() => [
    'receipt_no', 'date', 'type', 'customer_name', 'customer_phone', 
    'account_name', 'amount', 'ref_number', 'save_button'
  ], []);

  const {
    formRef,
    saveConfirmationOpen,
    handleKeyDown,
    focusSpecificField
  } = useKeyboardNav({
    fieldOrder,
    autoFocus: true,
    onSave: () => handleSave(),
    onCancel: onBack
  });

  useEffect(() => {
    if (!formData.receipt_no && mode === 'form') {
      generateReceiptNo();
    }
  }, [mode]);

  const generateReceiptNo = useCallback(() => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const prefix = formData.type === 'Debit' ? 'DR' : 'CR';
    setFormData(prev => ({
      ...prev,
      receipt_no: `${prefix}${year}${month}${day}${random}`
    }));
  }, [formData.type]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  async function handleSave() {
    if (!formData.customer_name || !formData.amount || !formData.account_name) {
      setError('Required fields are missing');
      return;
    }
    setSuccess('Payment saved successfully');
    setTimeout(() => onBack(), 1500);
  }

  return (
    <div className="erp-page-container payment-form-view">
      <div className="layout-action-bar">
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="erp-button primary" onClick={handleSave}>Save (F10)</button>
          <button className="erp-button" onClick={() => setMode(mode === 'form' ? 'records' : 'form')}>
            {mode === 'form' ? 'View Records' : 'Back to Form'}
          </button>
          <button className="erp-button" onClick={onBack}>Cancel (Esc)</button>
        </div>
        <div style={{ flex: 1 }}></div>
        <div className="erp-status-badge">{mode.toUpperCase()} MODE</div>
      </div>

      <div className="layout-content-wrapper" style={{ padding: '20px' }}>
        {mode === 'form' ? (
          <div className="erp-container" style={{ maxWidth: '800px', margin: '0 auto' }} ref={formRef} onKeyDown={handleKeyDown}>
            <div className="erp-panel-header">PAYMENT VOUCHER DETAILS</div>
            <div className="erp-form-content" style={{ padding: '20px' }}>
              {error && <div className="erp-error-banner">{error}</div>}
              {success && <div className="erp-success-banner">{success}</div>}
              
              <div className="erp-form-row-compact-3">
                <div className="erp-form-group">
                  <label className="erp-form-label">Receipt No</label>
                  <input type="text" className="erp-input" value={formData.receipt_no} readOnly tabIndex={-1} />
                </div>
                <div className="erp-form-group">
                  <label className="erp-form-label">Date</label>
                  <input type="date" className="erp-input" value={formData.date} onChange={(e) => handleInputChange('date', e.target.value)} />
                </div>
                <div className="erp-form-group">
                  <label className="erp-form-label">Type</label>
                  <select className="erp-input" value={formData.type} onChange={(e) => handleInputChange('type', e.target.value)}>
                    <option value="Debit">Debit (Payment Out)</option>
                    <option value="Credit">Credit (Refund In)</option>
                  </select>
                </div>
              </div>

              <div className="erp-form-row-compact-2" style={{ marginTop: '15px' }}>
                <div className="erp-form-group">
                  <label className="erp-form-label required">Customer Name</label>
                  <input type="text" className="erp-input" value={formData.customer_name} onChange={(e) => handleInputChange('customer_name', e.target.value)} placeholder="Search customer..." />
                </div>
                <div className="erp-form-group">
                  <label className="erp-form-label">Phone Number</label>
                  <input type="text" className="erp-input" value={formData.customer_phone} onChange={(e) => handleInputChange('customer_phone', e.target.value)} />
                </div>
              </div>

              <div className="erp-form-row-compact-3" style={{ marginTop: '15px' }}>
                <div className="erp-form-group">
                  <label className="erp-form-label required">Account</label>
                  <select className="erp-input" value={formData.account_name} onChange={(e) => handleInputChange('account_name', e.target.value)}>
                    <option value="">Select Account</option>
                    {accounts.map(acc => <option key={acc} value={acc}>{acc}</option>)}
                  </select>
                </div>
                <div className="erp-form-group">
                  <label className="erp-form-label required">Amount (₹)</label>
                  <input type="number" className="erp-input" value={formData.amount} onChange={(e) => handleInputChange('amount', e.target.value)} placeholder="0.00" />
                </div>
                <div className="erp-form-group">
                  <label className="erp-form-label">Ref Number</label>
                  <input type="text" className="erp-input" value={formData.ref_number} onChange={(e) => handleInputChange('ref_number', e.target.value)} placeholder="Chq/UTR No." />
                </div>
              </div>
            </div>
            
            <div className="erp-panel-footer" style={{ padding: '10px', background: '#f0f0f0', textAlign: 'right' }}>
              <span style={{ fontSize: '11px', color: '#666', marginRight: '15px' }}>
                Entered By: {auditData.enteredBy} | {new Date(auditData.enteredOn).toLocaleString()}
              </span>
            </div>
          </div>
        ) : (
          <div className="erp-grid-section">
            <div className="erp-panel-header">PAYMENT HISTORY</div>
            <div className="erp-grid-container" style={{ maxHeight: '500px', overflowY: 'auto' }}>
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Receipt No</th>
                    <th>Customer</th>
                    <th>Account</th>
                    <th>Amount</th>
                    <th>Type</th>
                    <th>Ref No</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td colSpan="7" style={{ textAlign: 'center' }}>No records found</td></tr>
                </tbody>
              </table>
            </div>
            <PaginationControls
              pagination={pagination}
              onPageChange={setPage}
              limit={limit}
              onLimitChange={setLimit}
            />
          </div>
        )}
      </div>
      
      {saveConfirmationOpen && (
        <SaveConfirmationModal isOpen={true} onConfirm={handleSave} onCancel={() => {}} />
      )}
    </div>
  );
};

export default PaymentForm;
