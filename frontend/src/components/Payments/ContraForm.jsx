import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useKeyboardNavigation } from '../../contexts/KeyboardNavigationContext';
import { usePagination } from '../../hooks/usePagination';
import useERPFilters from '../../hooks/useERPFilters';
import PaginationControls from '../common/PaginationControls';
import SaveConfirmationModal from '../common/SaveConfirmationModal';
import { contraAPI, reconciliationAPI } from '../../services/api';
import { printVoucher } from '../../utils/paymentPrintUtils';
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
    utr_number: '',
    payment_proof: null,
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
    ct_date: '',
    ct_entry_no: '',
    ct_from_account: '',
    ct_to_account: '',
    ct_amount: '',
    ct_ref_number: '',
    utr_number: ''
  }, () => {
    setPage(1);
  }, { 
    realTime: true, 
    debounceMs: 500 
  });

  const fieldOrder = useMemo(() => [
    'date', 
    'from_account', 
    'to_account', 
    'amount', 
    'ref_number', 
    'narration'
  ], []);

  // Registry for keyboard navigation
  useEffect(() => {
    registerForm('contra', fieldOrder);
    setActiveForm('contra');
    return () => unregisterForm('contra');
  }, [fieldOrder, registerForm, unregisterForm, setActiveForm]);

  const fetchContras = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        ...activeFilters
      };
      const response = await contraAPI.getAllContras(params);
      setPaymentRecords(response.data || []);
      updatePagination(response.pagination);
    } catch (err) {
      console.error('Error fetching contras:', err);
      setError('Failed to load contra history');
    } finally {
      setLoading(false);
    }
  }, [page, limit, activeFilters, updatePagination]);

  useEffect(() => {
    fetchContras();
  }, [page, limit, fetchContras]);

  // Generate a temporary Contra Number if creating new
  const generateTempContraNo = useCallback(() => {
    const date = new Date();
    return `CT${date.getTime().toString().slice(-8)}`;
  }, []);

  useEffect(() => {
    if (!formData.contra_no && isEditing && !selectedRecord) {
      setFormData(prev => ({
        ...prev,
        contra_no: generateTempContraNo()
      }));
    }
  }, [isEditing, selectedRecord, formData.contra_no, generateTempContraNo]);

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'payment_proof' && files && files.length > 0) {
      setFormData(prev => ({ ...prev, payment_proof: files[0] }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    setError('');
  };

  const handleRecordSelect = useCallback((record) => {
    if (!record) return;
    setSelectedRecord(record);
    setFormData({
      contra_no: record.ct_entry_no || '',
      date: record.ct_date || record.date || '',
      from_account: record.ct_from_account || record.from_account || '',
      to_account: record.ct_to_account || record.to_account || '',
      amount: record.ct_amount || record.amount || '',
      ref_number: record.ct_ref_number || record.ref_number || '',
      narration: record.ct_narration || record.narration || '',
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
      contra_no: generateTempContraNo(),
      date: new Date().toISOString().split('T')[0],
      from_account: '',
      to_account: '',
      amount: '',
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
        contra_no: selectedRecord.py_entry_no || '',
        date: selectedRecord.py_date || selectedRecord.date || '',
        from_account: selectedRecord.py_from_account || selectedRecord.from_account || '',
        to_account: selectedRecord.py_bank_account || selectedRecord.account_name || '',
        amount: selectedRecord.py_amount || selectedRecord.amount || '',
        ref_number: selectedRecord.py_ref_number || selectedRecord.ref_number || '',
        narration: selectedRecord.py_narration || selectedRecord.narration || '',
        utr_number: selectedRecord.utr_number || '',
        payment_proof: null
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
    if (window.confirm('Are you sure you want to delete this contra entry?')) {
      try {
        setLoading(true);
        await contraAPI.deleteContra(selectedRecord.ct_ctid);
        setSuccess('Contra entry deleted successfully');
        setSelectedRecord(null);
        handleNew();
        fetchContras();
      } catch (err) {
        console.error('Error deleting contra:', err);
        setError(err.message || 'Failed to delete contra entry');
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
      await reconciliationAPI.reconcileContra(selectedRecord.ct_ctid, remarks, bankRef);
      setSuccess('Contra reconciled successfully');
      if (inlineFilters['reconciliationStatus'] === 'ACTIVE' || !inlineFilters['reconciliationStatus']) {
        setSelectedRecord(null);
        handleNew();
      }
      fetchContras();
    } catch (err) {
      console.error('Error reconciling contra:', err);
      setError(err.message || 'Failed to reconcile contra');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkReconcile = async () => {
    if (selectedIds.length === 0) return;
    try {
      setIsReconciling(true);
      await reconciliationAPI.bulkReconcileContra(selectedIds, 'Reconciled');
      setSuccess(`${selectedIds.length} contra entry/entries reconciled successfully`);
      setSelectedIds([]);
      fetchContras();
    } catch (err) {
      console.error('Reconciliation error:', err);
      setError(err.message || 'Failed to reconcile contra entries');
    } finally {
      setIsReconciling(false);
    }
  };

  const handleSave = async () => {
    if (!formData.from_account || !formData.to_account || !formData.amount) {
      setError('Required fields are missing (From Account, To Account, Amount)');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const payload = new FormData();
      payload.append('ct_from_account', formData.from_account);
      payload.append('ct_to_account', formData.to_account);
      payload.append('ct_amount', formData.amount);
      payload.append('ct_ref_number', formData.ref_number);
      payload.append('ct_narration', formData.narration || `Contra: ${formData.from_account} to ${formData.to_account}`);
      if (formData.utr_number) {
        payload.append('utr_number', formData.utr_number);
      }
      if (formData.payment_proof) {
        payload.append('payment_proof', formData.payment_proof);
      }

      let response;
      if (selectedRecord) {
        // Edit Mode -> Update
        response = await contraAPI.updateContra(selectedRecord.ct_ctid, payload);
        setSuccess('Contra entry updated successfully');
      } else {
        // New Mode -> Create
        response = await contraAPI.createContra(payload);
        setSuccess('Contra entry saved successfully');
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
        fetchContras();
      }, 1500);
    } catch (err) {
      console.error('Error saving contra:', err);
      setError(err.message || 'Failed to save contra entry');
    } finally {
      setLoading(false);
    }
  };

  const handleNavigation = useCallback((direction) => {
    if (paymentRecords.length === 0) return;
    let newIndex = 0;
    if (selectedRecord) {
      const currentIndex = paymentRecords.findIndex(r => r.ct_ctid === selectedRecord.ct_ctid);
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
            if (paymentRecords.length > 0) {
              const currentIdx = selectedRecord ? paymentRecords.findIndex(r => r.ct_ctid === selectedRecord.ct_ctid) : -1;
              const newIdx = currentIdx > 0 ? currentIdx - 1 : 0;
              handleRecordSelect(paymentRecords[newIdx]);
            }
            break;
          case 'ArrowDown':
            e.preventDefault();
            if (paymentRecords.length > 0) {
              const currentIdx = selectedRecord ? paymentRecords.findIndex(r => r.ct_ctid === selectedRecord.ct_ctid) : -1;
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

  const isFirstRecord = selectedRecord && paymentRecords.length > 0 && paymentRecords[0].ct_ctid === selectedRecord.ct_ctid;
  const isLastRecord = selectedRecord && paymentRecords.length > 0 && paymentRecords[paymentRecords.length - 1].ct_ctid === selectedRecord.ct_ctid;

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
        <button className="erp-button" onClick={handleReconcile} disabled={!selectedRecord || selectedRecord.is_reconciled} title="Reconcile Contra">Reconcile</button>
        <button
          className="erp-button"
          onClick={handleBulkReconcile}
          disabled={selectedIds.length === 0 || isReconciling}
          title="Bulk reconcile checked contra entries"
          style={selectedIds.length > 0 ? { background: '#2e7d32', color: '#fff' } : {}}
        >
          {isReconciling ? 'Reconciling...' : `Reconcile${selectedIds.length > 0 ? ` (${selectedIds.length})` : ' All'}`}
        </button>
        <button className="erp-button" onClick={() => printVoucher(selectedRecord, 'contra')} disabled={!selectedRecord} title="Export to PDF">Export PDF</button>
        <div className="erp-tool-separator"></div>
        <button className="erp-button" onClick={() => setShowSaveModal(true)} disabled={!isEditing} title="Save (F10)">Save</button>
        <button className="erp-button" onClick={handleCancel} disabled={!isEditing} title="Cancel">Cancel</button>
        <button className="erp-button" onClick={fetchContras} title="Refresh">Refresh</button>
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
          {isEditing ? (selectedRecord ? 'EDIT MODE' : 'NEW RECORD') : 'READY'} | Total Records: {pagination.totalRecords || paymentRecords.length}
        </div>
      </div>

      {/* Main Content (Stacked Form & Grid) */}
      <div className="layout-content-wrapper" style={{ display: 'flex', flex: 1, flexDirection: 'column', overflow: 'hidden' }}>
        <div className="layout-main-column" style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%' }}>
          
          {/* Form Panel */}
          <div className="layout-form-section" style={{ padding: '15px', backgroundColor: '#fcfcfc', borderBottom: '1px solid #ddd' }}>
            <div className="erp-panel-header">CONTRA VOUCHER ENTRY (FUND TRANSFER)</div>
            <div className="erp-form-content" style={{ padding: '15px', background: '#f5f5f5', borderRadius: '4px' }}>
              {error && <div className="erp-error-banner" style={{ marginBottom: '10px' }}>{error}</div>}
              {success && <div className="erp-success-banner" style={{ marginBottom: '10px' }}>{success}</div>}
              
              <div className="erp-form-row-compact-3">
                <div className="erp-form-group">
                  <label className="erp-form-label">Receipt No</label>
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
                    onFocus={() => handleManualFocus('contra', 'date')}
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
                    onFocus={() => handleManualFocus('contra', 'type')}
                    disabled={!isEditing}
                  >
                    <option value="Contra">Contra (Bank/Cash Transfer)</option>
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
                    onFocus={() => handleManualFocus('contra', 'customer_name')}
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
                    onFocus={() => handleManualFocus('contra', 'customer_phone')}
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
                    onFocus={() => handleManualFocus('contra', 'account_name')}
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
                    onFocus={() => handleManualFocus('contra', 'amount')}
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
                    onFocus={() => handleManualFocus('contra', 'payment_mode')}
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
                    onFocus={() => handleManualFocus('contra', 'utr_number')}
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
                    onFocus={() => handleManualFocus('contra', 'payment_proof')}
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
                    onFocus={() => handleManualFocus('contra', 'narration')}
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
              CONTRA VOUCHER HISTORY
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
                        checked={paymentRecords.filter(r => !r.is_reconciled).length > 0 && selectedIds.length === paymentRecords.filter(r => !r.is_reconciled).length}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedIds(paymentRecords.filter(r => !r.is_reconciled).map(r => r.ct_ctid));
                          else setSelectedIds([]);
                        }}
                        disabled={paymentRecords.filter(r => !r.is_reconciled).length === 0}
                      />
                    </th>
                    <th style={{ width: '100px' }}>Date</th>
                    <th style={{ width: '120px' }}>Entry No</th>
                    <th>From Account</th>
                    <th>To Account</th>
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
                        value={inlineFilters.ct_date || ''}
                        onChange={(e) => handleInlineFilterChange('ct_date', e.target.value)}
                        className="inline-filter-input"
                        style={{ width: '100%', padding: '2px 4px', fontSize: '11px', border: '1px solid #ddd' }}
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        placeholder="Filter Entry No..."
                        value={inlineFilters.ct_entry_no || ''}
                        onChange={(e) => handleInlineFilterChange('ct_entry_no', e.target.value)}
                        className="inline-filter-input"
                        style={{ width: '100%', padding: '2px 4px', fontSize: '11px', border: '1px solid #ddd' }}
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        placeholder="Filter From..."
                        value={inlineFilters.ct_from_account || ''}
                        onChange={(e) => handleInlineFilterChange('ct_from_account', e.target.value)}
                        className="inline-filter-input"
                        style={{ width: '100%', padding: '2px 4px', fontSize: '11px', border: '1px solid #ddd' }}
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        placeholder="Filter To..."
                        value={inlineFilters.ct_to_account || ''}
                        onChange={(e) => handleInlineFilterChange('ct_to_account', e.target.value)}
                        className="inline-filter-input"
                        style={{ width: '100%', padding: '2px 4px', fontSize: '11px', border: '1px solid #ddd' }}
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        placeholder="Filter Amount..."
                        value={inlineFilters.ct_amount || ''}
                        onChange={(e) => handleInlineFilterChange('ct_amount', e.target.value)}
                        className="inline-filter-input"
                        style={{ width: '100%', padding: '2px 4px', fontSize: '11px', border: '1px solid #ddd' }}
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        placeholder="Filter Ref..."
                        value={inlineFilters.ct_ref_number || ''}
                        onChange={(e) => handleInlineFilterChange('ct_ref_number', e.target.value)}
                        className="inline-filter-input"
                        style={{ width: '100%', padding: '2px 4px', fontSize: '11px', border: '1px solid #ddd' }}
                      />
                    </td>
                  </tr>
                </thead>
                <tbody>
                  {paymentRecords.length > 0 ? paymentRecords.map((r, i) => {
                    const isSelected = selectedRecord && selectedRecord.ct_ctid === r.ct_ctid;
                    return (
                      <tr 
                        key={r.ct_ctid || i}
                        className={`${isSelected ? 'selected' : ''} ${r.is_reconciled ? 'reconciled-row' : ''}`}
                        onClick={() => handleRecordSelect(r)}
                        style={{ cursor: 'pointer', opacity: r.is_reconciled ? 0.6 : 1, backgroundColor: r.is_reconciled ? '#f5f5f5' : '' }}
                      >
                        <td onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(r.ct_ctid)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedIds(prev => [...prev, r.ct_ctid]);
                              else setSelectedIds(prev => prev.filter(id => id !== r.ct_ctid));
                            }}
                            disabled={!!r.is_reconciled}
                          />
                        </td>
                        <td>{new Date(r.ct_date || r.date).toLocaleDateString()}</td>
                        <td className="font-bold">{r.ct_entry_no || r.contra_no}</td>
                        <td>{r.ct_from_account || r.from_account}</td>
                        <td>{r.ct_to_account || r.to_account}</td>
                        <td className="text-right font-bold" style={{ color: '#005fcc' }}>
                          ₹{parseFloat(r.ct_amount || r.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td>{r.ct_ref_number || r.ref_number}</td>
                      </tr>
                    );
                  }) : (
                    <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>No historical records found</td></tr>
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

export default ContraForm;
