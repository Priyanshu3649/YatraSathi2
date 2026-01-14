import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/admin-dashboard.css';

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('sessionId');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
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

  const { overview, bookingStats, employeePerformance } = dashboardData || {};
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="user-welcome">
            <h1>Welcome, Admin {user.name}!</h1>
            <p>System overview and management</p>
          </div>
          <div className="header-actions">
            <button onClick={() => navigate('/admin/employees')} className="btn-secondary">
              Manage Employees
            </button>
            <button onClick={() => navigate('/admin/customers')} className="btn-secondary">
              Manage Customers
            </button>
            <button onClick={handleLogout} className="btn-outline">
              <i className="fas fa-sign-out-alt"></i>
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="stats-section">
          <div className="stat-card primary">
            <div className="stat-icon">
              <i className="fas fa-users"></i>
            </div>
            <div className="stat-content">
              <h3>{overview?.totalUsers || 0}</h3>
              <p>Total Users</p>
            </div>
          </div>

          <div className="stat-card secondary">
            <div className="stat-icon">
              <i className="fas fa-ticket-alt"></i>
            </div>
            <div className="stat-content">
              <h3>{overview?.totalBookings || 0}</h3>
              <p>Total Bookings</p>
            </div>
          </div>

          <div className="stat-card success">
            <div className="stat-icon">
              <i className="fas fa-rupee-sign"></i>
            </div>
            <div className="stat-content">
              <h3>₹{(overview?.totalRevenue || 0).toLocaleString()}</h3>
              <p>Total Revenue</p>
            </div>
          </div>

          <div className="stat-card warning">
            <div className="stat-icon">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <div className="stat-content">
              <h3>₹{(overview?.totalPending || 0).toLocaleString()}</h3>
              <p>Pending Amount</p>
            </div>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Booking Statistics</h2>
              <button onClick={() => navigate('/admin/bookings')} className="btn-link">
                View All
              </button>
            </div>
            
            <div className="stats-grid">
              <div className="mini-stat">
                <div className="stat-number">{bookingStats?.pending || 0}</div>
                <div className="stat-label">Pending</div>
              </div>
              <div className="mini-stat">
                <div className="stat-number">{bookingStats?.confirmed || 0}</div>
                <div className="stat-label">Confirmed</div>
              </div>
              <div className="mini-stat">
                <div className="stat-number">{bookingStats?.cancelled || 0}</div>
                <div className="stat-label">Cancelled</div>
              </div>
            </div>
          </div>

          <div className="dashboard-section">
            <div className="section-header">
              <h2>Top Performing Employees</h2>
              <button onClick={() => navigate('/admin/reports')} className="btn-link">
                View Reports
              </button>
            </div>
            
            <div className="employee-performance">
              {employeePerformance && employeePerformance.length > 0 ? (
                employeePerformance.map((emp, index) => (
                  <div key={index} className="performance-item">
                    <div className="employee-info">
                      <div className="employee-name">{emp.name}</div>
                      <div className="employee-dept">{emp.department}</div>
                    </div>
                    <div className="performance-stats">
                      <div className="stat">
                        <span className="label">Total:</span>
                        <span className="value">{emp.totalBookings}</span>
                      </div>
                      <div className="stat">
                        <span className="label">Confirmed:</span>
                        <span className="value">{emp.confirmedBookings}</span>
                      </div>
                      <div className="stat">
                        <span className="label">Revenue:</span>
                        <span className="value">₹{emp.revenueGenerated?.toLocaleString() || 0}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <i className="fas fa-trophy"></i>
                  <p>No performance data available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="quick-actions">
          <h3>Quick Actions</h3>
          <div className="action-grid">
            <button onClick={() => navigate('/admin/bookings')} className="action-card">
              <i className="fas fa-list"></i>
              <span>All Bookings</span>
            </button>
            <button onClick={() => navigate('/admin/payments')} className="action-card">
              <i className="fas fa-credit-card"></i>
              <span>Payment Processing</span>
            </button>
            <button onClick={() => navigate('/admin/employees')} className="action-card">
              <i className="fas fa-user-tie"></i>
              <span>Employee Management</span>
            </button>
            <button onClick={() => navigate('/admin/customers')} className="action-card">
              <i className="fas fa-user-friends"></i>
              <span>Customer Management</span>
            </button>
            <button onClick={() => navigate('/admin/reports')} className="action-card">
              <i className="fas fa-chart-bar"></i>
              <span>Reports</span>
            </button>
            <button onClick={() => navigate('/admin/settings')} className="action-card">
              <i className="fas fa-cog"></i>
              <span>System Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;