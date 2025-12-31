import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../../../services/api';
import '../../../styles/dashboard-common.css';

const AgentDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const data = await dashboardAPI.getAgentDashboard();
      
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

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading agent dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <h3>Error Loading Dashboard</h3>
        <p>{error}</p>
        <button onClick={fetchDashboardData} className="retry-btn">
          Retry
        </button>
      </div>
    );
  }

  const { stats, recentBookings } = dashboardData || {};

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Agent Dashboard</h1>
        <p>Manage your assigned bookings and track performance</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-calendar-check"></i>
          </div>
          <div className="stat-content">
            <h3>{stats?.totalBookings || 0}</h3>
            <p>Total Bookings</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon confirmed">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="stat-content">
            <h3>{stats?.confirmedBookings || 0}</h3>
            <p>Confirmed</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon pending">
            <i className="fas fa-clock"></i>
          </div>
          <div className="stat-content">
            <h3>{stats?.pendingBookings || 0}</h3>
            <p>Pending</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon monthly">
            <i className="fas fa-calendar-alt"></i>
          </div>
          <div className="stat-content">
            <h3>{stats?.monthlyBookings || 0}</h3>
            <p>This Month</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon conversion">
            <i className="fas fa-percentage"></i>
          </div>
          <div className="stat-content">
            <h3>{stats?.conversionRate || 0}%</h3>
            <p>Conversion Rate</p>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <div className="section-header">
          <h2>Recent Bookings</h2>
          <button className="btn-primary">
            <i className="fas fa-plus"></i>
            New Booking
          </button>
        </div>

        <div className="bookings-table">
          {recentBookings && recentBookings.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Customer</th>
                  <th>Journey</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((booking) => (
                  <tr key={booking.bk_bkid}>
                    <td>{booking.bk_bkid}</td>
                    <td>{booking.bk_cuid}</td>
                    <td>{booking.bk_from} → {booking.bk_to}</td>
                    <td>{new Date(booking.bk_jdate).toLocaleDateString()}</td>
                    <td>
                      <span className={`status-badge ${booking.bk_status?.toLowerCase()}`}>
                        {booking.bk_status}
                      </span>
                    </td>
                    <td>
                      <button className="btn-sm btn-outline">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <i className="fas fa-calendar-times"></i>
              <h3>No Recent Bookings</h3>
              <p>You haven't been assigned any bookings yet.</p>
            </div>
          )}
        </div>
      </div>

      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-buttons">
          <button className="action-btn">
            <i className="fas fa-plus-circle"></i>
            <span>Create Booking</span>
          </button>
          <button className="action-btn">
            <i className="fas fa-search"></i>
            <span>Search Customer</span>
          </button>
          <button className="action-btn">
            <i className="fas fa-ticket-alt"></i>
            <span>Generate Ticket</span>
          </button>
          <button className="action-btn">
            <i className="fas fa-phone"></i>
            <span>Customer Support</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;