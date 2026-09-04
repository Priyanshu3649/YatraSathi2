import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useKeyboardNavigation } from '../../contexts/KeyboardNavigationContext';
import { usePagination } from '../../hooks/usePagination';
import useERPFilters from '../../hooks/useERPFilters';
import PaginationControls from '../common/PaginationControls';
import SaveConfirmationModal from '../common/SaveConfirmationModal';
import { receiptAPI, reconciliationAPI } from '../../services/api';
import { printVoucher } from '../../utils/paymentPrintUtils';
import '../../styles/vintage-erp-theme.css';

const ReceiptForm = ({ onBack, autoFillData }) => {
  const [autoFillReadOnly, setAutoFillReadOnly] = useState(false);
  const { user } = useAuth();
  const {
    registerForm,
    unregisterForm,
    setActiveForm,
    handleManualFocus
  } = useKeyboardNavigation();
  
  const [formData, setFormData] = useState({
    utr_number: '',
    payment_proof: null,
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

  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isReconciling, setIsReconciling] = useState(false);
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

  const {
    draftFilters: inlineFilters,
    activeFilters,
    handleFilterChange: handleInlineFilterChange,
    applyFiltersManual: applyFilters,
    clearFiltersManual: clearFilters
  } = useERPFilters({
    rc_date: '',
    rc_entry_no: '',
    rc_customer_name: '',
    rc_customer_phone: '',
    rc_bank_account: '',
    rc_payment_mode: '',
    rc_amount: '',
    rc_ref_number: '',
    rc_narration: '',
    utr_number: ''
  }, () => {
    setPage(1);
  }, { 
    realTime: true, 
    debounceMs: 500 
  });

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
    'narration',
    'utr_number',
    'payment_proof'
  ], []);

  // Registry for keyboard navigation
  useEffect(() => {
    if (autoFillData) {
      setFormData(prev => ({
        ...prev,
        customer_name: autoFillData.customer_name || prev.customer_name,
        customer_phone: autoFillData.customer_phone || prev.customer_phone
      }));
      setAutoFillReadOnly(true);
      setIsEditing(true);
    }
  }, [autoFillData]);

  useEffect(() => {
    registerForm('receipt', fieldOrder);
    setActiveForm('receipt');
    return () => unregisterForm('receipt');
  }, [fieldOrder, registerForm, unregisterForm, setActiveForm]);

  const fetchReceipts = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        ...activeFilters
      };
      const response = await receiptAPI.getAllReceipts(params);
      setReceipts(response.data || []);
      updatePagination(response.pagination);
    } catch (err) {
      console.error('Error fetching receipts:', err);
      setError('Failed to load receipts history');
    } finally {
      setLoading(false);
    }
  }, [page, limit, activeFilters, updatePagination]);

  useEffect(() => {
    fetchReceipts();
  }, [page, limit, fetchReceipts]);

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
    const { name, value, files } = e.target;
    if (name === 'payment_proof' && files && files.length > 0) {
      setFormData(prev => ({
        ...prev,
        payment_proof: files[0]
      }));
    } else {
      setFormData(prev => {
        const updated = { ...prev, [name]: value };
        if (name === 'type' && isEditing && !selectedRecord) {
          updated.receipt_no = generateTempReceiptNo(value);
        }
        return updated;
      });
    }
    setError('');
  };

  const handleRecordSelect = useCallback((record) => {
    if (!record) return;
    setSelectedRecord(record);
    setFormData({
      receipt_no: record.rc_entry_no || '',
      date: record.rc_date || record.date || '',
      type: 'Credit',
      customer_name: record.rc_customer_name || '',
      customer_id: '',
      customer_phone: record.rc_customer_phone || '',
      account_name: record.rc_bank_account || record.account_name || '',
      amount: record.rc_amount || record.amount || '',
      payment_mode: record.rc_payment_mode || record.payment_mode || 'Cash',
      ref_number: record.rc_ref_number || record.ref_number || '',
      narration: record.rc_narration || record.narration || '',
      utr_number: record.utr_number || '',
      payment_proof: null
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
      receipt_no: generateTempReceiptNo('Credit'),
      date: new Date().toISOString().split('T')[0],
      type: 'Credit',
      customer_name: '',
      customer_id: '',
      customer_phone: '',
      account_name: '',
      amount: '',
      payment_mode: 'Cash',
      ref_number: '',
      narration: '',
      utr_number: '',
      payment_proof: null
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
        receipt_no: selectedRecord.rc_entry_no || '',
        date: selectedRecord.rc_date || selectedRecord.date || '',
        type: selectedRecord.rc_entry_type || 'Credit',
        customer_name: selectedRecord.rc_customer_name || '',
        customer_id: selectedRecord.rc_customer_id || '',
        customer_phone: selectedRecord.rc_customer_phone || '',
        account_name: selectedRecord.rc_bank_account || selectedRecord.account_name || '',
        amount: selectedRecord.rc_amount || selectedRecord.amount || '',
        payment_mode: selectedRecord.rc_payment_mode || selectedRecord.payment_mode || 'Cash',
        ref_number: selectedRecord.rc_ref_number || selectedRecord.ref_number || '',
        narration: selectedRecord.rc_narration || selectedRecord.narration || '',
        utr_number: selectedRecord.utr_number || '',
        payment_proof: null
      });
      setIsEditing(false);
    } else {
      if (receipts.length > 0) {
        handleRecordSelect(receipts[0]);
      } else {
        setIsEditing(false);
      }
    }
    setError('');
    setSuccess('');
  };

  const handleDelete = async () => {
    if (!selectedRecord) return;
    if (window.confirm('Are you sure you want to delete this receipt entry?')) {
      try {
        setLoading(true);
        await receiptAPI.deleteReceipt(selectedRecord.rc_rcid);
        setSuccess('Receipt entry deleted successfully');
        setSelectedRecord(null);
        handleNew();
        fetchReceipts();
      } catch (err) {
        console.error('Error deleting receipt:', err);
        setError(err.message || 'Failed to delete receipt entry');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleReconcile = async () => {
    if (!selectedRecord) return;
    const remarks = window.prompt('Enter reconciliation remarks (optional):', 'Reconciled');
    if (remarks === null) return;
    const bankRef = window.prompt('Enter Bank Statement Reference (optional):', '');
    if (bankRef === null) return;

    try {
      setLoading(true);
      await reconciliationAPI.reconcileReceipt(selectedRecord.rc_rcid, remarks, bankRef);
      setSuccess('Receipt reconciled successfully');
      // If filtering out active only, deselect
      if (inlineFilters['reconciliationStatus'] === 'ACTIVE' || !inlineFilters['reconciliationStatus']) {
        setSelectedRecord(null);
        handleNew();
      }
      fetchReceipts();
    } catch (err) {
      console.error('Error reconciling receipt:', err);
      setError(err.message || 'Failed to reconcile receipt');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkReconcile = async () => {
    if (selectedIds.length === 0) return;
    try {
      setIsReconciling(true);
      await reconciliationAPI.bulkReconcileReceipts(selectedIds, 'Reconciled');
      setSuccess(`${selectedIds.length} receipt(s) reconciled successfully`);
      setSelectedIds([]);
      fetchReceipts();
    } catch (err) {
      console.error('Reconciliation error:', err);
      setError(err.message || 'Failed to reconcile receipts');
    } finally {
      setIsReconciling(false);
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
      
      const payload = new FormData();
      payload.append('rc_customer_name', formData.customer_name);
      payload.append('rc_customer_phone', formData.customer_phone);
      payload.append('rc_amount', formData.amount);
      payload.append('rc_payment_mode', formData.payment_mode);
      payload.append('rc_ref_number', formData.utr_number);
      payload.append('rc_bank_account', formData.account_name);
      payload.append('rc_narration', formData.narration || `Receipt from ${formData.customer_name}`);
      if (formData.utr_number) {
        payload.append('utr_number', formData.utr_number);
      }
      if (formData.payment_proof) {
        payload.append('payment_proof', formData.payment_proof);
      }
      
      let response;
      if (selectedRecord) {
        // Edit Mode -> Update
        response = await receiptAPI.updateReceipt(selectedRecord.rc_rcid, payload);
        setSuccess('Receipt entry updated successfully');
      } else {
        // New Mode -> Create
        response = await receiptAPI.createReceipt(payload);
        setSuccess('Receipt entry saved successfully');
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
        fetchReceipts();
      }, 1500);
    } catch (err) {
      console.error('Error saving receipt:', err);
      setError(err.message || 'Failed to save receipt');
    } finally {
      setLoading(false);
    }
  };

  const handleNavigation = useCallback((direction) => {
    if (receipts.length === 0) return;
    let newIndex = 0;
    if (selectedRecord) {
      const currentIndex = receipts.findIndex(r => r.rc_rcid === selectedRecord.rc_rcid);
      switch(direction) {
        case 'first': newIndex = 0; break;
        case 'prev': newIndex = currentIndex > 0 ? currentIndex - 1 : 0; break;
        case 'next': newIndex = currentIndex < receipts.length - 1 ? currentIndex + 1 : receipts.length - 1; break;
        case 'last': newIndex = receipts.length - 1; break;
        default: break;
      }
    }
    handleRecordSelect(receipts[newIndex]);
  }, [receipts, selectedRecord, handleRecordSelect]);

  // Scroll selected row into view
  useEffect(() => {
    if (selectedRecord) {
      setTimeout(() => {
        const selectedRow = document.querySelector('.selected-row');
        if (selectedRow) {
          selectedRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 50);
    }
  }, [selectedRecord]);

  // Keyboard navigation handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isInFormField = e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA';
      
      if (!isInFormField) {
        switch (e.key) {
          case 'ArrowUp':
            e.preventDefault();
            if (receipts.length > 0) {
              const currentIdx = selectedRecord ? receipts.findIndex(r => r.rc_rcid === selectedRecord.rc_rcid) : -1;
              const newIdx = currentIdx > 0 ? currentIdx - 1 : 0;
              handleRecordSelect(receipts[newIdx]);
            }
            break;
          case 'ArrowDown':
            e.preventDefault();
            if (receipts.length > 0) {
              const currentIdx = selectedRecord ? receipts.findIndex(r => r.rc_rcid === selectedRecord.rc_rcid) : -1;
              const newIdx = currentIdx < receipts.length - 1 ? currentIdx + 1 : receipts.length - 1;
              handleRecordSelect(receipts[newIdx]);
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
  }, [receipts, selectedRecord, isEditing, pagination, nextPage, prevPage, onBack, handleRecordSelect]);

  const isFirstRecord = selectedRecord && receipts.length > 0 && receipts[0].rc_rcid === selectedRecord.rc_rcid;
  const isLastRecord = selectedRecord && receipts.length > 0 && receipts[receipts.length - 1].rc_rcid === selectedRecord.rc_rcid;

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
        <button className="erp-button" onClick={handleReconcile} disabled={!selectedRecord || selectedRecord.is_reconciled} title="Reconcile Receipt">Reconcile</button>
        <button
          className="erp-button"
          onClick={handleBulkReconcile}
          disabled={selectedIds.length === 0 || isReconciling}
          title="Bulk reconcile checked receipts"
          style={selectedIds.length > 0 ? { background: '#2e7d32', color: '#fff' } : {}}
        >
          {isReconciling ? 'Reconciling...' : `Reconcile${selectedIds.length > 0 ? ` (${selectedIds.length})` : ' All'}`}
        </button>
        <button className="erp-button" onClick={() => printVoucher(selectedRecord, 'receipt')} disabled={!selectedRecord} title="Export to PDF">Export PDF</button>
        <div className="erp-tool-separator"></div>
        <button className="erp-button" onClick={() => setShowSaveModal(true)} disabled={!isEditing} title="Save (F10)">Save</button>
        <button className="erp-button" onClick={handleCancel} disabled={!isEditing} title="Cancel">Cancel</button>
        <button className="erp-button" onClick={fetchReceipts} title="Refresh">Refresh</button>
        <div className="erp-tool-separator"></div>
        <select 
           className="erp-input" 
           style={{ padding: '2px 8px', fontSize: '11px', width: 'auto' }}
           value={inlineFilters['reconciliationStatus'] || 'ACTIVE'} 
           onChange={(e) => handleInlineFilterChange('reconciliationStatus', e.target.value)}
        >
           <option value="ACTIVE">Active (Default)</option>
           <option value="RECONCILED">Reconciled</option>
           <option value="ALL">All</option>
        </select>
        <div style={{ flex: 1 }}></div>
        <div style={{ fontWeight: 'bold', fontSize: '12px' }}>
          {isEditing ? (selectedRecord ? 'EDIT MODE' : 'NEW RECORD') : 'READY'} | Total Records: {pagination.totalRecords || receipts.length}
        </div>
      </div>

      {/* Main Content (Stacked Form & Grid) */}
      <div className="layout-content-wrapper" style={{ display: 'flex', flex: 1, flexDirection: 'column', overflow: 'hidden' }}>
        <div className="layout-main-column" style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%' }}>
          
          {/* Form Panel */}
          <div className="layout-form-section" style={{ padding: '15px', backgroundColor: '#fcfcfc', borderBottom: '1px solid #ddd' }}>
            <div className="erp-panel-header">RECEIPT VOUCHER ENTRY</div>
            <div className="erp-form-content" style={{ padding: '15px', background: '#f8f8f8', borderRadius: '4px', border: '1px solid #eee' }}>
              {error && <div className="erp-error-banner" style={{ marginBottom: '10px' }}>{error}</div>}
              {success && <div className="erp-success-banner" style={{ marginBottom: '10px' }}>{success}</div>}
              
              {/* Row 1: Header Info */}
              <div className="erp-form-row-compact-3">
                <div className="erp-form-group">
                  <label className="erp-form-label">Date</label>
                  <input 
                    type="date" 
                    name="date"
                    className="erp-input" 
                    value={formData.date} 
                    onChange={handleInputChange} 
                    onFocus={() => handleManualFocus('receipt', 'date')}
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
                    onFocus={() => handleManualFocus('receipt', 'type')}
                    disabled={!isEditing}
                  >
                    <option value="Credit">Credit (Receipt In)</option>
                    <option value="Debit">Debit (Refund Out)</option>
                  </select>
                </div>
                <div className="erp-form-group" style={{ visibility: 'hidden' }}>
                   {/* Spacing alignment */}
                </div>
              </div>

              <div className="erp-form-row-compact-2 erp-payment-customer-row" style={{ marginTop: '10px' }}>
                <div className="erp-form-group">
                  <label className="erp-form-label required">Customer / Payee</label>
                  <input 
                    type="text" 
                    name="customer_name"
                    className="erp-input" 
                    value={formData.customer_name} 
                    onChange={handleInputChange} 
                    placeholder="Search or enter name" 
                    onFocus={() => handleManualFocus('receipt', 'customer_name')}
                    disabled={!isEditing || (typeof autoFillReadOnly !== 'undefined' && autoFillReadOnly)}
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
                    disabled={!isEditing || (typeof autoFillReadOnly !== 'undefined' && autoFillReadOnly)}
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
                    onFocus={() => handleManualFocus('receipt', 'account_name')}
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
                    onFocus={() => handleManualFocus('receipt', 'amount')}
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
                    onFocus={() => handleManualFocus('receipt', 'payment_mode')}
                    disabled={!isEditing}
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
                <div className="erp-form-group">
                  <label className="erp-form-label">UTR Number</label>
                  <input 
                    type="text" 
                    name="utr_number"
                    className="erp-input" 
                    value={formData.utr_number}
                    onChange={handleInputChange}
                    placeholder="Enter UTR if applicable..."
                    onFocus={() => handleManualFocus('receipt', 'utr_number')}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="erp-form-row-compact-2" style={{ marginTop: '10px' }}>
                <div className="erp-form-group">
                  <label className="erp-form-label" style={{ display: 'block', textAlign: 'left', marginBottom: '2px' }}>Payment Proof (Image)</label>
                  <input 
                    type="file" 
                    name="payment_proof"
                    className="erp-input" 
                    onChange={handleInputChange}
                    onFocus={() => handleManualFocus('receipt', 'payment_proof')}
                    disabled={!isEditing}
                    accept="image/*"
                  />
                  {selectedRecord?.attachment_path && (
                    <div style={{ marginTop: '5px', fontSize: '12px' }}>
                      <a href={selectedRecord.attachment_path} target="_blank" rel="noopener noreferrer">View Current Proof</a>
                    </div>
                  )}
                </div>
                <div className="erp-form-group">
                  <label className="erp-form-label" style={{ display: 'block', textAlign: 'left', marginBottom: '2px' }}>Transaction Narration</label>
                  <textarea 
                    name="narration"
                    className="erp-input" 
                    style={{ height: '50px', resize: 'none', width: '100%' }}
                    value={formData.narration}
                    onChange={handleInputChange}
                    placeholder="Enter specific details for this payment..."
                    onFocus={() => handleManualFocus('receipt', 'narration')}
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
              RECEIPT VOUCHER HISTORY
              {loading && <span style={{ marginLeft: '10px', fontSize: '11px', color: '#666' }}>loading...</span>}
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #ddd', backgroundColor: '#fff' }}>
              <table className="erp-table">
                <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f5f5f5', zIndex: 1 }}>
                  <tr>
                    <th style={{ width: '30px' }}>
                      <input
                        type="checkbox"
                        title="Select all unreconciled"
                        checked={receipts.filter(r => !r.is_reconciled).length > 0 && selectedIds.length === receipts.filter(r => !r.is_reconciled).length}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedIds(receipts.filter(r => !r.is_reconciled).map(r => r.rc_rcid));
                          else setSelectedIds([]);
                        }}
                        disabled={receipts.filter(r => !r.is_reconciled).length === 0}
                      />
                    </th>
                    <th style={{ width: '100px' }}>Date</th>
                    <th style={{ width: '120px' }}>Voucher No</th>
                    <th>Customer Name</th>
                    <th>Customer Phone</th>
                    <th>Account</th>
                    <th style={{ width: '100px' }}>Mode</th>
                    <th className="text-right" style={{ width: '150px' }}>Amount (₹)</th>
                    <th>Reference</th>
                  </tr>
                  {/* Inline Filter Row */}
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <td style={{ textAlign: 'center', fontSize: '10px', color: '#888' }}>{selectedIds.length > 0 ? `${selectedIds.length}✓` : ''}</td>
                    <td>
                      <input 
                        type="text" 
                        placeholder="Filter Date..."
                        value={inlineFilters.rc_date || ''}
                        onChange={(e) => handleInlineFilterChange('rc_date', e.target.value)}
                        className="inline-filter-input"
                        style={{ width: '100%', padding: '2px 4px', fontSize: '11px', border: '1px solid #ddd' }}
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        placeholder="Filter Voucher No..."
                        value={inlineFilters.rc_entry_no || ''}
                        onChange={(e) => handleInlineFilterChange('rc_entry_no', e.target.value)}
                        className="inline-filter-input"
                        style={{ width: '100%', padding: '2px 4px', fontSize: '11px', border: '1px solid #ddd' }}
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        placeholder="Filter Customer..."
                        value={inlineFilters.rc_customer_name || ''}
                        onChange={(e) => handleInlineFilterChange('rc_customer_name', e.target.value)}
                        className="inline-filter-input"
                        style={{ width: '100%', padding: '2px 4px', fontSize: '11px', border: '1px solid #ddd' }}
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        placeholder="Filter Phone..."
                        value={inlineFilters.rc_customer_phone || ''}
                        onChange={(e) => handleInlineFilterChange('rc_customer_phone', e.target.value)}
                        className="inline-filter-input"
                        style={{ width: '100%', padding: '2px 4px', fontSize: '11px', border: '1px solid #ddd' }}
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        placeholder="Filter Account..."
                        value={inlineFilters.rc_bank_account || ''}
                        onChange={(e) => handleInlineFilterChange('rc_bank_account', e.target.value)}
                        className="inline-filter-input"
                        style={{ width: '100%', padding: '2px 4px', fontSize: '11px', border: '1px solid #ddd' }}
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        placeholder="Filter Mode..."
                        value={inlineFilters.rc_payment_mode || ''}
                        onChange={(e) => handleInlineFilterChange('rc_payment_mode', e.target.value)}
                        className="inline-filter-input"
                        style={{ width: '100%', padding: '2px 4px', fontSize: '11px', border: '1px solid #ddd' }}
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        placeholder="Filter Amount..."
                        value={inlineFilters.rc_amount || ''}
                        onChange={(e) => handleInlineFilterChange('rc_amount', e.target.value)}
                        className="inline-filter-input"
                        style={{ width: '100%', padding: '2px 4px', fontSize: '11px', border: '1px solid #ddd' }}
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        placeholder="Filter Ref..."
                        value={inlineFilters.rc_ref_number || ''}
                        onChange={(e) => handleInlineFilterChange('rc_ref_number', e.target.value)}
                        className="inline-filter-input"
                        style={{ width: '100%', padding: '2px 4px', fontSize: '11px', border: '1px solid #ddd' }}
                      />
                    </td>
                  </tr>
                </thead>
                <tbody>
                  {receipts.length > 0 ? receipts.map((r, i) => {
                    const isSelected = selectedRecord && selectedRecord.rc_rcid === r.rc_rcid;
                    return (
                        <tr 
                        key={r.rc_rcid || i}
                        className={`${isSelected ? 'selected' : ''} ${r.is_reconciled ? 'reconciled-row' : ''}`}
                        onClick={() => handleRecordSelect(r)}
                        style={{ cursor: 'pointer', opacity: r.is_reconciled ? 0.6 : 1, backgroundColor: r.is_reconciled ? '#f5f5f5' : '' }}
                      >
                        <td onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(r.rc_rcid)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedIds(prev => [...prev, r.rc_rcid]);
                              else setSelectedIds(prev => prev.filter(id => id !== r.rc_rcid));
                            }}
                            disabled={!!r.is_reconciled}
                          />
                        </td>
                        <td>{new Date(r.rc_date || r.date).toLocaleDateString()}</td>
                        <td className="font-bold">{r.rc_entry_no || r.receipt_no}</td>
                        <td>{r.rc_customer_name || r.customer_name}</td>
                        <td>{r.rc_customer_phone || ''}</td>
                        <td>{r.rc_bank_account || r.account_name}</td>
                        <td>{r.rc_payment_mode || 'Cash'}</td>
                        <td className="text-right font-bold" style={{ color: '#006400' }}>
                          ₹{parseFloat(r.rc_amount || r.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td>{r.rc_ref_number || r.ref_number}</td>
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

export default ReceiptForm;
