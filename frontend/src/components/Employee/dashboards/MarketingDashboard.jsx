import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../../../services/api';
import '../../../styles/dashboard-common.css';

const MarketingDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const data = await dashboardAPI.getMarketingDashboard();
      
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

  const { stats, recentClients } = dashboardData || {};

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Marketing Dashboard</h1>
        <p>Manage corporate clients and marketing campaigns</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-building"></i>
          </div>
          <div className="stat-content">
            <h3>{stats?.totalCorporateClients || 0}</h3>
            <p>Total Clients</p>
          </div>
        </div>

        <div className="stat-card confirmed">
          <div className="stat-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="stat-content">
            <h3>{stats?.activeCorporateClients || 0}</h3>
            <p>Active Clients</p>
          </div>
        </div>

        <div className="stat-card monthly">
          <div className="stat-icon">
            <i className="fas fa-user-plus"></i>
          </div>
          <div className="stat-content">
            <h3>{stats?.newClientsThisMonth || 0}</h3>
            <p>New This Month</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-percentage"></i>
          </div>
          <div className="stat-content">
            <h3>{stats?.conversionRate || 'N/A'}</h3>
            <p>Conversion Rate</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-rupee-sign"></i>
          </div>
          <div className="stat-content">
            <h3>{stats?.avgDealSize || 'N/A'}</h3>
            <p>Avg Deal Size</p>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Recent Corporate Clients</h2>
        <div className="clients-table">
          {recentClients && recentClients.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Contact Person</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentClients.map((client) => (
                  <tr key={client.cc_ccid}>
                    <td>{client.cc_company}</td>
                    <td>{client.cc_contact_person}</td>
                    <td>{client.cc_phone}</td>
                    <td>
                      <span className={`status-badge ${client.cc_active ? 'confirmed' : 'pending'}`}>
                        {client.cc_active ? 'Active' : 'Inactive'}
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
              <i className="fas fa-building"></i>
              <h3>No Corporate Clients</h3>
              <p>Start building your client portfolio.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketingDashboard;