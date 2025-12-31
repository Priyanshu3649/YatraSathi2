import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../../../services/api';
import '../../../styles/dashboard-common.css';

const ManagementDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const data = await dashboardAPI.getManagementDashboard();
      
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

  const { stats, topAgents } = dashboardData || {};

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Management Dashboard</h1>
        <p>Executive overview and business analytics</p>
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
          <div className="stat-icon">
            <i className="fas fa-rupee-sign"></i>
          </div>
          <div className="stat-content">
            <h3>₹{(stats?.totalRevenue || 0).toLocaleString()}</h3>
            <p>Total Revenue</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-users"></i>
          </div>
          <div className="stat-content">
            <h3>{stats?.totalEmployees || 0}</h3>
            <p>Total Employees</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-user-friends"></i>
          </div>
          <div className="stat-content">
            <h3>{stats?.totalCustomers || 0}</h3>
            <p>Total Customers</p>
          </div>
        </div>

        <div className="stat-card monthly">
          <div className="stat-icon">
            <i className="fas fa-calendar-alt"></i>
          </div>
          <div className="stat-content">
            <h3>{stats?.monthlyBookings || 0}</h3>
            <p>Monthly Bookings</p>
          </div>
        </div>

        <div className="stat-card monthly">
          <div className="stat-icon">
            <i className="fas fa-chart-line"></i>
          </div>
          <div className="stat-content">
            <h3>₹{(stats?.monthlyRevenue || 0).toLocaleString()}</h3>
            <p>Monthly Revenue</p>
          </div>
        </div>

        <div className="stat-card confirmed">
          <div className="stat-icon">
            <i className="fas fa-trending-up"></i>
          </div>
          <div className="stat-content">
            <h3>{stats?.growthRate || 'N/A'}</h3>
            <p>Growth Rate</p>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Top Performing Agents (This Month)</h2>
        <div className="agents-table">
          {topAgents && topAgents.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Agent Name</th>
                  <th>Bookings</th>
                  <th>Performance</th>
                </tr>
              </thead>
              <tbody>
                {topAgents.map((agent, index) => (
                  <tr key={agent.bk_euid}>
                    <td>
                      <span className="rank-badge">#{index + 1}</span>
                    </td>
                    <td>{agent.User?.us_fname} {agent.User?.us_lname}</td>
                    <td>{agent.bookingCount}</td>
                    <td>
                      <div className="performance-bar">
                        <div 
                          className="performance-fill" 
                          style={{ width: `${Math.min((agent.bookingCount / (topAgents[0]?.bookingCount || 1)) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <i className="fas fa-chart-bar"></i>
              <h3>No Performance Data</h3>
              <p>Performance data will appear once bookings are made.</p>
            </div>
          )}
        </div>
      </div>

      <div className="quick-actions">
        <h3>Executive Actions</h3>
        <div className="action-buttons">
          <button className="action-btn">
            <i className="fas fa-chart-line"></i>
            <span>Financial Reports</span>
          </button>
          <button className="action-btn">
            <i className="fas fa-users-cog"></i>
            <span>Employee Management</span>
          </button>
          <button className="action-btn">
            <i className="fas fa-cog"></i>
            <span>System Settings</span>
          </button>
          <button className="action-btn">
            <i className="fas fa-download"></i>
            <span>Export Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManagementDashboard;