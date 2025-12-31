import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/customer-dashboard.css';

const CustomerDashboard = () => {
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
    navigate('/auth/login');
  };

  const handleNewBooking = () => {
    navigate('/customer/booking/new');
  };

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
    <div className="customer-dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="user-welcome">
            <h1>Welcome back, {user.name}!</h1>
            <p>Manage your travel bookings and plans</p>
          </div>
          <div className="header-actions">
            <button onClick={handleNewBooking} className="btn-primary">
              <i className="fas fa-plus"></i>
              New Booking
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
            <div className="stat-icon active">
              <i className="fas fa-plane"></i>
            </div>
            <div className="stat-content">
              <h3>{stats?.activeBookings || 0}</h3>
              <p>Active Bookings</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon pending">
              <i className="fas fa-clock"></i>
            </div>
            <div className="stat-content">
              <h3>{stats?.pendingPayments || 0}</h3>
              <p>Pending Payments</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon monthly">
              <i className="fas fa-calendar-alt"></i>
            </div>
            <div className="stat-content">
              <h3>{stats?.thisMonthBookings || 0}</h3>
              <p>This Month</p>
            </div>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Recent Bookings</h2>
              <button onClick={() => navigate('/customer/bookings')} className="btn-link">
                View All
              </button>
            </div>
            
            <div className="bookings-list">
              {recentBookings && recentBookings.length > 0 ? (
                recentBookings.map((booking) => (
                  <div key={booking.bk_bkid} className="booking-card">
                    <div className="booking-info">
                      <div className="booking-route">
                        <span className="from">{booking.bk_from}</span>
                        <i className="fas fa-arrow-right"></i>
                        <span className="to">{booking.bk_to}</span>
                      </div>
                      <div className="booking-details">
                        <span className="date">
                          {new Date(booking.bk_jdate).toLocaleDateString()}
                        </span>
                        <span className={`status ${booking.bk_status?.toLowerCase()}`}>
                          {booking.bk_status}
                        </span>
                      </div>
                    </div>
                    <div className="booking-actions">
                      <button className="btn-sm">View Details</button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <i className="fas fa-calendar-times"></i>
                  <h3>No Recent Bookings</h3>
                  <p>You haven't made any bookings yet.</p>
                  <button onClick={handleNewBooking} className="btn-primary">
                    Create Your First Booking
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="dashboard-section">
            <div className="section-header">
              <h2>Payment History</h2>
              <button onClick={() => navigate('/customer/payments')} className="btn-link">
                View All
              </button>
            </div>
            
            <div className="payments-list">
              {pendingInvoices && pendingInvoices.length > 0 ? (
                pendingInvoices.map((invoice) => (
                  <div key={invoice.id} className="payment-card">
                    <div className="payment-info">
                      <div className="payment-amount">
                        ₹{invoice.amount?.toLocaleString()}
                      </div>
                      <div className="payment-details">
                        <span className="date">
                          {new Date(invoice.date).toLocaleDateString()}
                        </span>
                        <span className={`status ${invoice.status?.toLowerCase()}`}>
                          {invoice.status}
                        </span>
                      </div>
                    </div>
                    <div className="payment-actions">
                      <button className="btn-sm">Download</button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <i className="fas fa-receipt"></i>
                  <h3>No Payment History</h3>
                  <p>Your payment history will appear here.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="quick-actions">
          <h3>Quick Actions</h3>
          <div className="action-grid">
            <button onClick={handleNewBooking} className="action-card">
              <i className="fas fa-plus-circle"></i>
              <span>New Booking</span>
            </button>
            <button onClick={() => navigate('/customer/bookings')} className="action-card">
              <i className="fas fa-list"></i>
              <span>My Bookings</span>
            </button>
            <button onClick={() => navigate('/customer/payments')} className="action-card">
              <i className="fas fa-credit-card"></i>
              <span>Payment History</span>
            </button>
            <button onClick={() => navigate('/customer/profile')} className="action-card">
              <i className="fas fa-user"></i>
              <span>My Profile</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;