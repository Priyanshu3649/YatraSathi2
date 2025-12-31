import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../../../services/api';
import '../../../styles/dashboard-common.css';

const AccountsDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const data = await dashboardAPI.getAccountsDashboard();
      
      if (data.success) {
        setDashboardData(data.data);
      } else {
        setError(data.error?.message || 'Failed to load dashboard');
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="dashboard-loading">Loading...</div>;

  const { stats, pendingPayments } = dashboardData || {};

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Accounts Dashboard</h1>
        <p>Manage payments and financial operations</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-rupee-sign"></i>
          </div>
          <div className="stat-content">
            <h3>₹{(stats?.totalPayments || 0).toLocaleString()}</h3>
            <p>Total Payments</p>
          </div>
        </div>

        <div className="stat-card pending">
          <div className="stat-icon">
            <i className="fas fa-clock"></i>
          </div>
          <div className="stat-content">
            <h3>₹{(stats?.pendingAmount || 0).toLocaleString()}</h3>
            <p>Pending Amount</p>
          </div>
        </div>

        <div className="stat-card confirmed">
          <div className="stat-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="stat-content">
            <h3>₹{(stats?.processedAmount || 0).toLocaleString()}</h3>
            <p>Processed</p>
          </div>
        </div>

        <div className="stat-card monthly">
          <div className="stat-icon">
            <i className="fas fa-calendar-alt"></i>
          </div>
          <div className="stat-content">
            <h3>₹{(stats?.monthlyCollections || 0).toLocaleString()}</h3>
            <p>This Month</p>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Pending Payments ({stats?.pendingCount || 0})</h2>
        <div className="payments-table">
          {pendingPayments && pendingPayments.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Payment ID</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingPayments.map((payment) => (
                  <tr key={payment.pt_ptid}>
                    <td>{payment.pt_ptid}</td>
                    <td>₹{payment.pt_amount?.toLocaleString()}</td>
                    <td>{new Date(payment.edtm).toLocaleDateString()}</td>
                    <td>
                      <span className="status-badge pending">
                        {payment.pt_status}
                      </span>
                    </td>
                    <td>
                      <button className="btn-sm btn-primary">Process</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <i className="fas fa-check-circle"></i>
              <h3>No Pending Payments</h3>
              <p>All payments are up to date.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountsDashboard;