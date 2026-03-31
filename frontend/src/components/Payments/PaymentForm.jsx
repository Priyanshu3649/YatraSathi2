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
    payment_mode: 'Cash',
    ref_number: '',
    narration: ''
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
    'account_name', 'amount', 'payment_mode', 'ref_number', 'save_button'
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

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await paymentAPI.getAllPayments({ page, limit });
      setPaymentRecords(response.data || []);
      updatePagination(response.pagination);
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError('Failed to load payment history');
    } finally {
      setLoading(false);
    }
  }, [page, limit, updatePagination]);

  useEffect(() => {
    if (mode === 'records') {
        fetchPayments();
    }
  }, [mode, fetchPayments]);

  useEffect(() => {
    if (!formData.receipt_no && mode === 'form') {
      generateReceiptNo();
    }
  }, [mode, formData.type]);

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
      setError('Required fields are missing (Customer, Account, Amount)');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const payload = {
        py_entry_type: formData.type,
        py_customer_name: formData.customer_name,
        py_customer_phone: formData.customer_phone,
        py_amount: formData.amount,
        py_ref_number: formData.ref_number,
        py_bank_account: formData.account_name,
        py_narration: formData.narration || `Payment for ${formData.customer_name}`
      };

      await paymentAPI.createPayment(payload);
      
      setSuccess('Payment saved successfully');
      setTimeout(() => {
        setSuccess('');
        onBack();
      }, 1500);
    } catch (err) {
      console.error('Error saving payment:', err);
      setError(err.message || 'Failed to save payment');
    } finally {
      setLoading(false);
    }
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

              <div className="erp-form-row-compact-4" style={{ marginTop: '15px' }}>
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
                  <label className="erp-form-label">Payment Mode</label>
                  <select className="erp-input" value={formData.payment_mode} onChange={(e) => handleInputChange('payment_mode', e.target.value)}>
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
                  <input type="text" className="erp-input" value={formData.ref_number} onChange={(e) => handleInputChange('ref_number', e.target.value)} placeholder="Chq/UTR No." />
                </div>
              </div>

              <div className="erp-form-group" style={{ marginTop: '15px' }}>
                <label className="erp-form-label">Narration</label>
                <textarea 
                  className="erp-input" 
                  style={{ height: '60px', resize: 'none' }}
                  value={formData.narration}
                  onChange={(e) => handleInputChange('narration', e.target.value)}
                  placeholder="Additional notes..."
                />
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
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>Loading history...</div>
              ) : (
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Entry No</th>
                      <th>Customer</th>
                      <th>Account</th>
                      <th>Mode</th>
                      <th className="text-right">Amount</th>
                      <th>Type</th>
                      <th>Ref No</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentRecords.length > 0 ? paymentRecords.map((r, i) => (
                      <tr key={i}>
                        <td>{new Date(r.py_date || r.date).toLocaleDateString()}</td>
                        <td className="font-bold">{r.py_entry_no || r.receipt_no}</td>
                        <td>{r.py_customer_name || r.customer_name}</td>
                        <td>{r.py_bank_account || r.account_name}</td>
                        <td>{r.py_payment_mode || 'Cash'}</td>
                        <td className="text-right font-bold">₹{parseFloat(r.py_amount || r.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td><span className={`erp-badge ${r.py_entry_type === 'Debit' ? 'danger' : 'success'}`}>{r.py_entry_type || r.type}</span></td>
                        <td>{r.py_ref_number || r.ref_number}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan="8" style={{ textAlign: 'center' }}>No historical records found</td></tr>
                    )}
                  </tbody>
                </table>
              )}
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
