import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useKeyboardNavigation } from '../../contexts/KeyboardNavigationContext';
import { usePagination } from '../../hooks/usePagination';
import PaginationControls from '../common/PaginationControls';
import SaveConfirmationModal from '../common/SaveConfirmationModal';
import { contraAPI } from '../../services/api';
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
      const response = await contraAPI.getAllContras({ page, limit });
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
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
      narration: record.ct_narration || record.narration || ''
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
        contra_no: selectedRecord.py_entry_no || '',
        date: selectedRecord.py_date || selectedRecord.date || '',
        from_account: selectedRecord.py_from_account || selectedRecord.from_account || '',
        to_account: selectedRecord.py_bank_account || selectedRecord.account_name || '',
        amount: selectedRecord.py_amount || selectedRecord.amount || '',
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

  const handleSave = async () => {
    if (!formData.from_account || !formData.to_account || !formData.amount) {
      setError('Required fields are missing (From Account, To Account, Amount)');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const payload = {
        ct_from_account: formData.from_account,
        ct_to_account: formData.to_account,
        ct_amount: formData.amount,
        ct_ref_number: formData.ref_number,
        ct_narration: formData.narration || `Contra: ${formData.from_account} to ${formData.to_account}`
      };

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
        <button className="erp-button" onClick={() => printVoucher(selectedRecord, 'contra')} disabled={!selectedRecord} title="Export to PDF">Export PDF</button>
        <div className="erp-tool-separator"></div>
        <button className="erp-button" onClick={() => setShowSaveModal(true)} disabled={!isEditing} title="Save (F10)">Save</button>
        <button className="erp-button" onClick={handleCancel} disabled={!isEditing} title="Cancel">Cancel</button>
        <button className="erp-button" onClick={fetchContras} title="Refresh">Refresh</button>
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
                    disabled={!isEditing}
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
                    disabled={!isEditing}
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
                    disabled={!isEditing}
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
                    disabled={!isEditing}
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
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="erp-form-group" style={{ marginTop: '10px' }}>
                <label className="erp-form-label" style={{ display: 'block', textAlign: 'left', marginBottom: '2px' }}>Transaction Details</label>
                <textarea 
                  name="narration"
                  className="erp-input" 
                  value={formData.narration} 
                  onChange={handleInputChange} 
                  rows="2" 
                  style={{ width: '100%', resize: 'none' }}
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
                    <th style={{ width: '100px' }}>Date</th>
                    <th style={{ width: '120px' }}>Entry No</th>
                    <th>From Account</th>
                    <th>To Account</th>
                    <th className="text-right" style={{ width: '150px' }}>Amount (₹)</th>
                    <th>Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentRecords.length > 0 ? paymentRecords.map((r, i) => {
                    const isSelected = selectedRecord && selectedRecord.ct_ctid === r.ct_ctid;
                    return (
                      <tr 
                        key={r.ct_ctid || i}
                        className={isSelected ? 'selected' : ''}
                        onClick={() => handleRecordSelect(r)}
                        style={{ cursor: 'pointer' }}
                      >
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
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>No historical records found</td></tr>
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
