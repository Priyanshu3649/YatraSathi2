import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { paymentAPI, bookingAPI } from '../services/api';
import '../styles/vintage-erp-theme.css';
import '../styles/classic-enterprise-global.css';
import '../styles/vintage-admin-panel.css';
import '../styles/dynamic-admin-panel.css';
import '../styles/vintage-erp-global.css';

// Import payment components
import PaymentCreationForm from '../components/Payment/PaymentCreationForm';
import PaymentAllocationInterface from '../components/Payment/PaymentAllocationInterface';
import PaymentList from '../components/Payment/PaymentList';
import PaymentDetails from '../components/Payment/PaymentDetails';
import CustomerPaymentHistory from '../components/Payment/CustomerPaymentHistory';
import CustomerPendingPNRs from '../components/Payment/CustomerPendingPNRs';
import RefundForm from '../components/Payment/RefundForm';

const Payments = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showRefundForm, setShowRefundForm] = useState(null); // For refund form
  const [activeView, setActiveView] = useState('list'); // 'list', 'allocation', 'history', 'pendingPNRs'
  const [formData, setFormData] = useState({
    customerId: user?.us_usertype === 'customer' ? user.us_usid : '', // Pre-fill for customers
    amount: '',
    mode: 'CASH',
    refNo: '', // Reference number (UTR / Cheque / Txn ID)
    paymentDate: new Date().toISOString().split('T')[0], // Pre-fill with today's date
    remarks: '',
    autoAllocate: false // Auto-allocate using FIFO
  });
  const [customers, setCustomers] = useState([]);
  const [pendingPNRs, setPendingPNRs] = useState([]);
  const [refundData, setRefundData] = useState({
    refundAmount: '',
    remarks: ''
  });

  // Fetch payments, customers, and pending PNRs when component mounts
  useEffect(() => {
    fetchPayments();
    if (user && (user.us_usertype === 'admin' || user.us_usertype === 'employee')) {
      fetchCustomers();
    }
    if (formData.customerId) {
      fetchPendingPNRs(formData.customerId);
    }
  }, [user]);

  // Fetch pending PNRs when customer changes
  useEffect(() => {
    if (formData.customerId) {
      fetchPendingPNRs(formData.customerId);
    } else {
      setPendingPNRs([]);
    }
  }, [formData.customerId]);

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

  const fetchCustomers = async () => {
    try {
      // Use customer API if available, otherwise fetch from bookings
      const response = await fetch('/api/customers', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setCustomers(Array.isArray(data) ? data : (data.customers || []));
      }
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    }
  };

  const fetchPendingPNRs = async (customerId) => {
    try {
      const response = await fetch(`/api/payments/customer/${customerId}/pending-pnrs`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPendingPNRs(data.pendingPNRs || []);
      }
    } catch (err) {
      console.error('Failed to fetch pending PNRs:', err);
      setPendingPNRs([]);
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
      // Build payment data according to new API structure
      const paymentData = {
        customerId: formData.customerId || user.us_usid, // Use current user if customer
        amount: parseFloat(formData.amount),
        mode: formData.mode,
        refNo: formData.refNo || null, // Reference number (UTR / Cheque / Txn ID)
        paymentDate: formData.paymentDate,
        remarks: formData.remarks || null,
        autoAllocate: formData.autoAllocate // Auto-allocate using FIFO
      };
      
      const response = await paymentAPI.createPayment(paymentData);
      
      if (response.success) {
        // Reset form and hide it
        setFormData({ 
          customerId: user?.us_usertype === 'customer' ? user.us_usid : '',
          amount: '',
          mode: 'CASH',
          refNo: '',
          paymentDate: new Date().toISOString().split('T')[0],
          remarks: '',
          autoAllocate: false
        });
        setShowForm(false);
        setError('');
        // Refresh payments list
        fetchPayments();
      } else {
        setError(response.message || 'Failed to record payment');
      }
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
    const paymentId = payment.pt_ptid || payment.id;
    const amount = payment.pt_amount || payment.amount;
    setRefundData({
      refundAmount: amount,
      remarks: `Refund for payment ${paymentId}`
    });
    setShowRefundForm(paymentId);
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
        <button className="tool-button" onClick={() => setActiveView('create')}>
          New Payment
        </button>
        <div className="tool-separator"></div>
        <button className="tool-button" onClick={fetchPayments}>Refresh</button>
        <div className="tool-separator"></div>
        <button className="tool-button">Export</button>
        <button className="tool-button">Print</button>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Left Navigation Panel */}
        <div className="nav-panel">
          <div className="nav-header">Payment Management</div>
          <div className={`nav-item ${activeView === 'list' ? 'active' : ''}`} onClick={() => setActiveView('list')}>
            Payment List
          </div>
          <div className={`nav-item ${activeView === 'create' ? 'active' : ''}`} onClick={() => setActiveView('create')}>
            Record Payment
          </div>
          <div className={`nav-item ${activeView === 'allocation' ? 'active' : ''}`} onClick={() => setActiveView('allocation')}>
            Allocate Payments
          </div>
          <div className={`nav-item ${activeView === 'history' ? 'active' : ''}`} onClick={() => setActiveView('history')}>
            Customer History
          </div>
          <div className={`nav-item ${activeView === 'pending' ? 'active' : ''}`} onClick={() => setActiveView('pending')}>
            Pending PNRs
          </div>
          <div className="nav-item" onClick={fetchPayments}>Refresh</div>
          <div className="nav-item">Export Data</div>
          <div className="nav-item">Print Report</div>
        </div>

        {/* Work Area */}
        <div className="work-area">
          {/* Render different views based on activeView state */}
          {activeView === 'create' && (
            <div className="form-panel">
              <div className="panel-header">Record New Payment</div>
              <PaymentCreationForm
                onCancel={() => setActiveView('list')}
                onSuccess={() => {
                  setActiveView('list');
                  fetchPayments();
                }}
              />
            </div>
          )}

          {activeView === 'allocation' && (
            <div className="form-panel">
              <div className="panel-header">Payment Allocation Interface</div>
              <PaymentAllocationInterface
                onAllocationComplete={() => {
                  fetchPayments();
                }}
              />
            </div>
          )}

          {activeView === 'history' && (
            <div className="grid-panel">
              <div className="panel-header">Customer Payment History</div>
              <CustomerPaymentHistory />
            </div>
          )}

          {activeView === 'pending' && (
            <div className="grid-panel">
              <div className="panel-header">Customer Pending PNRs</div>
              <CustomerPendingPNRs />
            </div>
          )}

          {activeView === 'list' && (
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
                <PaymentList
                  payments={payments}
                  loading={loading}
                  onRefund={handleRefundPayment}
                  onDelete={handleDeletePayment}
                  user={user}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="status-bar">
        <div className="status-item">View: {activeView}</div>
        <div className="status-item">Records: {payments.length}</div>
        <div className="status-item">User: {user?.us_name || 'Unknown'}</div>
        <div className="status-panel">Ready</div>
      </div>
    </div>
  );
};

export default Payments;