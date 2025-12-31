import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../../../services/api';
import '../../../styles/dashboard-common.css';

const CallCenterDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const data = await dashboardAPI.getCallCenterDashboard();
      
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

  const { stats, recentInquiries } = dashboardData || {};

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Call Center Dashboard</h1>
        <p>Manage customer support and inquiries</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card pending">
          <div className="stat-icon">
            <i className="fas fa-ticket-alt"></i>
          </div>
          <div className="stat-content">
            <h3>{stats?.openTickets || 0}</h3>
            <p>Open Tickets</p>
          </div>
        </div>

        <div className="stat-card confirmed">
          <div className="stat-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="stat-content">
            <h3>{stats?.resolvedToday || 0}</h3>
            <p>Resolved Today</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-clock"></i>
          </div>
          <div className="stat-content">
            <h3>{stats?.avgResponseTime || 'N/A'}</h3>
            <p>Avg Response Time</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-star"></i>
          </div>
          <div className="stat-content">
            <h3>{stats?.customerSatisfaction || 'N/A'}</h3>
            <p>Customer Satisfaction</p>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Recent Inquiries</h2>
        <div className="inquiries-table">
          {recentInquiries && recentInquiries.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Customer</th>
                  <th>Journey</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentInquiries.map((inquiry) => (
                  <tr key={inquiry.bk_bkid}>
                    <td>{inquiry.bk_bkid}</td>
                    <td>{inquiry.bk_cuid}</td>
                    <td>{inquiry.bk_from} → {inquiry.bk_to}</td>
                    <td>
                      <span className={`status-badge ${inquiry.bk_status?.toLowerCase()}`}>
                        {inquiry.bk_status}
                      </span>
                    </td>
                    <td>
                      <button className="btn-sm btn-primary">Assist</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <i className="fas fa-headset"></i>
              <h3>No Recent Inquiries</h3>
              <p>All customer inquiries are resolved.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CallCenterDashboard;