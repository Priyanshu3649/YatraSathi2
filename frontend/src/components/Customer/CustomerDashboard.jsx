import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/modern-customer-dashboard.css';

const CustomerDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [liveUpdateIndex, setLiveUpdateIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
    
    // Set up interval for cycling through live updates
    const interval = setInterval(() => {
      setLiveUpdateIndex(prev => (prev + 1) % liveUpdates.length);
    }, 4000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
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

  const handleNewBooking = () => {
    navigate('/customer/booking/new');
  };

  const liveUpdates = [
    { id: 1, message: 'New train schedules available for Diwali season!', time: '2 mins ago', type: 'info' },
    { id: 2, message: 'Special offers on premium bookings this week', time: '15 mins ago', type: 'offer' },
    { id: 3, message: 'Your booking status updated to CONFIRMED', time: '30 mins ago', type: 'success' },
    { id: 4, message: 'Payment received successfully', time: '1 hour ago', type: 'success' },
  ];

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
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

  const { stats, recentBookings, pendingInvoices } = dashboardData || {};
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div className="modern-customer-dashboard">
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1>Welcome back, {user.name}!</h1>
          <p>Manage your travel bookings and plans</p>
        </div>
        <div className="header-actions">
          <button onClick={handleNewBooking} className="btn-primary">
            <span className="btn-icon">🎫</span>
            New Booking
          </button>
        </div>
      </div>

      {/* Live Updates Ticker */}
      <div className="live-updates-ticker">
        <div className="ticker-label">📢</div>
        <div className="ticker-content">
          <div className="ticker-message" key={liveUpdateIndex}>
            {liveUpdates[liveUpdateIndex].message}
          </div>
        </div>
        <div className="ticker-time">
          {liveUpdates[liveUpdateIndex].time}
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#3498db' }}>
            <span className="icon">🎫</span>
          </div>
          <div className="stat-info">
            <h3>{stats?.totalBookings || 0}</h3>
            <p>Total Bookings</p>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${Math.min(100, (stats?.totalBookings || 0) * 10)}%`, backgroundColor: '#3498db' }}></div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#e74c3c' }}>
            <span className="icon">⏳</span>
          </div>
          <div className="stat-info">
            <h3>{stats?.activeBookings || 0}</h3>
            <p>Pending</p>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${Math.min(100, (stats?.activeBookings || 0) * 15)}%`, backgroundColor: '#e74c3c' }}></div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#2ecc71' }}>
            <span className="icon">✅</span>
          </div>
          <div className="stat-info">
            <h3>{stats?.activeBookings ? stats.totalBookings - stats.activeBookings : 0}</h3>
            <p>Confirmed</p>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${Math.min(100, ((stats?.activeBookings ? stats.totalBookings - stats.activeBookings : 0) / (stats?.totalBookings || 1)) * 100 || 0)}%`, backgroundColor: '#2ecc71' }}></div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#f39c12' }}>
            <span className="icon">💰</span>
          </div>
          <div className="stat-info">
            <h3>₹{(stats?.pendingPayments || 0).toLocaleString()}</h3>
            <p>Payments</p>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${Math.min(100, (stats?.pendingPayments || 0) / 1000 * 10 || 0)}%`, backgroundColor: '#f39c12' }}></div>
          </div>
        </div>
      </div>

      <div className="quick-actions-section">
        <h2>Quick Actions</h2>
        <div className="quick-actions-grid">
          <div 
            className="action-card"
            style={{ borderLeftColor: '#3498db' }}
            onClick={handleNewBooking}
          >
            <div className="action-icon" style={{ backgroundColor: '#3498db' + '20' }}>
              <span style={{ color: '#3498db' }}>🎫</span>
            </div>
            <div className="action-content">
              <h3>New Booking Request</h3>
              <p>Submit a new travel booking</p>
            </div>
            <div className="action-arrow">
              <span>→</span>
            </div>
          </div>
          <div 
            className="action-card"
            style={{ borderLeftColor: '#e74c3c' }}
            onClick={() => navigate('/customer/bookings')}
          >
            <div className="action-icon" style={{ backgroundColor: '#e74c3c' + '20' }}>
              <span style={{ color: '#e74c3c' }}>📋</span>
            </div>
            <div className="action-content">
              <h3>My Requests</h3>
              <p>View all your booking requests</p>
            </div>
            <div className="action-arrow">
              <span>→</span>
            </div>
          </div>
          <div 
            className="action-card"
            style={{ borderLeftColor: '#2ecc71' }}
            onClick={() => navigate('/customer/bills-payments')}
          >
            <div className="action-icon" style={{ backgroundColor: '#2ecc71' + '20' }}>
              <span style={{ color: '#2ecc71' }}>💰</span>
            </div>
            <div className="action-content">
              <h3>My Payments</h3>
              <p>Check payment status</p>
            </div>
            <div className="action-arrow">
              <span>→</span>
            </div>
          </div>
          <div 
            className="action-card"
            style={{ borderLeftColor: '#9b59b6' }}
            onClick={() => navigate('/customer/profile')}
          >
            <div className="action-icon" style={{ backgroundColor: '#9b59b6' + '20' }}>
              <span style={{ color: '#9b59b6' }}>👤</span>
            </div>
            <div className="action-content">
              <h3>My Profile</h3>
              <p>Manage your account</p>
            </div>
            <div className="action-arrow">
              <span>→</span>
            </div>
          </div>
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

export default CustomerDashboard;