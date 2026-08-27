import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useKeyboardNavigation } from '../../contexts/KeyboardNavigationContext';
import { usePagination } from '../../hooks/usePagination';
import useERPFilters from '../../hooks/useERPFilters';
import PaginationControls from '../common/PaginationControls';
import SaveConfirmationModal from '../common/SaveConfirmationModal';
import { journalAPI, reconciliationAPI } from '../../services/api';
import { printVoucher } from '../../utils/paymentPrintUtils';
import '../../styles/vintage-erp-theme.css';

const JournalForm = ({ onBack }) => {
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
    journal_no: '',
    date: new Date().toISOString().split('T')[0],
    debit_account: '',
    credit_account: '',
    amount: '',
    ref_number: '',
    narration: ''
  });

  const [journalRecords, setJournalRecords] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(true); // Default mode is "New" (showing empty form ready for data entry)
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
    je_date: '',
    je_entry_no: '',
    je_account: '',
    je_amount: '',
    je_ref_number: '',
    je_narration: '',
    reconciliationStatus: 'ACTIVE'
  }, () => {
    setPage(1);
  }, { 
    realTime: true, 
    debounceMs: 500 
  });

  const fieldOrder = useMemo(() => [
    'date', 
    'debit_account', 
    'credit_account', 
    'amount', 
    'ref_number', 
    'narration'
  ], []);

  // Registry for keyboard navigation
  useEffect(() => {
    registerForm('journal', fieldOrder);
    setActiveForm('journal');
    return () => unregisterForm('journal');
  }, [fieldOrder, registerForm, unregisterForm, setActiveForm]);

  const fetchJournals = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        ...activeFilters
      };
      const response = await journalAPI.getAllJournals(params);
      setJournalRecords(response.data || []);
      updatePagination(response.pagination);
    } catch (err) {
      console.error('Error fetching journals:', err);
      setError('Failed to load journal history');
    } finally {
      setLoading(false);
    }
  }, [page, limit, activeFilters, updatePagination]);

  useEffect(() => {
    fetchJournals();
  }, [page, limit, fetchJournals]);

  const generateTempJournalNo = useCallback(() => {
    const date = new Date();
    return `JN${date.getTime().toString().slice(-8)}`;
  }, []);

  useEffect(() => {
    if (!formData.journal_no && isEditing && !selectedRecord) {
      setFormData(prev => ({
        ...prev,
        journal_no: generateTempJournalNo()
      }));
    }
  }, [isEditing, selectedRecord, formData.journal_no, generateTempJournalNo]);

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
    
    let debitAccount = record.je_account || '';
    let creditAccount = '';
    let narrationText = record.je_narration || '';
    
    if (record.je_narration && record.je_narration.startsWith('Journal: ')) {
      const parts = record.je_narration.substring(9).split(' | ');
      const accountsPart = parts[0];
      narrationText = parts.length > 1 ? parts.slice(1).join(' | ') : '';
      
      const accounts = accountsPart.split(' / ');
      if (accounts.length >= 2) {
        debitAccount = accounts[0];
        creditAccount = accounts[1];
      }
    }
    
    setFormData({
      journal_no: record.je_entry_no || '',
      date: record.je_date ? (record.je_date.includes('T') ? record.je_date.split('T')[0] : record.je_date) : '',
      debit_account: debitAccount,
      credit_account: creditAccount,
      amount: record.je_amount || '',
      ref_number: record.je_ref_number || '',
      narration: narrationText,
      utr_number: record.utr_number || '',
      payment_proof: null
    });

    setAuditData({
      enteredOn: record.edtm ? new Date(record.edtm).toLocaleString() : '',
      enteredBy: record.eby || record.je_created_by || '',
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
      journal_no: generateTempJournalNo(),
      date: new Date().toISOString().split('T')[0],
      debit_account: '',
      credit_account: '',
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
      handleRecordSelect(selectedRecord);
    } else {
      if (journalRecords.length > 0) {
        handleRecordSelect(journalRecords[0]);
      } else {
        handleNew();
      }
    }
    setError('');
    setSuccess('');
  };

  const handleDelete = async () => {
    if (!selectedRecord) return;
    if (window.confirm('Are you sure you want to delete this journal entry?')) {
      try {
        setLoading(true);
        await journalAPI.deleteJournal(selectedRecord.je_jeid);
        setSuccess('Journal entry deleted successfully');
        setSelectedRecord(null);
        handleNew();
        fetchJournals();
      } catch (err) {
        console.error('Error deleting journal:', err);
        setError(err.message || 'Failed to delete journal entry');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBulkReconcile = async () => {
    if (selectedIds.length === 0) return;
    try {
      setIsReconciling(true);
      await reconciliationAPI.bulkReconcileJournals(selectedIds, 'Reconciled');
      setSuccess(`${selectedIds.length} journal(s) reconciled successfully`);
      setSelectedIds([]);
      fetchJournals();
    } catch (err) {
      console.error('Reconciliation error:', err);
      setError(err.message || 'Failed to reconcile journals');
    } finally {
      setIsReconciling(false);
    }
  };

  const handleSave = async () => {
    if (!formData.debit_account || !formData.credit_account || !formData.amount) {
      setError('Required fields are missing (Debit Account, Credit Account, Amount)');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const narrationCombined = `Journal: ${formData.debit_account} / ${formData.credit_account}${formData.narration ? ` | ${formData.narration}` : ''}`;
      
      const payload = new FormData();
      payload.append('je_account', formData.debit_account);
      payload.append('je_entry_type', 'Debit');
      payload.append('je_amount', parseFloat(formData.amount) || 0);
      payload.append('je_ref_number', formData.ref_number);
      payload.append('je_narration', narrationCombined);
      payload.append('je_voucher_type', 'Journal');
      if (formData.utr_number) {
        payload.append('utr_number', formData.utr_number);
      }
      if (formData.payment_proof) {
        payload.append('payment_proof', formData.payment_proof);
      }

      let response;
      if (selectedRecord) {
        // Edit Mode -> Update
        response = await journalAPI.updateJournal(selectedRecord.je_jeid, payload);
        setSuccess('Journal entry updated successfully');
      } else {
        // New Mode -> Create
        response = await journalAPI.createJournal(payload);
        setSuccess('Journal entry saved successfully');
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
        fetchJournals();
      }, 1500);
    } catch (err) {
      console.error('Error saving journal:', err);
      setError(err.message || 'Failed to save journal entry');
    } finally {
      setLoading(false);
    }
  };

  const handleNavigation = useCallback((direction) => {
    if (journalRecords.length === 0) return;
    let newIndex = 0;
    if (selectedRecord) {
      const currentIndex = journalRecords.findIndex(r => r.je_jeid === selectedRecord.je_jeid);
      switch(direction) {
        case 'first': newIndex = 0; break;
        case 'prev': newIndex = currentIndex > 0 ? currentIndex - 1 : 0; break;
        case 'next': newIndex = currentIndex < journalRecords.length - 1 ? currentIndex + 1 : journalRecords.length - 1; break;
        case 'last': newIndex = journalRecords.length - 1; break;
        default: break;
      }
    }
    handleRecordSelect(journalRecords[newIndex]);
  }, [journalRecords, selectedRecord, handleRecordSelect]);

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
            if (journalRecords.length > 0) {
              const currentIdx = selectedRecord ? journalRecords.findIndex(r => r.je_jeid === selectedRecord.je_jeid) : -1;
              const newIdx = currentIdx > 0 ? currentIdx - 1 : 0;
              handleRecordSelect(journalRecords[newIdx]);
            }
            break;
          case 'ArrowDown':
            e.preventDefault();
            if (journalRecords.length > 0) {
              const currentIdx = selectedRecord ? journalRecords.findIndex(r => r.je_jeid === selectedRecord.je_jeid) : -1;
              const newIdx = currentIdx < journalRecords.length - 1 ? currentIdx + 1 : journalRecords.length - 1;
              handleRecordSelect(journalRecords[newIdx]);
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
  }, [journalRecords, selectedRecord, isEditing, pagination, nextPage, prevPage, onBack, handleRecordSelect]);

  const isFirstRecord = selectedRecord && journalRecords.length > 0 && journalRecords[0].je_jeid === selectedRecord.je_jeid;
  const isLastRecord = selectedRecord && journalRecords.length > 0 && journalRecords[journalRecords.length - 1].je_jeid === selectedRecord.je_jeid;

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
        <button className="erp-button" onClick={handleDelete} disabled={!selectedRecord} title="Delete (F4)">Delete</button>
        <button
          className="erp-button"
          onClick={handleBulkReconcile}
          disabled={selectedIds.length === 0 || isReconciling}
          title="Reconcile selected records"
          style={selectedIds.length > 0 ? { background: '#2e7d32', color: '#fff' } : {}}
        >
          {isReconciling ? 'Reconciling...' : `Reconcile${selectedIds.length > 0 ? ` (${selectedIds.length})` : ''}`}
        </button>
        <button className="erp-button" onClick={() => printVoucher(selectedRecord, 'journal')} disabled={!selectedRecord} title="Export to PDF">Export PDF</button>
        <div className="erp-tool-separator"></div>
        <button className="erp-button" onClick={() => setShowSaveModal(true)} disabled={!isEditing} title="Save (F10)">Save</button>
        <button className="erp-button" onClick={handleCancel} disabled={!isEditing} title="Cancel">Cancel</button>
        <button className="erp-button" onClick={fetchJournals} title="Refresh">Refresh</button>
        <div className="erp-tool-separator"></div>
        <select
          className="erp-input"
          style={{ padding: '2px 8px', fontSize: '11px', width: 'auto' }}
          value={inlineFilters['reconciliationStatus'] || 'ACTIVE'}
          onChange={(e) => { handleInlineFilterChange('reconciliationStatus', e.target.value); setSelectedIds([]); }}
        >
          <option value="ACTIVE">Active (Default)</option>
          <option value="RECONCILED">Reconciled</option>
          <option value="ALL">All</option>
        </select>
        <div style={{ flex: 1 }}></div>
        <div style={{ fontWeight: 'bold', fontSize: '12px' }}>
          {isEditing ? (selectedRecord ? 'EDIT MODE' : 'NEW RECORD') : 'READY'} | Total Records: {pagination.totalRecords || journalRecords.length}
        </div>
      </div>

      {/* Main Content (Stacked Form & Grid) */}
      <div className="layout-content-wrapper" style={{ display: 'flex', flex: 1, flexDirection: 'column', overflow: 'hidden' }}>
        <div className="layout-main-column" style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%' }}>
          
          {/* Form Panel */}
          <div className="layout-form-section" style={{ padding: '15px', backgroundColor: '#fcfcfc', borderBottom: '1px solid #ddd' }}>
            <div className="erp-panel-header">JOURNAL VOUCHER ENTRY (ADJUSTMENT)</div>
            <div className="erp-form-content" style={{ padding: '15px', background: '#f5f5f5', borderRadius: '4px', border: '1px solid #eee' }}>
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
                    onFocus={() => handleManualFocus('journal', 'date')}
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
                    onFocus={() => handleManualFocus('journal', 'type')}
                    disabled={!isEditing}
                  >
                    <option value="Journal">Journal (Adjustment)</option>
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
                    onFocus={() => handleManualFocus('journal', 'customer_name')}
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
                    onFocus={() => handleManualFocus('journal', 'customer_phone')}
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
                    onFocus={() => handleManualFocus('journal', 'account_name')}
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
                    onFocus={() => handleManualFocus('journal', 'amount')}
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
                    onFocus={() => handleManualFocus('journal', 'payment_mode')}
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
                    onFocus={() => handleManualFocus('journal', 'utr_number')}
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
                    onFocus={() => handleManualFocus('journal', 'payment_proof')}
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
                    onFocus={() => handleManualFocus('journal', 'narration')}
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
                <input type="text" className="erp-audit-input" value={auditData.enteredOn || ''} readOnly tabIndex="-1" />
                <label className="erp-audit-label">Entered By</label>
                <input type="text" className="erp-audit-input" value={auditData.enteredBy || ''} readOnly tabIndex="-1" />
              </div>
              <div className="erp-audit-row">
                <label className="erp-audit-label">Modified On</label>
                <input type="text" className="erp-audit-input" value={auditData.modifiedOn || ''} readOnly tabIndex="-1" />
                <label className="erp-audit-label">Modified By</label>
                <input type="text" className="erp-audit-input" value={auditData.modifiedBy || ''} readOnly tabIndex="-1" />
              </div>
            </div>
          </div>

          {/* Grid Panel */}
          <div className="layout-grid-section" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            <div className="erp-panel-header">
              JOURNAL VOUCHER HISTORY
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
                        checked={journalRecords.filter(r => !r.is_reconciled).length > 0 && selectedIds.length === journalRecords.filter(r => !r.is_reconciled).length}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedIds(journalRecords.filter(r => !r.is_reconciled).map(r => r.je_jeid));
                          else setSelectedIds([]);
                        }}
                        disabled={journalRecords.filter(r => !r.is_reconciled).length === 0}
                      />
                    </th>
                    <th style={{ width: '100px' }}>Date</th>
                    <th style={{ width: '120px' }}>Entry No</th>
                    <th>Debit Account</th>
                    <th>Credit Account</th>
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
                        value={inlineFilters.je_date || ''}
                        onChange={(e) => handleInlineFilterChange('je_date', e.target.value)}
                        className="inline-filter-input"
                        style={{ width: '100%', padding: '2px 4px', fontSize: '11px', border: '1px solid #ddd' }}
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        placeholder="Filter Entry No..."
                        value={inlineFilters.je_entry_no || ''}
                        onChange={(e) => handleInlineFilterChange('je_entry_no', e.target.value)}
                        className="inline-filter-input"
                        style={{ width: '100%', padding: '2px 4px', fontSize: '11px', border: '1px solid #ddd' }}
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        placeholder="Filter Debit..."
                        value={inlineFilters.je_account || ''}
                        onChange={(e) => handleInlineFilterChange('je_account', e.target.value)}
                        className="inline-filter-input"
                        style={{ width: '100%', padding: '2px 4px', fontSize: '11px', border: '1px solid #ddd' }}
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        placeholder="Filter Credit..."
                        value={inlineFilters.je_narration || ''}
                        onChange={(e) => handleInlineFilterChange('je_narration', e.target.value)}
                        className="inline-filter-input"
                        style={{ width: '100%', padding: '2px 4px', fontSize: '11px', border: '1px solid #ddd' }}
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        placeholder="Filter Amount..."
                        value={inlineFilters.je_amount || ''}
                        onChange={(e) => handleInlineFilterChange('je_amount', e.target.value)}
                        className="inline-filter-input"
                        style={{ width: '100%', padding: '2px 4px', fontSize: '11px', border: '1px solid #ddd' }}
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        placeholder="Filter Ref..."
                        value={inlineFilters.je_ref_number || ''}
                        onChange={(e) => handleInlineFilterChange('je_ref_number', e.target.value)}
                        className="inline-filter-input"
                        style={{ width: '100%', padding: '2px 4px', fontSize: '11px', border: '1px solid #ddd' }}
                      />
                    </td>
                  </tr>
                </thead>
                <tbody>
                  {journalRecords.length > 0 ? journalRecords.map((r, i) => {
                    const isSelected = selectedRecord && selectedRecord.je_jeid === r.je_jeid;
                    
                    // Parse accounts from narration
                    let debitAcc = r.je_account || '';
                    let creditAcc = '';
                    if (r.je_narration && r.je_narration.startsWith('Journal: ')) {
                      const accountsPart = r.je_narration.substring(9).split(' | ')[0];
                      const accounts = accountsPart.split(' / ');
                      if (accounts.length >= 2) {
                        debitAcc = accounts[0];
                        creditAcc = accounts[1];
                      }
                    }
                    
                    return (
                      <tr 
                        key={r.je_jeid || i}
                        className={`${isSelected ? 'selected' : ''} ${r.is_reconciled ? 'reconciled-row' : ''}`}
                        onClick={() => handleRecordSelect(r)}
                        style={{ cursor: 'pointer', opacity: r.is_reconciled ? 0.6 : 1, backgroundColor: r.is_reconciled ? '#f5f5f5' : '' }}
                      >
                        <td onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(r.je_jeid)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedIds(prev => [...prev, r.je_jeid]);
                              else setSelectedIds(prev => prev.filter(id => id !== r.je_jeid));
                            }}
                            disabled={!!r.is_reconciled}
                          />
                        </td>
                        <td>{r.je_date ? new Date(r.je_date).toLocaleDateString() : ''}</td>
                        <td className="font-bold">{r.je_entry_no || ''}</td>
                        <td>{debitAcc}</td>
                        <td>{creditAcc}</td>
                        <td className="text-right font-bold" style={{ color: '#555' }}>
                          ₹{parseFloat(r.je_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td>{r.je_ref_number || ''}</td>
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

export default JournalForm;
