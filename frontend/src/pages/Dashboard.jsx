import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dashboardAPI } from '../services/api';
import '../styles/dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        let data;
        
        if (user && user.us_usertype === 'admin') {
          data = await dashboardAPI.getAdminStats();
        } else if (user && user.us_usertype === 'employee') {
          data = await dashboardAPI.getEmployeeStats();
        } else {
          data = await dashboardAPI.getCustomerStats();
        }
        
        setStats(data);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  if (loading) {
    return <div className="dashboard panel">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="dashboard panel alert alert-error">{error}</div>;
  }

  if (!stats) {
    return <div className="dashboard panel">No dashboard data available</div>;
  }

  // Render dashboard based on user type
  if (user && user.us_usertype === 'admin') {
    return <AdminDashboard stats={stats} />;
  } else if (user && user.us_usertype === 'employee') {
    return <EmployeeDashboard stats={stats} />;
  } else {
    return <CustomerDashboard stats={stats} />;
  }
};

// Admin Dashboard Component
const AdminDashboard = ({ stats }) => {
  const { overview, bookingStats, employeePerformance } = stats;

  return (
    <div className="dashboard admin-dashboard">
      <div className="panel-header">
        <h2>Admin Dashboard</h2>
      </div>
      
      {/* Overview Stats */}
      <div className="row">
        <div className="col-3">
          <div className="stat-card">
            <h3>Total Users</h3>
            <p>{overview.totalUsers}</p>
          </div>
        </div>
        <div className="col-3">
          <div className="stat-card">
            <h3>Total Bookings</h3>
            <p>{overview.totalBookings}</p>
          </div>
        </div>
        <div className="col-3">
          <div className="stat-card">
            <h3>Total Revenue</h3>
            <p>₹{overview.totalRevenue?.toLocaleString() || '0'}</p>
          </div>
        </div>
        <div className="col-3">
          <div className="stat-card">
            <h3>Pending Amount</h3>
            <p>₹{overview.totalPending?.toLocaleString() || '0'}</p>
          </div>
        </div>
      </div>
      
      {/* Booking Stats */}
      <div className="panel">
        <h3>Booking Status Overview</h3>
        <div className="row">
          <div className="col-4">
            <div className="stat-card">
              <h3>Pending</h3>
              <h4>{bookingStats.pending}</h4>
            </div>
          </div>
          <div className="col-4">
            <div className="stat-card">
              <h3>Confirmed</h3>
              <h4>{bookingStats.confirmed}</h4>
            </div>
          </div>
          <div className="col-4">
            <div className="stat-card">
              <h3>Cancelled</h3>
              <h4>{bookingStats.cancelled}</h4>
            </div>
          </div>
        </div>
      </div>
      
      {/* Employee Performance */}
      <div className="panel">
        <h3>Employee Performance</h3>
        <div className="row">
          {employeePerformance && employeePerformance.map((employee, index) => (
            <div key={index} className="col-4">
              <div className="performance-card">
                <h4>{employee.name}</h4>
                <p><strong>Department:</strong> {employee.department || 'N/A'}</p>
                <p><strong>Total Bookings:</strong> {employee.totalBookings}</p>
                <p><strong>Confirmed:</strong> {employee.confirmedBookings}</p>
                <p><strong>Revenue:</strong> ₹{employee.revenueGenerated?.toLocaleString() || '0'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Employee Dashboard Component
const EmployeeDashboard = ({ stats }) => {
  const { overview } = stats;

  return (
    <div className="dashboard employee-dashboard">
      <div className="panel-header">
        <h2>Employee Dashboard</h2>
      </div>
      
      {/* Overview Stats */}
      <div className="row">
        <div className="col-3">
          <div className="stat-card">
            <h3>Total Bookings</h3>
            <p>{overview.totalBookings}</p>
          </div>
        </div>
        <div className="col-3">
          <div className="stat-card">
            <h3>Pending Bookings</h3>
            <p>{overview.pendingBookings}</p>
          </div>
        </div>
        <div className="col-3">
          <div className="stat-card">
            <h3>Confirmed Bookings</h3>
            <p>{overview.confirmedBookings}</p>
          </div>
        </div>
        <div className="col-3">
          <div className="stat-card">
            <h3>Revenue Generated</h3>
            <p>₹{overview.revenueGenerated?.toLocaleString() || '0'}</p>
          </div>
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="panel">
        <h3>Your Recent Bookings</h3>
        <div className="summary-details">
          <p>Recent booking activity will be displayed here.</p>
        </div>
      </div>
    </div>
  );
};

// Customer Dashboard Component
const CustomerDashboard = ({ stats }) => {
  const { overview, corporateInfo } = stats;

  return (
    <div className="dashboard customer-dashboard">
      <div className="panel-header">
        <h2>Customer Dashboard</h2>
      </div>
      
      {/* Overview Stats */}
      <div className="row">
        <div className="col-3">
          <div className="stat-card">
            <h3>Total Bookings</h3>
            <p>{overview.totalBookings}</p>
          </div>
        </div>
        <div className="col-3">
          <div className="stat-card">
            <h3>Pending Bookings</h3>
            <p>{overview.pendingBookings}</p>
          </div>
        </div>
        <div className="col-3">
          <div className="stat-card">
            <h3>Confirmed Bookings</h3>
            <p>{overview.confirmedBookings}</p>
          </div>
        </div>
        <div className="col-3">
          <div className="stat-card">
            <h3>Total Paid</h3>
            <p>₹{overview.totalPaid?.toLocaleString() || '0'}</p>
          </div>
        </div>
      </div>
      
      {/* Payment Summary */}
      <div className="panel">
        <h3>Payment Summary</h3>
        <div className="summary-details">
          <p><strong>Total Amount:</strong> ₹{overview.totalAmount?.toLocaleString() || '0'}</p>
          <p><strong>Paid:</strong> ₹{overview.totalPaid?.toLocaleString() || '0'}</p>
          <p><strong>Pending:</strong> ₹{overview.totalPending?.toLocaleString() || '0'}</p>
        </div>
      </div>
      
      {/* Corporate Info (if applicable) */}
      {corporateInfo && (
        <div className="panel">
          <h3>Corporate Information</h3>
          <div className="info-details">
            <p><strong>Company:</strong> {corporateInfo.companyName}</p>
            <p><strong>Credit Limit:</strong> ₹{corporateInfo.creditLimit?.toLocaleString() || '0'}</p>
            <p><strong>Credit Used:</strong> ₹{corporateInfo.creditUsed?.toLocaleString() || '0'}</p>
            <p><strong>Credit Available:</strong> ₹{(corporateInfo.creditLimit - corporateInfo.creditUsed)?.toLocaleString() || '0'}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;