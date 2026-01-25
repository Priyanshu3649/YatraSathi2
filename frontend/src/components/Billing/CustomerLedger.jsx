import React, { useState, useEffect } from 'react';
import { billingAPI } from '../../services/api';

const CustomerLedger = () => {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [ledgerData, setLedgerData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customerBalances, setCustomerBalances] = useState({});

  // Fetch customers when component mounts
  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/customers', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const customersList = Array.isArray(data) ? data : (data.customers || []);
        setCustomers(customersList);
        
        // Fetch balances for all customers
        const balances = {};
        for (const customer of customersList) {
          const balance = await fetchCustomerBalance(customer.id || customer.us_usid);
          balances[customer.id || customer.us_usid] = balance;
        }
        setCustomerBalances(balances);
      }
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerBalance = async (customerId) => {
    try {
      const data = await billingAPI.getCustomerBalance(customerId);
      return data;
    } catch (err) {
      console.error('Failed to fetch customer balance:', err);
      return { totalBilled: 0, totalReceived: 0, netDue: 0, netAdvance: 0 };
    }
  };

  const fetchCustomerLedger = async (customerId) => {
    try {
      setLoading(true);
      const data = await billingAPI.getCustomerLedger(customerId);
      setLedgerData(data.ledger || []);
    } catch (err) {
      console.error('Failed to fetch customer ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerChange = (e) => {
    const customerId = e.target.value;
    setSelectedCustomer(customerId);
    if (customerId) {
      fetchCustomerLedger(customerId);
    } else {
      setLedgerData([]);
    }
  };

  if (loading && !selectedCustomer) {
    return <p>Loading customer ledger...</p>;
  }

  return (
    <div className="customer-ledger">
      <div className="form-grid">
        <label htmlFor="customerSelect" className="form-label">Select Customer</label>
        <select
          id="customerSelect"
          value={selectedCustomer}
          onChange={handleCustomerChange}
          className="form-input"
        >
          <option value="">All Customers</option>
          {customers.map(customer => (
            <option key={customer.id || customer.us_usid} value={customer.id || customer.us_usid}>
              {customer.us_name || customer.name} 
              {customerBalances[customer.id || customer.us_usid] && 
                ` (Due: ₹${parseFloat(customerBalances[customer.id || customer.us_usid].netDue)?.toFixed(2) || '0.00'})`
              }
            </option>
          ))}
        </select>
      </div>

      {selectedCustomer && (
        <div className="ledger-summary">
          <h3>Customer Balance Summary</h3>
          {customerBalances[selectedCustomer] && (
            <div className="summary-grid">
              <div className="summary-item">
                <label>Total Billed:</label>
                <span>₹{parseFloat(customerBalances[selectedCustomer].totalBilled)?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="summary-item">
                <label>Total Received:</label>
                <span>₹{parseFloat(customerBalances[selectedCustomer].totalReceived)?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="summary-item">
                <label>Net Due:</label>
                <span className={customerBalances[selectedCustomer].netDue > 0 ? 'due-amount' : ''}>
                  ₹{parseFloat(customerBalances[selectedCustomer].netDue)?.toFixed(2) || '0.00'}
                </span>
              </div>
              <div className="summary-item">
                <label>Net Advance:</label>
                <span className={customerBalances[selectedCustomer].netAdvance > 0 ? 'advance-amount' : ''}>
                  ₹{parseFloat(customerBalances[selectedCustomer].netAdvance)?.toFixed(2) || '0.00'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid-container">
        {loading ? (
          <p>Loading ledger details...</p>
        ) : ledgerData.length > 0 ? (
          <table className="grid-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Bill ID</th>
                <th>Description</th>
                <th>Debit</th>
                <th>Credit</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {ledgerData.map((entry, index) => (
                <tr key={index}>
                  <td>{new Date(entry.date).toLocaleDateString()}</td>
                  <td>{entry.billId || entry.refId}</td>
                  <td>{entry.description}</td>
                  <td>{entry.debit ? `₹${parseFloat(entry.debit).toFixed(2)}` : '-'}</td>
                  <td>{entry.credit ? `₹${parseFloat(entry.credit).toFixed(2)}` : '-'}</td>
                  <td>₹{parseFloat(entry.balance)?.toFixed(2) || '0.00'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>{selectedCustomer ? 'No ledger entries found for this customer.' : 'Select a customer to view ledger details.'}</p>
        )}
      </div>
    </div>
  );
};

export default CustomerLedger;