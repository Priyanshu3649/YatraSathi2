import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/modern-customer-dashboard.css';

const ModernCustomerDashboard = () => {
  const [dashboardStats, setDashboardStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    confirmedRequests: 0,
    totalPayments: 0
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/customer/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setDashboardStats({
          totalRequests: data.data.stats?.totalBookings || 0,
          pendingRequests: data.data.stats?.activeBookings || 0,
          confirmedRequests: data.data.stats?.totalBookings || 0, // This would need to be calculated differently in a real scenario
          totalPayments: 0 // Placeholder
        });
      }
    } catch (error) {
      console.error('Dashboard stats fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const quickActions = [
    {
      title: 'New Booking Request',
      description: 'Submit a new travel booking',
      icon: '🎫',
      color: '#3498db',
      onClick: () => handleNavigation('/customer/booking/new')
    },
    {
      title: 'My Requests',
      description: 'View all your booking requests',
      icon: '📋',
      color: '#e74c3c',
      onClick: () => handleNavigation('/customer/bookings')
    },
    {
      title: 'My Payments',
      description: 'Check payment status',
      icon: '💰',
      color: '#2ecc71',
      onClick: () => handleNavigation('/customer/bills-payments')
    },
    {
      title: 'My Profile',
      description: 'Manage your account',
      icon: '👤',
      color: '#9b59b6',
      onClick: () => handleNavigation('/customer/profile')
    }
  ];

  if (loading) {
    return (
      <div className="modern-customer-dashboard loading">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="modern-customer-dashboard">
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1>Welcome to YatraSathi</h1>
          <p>Manage your travel bookings with ease</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#3498db' }}>
            <span className="icon">🎫</span>
          </div>
          <div className="stat-info">
            <h3>{dashboardStats.totalRequests}</h3>
            <p>Total Requests</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#e74c3c' }}>
            <span className="icon">⏳</span>
          </div>
          <div className="stat-info">
            <h3>{dashboardStats.pendingRequests}</h3>
            <p>Pending</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#2ecc71' }}>
            <span className="icon">✅</span>
          </div>
          <div className="stat-info">
            <h3>{dashboardStats.confirmedRequests}</h3>
            <p>Confirmed</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#f39c12' }}>
            <span className="icon">💰</span>
          </div>
          <div className="stat-info">
            <h3>₹{dashboardStats.totalPayments}</h3>
            <p>Payments</p>
          </div>
        </div>
      </div>

      <div className="quick-actions-section">
        <h2>Quick Actions</h2>
        <div className="quick-actions-grid">
          {quickActions.map((action, index) => (
            <div 
              key={index}
              className="action-card"
              style={{ borderLeftColor: action.color }}
              onClick={action.onClick}
            >
              <div className="action-icon" style={{ backgroundColor: action.color + '20' }}>
                <span style={{ color: action.color }}>{action.icon}</span>
              </div>
              <div className="action-content">
                <h3>{action.title}</h3>
                <p>{action.description}</p>
              </div>
              <div className="action-arrow">
                <span>→</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="recent-activity-section">
        <h2>Recent Activity</h2>
        <div className="activity-list">
          <div className="activity-item">
            <div className="activity-icon">🎫</div>
            <div className="activity-content">
              <h4>New Booking Request</h4>
              <p>Successfully submitted your booking request</p>
              <span className="activity-time">2 hours ago</span>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon">✅</div>
            <div className="activity-content">
              <h4>Booking Confirmed</h4>
              <p>Your booking has been confirmed</p>
              <span className="activity-time">1 day ago</span>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon">💰</div>
            <div className="activity-content">
              <h4>Payment Received</h4>
              <p>Payment has been processed successfully</p>
              <span className="activity-time">3 days ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernCustomerDashboard;