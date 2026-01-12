import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { paymentAPI } from '../services/api';
import '../styles/vintage-erp-theme.css';
import '../styles/classic-enterprise-global.css';
import '../styles/vintage-admin-panel.css';
import '../styles/dynamic-admin-panel.css';
import '../styles/vintage-erp-global.css';

const Payments = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form state for payment details
  const [formData, setFormData] = useState({
    pt_ptid: '',
    pt_cusid: '',
    pt_amount: '',
    pt_mode: 'CASH',
    pt_refno: '',
    pt_date: new Date().toISOString().split('T')[0],
    pt_remarks: '',
    pt_status: 'RECEIVED',
    pt_entdt: '',
    pt_entby: '',
    pt_moddt: '',
    pt_modby: '',
    pt_rcvby: user?.us_usid || ''
  });
  
  // Audit data state
  const [auditData, setAuditData] = useState({
    enteredOn: '',
    enteredBy: user?.us_usid || 'ADMIN',
    modifiedOn: '',
    modifiedBy: '',
    closedOn: '',
    closedBy: ''
  });
  
  // Filter state
  const [filters, setFilters] = useState({
    pt_ptid: '',
    pt_cusid: '',
    pt_date_from: '',
    pt_date_to: '',
    pt_status: '',
    pt_amount_min: '',
    pt_amount_max: '',
    showOnlyUnallocated: false
  });
  
  // Selected payment for form
  const [selectedPayment, setSelectedPayment] = useState(null);
  
  // Navigation helper function to find index of selected payment
  const getSelectedPaymentIndex = () => {
    if (!selectedPayment) return -1;
    return payments.findIndex(p => p.pt_ptid === selectedPayment.pt_ptid);
  };
  
  // Navigation functions
  const goToFirstRecord = () => {
    if (payments.length > 0) {
      handleRowSelect(payments[0]);
    }
  };
  
  const goToPreviousRecord = () => {
    const currentIndex = getSelectedPaymentIndex();
    if (currentIndex > 0) {
      handleRowSelect(payments[currentIndex - 1]);
    }
  };
  
  const goToNextRecord = () => {
    const currentIndex = getSelectedPaymentIndex();
    if (currentIndex < payments.length - 1) {
      handleRowSelect(payments[currentIndex + 1]);
    }
  };
  
  const goToLastRecord = () => {
    if (payments.length > 0) {
      handleRowSelect(payments[payments.length - 1]);
    }
  };
  
  // Auto-select first record when payments data changes
  useEffect(() => {
    if (payments.length > 0 && !selectedPayment) {
      handleRowSelect(payments[0]);
    }
  }, [payments]); // Only trigger when payments change, not selectedPayment
  
  // Keyboard navigation effect
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Only handle navigation if we have payments and are not in an input field
      if (payments.length === 0 || document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'SELECT') {
        return;
      }
      
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          goToNextRecord();
          break;
        case 'ArrowUp':
          event.preventDefault();
          goToPreviousRecord();
          break;
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedPayment, payments]);
  
  // Fetch payments when component mounts
  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      let response;
      
      if (user && user.us_usertype === 'admin') {
        response = await paymentAPI.getAllPayments();
      } else {
        response = await paymentAPI.getMyPayments();
      }
      
      // Handle new API response format { success: true, payments: [...] }
      const paymentsData = response.payments || response || [];
      setPayments(Array.isArray(paymentsData) ? paymentsData : []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to fetch payments');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNew = () => {
    setFormData({
      pt_ptid: '',
      pt_cusid: '',
      pt_amount: '',
      pt_mode: 'CASH',
      pt_refno: '',
      pt_date: new Date().toISOString().split('T')[0],
      pt_remarks: '',
      pt_status: 'RECEIVED',
      pt_entdt: '',
      pt_entby: '',
      pt_moddt: '',
      pt_modby: '',
      pt_rcvby: user?.us_usid || ''
    });
    setSelectedPayment(null);
    
    // Reset audit data for new record
    setAuditData({
      enteredOn: '',
      enteredBy: user?.us_usid || 'ADMIN',
      modifiedOn: '',
      modifiedBy: '',
      closedOn: '',
      closedBy: ''
    });
  };

  const handleEdit = (payment) => {
    setFormData({
      pt_ptid: payment.pt_ptid,
      pt_cusid: payment.pt_cusid,
      pt_amount: payment.pt_amount,
      pt_mode: payment.pt_mode,
      pt_refno: payment.pt_refno,
      pt_date: payment.pt_date?.split('T')[0] || payment.pt_date,
      pt_remarks: payment.pt_remarks,
      pt_status: payment.pt_status,
      pt_entdt: payment.pt_entdt,
      pt_entby: payment.pt_entby,
      pt_moddt: payment.pt_moddt,
      pt_modby: payment.pt_modby,
      pt_rcvby: payment.pt_rcvby
    });
    setSelectedPayment(payment);
    
    // Update audit data based on payment record
    setAuditData({
      enteredOn: payment.edtm ? new Date(payment.edtm).toLocaleString() : '',
      enteredBy: payment.eby || '',
      modifiedOn: payment.mdtm ? new Date(payment.mdtm).toLocaleString() : '',
      modifiedBy: payment.mby || '',
      closedOn: payment.cdtm ? new Date(payment.cdtm).toLocaleString() : '',
      closedBy: payment.cby || ''
    });
  };

  const handleSave = async () => {
    try {
      // Prepare payment data for API call
      const paymentData = {
        customerId: formData.pt_cusid,
        amount: formData.pt_amount,
        mode: formData.pt_mode,
        refNo: formData.pt_refno,
        paymentDate: formData.pt_date,
        remarks: formData.pt_remarks,
        status: formData.pt_status,
        receivedBy: formData.pt_rcvby
      };
      
      if (selectedPayment) {
        // Update existing payment
        await paymentAPI.updatePayment(formData.pt_ptid, paymentData);
      } else {
        // Create new payment
        await paymentAPI.createPayment(paymentData);
      }
      
      fetchPayments();
      handleNew(); // Reset form
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to save payment');
    }
  };

  const handleDelete = async (paymentId) => {
    if (window.confirm('Are you sure you want to delete this payment? This action cannot be undone.')) {
      try {
        await paymentAPI.deletePayment(paymentId);
        fetchPayments();
        if (selectedPayment && selectedPayment.pt_ptid === paymentId) {
          handleNew();
        }
      } catch (err) {
        setError(err.message || 'Failed to delete payment');
      }
    }
  };

  const handleFilterApply = () => {
    // Apply filters to payment data
    fetchPayments();
  };

  const handleFilterClear = () => {
    setFilters({
      pt_ptid: '',
      pt_cusid: '',
      pt_date_from: '',
      pt_date_to: '',
      pt_status: '',
      pt_amount_min: '',
      pt_amount_max: '',
      showOnlyUnallocated: false
    });
  };

  const handleRowSelect = (payment) => {
    handleEdit(payment);
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'RECEIVED':
        return 'status-received';
      case 'PENDING':
        return 'status-pending';
      case 'REFUNDED':
        return 'status-refunded';
      default:
        return '';
    }
  };

  const getModeDisplay = (mode) => {
    const modes = {
      'CASH': 'Cash',
      'ONLINE': 'Online',
      'CHEQUE': 'Cheque',
      'BANK_TRANSFER': 'Bank Transfer'
    };
    return modes[mode] || mode;
  };

  if (loading) {
    return (
      <div className="erp-admin-container">
        <div className="erp-loading">Loading payments...</div>
      </div>
    );
  }

  return (
    <div className="erp-admin-container">
      {/* Toolbar */}
      <div className="erp-toolbar">
        <button className="erp-icon-button" onClick={goToFirstRecord} disabled={payments.length === 0 || getSelectedPaymentIndex() <= 0} title="First Record">|◀</button>
        <button className="erp-icon-button" onClick={goToPreviousRecord} disabled={payments.length === 0 || getSelectedPaymentIndex() <= 0} title="Previous Record">◀</button>
        <button className="erp-icon-button" onClick={goToNextRecord} disabled={payments.length === 0 || getSelectedPaymentIndex() >= payments.length - 1} title="Next Record">▶</button>
        <button className="erp-icon-button" onClick={goToLastRecord} disabled={payments.length === 0 || getSelectedPaymentIndex() >= payments.length - 1} title="Last Record">▶|</button>
        <div className="erp-tool-separator"></div>
        <button className="erp-button" onClick={handleNew} title="New">New</button>
        <button className="erp-button" onClick={() => selectedPayment ? handleEdit(selectedPayment) : alert('Please select a payment first')} disabled={!selectedPayment || (user?.us_usertype !== 'admin' && user?.us_usertype !== 'employee')} title="Edit">Edit</button>
        <button className="erp-button" onClick={() => selectedPayment ? handleDelete(selectedPayment.pt_ptid) : alert('Please select a payment first')} disabled={!selectedPayment || user?.us_usertype !== 'admin'} title="Delete">Delete</button>
        <div className="erp-tool-separator"></div>
        <button className="erp-button" onClick={handleSave} title="Save">Save</button>
        <div className="erp-tool-separator"></div>
        <button className="erp-button" onClick={fetchPayments} title="Refresh">Refresh</button>
        <div className="erp-tool-separator"></div>
        <button className="erp-button" title="Export">Export</button>
        <button className="erp-button" title="Print">Print</button>
      </div>

      <div className="erp-main-content">
        <div className="erp-center-content">
          {/* Form Section - Static */}
          <div className="erp-form-section">
            <div className="erp-panel-header">Payment Details</div>
            
            <div className="erp-form-grid">
              <label className="erp-form-label">Payment ID</label>
              <input 
                type="text" 
                name="pt_ptid" 
                value={formData.pt_ptid || ''} 
                onChange={(e) => setFormData({...formData, pt_ptid: e.target.value})}
                readOnly
                className="erp-input"
              />
              <label className="erp-form-label">Payment Date</label>
              <input 
                type="date" 
                name="pt_date" 
                value={formData.pt_date} 
                onChange={(e) => setFormData({...formData, pt_date: e.target.value})}
                className="erp-input"
              />
              <label className="erp-form-label">Customer ID</label>
              <input 
                type="text" 
                name="pt_cusid" 
                value={formData.pt_cusid} 
                onChange={(e) => setFormData({...formData, pt_cusid: e.target.value})}
                className="erp-input"
              />
              <label className="erp-form-label">Amount</label>
              <input 
                type="number" 
                name="pt_amount" 
                value={formData.pt_amount} 
                onChange={(e) => setFormData({...formData, pt_amount: e.target.value})}
                className="erp-input"
              />
              <label className="erp-form-label">Payment Mode</label>
              <select 
                name="pt_mode" 
                value={formData.pt_mode} 
                onChange={(e) => setFormData({...formData, pt_mode: e.target.value})}
                className="erp-input"
              >
                <option value="CASH">Cash</option>
                <option value="ONLINE">Online</option>
                <option value="CHEQUE">Cheque</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
              </select>
              <label className="erp-form-label">Reference No</label>
              <input 
                type="text" 
                name="pt_refno" 
                value={formData.pt_refno} 
                onChange={(e) => setFormData({...formData, pt_refno: e.target.value})}
                className="erp-input"
              />
              <label className="erp-form-label">Status</label>
              <select 
                name="pt_status" 
                value={formData.pt_status} 
                onChange={(e) => setFormData({...formData, pt_status: e.target.value})}
                className="erp-input"
              >
                <option value="RECEIVED">Received</option>
                <option value="PENDING">Pending</option>
                <option value="REFUNDED">Refunded</option>
              </select>
              <label className="erp-form-label">Received By</label>
              <input 
                type="text" 
                name="pt_rcvby" 
                value={formData.pt_rcvby} 
                onChange={(e) => setFormData({...formData, pt_rcvby: e.target.value})}
                className="erp-input"
              />
              <label className="erp-form-label">Remarks</label>
              <textarea 
                name="pt_remarks" 
                value={formData.pt_remarks} 
                onChange={(e) => setFormData({...formData, pt_remarks: e.target.value})}
                className="erp-input"
                rows="3"
                style={{ gridColumn: '1 / span 2' }}
              ></textarea>
            </div>
            
            {/* Audit Section */}
            <div className="erp-audit-section">
              <div className="erp-audit-row">
                <label className="erp-audit-label">Entered On</label>
                <input type="text" className="erp-audit-input" value={auditData.enteredOn} readOnly />
                <label className="erp-audit-label">Entered By</label>
                <input type="text" className="erp-audit-input" value={auditData.enteredBy} readOnly />
              </div>
              <div className="erp-audit-row">
                <label className="erp-audit-label">Modified On</label>
                <input type="text" className="erp-audit-input" value={auditData.modifiedOn} readOnly />
                <label className="erp-audit-label">Modified By</label>
                <input type="text" className="erp-audit-input" value={auditData.modifiedBy} readOnly />
              </div>
              <div className="erp-audit-row">
                <label className="erp-audit-label">Closed On</label>
                <input type="text" className="erp-audit-input" value={auditData.closedOn} readOnly />
                <label className="erp-audit-label">Closed By</label>
                <input type="text" className="erp-audit-input" value={auditData.closedBy} readOnly />
              </div>
            </div>
          </div>

          {/* Grid Section - Scrollable */}
          <div className="erp-grid-section">
            <div className="erp-panel-header">Payment Records</div>
            
            {error && <div className="alert alert-error">{error}</div>}
            
            <div className="erp-grid-container" style={{ maxHeight: 'calc(100vh - 450px)', overflowY: 'auto' }}>
              <table className="erp-table">
                <thead>
                  <tr>
                    <th style={{ width: '30px' }}></th>
                    <th style={{ width: '120px' }}>Payment ID</th>
                    <th style={{ width: '100px' }}>Date</th>
                    <th style={{ width: '120px' }}>Customer ID</th>
                    <th style={{ width: '120px' }}>Amount</th>
                    <th style={{ width: '120px' }}>Mode</th>
                    <th style={{ width: '120px' }}>Ref No</th>
                    <th style={{ width: '100px' }}>Status</th>
                    <th style={{ width: '100px' }}>Received By</th>
                    <th style={{ width: '120px' }}>Entered On</th>
                    <th style={{ width: '120px' }}>Modified On</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr 
                      key={payment.pt_ptid} 
                      onClick={() => handleRowSelect(payment)}
                      className={selectedPayment && selectedPayment.pt_ptid === payment.pt_ptid ? 'selected' : ''}
                    >
                      <td><input type="checkbox" checked={selectedPayment && selectedPayment.pt_ptid === payment.pt_ptid} onChange={() => {}} /></td>
                      <td>{payment.pt_ptid}</td>
                      <td>{payment.pt_paydt ? new Date(payment.pt_paydt).toLocaleDateString() : ''}</td>
                      <td>{payment.pt_custid}</td>
                      <td className="text-right">{payment.pt_amount?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) || payment.amount?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</td>
                      <td>{getModeDisplay(payment.pt_mode || payment.mode)}</td>
                      <td>{payment.pt_refno || payment.refNo || ''}</td>
                      <td><span className={`status-badge ${getStatusClass(payment.pt_status || payment.status)}`}>
                        {payment.pt_status || payment.status}
                      </span></td>
                      <td>{payment.pt_rcvby || payment.receivedBy || ''}</td>
                      <td>{payment.edtm ? new Date(payment.edtm).toLocaleDateString() : ''}</td>
                      <td>{payment.mdtm ? new Date(payment.mdtm).toLocaleDateString() : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {payments.length === 0 && (
                <div className="no-records" style={{ padding: '20px', textAlign: 'center' }}>No payment records found</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Filter Panel */}
        <div className="erp-filter-panel">
          <div className="erp-filter-header">
            <div className="erp-filter-title">
              Filter Criteria
            </div>
          </div>
          
          <div className="erp-filter-section">
            <div className="erp-filter-row">
              <div className="erp-filter-field">
                <label className="erp-filter-label">Payment ID</label>
                <input 
                  type="text" 
                  name="pt_ptid" 
                  className="erp-filter-input" 
                  value={filters.pt_ptid || ''} 
                  onChange={(e) => setFilters({...filters, pt_ptid: e.target.value})}
                  placeholder="Search payment ID..."
                />
              </div>
            </div>
            
            <div className="erp-filter-row">
              <div className="erp-filter-field">
                <label className="erp-filter-label">Customer ID</label>
                <input 
                  type="text" 
                  name="pt_cusid" 
                  className="erp-filter-input" 
                  value={filters.pt_cusid || ''} 
                  onChange={(e) => setFilters({...filters, pt_cusid: e.target.value})}
                  placeholder="Search customer ID..."
                />
              </div>
            </div>
            
            <div className="erp-filter-row">
              <div className="erp-filter-field">
                <label className="erp-filter-label">Date From</label>
                <input 
                  type="date" 
                  name="pt_date_from" 
                  className="erp-filter-input" 
                  value={filters.pt_date_from || ''} 
                  onChange={(e) => setFilters({...filters, pt_date_from: e.target.value})}
                />
              </div>
              
              <div className="erp-filter-field">
                <label className="erp-filter-label">Date To</label>
                <input 
                  type="date" 
                  name="pt_date_to" 
                  className="erp-filter-input" 
                  value={filters.pt_date_to || ''} 
                  onChange={(e) => setFilters({...filters, pt_date_to: e.target.value})}
                />
              </div>
            </div>
            
            <div className="erp-filter-row">
              <div className="erp-filter-field">
                <label className="erp-filter-label">Status</label>
                <select 
                  name="pt_status" 
                  className="erp-filter-select" 
                  value={filters.pt_status || ''} 
                  onChange={(e) => setFilters({...filters, pt_status: e.target.value})}
                >
                  <option value="">All</option>
                  <option value="RECEIVED">Received</option>
                  <option value="PENDING">Pending</option>
                  <option value="REFUNDED">Refunded</option>
                </select>
              </div>
              
              <div className="erp-filter-field">
                <label className="erp-filter-label">Amount Range From</label>
                <input 
                  type="number" 
                  name="pt_amount_min" 
                  className="erp-filter-input" 
                  value={filters.pt_amount_min || ''} 
                  onChange={(e) => setFilters({...filters, pt_amount_min: e.target.value})}
                  placeholder="Min amount"
                />
              </div>
            </div>
            
            <div className="erp-filter-row">
              <div className="erp-filter-field">
                <label className="erp-filter-label">Amount Range To</label>
                <input 
                  type="number" 
                  name="pt_amount_max" 
                  className="erp-filter-input" 
                  value={filters.pt_amount_max || ''} 
                  onChange={(e) => setFilters({...filters, pt_amount_max: e.target.value})}
                  placeholder="Max amount"
                />
              </div>
              
              <div className="erp-filter-field">
                <label className="erp-filter-label">
                  <input
                    type="checkbox"
                    id="showOnlyUnallocated"
                    name="showOnlyUnallocated"
                    checked={filters.showOnlyUnallocated || false}
                    onChange={(e) => setFilters({...filters, showOnlyUnallocated: e.target.checked})}
                  />
                  Show Only Unallocated
                </label>
              </div>
            </div>
          </div>
          
          <div className="erp-filter-actions" style={{ marginTop: '12px', display: 'flex', gap: '4px' }}>
            <button 
              className="erp-button erp-filter-btn erp-filter-btn-primary" 
              style={{ flex: 1 }}
              onClick={handleFilterApply}
              title="Apply filter criteria"
            >
              Apply Filters
            </button>
            <button 
              className="erp-button erp-filter-btn erp-filter-btn-clear" 
              style={{ flex: 1 }}
              onClick={handleFilterClear}
              title="Clear all filters and reload data"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="erp-status-bar">
        <div className="erp-status-item">{selectedPayment ? 'Selected' : 'Ready'}</div>
        <div className="erp-status-item">Records: {payments.length}</div>
        <div className="erp-status-item">Position: {selectedPayment ? `${getSelectedPaymentIndex() + 1} of ${payments.length}` : '- / -'}</div>
        <div className="erp-status-item">User: {user?.us_usid || 'Unknown'}</div>
        <div className="status-panel">YatraSathi ERP System</div>
      </div>
    </div>
  );
};

export default Payments;