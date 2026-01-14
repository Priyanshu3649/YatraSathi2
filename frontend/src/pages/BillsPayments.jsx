import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/bills-payments.css';

const BillsPayments = () => {
  const [bills, setBills] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch bills
      const billsResponse = await fetch('/api/customer/bills', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const billsData = await billsResponse.json();
      if (billsData.success) {
        setBills(billsData.data.bills || []);
      }

      // Fetch payments
      const paymentsResponse = await fetch('/api/customer/payments', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const paymentsData = await paymentsResponse.json();
      if (paymentsData.success) {
        setPayments(paymentsData.data.payments || []);
      }
    } catch (error) {
      console.error('Bills/Payments fetch error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  if (loading) {
    return (
      <div className="bills-payments-loading">
        <div className="loading-spinner"></div>
        <p>Loading bills and payments...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bills-payments-error">
        <h3>Error Loading Data</h3>
        <p>{error}</p>
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
              <div key={bill.billId} className="bill-card">
                <div className="bill-header">
                  <div className="bill-id">Bill #{bill.billId}</div>
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
                    <span className="value">{bill.bookingId}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Bill Date:</span>
                    <span className="value">{formatDate(bill.billDate)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Total Amount:</span>
                    <span className="value amount">{formatAmount(bill.totalAmount)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Paid Amount:</span>
                    <span className="value amount">{formatAmount(bill.paidAmount)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Balance:</span>
                    <span className="value amount">{formatAmount(bill.balanceAmount)}</span>
                  </div>
                </div>
                
                <div className="bill-actions">
                  <button className="btn-sm btn-outline">Download Invoice</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="payments-section">
        <h2>Payment History</h2>
        {payments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💳</div>
            <h3>No Payment History</h3>
            <p>Payment history will appear here.</p>
          </div>
        ) : (
          <div className="payments-table-container">
            <table className="payments-table">
              <thead>
                <tr>
                  <th>Payment ID</th>
                  <th>Bill ID</th>
                  <th>Amount</th>
                  <th>Mode</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment, index) => (
                  <tr 
                    key={payment.paymentId} 
                    className={index % 2 === 0 ? 'even-row' : 'odd-row'}
                  >
                    <td>{payment.paymentId}</td>
                    <td>{payment.billId}</td>
                    <td className="amount">{formatAmount(payment.amount)}</td>
                    <td>{payment.mode}</td>
                    <td>{formatDate(payment.date)}</td>
                    <td>
                      <span className="status-badge payment-status">
                        {payment.status}
                      </span>
                    </td>
                    <td>{payment.remarks || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BillsPayments;