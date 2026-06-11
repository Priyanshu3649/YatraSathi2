import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useKeyboardNavigation } from '../../contexts/KeyboardNavigationContext';
import { usePagination } from '../../hooks/usePagination';
import PaginationControls from '../common/PaginationControls';
import SaveConfirmationModal from '../common/SaveConfirmationModal';
import AuditHistoryButton from '../common/AuditHistoryButton';
import { paymentAPI } from '../../services/api';
import { printVoucher } from '../../utils/paymentPrintUtils';
import '../../styles/vintage-erp-theme.css';

const PaymentForm = ({ onBack }) => {
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

  const [paymentRecords, setPaymentRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(true); // Default mode is "New" (showing empty form ready for data entry)
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [auditData, setAuditData] = useState({
    enteredOn: '',
    enteredBy: '',
    modifiedOn: '',
    modifiedBy: ''
  });
  
  const {
    page,
    limit,
    pagination,
    updatePagination,
    setPage,
    setLimit,
    nextPage,
    prevPage,
    changeLimit
  } = usePagination(1, 50);

  const [accounts] = useState([
    'Cash Account',
    'Bank Account - SBI',
    'Bank Account - HDFC',
    'Customer Account',
    'Supplier Account'
  ]);

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
    registerForm('payment', fieldOrder);
    setActiveForm('payment');
    return () => unregisterForm('payment');
  }, [fieldOrder, registerForm, unregisterForm, setActiveForm]);

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await paymentAPI.getAllPayments({ page, limit, type: 'Debit' });
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
    fetchPayments();
  }, [page, limit, fetchPayments]);

  const generateTempReceiptNo = useCallback((type) => {
    const date = new Date();
    const prefix = type === 'Debit' ? 'DR' : 'CR';
    return `${prefix}${date.getTime().toString().slice(-8)}`;
  }, []);

  useEffect(() => {
    if (!formData.receipt_no && isEditing && !selectedRecord) {
      setFormData(prev => ({
        ...prev,
        receipt_no: generateTempReceiptNo(prev.type)
      }));
    }
  }, [isEditing, selectedRecord, formData.receipt_no, formData.type, generateTempReceiptNo]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'type' && isEditing && !selectedRecord) {
        updated.receipt_no = generateTempReceiptNo(value);
      }
      return updated;
    });
    setError('');
  };

  const handleRecordSelect = useCallback((record) => {
    if (!record) return;
    setSelectedRecord(record);
    setFormData({
      receipt_no: record.py_entry_no || '',
      date: record.py_date || record.date || '',
      type: record.py_entry_type || 'Debit',
      customer_name: record.py_customer_name || '',
      customer_id: record.py_customer_id || '',
      customer_phone: record.py_customer_phone || '',
      account_name: record.py_bank_account || record.account_name || '',
      amount: record.py_amount || record.amount || '',
      payment_mode: record.py_payment_mode || 'Cash',
      ref_number: record.py_ref_number || record.ref_number || '',
      narration: record.py_narration || record.narration || ''
    });
    setAuditData({
      enteredOn: record.edtm ? new Date(record.edtm).toLocaleString() : '',
      enteredBy: record.eby || '',
      modifiedOn: record.mdtm ? new Date(record.mdtm).toLocaleString() : '',
      modifiedBy: record.mby || ''
    });
    setIsEditing(false);
    setError('');
    setSuccess('');
  }, []);

  const handleNew = () => {
    setSelectedRecord(null);
    setIsEditing(true);
    setFormData({
      receipt_no: generateTempReceiptNo('Debit'),
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
    setAuditData({
      enteredOn: new Date().toLocaleString(),
      enteredBy: user?.us_usid || 'ADMIN',
      modifiedOn: '',
      modifiedBy: ''
    });
    setError('');
    setSuccess('');
  };

  const handleEdit = () => {
    if (selectedRecord) {
      setIsEditing(true);
    }
  };

  const handleCancel = () => {
    if (selectedRecord) {
      setFormData({
        receipt_no: selectedRecord.py_entry_no || '',
        date: selectedRecord.py_date || selectedRecord.date || '',
        type: selectedRecord.py_entry_type || 'Debit',
        customer_name: selectedRecord.py_customer_name || '',
        customer_id: selectedRecord.py_customer_id || '',
        customer_phone: selectedRecord.py_customer_phone || '',
        account_name: selectedRecord.py_bank_account || selectedRecord.account_name || '',
        amount: selectedRecord.py_amount || selectedRecord.amount || '',
        payment_mode: selectedRecord.py_payment_mode || 'Cash',
        ref_number: selectedRecord.py_ref_number || selectedRecord.ref_number || '',
        narration: selectedRecord.py_narration || selectedRecord.narration || ''
      });
      setIsEditing(false);
    } else {
      if (paymentRecords.length > 0) {
        handleRecordSelect(paymentRecords[0]);
      } else {
        setIsEditing(false);
      }
    }
    setError('');
    setSuccess('');
  };

  const handleDelete = async () => {
    if (!selectedRecord) return;
    if (window.confirm('Are you sure you want to delete this payment entry?')) {
      try {
        setLoading(true);
        await paymentAPI.deletePayment(selectedRecord.py_pymtid);
        setSuccess('Payment entry deleted successfully');
        setSelectedRecord(null);
        handleNew();
        fetchPayments();
      } catch (err) {
        console.error('Error deleting payment:', err);
        setError(err.message || 'Failed to delete payment entry');
      } finally {
        setLoading(false);
      }
    }
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
        py_entry_type: formData.type,
        py_customer_name: formData.customer_name,
        py_customer_phone: formData.customer_phone,
        py_amount: formData.amount,
        py_ref_number: formData.ref_number,
        py_bank_account: formData.account_name,
        py_payment_mode: formData.payment_mode,
        py_narration: formData.narration || `Payment for ${formData.customer_name}`
      };

      let response;
      if (selectedRecord) {
        // Edit Mode -> Update
        response = await paymentAPI.updatePayment(selectedRecord.py_pymtid, payload);
        setSuccess('Payment entry updated successfully');
      } else {
        // New Mode -> Create
        response = await paymentAPI.createPayment(payload);
        setSuccess('Payment entry saved successfully');
      }
      
      setShowSaveModal(false);
      setTimeout(() => {
        setSuccess('');
        setIsEditing(false);
        if (response && response.data) {
          handleRecordSelect(response.data);
        } else {
          handleNew();
        }
        fetchPayments();
      }, 1500);
    } catch (err) {
      console.error('Error saving payment:', err);
      setError(err.message || 'Failed to save payment');
    } finally {
      setLoading(false);
    }
  };

  const handleNavigation = useCallback((direction) => {
    if (paymentRecords.length === 0) return;
    let newIndex = 0;
    if (selectedRecord) {
      const currentIndex = paymentRecords.findIndex(r => r.py_pymtid === selectedRecord.py_pymtid);
      switch(direction) {
        case 'first': newIndex = 0; break;
        case 'prev': newIndex = currentIndex > 0 ? currentIndex - 1 : 0; break;
        case 'next': newIndex = currentIndex < paymentRecords.length - 1 ? currentIndex + 1 : paymentRecords.length - 1; break;
        case 'last': newIndex = paymentRecords.length - 1; break;
        default: break;
      }
    }
    handleRecordSelect(paymentRecords[newIndex]);
  }, [paymentRecords, selectedRecord, handleRecordSelect]);

  // Keyboard navigation handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isInFormField = e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA';
      
      if (!isInFormField) {
        switch (e.key) {
          case 'ArrowUp':
            e.preventDefault();
            if (paymentRecords.length > 0) {
              const currentIdx = selectedRecord ? paymentRecords.findIndex(r => r.py_pymtid === selectedRecord.py_pymtid) : -1;
              const newIdx = currentIdx > 0 ? currentIdx - 1 : 0;
              handleRecordSelect(paymentRecords[newIdx]);
            }
            break;
          case 'ArrowDown':
            e.preventDefault();
            if (paymentRecords.length > 0) {
              const currentIdx = selectedRecord ? paymentRecords.findIndex(r => r.py_pymtid === selectedRecord.py_pymtid) : -1;
              const newIdx = currentIdx < paymentRecords.length - 1 ? currentIdx + 1 : paymentRecords.length - 1;
              handleRecordSelect(paymentRecords[newIdx]);
            }
            break;
          case 'ArrowLeft':
            e.preventDefault();
            if (pagination.hasPrevPage) {
              prevPage();
            }
            break;
          case 'ArrowRight':
            e.preventDefault();
            if (pagination.hasNextPage) {
              nextPage();
            }
            break;
          default:
            break;
        }
      }

      // F-Keys
      switch (e.key) {
        case 'F2':
          e.preventDefault();
          handleNew();
          break;
        case 'F3':
          e.preventDefault();
          if (selectedRecord) {
            handleEdit();
          }
          break;
        case 'F4':
          e.preventDefault();
          if (selectedRecord) {
            handleDelete();
          }
          break;
        case 'F10':
          e.preventDefault();
          if (isEditing) {
            setShowSaveModal(true);
          }
          break;
        case 'Escape':
          e.preventDefault();
          if (isEditing) {
            handleCancel();
          } else {
            onBack();
          }
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [paymentRecords, selectedRecord, isEditing, pagination, nextPage, prevPage, onBack, handleRecordSelect]);

  const isFirstRecord = selectedRecord && paymentRecords.length > 0 && paymentRecords[0].py_pymtid === selectedRecord.py_pymtid;
  const isLastRecord = selectedRecord && paymentRecords.length > 0 && paymentRecords[paymentRecords.length - 1].py_pymtid === selectedRecord.py_pymtid;

  return (
    <div className="erp-admin-container booking-layout" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div className="erp-toolbar">
        <button className="erp-icon-button" onClick={onBack} title="Back to menu (Esc)">🏠</button>
        <button 
          className="erp-icon-button" 
          onClick={() => handleNavigation('first')} 
          disabled={!selectedRecord || isFirstRecord}
          title="First"
        >
          |◀
        </button>
        <button 
          className="erp-icon-button" 
          onClick={() => handleNavigation('prev')} 
          disabled={!selectedRecord || isFirstRecord}
          title="Previous"
        >
          ◀
        </button>
        <button 
          className="erp-icon-button" 
          onClick={() => handleNavigation('next')} 
          disabled={!selectedRecord || isLastRecord}
          title="Next"
        >
          ▶
        </button>
        <button 
          className="erp-icon-button" 
          onClick={() => handleNavigation('last')} 
          disabled={!selectedRecord || isLastRecord}
          title="Last"
        >
          ▶|
        </button>
        <div className="erp-tool-separator"></div>
        <button className="erp-button" onClick={handleNew} title="New (F2)">New</button>
        <button className="erp-button" onClick={handleEdit} disabled={!selectedRecord || isEditing} title="Edit (F3)">Edit</button>
        <button className="erp-button danger" onClick={handleDelete} disabled={!selectedRecord} title="Delete (F4)">Delete</button>
        <button className="erp-button" onClick={() => printVoucher(selectedRecord, 'payment')} disabled={!selectedRecord} title="Export to PDF">Export PDF</button>
        <div className="erp-tool-separator"></div>
        <button className="erp-button" onClick={() => setShowSaveModal(true)} disabled={!isEditing} title="Save (F10)">Save</button>
        <button className="erp-button" onClick={handleCancel} disabled={!isEditing} title="Cancel">Cancel</button>
        <button className="erp-button" onClick={fetchPayments} title="Refresh">Refresh</button>
        <div style={{ flex: 1 }}></div>
        <div style={{ fontWeight: 'bold', fontSize: '12px' }}>
          {isEditing ? (selectedRecord ? 'EDIT MODE' : 'NEW RECORD') : 'READY'} | Total Records: {pagination.totalRecords || paymentRecords.length}
        </div>
      </div>

      {/* Main Content (Stacked Form & Grid) */}
      <div className="layout-content-wrapper" style={{ display: 'flex', flex: 1, flexDirection: 'column', overflow: 'hidden' }}>
        <div className="layout-main-column" style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%' }}>
          
          {/* Form Panel */}
          <div className="layout-form-section" style={{ padding: '15px', backgroundColor: '#fcfcfc', borderBottom: '1px solid #ddd' }}>
            <div className="erp-panel-header">PAYMENT VOUCHER ENTRY (OUT)</div>
            <div className="erp-form-content" style={{ padding: '15px', background: '#fcfcfc', borderRadius: '4px', border: '1px solid #eee' }}>
              {error && <div className="erp-error-banner" style={{ marginBottom: '10px' }}>{error}</div>}
              {success && <div className="erp-success-banner" style={{ marginBottom: '10px' }}>{success}</div>}
              
              <div className="erp-form-row-compact-3">
                <div className="erp-form-group">
                  <label className="erp-form-label">Entry No.</label>
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
                    onFocus={() => handleManualFocus('payment', 'date')}
                    disabled={!isEditing}
                  />
                </div>
                <div className="erp-form-group">
                  <label className="erp-form-label">Voucher Type</label>
                  <select 
                    name="type"
                    className="erp-input" 
                    value={formData.type} 
                    onChange={handleInputChange}
                    onFocus={() => handleManualFocus('payment', 'type')}
                    disabled={!isEditing}
                  >
                    <option value="Debit">Debit (Payment Out)</option>
                    <option value="Credit">Credit (Refund In)</option>
                  </select>
                </div>
              </div>

              <div className="erp-form-row-compact-2" style={{ marginTop: '10px' }}>
                <div className="erp-form-group">
                  <label className="erp-form-label required">Customer / Payee</label>
                  <input 
                    type="text" 
                    name="customer_name"
                    className="erp-input" 
                    value={formData.customer_name} 
                    onChange={handleInputChange} 
                    placeholder="Search or enter name" 
                    onFocus={() => handleManualFocus('payment', 'customer_name')}
                    disabled={!isEditing}
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
                    onFocus={() => handleManualFocus('payment', 'customer_phone')}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="erp-form-row-compact-4" style={{ marginTop: '10px' }}>
                <div className="erp-form-group">
                  <label className="erp-form-label required">Account</label>
                  <select 
                    name="account_name"
                    className="erp-input" 
                    value={formData.account_name} 
                    onChange={handleInputChange}
                    onFocus={() => handleManualFocus('payment', 'account_name')}
                    disabled={!isEditing}
                  >
                    <option value="">Select Account</option>
                    {accounts.map(acc => <option key={acc} value={acc}>{acc}</option>)}
                  </select>
                </div>
                <div className="erp-form-group">
                  <label className="erp-form-label required">Amount (₹)</label>
                  <input 
                    type="number" 
                    name="amount"
                    className="erp-input" 
                    value={formData.amount} 
                    onChange={handleInputChange} 
                    placeholder="0.00" 
                    style={{ fontWeight: 'bold' }}
                    onFocus={() => handleManualFocus('payment', 'amount')}
                    disabled={!isEditing}
                  />
                </div>
                <div className="erp-form-group">
                  <label className="erp-form-label">Mode</label>
                  <select 
                    name="payment_mode"
                    className="erp-input" 
                    value={formData.payment_mode} 
                    onChange={handleInputChange}
                    onFocus={() => handleManualFocus('payment', 'payment_mode')}
                    disabled={!isEditing}
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
                    placeholder="Chq/UTR No." 
                    onFocus={() => handleManualFocus('payment', 'ref_number')}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="erp-form-group" style={{ marginTop: '10px' }}>
                <label className="erp-form-label" style={{ display: 'block', textAlign: 'left', marginBottom: '2px' }}>Transaction Narration</label>
                <textarea 
                  name="narration"
                  className="erp-input" 
                  style={{ height: '50px', resize: 'none', width: '100%' }}
                  value={formData.narration}
                  onChange={handleInputChange}
                  placeholder="Enter specific details for this payment..."
                  onFocus={() => handleManualFocus('payment', 'narration')}
                  disabled={!isEditing}
                  onKeyDown={(e) => {
                    if (e.key === 'Tab' && !e.shiftKey && isEditing) {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowSaveModal(true);
                    }
                  }}
                />
              </div>
            </div>
            
            {/* Audit Section */}
            <div className="erp-audit-section" style={{ marginTop: '15px' }}>
              <div className="erp-audit-row">
                <label className="erp-audit-label">Entered On</label>
                <input type="text" className="erp-audit-input" value={auditData.enteredOn || ''} readOnly />
                <label className="erp-audit-label">Entered By</label>
                <input type="text" className="erp-audit-input" value={auditData.enteredBy || ''} readOnly />
              </div>
              <div className="erp-audit-row">
                <label className="erp-audit-label">Modified On</label>
                <input type="text" className="erp-audit-input" value={auditData.modifiedOn || ''} readOnly />
                <label className="erp-audit-label">Modified By</label>
                <input type="text" className="erp-audit-input" value={auditData.modifiedBy || ''} readOnly />
              </div>
            </div>
          </div>

          {/* Grid Panel */}
          <div className="layout-grid-section" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            <div className="erp-panel-header">
              PAYMENT VOUCHER HISTORY
              {loading && <span style={{ marginLeft: '10px', fontSize: '11px', color: '#666' }}>loading...</span>}
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #ddd', backgroundColor: '#fff' }}>
              <table className="erp-table">
                <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f5f5f5', zIndex: 1 }}>
                  <tr>
                    <th style={{ width: '100px' }}>Date</th>
                    <th style={{ width: '120px' }}>Entry No</th>
                    <th>Payee Name</th>
                    <th>Account</th>
                    <th style={{ width: '100px' }}>Mode</th>
                    <th className="text-right" style={{ width: '150px' }}>Amount (₹)</th>
                    <th style={{ width: '80px' }}>Type</th>
                    <th>Ref No</th>
                    <th style={{ width: '90px' }}>History</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentRecords.length > 0 ? paymentRecords.map((r, i) => {
                    const isSelected = selectedRecord && selectedRecord.py_pymtid === r.py_pymtid;
                    return (
                      <tr 
                        key={r.py_pymtid || i}
                        className={isSelected ? 'selected' : ''}
                        onClick={() => handleRecordSelect(r)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>{new Date(r.py_date || r.date).toLocaleDateString()}</td>
                        <td className="font-bold">{r.py_entry_no || r.receipt_no}</td>
                        <td>{r.py_customer_name || r.customer_name}</td>
                        <td>{r.py_bank_account || r.account_name}</td>
                        <td>{r.py_payment_mode || 'Cash'}</td>
                        <td className="text-right font-bold" style={{ color: '#c62828' }}>
                          ₹{parseFloat(r.py_amount || r.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td>
                          <span className={`erp-status-badge ${r.py_entry_type === 'Debit' ? 'status-cancelled' : 'status-active'}`}>
                            {r.py_entry_type || r.type}
                          </span>
                        </td>
                        <td>{r.py_ref_number || r.ref_number}</td>
                        <td>
                          {r.py_pymtid && (
                            <AuditHistoryButton
                              module="Payment"
                              recordId={r.py_pymtid}
                              label="History"
                            />
                          )}
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr><td colSpan="9" style={{ textAlign: 'center', padding: '20px' }}>No historical records found</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <PaginationControls
              pagination={pagination}
              onPageChange={setPage}
              limit={limit}
              onLimitChange={changeLimit}
              onPrev={prevPage}
              onNext={nextPage}
            />
          </div>
        </div>
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

export default PaymentForm;
