import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { paymentAPI, bookingAPI } from '../services/api';
import '../styles/vintage-erp-theme.css';
import '../styles/classic-enterprise-global.css';

const Payments = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showRefundForm, setShowRefundForm] = useState(null); // For refund form
  const [formData, setFormData] = useState({
    bookingId: '',
    amount: '',
    mode: 'ONLINE',
    transactionId: '',
    bankName: '',
    branch: '',
    chequeNumber: '',
    paymentDate: new Date().toISOString().split('T')[0], // Pre-fill with today's date
    remarks: ''
  });
  const [refundData, setRefundData] = useState({
    refundAmount: '',
    remarks: ''
  });

  // Fetch payments and bookings when component mounts
  useEffect(() => {
    fetchPayments();
    if (user && (user.us_usertype === 'admin' || user.us_usertype === 'employee')) {
      fetchAllBookings();
    } else {
      fetchCustomerBookings();
    }
  }, [user]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      let data;
      
      if (user && user.us_usertype === 'admin') {
        data = await paymentAPI.getAllPayments();
      } else {
        data = await paymentAPI.getMyPayments();
      }
      
      setPayments(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerBookings = async () => {
    try {
      const data = await bookingAPI.getMyBookings();
      setBookings(data);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    }
  };

  const fetchAllBookings = async () => {
    try {
      const data = await bookingAPI.getAllBookings();
      setBookings(data);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    }
  };

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onRefundChange = (e) => {
    setRefundData({ ...refundData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const paymentData = {
        bookingId: parseInt(formData.bookingId),
        amount: parseFloat(formData.amount),
        mode: formData.mode,
        transactionId: formData.transactionId,
        bankName: formData.bankName,
        branch: formData.branch,
        chequeNumber: formData.chequeNumber,
        paymentDate: formData.paymentDate,
        remarks: formData.remarks
      };
      
      await paymentAPI.createPayment(paymentData);
      // Reset form and hide it
      setFormData({ 
        bookingId: '',
        amount: '',
        mode: 'ONLINE',
        transactionId: '',
        bankName: '',
        branch: '',
        chequeNumber: '',
        paymentDate: new Date().toISOString().split('T')[0],
        remarks: ''
      });
      setShowForm(false);
      // Refresh payments list
      fetchPayments();
    } catch (error) {
      setError(error.message || 'Failed to record payment');
    }
  };

  const onRefundSubmit = async (e, paymentId) => {
    e.preventDefault();
    
    try {
      // Make API call to refund payment using the service
      await paymentAPI.refundPayment(paymentId, {
        refundAmount: parseFloat(refundData.refundAmount),
        remarks: refundData.remarks
      });
      
      // Reset refund form and hide it
      setRefundData({ refundAmount: '', remarks: '' });
      setShowRefundForm(null);
      // Refresh payments list
      fetchPayments();
    } catch (error) {
      setError(error.message || 'Failed to process refund');
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (window.confirm('Are you sure you want to delete this payment? This action cannot be undone.')) {
      try {
        await paymentAPI.deletePayment(paymentId);
        // Refresh payments list
        fetchPayments();
      } catch (error) {
        setError(error.message || 'Failed to delete payment');
      }
    }
  };

  const handleRefundPayment = (payment) => {
    // Set the maximum refund amount to the original payment amount
    setRefundData({
      refundAmount: payment.pt_amount,
      remarks: `Refund for payment ${payment.pt_ptid}`
    });
    setShowRefundForm(payment.pt_ptid);
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
      {/* Title Bar */}
      <div className="title-bar">
        <div className="system-menu">⚡</div>
        <div className="title-text">Payment Management System</div>
        <div className="close-button">×</div>
      </div>

      {/* Menu Bar */}
      <div className="menu-bar">
        <div className="menu-item">File</div>
        <div className="menu-item">Edit</div>
        <div className="menu-item">View</div>
        <div className="menu-item">Tools</div>
        <div className="menu-item">Help</div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <button className="tool-button" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'New'}
        </button>
        <div className="tool-separator"></div>
        <button className="tool-button" onClick={fetchPayments}>Refresh</button>
        <div className="tool-separator"></div>
        <button className="tool-button">Export</button>
        <button className="tool-button">Print</button>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Left Form Panel */}
        <div className="nav-panel">
          <div className="nav-header">Payment Actions</div>
          <div className={`nav-item ${showForm ? 'active' : ''}`} onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel Form' : 'Record Payment'}
          </div>
          <div className="nav-item" onClick={fetchPayments}>Refresh List</div>
          <div className="nav-item">Export Data</div>
          <div className="nav-item">Print Report</div>
          {showRefundForm && (
            <div className="nav-item active">Process Refund</div>
          )}
        </div>

        {/* Work Area */}
        <div className="work-area">
          {/* Form Panel */}
          {showForm && (
            <div className="form-panel">
              <div className="panel-header">Record New Payment</div>
              <form onSubmit={onSubmit} className="erp-form">
                <div className="form-grid">
                  <label htmlFor="bookingId" className="form-label required">Booking</label>
                  <select
                    id="bookingId"
                    name="bookingId"
                    value={formData.bookingId}
                    onChange={onChange}
                    required
                    className="form-input"
                  >
                    <option value="">Select Booking</option>
                    {bookings.map(booking => (
                      <option key={booking.bk_bkid} value={booking.bk_bkid}>
                        {booking.bk_bkid} - {booking.bk_fromstation || booking.bk_fromst} to {booking.bk_tostation || booking.bk_tost}
                      </option>
                    ))}
                  </select>

                  <label htmlFor="amount" className="form-label required">Amount</label>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={formData.amount}
                    onChange={onChange}
                    required
                    step="0.01"
                    min="0"
                    className="form-input"
                  />

                  <label htmlFor="mode" className="form-label required">Payment Mode</label>
                  <select
                    id="mode"
                    name="mode"
                    value={formData.mode}
                    onChange={onChange}
                    required
                    className="form-input"
                  >
                    <option value="CASH">Cash</option>
                    <option value="ONLINE">Online</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                  </select>

                  <label htmlFor="paymentDate" className="form-label required">Payment Date</label>
                  <input
                    type="date"
                    id="paymentDate"
                    name="paymentDate"
                    value={formData.paymentDate}
                    onChange={onChange}
                    required
                    className="form-input"
                  />

                  {formData.mode === 'ONLINE' && (
                    <>
                      <label htmlFor="transactionId" className="form-label">Transaction ID</label>
                      <input
                        type="text"
                        id="transactionId"
                        name="transactionId"
                        value={formData.transactionId}
                        onChange={onChange}
                        className="form-input"
                      />
                    </>
                  )}

                  {(formData.mode === 'CHEQUE' || formData.mode === 'BANK_TRANSFER') && (
                    <>
                      <label htmlFor="bankName" className="form-label">Bank Name</label>
                      <input
                        type="text"
                        id="bankName"
                        name="bankName"
                        value={formData.bankName}
                        onChange={onChange}
                        className="form-input"
                      />

                      <label htmlFor="branch" className="form-label">Branch</label>
                      <input
                        type="text"
                        id="branch"
                        name="branch"
                        value={formData.branch}
                        onChange={onChange}
                        className="form-input"
                      />

                      {formData.mode === 'CHEQUE' && (
                        <>
                          <label htmlFor="chequeNumber" className="form-label">Cheque Number</label>
                          <input
                            type="text"
                            id="chequeNumber"
                            name="chequeNumber"
                            value={formData.chequeNumber}
                            onChange={onChange}
                            className="form-input"
                          />
                        </>
                      )}
                    </>
                  )}

                  <label htmlFor="remarks" className="form-label">Remarks</label>
                  <textarea
                    id="remarks"
                    name="remarks"
                    value={formData.remarks}
                    onChange={onChange}
                    className="form-input"
                    rows="3"
                  ></textarea>
                </div>

                <div className="form-actions">
                  <button type="submit" className="tool-button">Save Payment</button>
                  <button type="button" className="tool-button" onClick={() => setShowForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* Refund Form Panel */}
          {showRefundForm && (
            <div className="form-panel">
              <div className="panel-header">Process Refund</div>
              <form onSubmit={(e) => onRefundSubmit(e, showRefundForm)} className="erp-form">
                <div className="form-grid">
                  <label htmlFor="refundAmount" className="form-label required">Refund Amount</label>
                  <input
                    type="number"
                    id="refundAmount"
                    name="refundAmount"
                    value={refundData.refundAmount}
                    onChange={onRefundChange}
                    required
                    step="0.01"
                    min="0"
                    max={payments.find(p => p.pt_ptid === showRefundForm)?.pt_amount}
                    className="form-input"
                  />

                  <label htmlFor="remarks" className="form-label">Remarks</label>
                  <textarea
                    id="remarks"
                    name="remarks"
                    value={refundData.remarks}
                    onChange={onRefundChange}
                    className="form-input"
                    rows="3"
                  ></textarea>
                </div>

                <div className="form-actions">
                  <button type="submit" className="tool-button">Process Refund</button>
                  <button type="button" className="tool-button" onClick={() => setShowRefundForm(null)}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* Grid Panel */}
          <div className="grid-panel">
            <div className="panel-header">Payment Records</div>
            
            {error && <div className="alert alert-error">{error}</div>}

            <div className="grid-toolbar">
              <input
                type="text"
                placeholder="Search payments..."
                className="filter-input"
              />
              <button className="tool-button">Filter</button>
              <button className="tool-button">Clear</button>
            </div>

            <div className="grid-container">
              {payments.length === 0 ? (
                <p>No payments found.</p>
              ) : (
                <table className="grid-table">
                  <thead>
                    <tr>
                      <th>Payment ID</th>
                      <th>Booking ID</th>
                      <th>Amount</th>
                      <th>Mode</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.pt_ptid} className={getStatusClass(payment.pt_status)}>
                        <td>{payment.pt_ptid}</td>
                        <td>{payment.pt_bkid}</td>
                        <td>₹{parseFloat(payment.pt_amount).toFixed(2)}</td>
                        <td>{getModeDisplay(payment.pt_mode)}</td>
                        <td>{new Date(payment.pt_paydt || payment.pt_paymentdt).toLocaleDateString()}</td>
                        <td>{payment.pt_status}</td>
                        <td>
                          {payment.pt_status === 'RECEIVED' && (
                            <button 
                              className="tool-button" 
                              onClick={() => handleRefundPayment(payment)}
                            >
                              Refund
                            </button>
                          )}
                          {user && (user.us_usertype === 'admin' || user.us_usertype === 'employee') && (
                            <button 
                              className="tool-button" 
                              onClick={() => handleDeletePayment(payment.pt_ptid)}
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="status-bar">
        <div className="status-item">Records: {payments.length}</div>
        <div className="status-item">User: {user?.us_name || 'Unknown'}</div>
        <div className="status-panel">Ready</div>
      </div>
    </div>
  );
};

export default Payments;