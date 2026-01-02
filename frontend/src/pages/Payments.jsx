import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { paymentAPI, bookingAPI } from '../services/api';
import '../styles/vintage-erp-theme.css';
import '../styles/payments.css';

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
    return <div className="erp-container"><div className="erp-loading">Loading payments...</div></div>;
  }

  return (
    <div className="erp-container">
      {/* Left Form Panel */}
      {showForm && (
        <div className="erp-form-section">
          <h3>Record Payment</h3>
          <form onSubmit={onSubmit} className="erp-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="bookingId" className="form-label">Booking *</label>
                <select
                  id="bookingId"
                  name="bookingId"
                  value={formData.bookingId}
                  onChange={onChange}
                  required
                  className="form-control"
                >
                  <option value="">Select Booking</option>
                  {bookings.map(booking => (
                    <option key={booking.bk_bkid} value={booking.bk_bkid}>
                      {booking.bk_bkid} - {booking.bk_fromstation || booking.bk_fromst} to {booking.bk_tostation || booking.bk_tost}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="amount" className="form-label">Amount *</label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={onChange}
                  required
                  step="0.01"
                  min="0"
                  className="form-control"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="mode" className="form-label">Payment Mode *</label>
                <select
                  id="mode"
                  name="mode"
                  value={formData.mode}
                  onChange={onChange}
                  required
                  className="form-control"
                >
                  <option value="CASH">Cash</option>
                  <option value="ONLINE">Online</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="paymentDate" className="form-label">Payment Date *</label>
                <input
                  type="date"
                  id="paymentDate"
                  name="paymentDate"
                  value={formData.paymentDate}
                  onChange={onChange}
                  required
                  className="form-control"
                />
              </div>
            </div>
            
            {formData.mode === 'ONLINE' && (
              <div className="form-group">
                <label htmlFor="transactionId" className="form-label">Transaction ID</label>
                <input
                  type="text"
                  id="transactionId"
                  name="transactionId"
                  value={formData.transactionId}
                  onChange={onChange}
                  className="form-control"
                />
              </div>
            )}
            
            {(formData.mode === 'CHEQUE' || formData.mode === 'BANK_TRANSFER') && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="bankName" className="form-label">Bank Name</label>
                    <input
                      type="text"
                      id="bankName"
                      name="bankName"
                      value={formData.bankName}
                      onChange={onChange}
                      className="form-control"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="branch" className="form-label">Branch</label>
                    <input
                      type="text"
                      id="branch"
                      name="branch"
                      value={formData.branch}
                      onChange={onChange}
                      className="form-control"
                    />
                  </div>
                </div>
                {formData.mode === 'CHEQUE' && (
                  <div className="form-group">
                    <label htmlFor="chequeNumber" className="form-label">Cheque Number</label>
                    <input
                      type="text"
                      id="chequeNumber"
                      name="chequeNumber"
                      value={formData.chequeNumber}
                      onChange={onChange}
                      className="form-control"
                    />
                  </div>
                )}
              </>
            )}
            
            <div className="form-group">
              <label htmlFor="remarks" className="form-label">Remarks</label>
              <textarea
                id="remarks"
                name="remarks"
                value={formData.remarks}
                onChange={onChange}
                className="form-control"
                rows="3"
              ></textarea>
            </div>
            
            <div className="form-group">
              <button type="submit" className="btn btn-primary">Record Payment</button>
              <button type="button" className="btn" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {showRefundForm && (
        <div className="erp-form-section">
          <h3>Process Refund</h3>
          <form onSubmit={(e) => onRefundSubmit(e, showRefundForm)} className="erp-form">
            <div className="form-group">
              <label htmlFor="refundAmount" className="form-label">Refund Amount *</label>
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
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label htmlFor="remarks" className="form-label">Remarks</label>
              <textarea
                id="remarks"
                name="remarks"
                value={refundData.remarks}
                onChange={onRefundChange}
                className="form-control"
                rows="3"
              ></textarea>
            </div>
            <div className="form-group">
              <button type="submit" className="btn btn-primary">Process Refund</button>
              <button type="button" className="btn" onClick={() => setShowRefundForm(null)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Right Content Panel */}
      <div className="erp-content-section">
        <div className="erp-header">
          <h2>Payments</h2>
          <div className="header-actions">
            <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
              {showForm ? 'Cancel' : 'Record Payment'}
            </button>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="erp-data-section">
          <h3>Payment List</h3>
          {payments.length === 0 ? (
            <p>No payments found.</p>
          ) : (
            <div className="table-responsive">
              <table className="erp-data-table">
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
                            className="btn btn-primary mr-1" 
                            onClick={() => handleRefundPayment(payment)}
                          >
                            Refund
                          </button>
                        )}
                        {user && (user.us_usertype === 'admin' || user.us_usertype === 'employee') && (
                          <button 
                            className="btn btn-danger" 
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Payments;