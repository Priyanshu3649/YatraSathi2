import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useKeyboardNavigation } from '../../contexts/KeyboardNavigationContext';
import { usePagination } from '../../hooks/usePagination';
import PaginationControls from '../common/PaginationControls';
import SaveConfirmationModal from '../common/SaveConfirmationModal';
import { paymentAPI } from '../../services/api'; // Correct service import if Receipt uses it
import '../../styles/vintage-erp-theme.css';

const ReceiptForm = ({ onBack }) => {
  const { user } = useAuth();
  const {
    registerForm,
    unregisterForm,
    setActiveForm,
    handleManualFocus
  } = useKeyboardNavigation();
  
  const [formData, setFormData] = useState({
    receipt_no: '',
    date: new Date().toISOString().split('T')[0],
    type: 'Credit',
    customer_name: '',
    customer_id: '',
    customer_phone: '',
    account_name: '',
    amount: '',
    payment_mode: 'Cash',
    ref_number: '',
    narration: ''
  });

  const [mode, setMode] = useState('form'); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [receipts, setReceipts] = useState([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  
  const {
    page,
    limit,
    pagination,
    updatePagination,
    setPage,
    setLimit
  } = usePagination(1, 50);

  // Field order for keyboard navigation context
  const fieldOrder = useMemo(() => [
    'date', 
    'type', 
    'customer_name', 
    'customer_phone', 
    'account_name', 
    'amount', 
    'payment_mode', 
    'ref_number', 
    'narration'
  ], []);

  // Registry for keyboard navigation
  useEffect(() => {
    if (mode === 'form') {
      registerForm('receipt', fieldOrder);
      setActiveForm('receipt');
      return () => unregisterForm('receipt');
    }
  }, [mode, fieldOrder, registerForm, unregisterForm, setActiveForm]);

  const fetchReceipts = useCallback(async () => {
    try {
      setLoading(true);
      // Assuming paymentAPI handles receipts too, or use appropriate service
      const response = await paymentAPI.getAllPayments({ page, limit, type: 'Credit' });
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSave = async () => {
    if (!formData.customer_name || !formData.amount || !formData.account_name) {
      setError('Required fields are missing (Customer, Account, Amount)');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const payload = {
        py_entry_type: formData.type === 'Credit' ? 'Credit' : 'Debit',
        py_customer_name: formData.customer_name,
        py_customer_phone: formData.customer_phone,
        py_amount: formData.amount,
        py_payment_mode: formData.payment_mode,
        py_ref_number: formData.ref_number,
        py_bank_account: formData.account_name,
        py_narration: formData.narration || `Receipt from ${formData.customer_name}`
      };
      
      await paymentAPI.createPayment(payload);
      
      setSuccess('Receipt saved successfully');
      setShowSaveModal(false);
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
          <button className="erp-button primary" onClick={() => setShowSaveModal(true)} disabled={loading}>
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

      <div className="layout-content-wrapper" style={{ padding: '20px', overflowY: 'auto' }}>
        {mode === 'form' ? (
          <div className="erp-container" style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div className="erp-panel-header">RECEIPT VOUCHER ENTRY</div>
            <div className="erp-form-content" style={{ padding: '24px', background: '#f8f8f8' }}>
              {error && <div className="erp-error-banner" style={{ marginBottom: '15px' }}>{error}</div>}
              {success && <div className="erp-success-banner" style={{ marginBottom: '15px' }}>{success}</div>}
              
              {/* Row 1: Header Info */}
              <div className="erp-form-row-compact-3">
                <div className="erp-form-group">
                  <label className="erp-form-label">Receipt No.</label>
                  <input type="text" className="erp-input" value={formData.receipt_no} readOnly tabIndex="-1" />
                </div>
                <div className="erp-form-group">
                  <label className="erp-form-label">Date</label>
                  <input 
                    type="date" 
                    name="date"
                    className="erp-input" 
                    value={formData.date} 
                    onChange={handleInputChange}
                    onFocus={() => handleManualFocus('receipt', 'date')}
                  />
                </div>
                <div className="erp-form-group">
                  <label className="erp-form-label">Voucher Type</label>
                  <select 
                    name="type"
                    className="erp-input" 
                    value={formData.type} 
                    onChange={handleInputChange}
                    onFocus={() => handleManualFocus('receipt', 'type')}
                  >
                    <option value="Credit">Credit (Receipt In)</option>
                    <option value="Debit">Debit (Payment Out)</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Customer Details */}
              <div className="erp-form-row-compact-2" style={{ marginTop: '10px' }}>
                <div className="erp-form-group">
                  <label className="erp-form-label required">Customer Name</label>
                  <input 
                    type="text" 
                    name="customer_name"
                    className="erp-input" 
                    value={formData.customer_name} 
                    onChange={handleInputChange} 
                    placeholder="Search or enter name"
                    onFocus={() => handleManualFocus('receipt', 'customer_name')}
                  />
                </div>
                <div className="erp-form-group">
                  <label className="erp-form-label">Phone Number</label>
                  <input 
                    type="text" 
                    name="customer_phone"
                    className="erp-input" 
                    value={formData.customer_phone} 
                    onChange={handleInputChange}
                    onFocus={() => handleManualFocus('receipt', 'customer_phone')}
                  />
                </div>
              </div>

              {/* Row 3: Account & Amount */}
              <div className="erp-form-row-compact-2" style={{ marginTop: '10px' }}>
                <div className="erp-form-group">
                  <label className="erp-form-label required">Account (Dr/Cr)</label>
                  <input 
                    type="text" 
                    name="account_name"
                    className="erp-input" 
                    value={formData.account_name} 
                    onChange={handleInputChange} 
                    placeholder="Bank or Cash Account"
                    onFocus={() => handleManualFocus('receipt', 'account_name')}
                  />
                </div>
                <div className="erp-form-group">
                  <label className="erp-form-label required">Amount (₹)</label>
                  <input 
                    type="number" 
                    name="amount"
                    className="erp-input" 
                    value={formData.amount} 
                    onChange={handleInputChange}
                    onFocus={() => handleManualFocus('receipt', 'amount')}
                    style={{ fontWeight: 'bold', fontSize: '13px' }}
                  />
                </div>
              </div>

              {/* Row 4: Mode & Ref */}
              <div className="erp-form-row-compact-2" style={{ marginTop: '10px' }}>
                <div className="erp-form-group">
                  <label className="erp-form-label">Payment Mode</label>
                  <select 
                    name="payment_mode"
                    className="erp-input" 
                    value={formData.payment_mode} 
                    onChange={handleInputChange}
                    onFocus={() => handleManualFocus('receipt', 'payment_mode')}
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
                <div className="erp-form-group">
                  <label className="erp-form-label">Ref Number</label>
                  <input 
                    type="text" 
                    name="ref_number"
                    className="erp-input" 
                    value={formData.ref_number} 
                    onChange={handleInputChange} 
                    placeholder="UTR/Chq No"
                    onFocus={() => handleManualFocus('receipt', 'ref_number')}
                  />
                </div>
              </div>
              
              {/* Row 5: Narration */}
              <div className="erp-form-group" style={{ marginTop: '15px' }}>
                <label className="erp-form-label" style={{ display: 'block', textAlign: 'left', marginBottom: '4px' }}>Narration / Remarks</label>
                <textarea 
                  name="narration"
                  className="erp-input" 
                  style={{ height: '60px', resize: 'none', width: '100%' }}
                  value={formData.narration}
                  onChange={handleInputChange}
                  placeholder="Enter details of transaction..."
                  onFocus={() => handleManualFocus('receipt', 'narration')}
                />
              </div>

              <div className="erp-panel-footer" style={{ marginTop: '20px', padding: '10px', background: '#eee', fontSize: '11px', color: '#666' }}>
                VOUCHER AUDIT: ENTERED BY {user?.us_name || 'ADMIN'} | {new Date().toLocaleString()}
              </div>
            </div>
          </div>
        ) : (
          <div className="erp-grid-section">
            <div className="erp-panel-header">RECEIPT VOUCHER HISTORY</div>
            <div className="erp-grid-container" style={{ minHeight: '400px' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>Loading history...</div>
              ) : (
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th style={{ width: '100px' }}>Date</th>
                      <th style={{ width: '120px' }}>Voucher No</th>
                      <th>Customer Name</th>
                      <th>Account</th>
                      <th style={{ width: '100px' }}>Mode</th>
                      <th className="text-right" style={{ width: '150px' }}>Amount (₹)</th>
                      <th>Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receipts.length > 0 ? receipts.map((r, i) => (
                      <tr key={i}>
                        <td>{new Date(r.py_date || r.date).toLocaleDateString()}</td>
                        <td className="font-bold">{r.py_entry_no || r.receipt_no}</td>
                        <td>{r.py_customer_name || r.customer_name}</td>
                        <td>{r.py_bank_account || r.account_name}</td>
                        <td>{r.py_payment_mode || 'Cash'}</td>
                        <td className="text-right font-bold" style={{ color: '#006400' }}>
                          ₹{parseFloat(r.py_amount || r.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td>{r.py_ref_number || r.ref_number}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>No historical records found</td></tr>
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

export default ReceiptForm;
