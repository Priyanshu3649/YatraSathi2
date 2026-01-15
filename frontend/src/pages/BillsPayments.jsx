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

  useEffect(() => {
    fetchData();
  }, []);

const fetchData = async () => {
    try {
      // Try customer-specific endpoints first
      let billsData, paymentsData;
      
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
                    <span className="value amount">{formatAmount(bill.total_amount || bill.totalAmount || 0)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Paid Amount:</span>
                    <span className="value amount">{formatAmount(bill.paid_amount || bill.paidAmount || 0)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Balance:</span>
                    <span className="value amount">{formatAmount((bill.total_amount || bill.totalAmount || 0) - (bill.paid_amount || bill.paidAmount || 0))}</span>
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
                    key={payment.pt_ptid || payment.paymentId || payment.id || index} 
                    className={index % 2 === 0 ? 'even-row' : 'odd-row'}
                  >
                    <td>{payment.pt_ptid || payment.paymentId || payment.id || 'N/A'}</td>
                    <td>{payment.pt_bkid || payment.billId || 'N/A'}</td>
                    <td className="amount">{formatAmount(payment.pt_amount || payment.amount || 0)}</td>
                    <td>{payment.pt_mode || payment.mode || 'N/A'}</td>
                    <td>{formatDate(payment.pt_paydt || payment.date || payment.edtm)}</td>
                    <td>
                      <span className="status-badge payment-status">
                        {payment.pt_status || payment.status || 'N/A'}
                      </span>
                    </td>
                    <td>{payment.pt_remarks || payment.remarks || '-'}</td>
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
