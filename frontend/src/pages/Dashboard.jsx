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
        
        if (user.us_usertype === 'admin') {
          data = await dashboardAPI.getAdminStats();
        } else if (user.us_usertype === 'employee') {
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
  if (user.us_usertype === 'admin') {
    return <AdminDashboard stats={stats} />;
  } else if (user.us_usertype === 'employee') {
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
          <div className="card">
            <div className="card-header">Total Users</div>
            <div className="p-2 text-center">
              <h3>{overview.totalUsers}</h3>
            </div>
          </div>
        </div>
        <div className="col-3">
          <div className="card">
            <div className="card-header">Total Bookings</div>
            <div className="p-2 text-center">
              <h3>{overview.totalBookings}</h3>
            </div>
          </div>
        </div>
        <div className="col-3">
          <div className="card">
            <div className="card-header">Total Revenue</div>
            <div className="p-2 text-center">
              <h3>₹{overview.totalRevenue?.toLocaleString() || '0'}</h3>
            </div>
          </div>
        </div>
        <div className="col-3">
          <div className="card">
            <div className="card-header">Pending Amount</div>
            <div className="p-2 text-center">
              <h3>₹{overview.totalPending?.toLocaleString() || '0'}</h3>
            </div>
          </div>
        </div>
      </div>
      
      {/* Booking Stats */}
      <div className="panel card">
        <div className="panel-header">
          <h3>Booking Status Overview</h3>
        </div>
        <div className="row">
          <div className="col-4">
            <div className="card text-center">
              <div className="card-header">Pending</div>
              <div className="p-2">
                <h4>{bookingStats.pending}</h4>
              </div>
            </div>
          </div>
          <div className="col-4">
            <div className="card text-center">
              <div className="card-header">Confirmed</div>
              <div className="p-2">
                <h4>{bookingStats.confirmed}</h4>
              </div>
            </div>
          </div>
          <div className="col-4">
            <div className="card text-center">
              <div className="card-header">Cancelled</div>
              <div className="p-2">
                <h4>{bookingStats.cancelled}</h4>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Employee Performance */}
      <div className="panel card">
        <div className="panel-header">
          <h3>Employee Performance</h3>
        </div>
        <div className="row">
          {employeePerformance && employeePerformance.map((employee, index) => (
            <div key={index} className="col-4 mb-2">
              <div className="card">
                <div className="card-header">{employee.name}</div>
                <div className="p-2">
                  <p className="mb-1">Department: {employee.department || 'N/A'}</p>
                  <p className="mb-1">Total Bookings: {employee.totalBookings}</p>
                  <p className="mb-1">Confirmed: {employee.confirmedBookings}</p>
                  <p>Revenue: ₹{employee.revenueGenerated?.toLocaleString() || '0'}</p>
                </div>
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
          <div className="card">
            <div className="card-header">Total Bookings</div>
            <div className="p-2 text-center">
              <h3>{overview.totalBookings}</h3>
            </div>
          </div>
        </div>
        <div className="col-3">
          <div className="card">
            <div className="card-header">Pending Bookings</div>
            <div className="p-2 text-center">
              <h3>{overview.pendingBookings}</h3>
            </div>
          </div>
        </div>
        <div className="col-3">
          <div className="card">
            <div className="card-header">Confirmed Bookings</div>
            <div className="p-2 text-center">
              <h3>{overview.confirmedBookings}</h3>
            </div>
          </div>
        </div>
        <div className="col-3">
          <div className="card">
            <div className="card-header">Revenue Generated</div>
            <div className="p-2 text-center">
              <h3>₹{overview.revenueGenerated?.toLocaleString() || '0'}</h3>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="panel card">
        <div className="panel-header">
          <h3>Your Recent Bookings</h3>
        </div>
        <div className="p-2">
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
          <div className="card">
            <div className="card-header">Total Bookings</div>
            <div className="p-2 text-center">
              <h3>{overview.totalBookings}</h3>
            </div>
          </div>
        </div>
        <div className="col-3">
          <div className="card">
            <div className="card-header">Pending Bookings</div>
            <div className="p-2 text-center">
              <h3>{overview.pendingBookings}</h3>
            </div>
          </div>
        </div>
        <div className="col-3">
          <div className="card">
            <div className="card-header">Confirmed Bookings</div>
            <div className="p-2 text-center">
              <h3>{overview.confirmedBookings}</h3>
            </div>
          </div>
        </div>
        <div className="col-3">
          <div className="card">
            <div className="card-header">Total Paid</div>
            <div className="p-2 text-center">
              <h3>₹{overview.totalPaid?.toLocaleString() || '0'}</h3>
            </div>
          </div>
        </div>
      </div>
      
      {/* Payment Summary */}
      <div className="panel card">
        <div className="panel-header">
          <h3>Payment Summary</h3>
        </div>
        <div className="p-2">
          <p className="mb-1">Total Amount: ₹{overview.totalAmount?.toLocaleString() || '0'}</p>
          <p className="mb-1">Paid: ₹{overview.totalPaid?.toLocaleString() || '0'}</p>
          <p>Pending: ₹{overview.totalPending?.toLocaleString() || '0'}</p>
        </div>
      </div>
      
      {/* Corporate Info (if applicable) */}
      {corporateInfo && (
        <div className="panel card">
          <div className="panel-header">
            <h3>Corporate Information</h3>
          </div>
          <div className="p-2">
            <p className="mb-1">Company: {corporateInfo.companyName}</p>
            <p className="mb-1">Credit Limit: ₹{corporateInfo.creditLimit?.toLocaleString() || '0'}</p>
            <p className="mb-1">Credit Used: ₹{corporateInfo.creditUsed?.toLocaleString() || '0'}</p>
            <p>Credit Available: ₹{(corporateInfo.creditLimit - corporateInfo.creditUsed)?.toLocaleString() || '0'}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;