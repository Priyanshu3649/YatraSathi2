import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { billingAPI, paymentAPI } from '../services/api';
import '../styles/bills-payments.css';

const BillsPayments = () => {
  const [bills, setBills] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setLoading(true);
      let billsData = [];
      let paymentsData = [];

      try {
        // Try customer routes
        const billsResponse = await fetch('/api/customer/bills', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (billsResponse.ok) {
          const billsResult = await billsResponse.json();
          billsData = billsResult.data?.bills || billsResult.bills || [];
        } else {
          throw new Error('Customer bills endpoint failed');
        }
      } catch (billsError) {
        // Fallback to billing API
        billsData = await billingAPI.getMyBills();
        billsData = Array.isArray(billsData) 
          ? billsData
          : billsData?.data?.bills || billsData?.bills || [];
      }
      
      try {
        // Try customer routes
        const paymentsResponse = await fetch('/api/customer/payments', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (paymentsResponse.ok) {
          const paymentsResult = await paymentsResponse.json();
          paymentsData = paymentsResult.data?.payments || paymentsResult.payments || [];
        } else {
          throw new Error('Customer payments endpoint failed');
        }
      } catch (paymentsError) {
        // Fallback to payment API
        paymentsData = await paymentAPI.getMyPayments();
        paymentsData = Array.isArray(paymentsData)
          ? paymentsData
          : paymentsData?.data?.payments || paymentsData?.payments || [];
      }

      setBills(billsData);
      setPayments(paymentsData);
    } catch (error) {
      console.error('Bills/Payments fetch error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getBillStatusColor = (status) => {
    const statusColors = {
      'UNPAID': '#e74c3c',
      'PARTIALLY_PAID': '#f39c12',
      'PAID': '#2ecc71',
      'OVERDUE': '#e67e22'
    };
    return statusColors[status] || '#95a5a6';
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading bills and payments...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <button onClick={fetchData} className="retry-btn">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bills-payments-container">
      <div className="page-header">
        <h1>Bills & Payments</h1>
      </div>

      <div className="bills-section">
        <h2>Outstanding Bills</h2>
        {bills.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💰</div>
            <h3>No Outstanding Bills</h3>
            <p>All your bills are cleared!</p>
          </div>
        ) : (
          <div className="bills-grid">
            {bills.map((bill) => (
              <div key={bill.bill_id || bill.billId || bill.id} className="bill-card">
                <div className="bill-header">
                  <div className="bill-id">Bill #{bill.bill_id || bill.billId || bill.id}</div>
                  <div 
                    className="status-badge"
                    style={{ backgroundColor: getBillStatusColor(bill.status) }}
                  >
                    {bill.status.replace('_', ' ')}
                  </div>
                </div>
                
                <div className="bill-details">
                  <div className="detail-item">
                    <span className="label">Booking ID:</span>
                    <span className="value">{bill.booking_id || bill.bookingId || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Bill Date:</span>
                    <span className="value">{formatDate(bill.bill_date || bill.billDate || bill.created_on)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Total Amount:</span>
                    <span className="value amount">{formatAmount(bill.total_amount || bill.totalAmount)}</span>
                  </div>
                </div>
                
                <div className="bill-actions">
                  <button 
                    className="pay-btn"
                    onClick={() => navigate(`/payments/new?billId=${bill.bill_id || bill.billId || bill.id}`)}
                  >
                    Pay Now
                  </button>
                  <button 
                    className="view-btn"
                    onClick={() => navigate(`/bills/${bill.bill_id || bill.billId || bill.id}`)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="payments-section">
        <h2>Recent Payments</h2>
        {payments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💳</div>
            <h3>No Recent Payments</h3>
            <p>Your payment history will appear here.</p>
          </div>
        ) : (
          <div className="payments-list">
            {payments.slice(0, 5).map((payment) => (
              <div key={payment.payment_id || payment.paymentId || payment.id} className="payment-item">
                <div className="payment-info">
                  <div className="payment-id">Payment #{payment.payment_id || payment.paymentId || payment.id}</div>
                  <div className="payment-date">{formatDate(payment.payment_date || payment.paymentDate || payment.created_on)}</div>
                </div>
                <div className="payment-amount">
                  {formatAmount(payment.amount)}
                </div>
                <div className="payment-status">
                  <span className={`status-badge ${(payment.status || 'completed').toLowerCase()}`}>
                    {payment.status || 'Completed'}
                  </span>
                </div>
              </div>
            ))}
            
            {payments.length > 5 && (
              <div className="view-all-payments">
                <button 
                  className="view-all-btn"
                  onClick={() => navigate('/payments')}
                >
                  View All Payments ({payments.length})
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BillsPayments;
