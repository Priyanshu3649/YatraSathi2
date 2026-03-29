import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useRealTime } from '../contexts/RealTimeContext';
import { dashboardAPI } from '../services/api';
import '../styles/dashboard.css';
import '../styles/vintage-erp-theme.css';
import '../styles/classic-enterprise-global.css';
import '../styles/vintage-admin-panel.css';
import '../styles/dynamic-admin-panel.css';
import '../styles/vintage-erp-global.css';
import '../styles/vintage-erp-dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { socket, isConnected, lastUpdate: rtLastUpdate } = useRealTime();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      // Don't set loading true for background refreshes
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

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  // Real-time socket listeners
  useEffect(() => {
    if (socket) {
      const handleUpdate = () => {
        console.log('🔄 Real-time update received, refreshing dashboard...');
        fetchDashboardData();
      };

      socket.on('booking_update', handleUpdate);
      socket.on('payment_update', handleUpdate);
      socket.on('billing_update', handleUpdate);

      return () => {
        socket.off('booking_update', handleUpdate);
        socket.off('payment_update', handleUpdate);
        socket.off('billing_update', handleUpdate);
      };
    }
  }, [socket]);

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
    return (
      <AdminDashboard
        stats={stats}
        isConnected={isConnected}
        rtLastUpdate={rtLastUpdate}
        onNavigate={navigate}
        onRefresh={fetchDashboardData}
      />
    );
  } else if (user && user.us_usertype === 'employee') {
    return <EmployeeDashboard stats={stats} onNavigate={navigate} />;
  } else {
    return <CustomerDashboard stats={stats} onNavigate={navigate} />;
  }
};

// Admin Dashboard Component with Vintage ERP Styling
const AdminDashboard = ({ stats, isConnected, rtLastUpdate, onNavigate, onRefresh }) => {
  const { user } = useAuth();
  const { overview, bookingStats, employeePerformance, recentActivity, alerts } = stats || {};
  
  // Calculate financial metrics
  const revenueMetrics = [
    { metric: 'Net Fare Collected', amount: overview?.netFareCollected || '₹0' },
    { metric: 'Service Charges', amount: overview?.serviceCharges || '₹0' },
    { metric: 'Agent Fees', amount: overview?.agentFees || '₹0' },
    { metric: 'Platform Fees', amount: overview?.platformFees || '₹0' },
    { metric: 'Discounts Given', amount: overview?.discountsGiven || '₹0' },
    { metric: 'Taxes Collected', amount: overview?.taxesCollected || '₹0' },
    { metric: 'Total Revenue', amount: overview?.totalRevenue || '₹0' }
  ];
  
  const outstandingMetrics = [
    { category: 'Pending Bills', count: overview?.pendingBillsCount || 0, amount: overview?.pendingBillsAmount || '₹0' },
    { category: 'Partial Payments', count: overview?.partialPaymentsCount || 0, amount: overview?.partialPaymentsAmount || '₹0' },
    { category: 'Overdue Payments', count: overview?.overduePaymentsCount || 0, amount: overview?.overduePaymentsAmount || '₹0' },
    { category: 'Refund Pending', count: overview?.refundPendingCount || 0, amount: overview?.refundPendingAmount || '₹0' }
  ];
  
  const operationalMetrics = [
    { metric: 'Trains Booked', today: overview?.trainsBookedToday || 0, thisMonth: overview?.trainsBookedThisMonth || 0 },
    { metric: 'Tickets Issued', today: overview?.ticketsIssuedToday || 0, thisMonth: overview?.ticketsIssuedThisMonth || 0 },
    { metric: 'Tickets Cancelled', today: overview?.ticketsCancelledToday || 0, thisMonth: overview?.ticketsCancelledThisMonth || 0 },
    { metric: 'Waitlisted PNRs', today: overview?.waitlistedPnrsToday || 0, thisMonth: overview?.waitlistedPnrsThisMonth || 0 },
    { metric: 'Chart Prepared', today: overview?.chartsPreparedToday || 0, thisMonth: overview?.chartsPreparedThisMonth || 0 }
  ];
  
  const navigationLinks = [
    { name: 'Bookings', path: '/bookings' },
    { name: 'Billing', path: '/billing' },
    { name: 'Payments', path: '/payments' },
    { name: 'Refunds', path: '/refunds' },
    { name: 'Reports', path: '/reports' },
    { name: 'Admin Panel', path: '/admin-dashboard' }
  ];
  
  const defaultAlerts = [
    { type: 'critical', message: 'Bills overdue > 7 days' },
    { type: 'warning', message: 'Partial payments pending' },
    { type: 'critical', message: 'Refunds pending approval' },
    { type: 'warning', message: 'Charts not prepared for today' }
  ];
  
  return (
    <div className="admin-dashboard erp-admin-container">
      {/* Top Menu Bar - Static */}
      <div className="erp-menu-bar">
        <div className="erp-menu-item">File</div>
        <div className="erp-menu-item">Edit</div>
        <div className="erp-menu-item">View</div>
        <div className="erp-menu-item">Dashboard</div>
        <div className="erp-menu-item">Reports</div>
        <div className="erp-menu-item">Help</div>
        <div className="erp-user-info">USER: ADMIN ⚙</div>
      </div>

      {/* Toolbar - Static */}
      <div className="erp-toolbar">
        <button type="button" className="erp-button" onClick={() => onRefresh?.()}>Refresh</button>
        <div className="erp-tool-separator"></div>
        <button className="erp-button">Filters</button>
        <button className="erp-button">Print</button>
        <button className="erp-button">Export</button>
      </div>

      {/* Main Content Area - Scrollable */}
      <div className="erp-main-content">
        {/* Center Content */}
        <div className="erp-center-content">
          {/* System Summary - Top Row */}
          <div className="section-header">
            SYSTEM SUMMARY 
            {isConnected && <span className="live-indicator">● LIVE</span>}
          </div>
          <div className="dashboard-summary">
            <div className="summary-panel">
              <div className="summary-title">TOTAL BOOKINGS</div>
              <div className="summary-value">
                {overview?.totalBookings || 0}
                {overview?.trends?.bookings && (
                  <span className={`trend-tag ${parseFloat(overview.trends.bookings.percent) >= 0 ? 'up' : 'down'}`}>
                    {parseFloat(overview.trends.bookings.percent) >= 0 ? '↑' : '↓'} {Math.abs(overview.trends.bookings.percent)}%
                  </span>
                )}
              </div>
              <div className="summary-desc">All time bookings</div>
            </div>
            <div className="summary-panel">
              <div className="summary-title">TOTAL REVENUE</div>
              <div className="summary-value">
                ₹{(overview?.totalRevenue || 0).toLocaleString()}
                {overview?.trends?.revenue && (
                  <span className={`trend-tag ${parseFloat(overview.trends.revenue.percent) >= 0 ? 'up' : 'down'}`}>
                    {parseFloat(overview.trends.revenue.percent) >= 0 ? '↑' : '↓'} {Math.abs(overview.trends.revenue.percent)}%
                  </span>
                )}
              </div>
              <div className="summary-desc">Processed payments</div>
            </div>
            <div className="summary-panel">
              <div className="summary-title">PENDING PAYMENTS</div>
              <div className="summary-value">₹{(overview?.totalPending || 0).toLocaleString()}</div>
              <div className="summary-desc">Awaiting clearance</div>
            </div>
            <div className="summary-panel">
              <div className="summary-title">REFUNDS IN PROCESS</div>
              <div className="summary-value">{overview?.refundsInProcess || 0}</div>
              <div className="summary-desc">Processing queue</div>
            </div>
          </div>

          {/* Financial Snapshot */}
          <div className="section-header">FINANCIAL SNAPSHOT</div>
          <div className="section-content">
            <div className="financial-section">
              <div>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#2d3748' }}>REVENUE SUMMARY</h4>
                <table className="financial-table">
                  <thead>
                    <tr>
                      <th>Metric</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenueMetrics.map((item, index) => (
                      <tr key={index}>
                        <td>{item.metric}</td>
                        <td>{item.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#2d3748' }}>OUTSTANDING & RISK</h4>
                <table className="outstanding-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Count</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {outstandingMetrics.map((item, index) => (
                      <tr key={index}>
                        <td>{item.category}</td>
                        <td>{item.count}</td>
                        <td>{item.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Operational Status */}
          <div className="section-header">OPERATIONAL STATUS</div>
          <div className="section-content">
            <table className="operational-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Today</th>
                  <th>This Month</th>
                </tr>
              </thead>
              <tbody>
                {operationalMetrics.map((item, index) => (
                  <tr key={index}>
                    <td>{item.metric}</td>
                    <td>{item.today}</td>
                    <td>{item.thisMonth}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Recent Activity Log */}
          <div className="section-header">RECENT ACTIVITY LOG</div>
          <div className="section-content">
            <div className="scrollable-container">
              <table className="activity-log-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Module</th>
                    <th>Action</th>
                    <th>Reference</th>
                    <th>User</th>
                  </tr>
                </thead>
                <tbody>
                  {(recentActivity && recentActivity.length > 0 ? recentActivity : [
                    { timestamp: '06/01/2026 14:22', module: 'Billing', action: 'Bill Created', reference: 'BILL-10234', user: 'ADM001' },
                    { timestamp: '06/01/2026 14:15', module: 'Booking', action: 'Booking Confirmed', reference: 'BK-20260106-001', user: 'EMP001' },
                    { timestamp: '06/01/2026 14:10', module: 'Payment', action: 'Payment Received', reference: 'PYMT-001', user: 'ACC001' },
                    { timestamp: '06/01/2026 14:05', module: 'Customer', action: 'Customer Added', reference: 'CUS-001', user: 'ADM001' }
                  ]).map((activity, index) => (
                    <tr key={index}>
                      <td>{activity.timestamp}</td>
                      <td>{activity.module}</td>
                      <td>{activity.action}</td>
                      <td>{activity.reference}</td>
                      <td>{activity.user}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Alerts & Attention Required */}
          <div className="section-header">ALERTS & ATTENTION REQUIRED</div>
          <div className="alerts-section">
            {(alerts && alerts.length > 0 ? alerts : defaultAlerts).map((alert, index) => (
              <div key={index} className={`alert-item ${alert.type}`}>
                <span>{alert.message}</span>
              </div>
            ))}
          </div>

          {/* Quick Navigation */}
          <div className="section-header">QUICK NAVIGATION</div>
          <div className="quick-nav-section">
            {navigationLinks.map((link, index) => (
              <button key={index} type="button" className="nav-button" onClick={() => onNavigate(link.path)}>
                {link.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Audit Footer */}
      <div className="erp-status-bar">
        <div className="erp-status-item">
          System Sync: {rtLastUpdate ? rtLastUpdate.toLocaleTimeString() : new Date().toLocaleTimeString()} 
          <span style={{ marginLeft: '10px', color: isConnected ? '#2ecc71' : '#e74c3c' }}>
            {isConnected ? '[CONNECTED]' : '[OFFLINE]'}
          </span>
        </div>
        <div className="erp-status-item">Logged-in User: {user?.us_fname || 'ADMIN'}</div>
        <div className="erp-status-item">Role: {user?.us_roid || 'ADMIN'}</div>
        <div className="erp-status-item">Last Update: {stats?.lastUpdated ? new Date(stats.lastUpdated).toLocaleTimeString() : 'N/A'}</div>
      </div>
    </div>
  );
};

// Employee Dashboard Component
const EmployeeDashboard = ({ stats, onNavigate }) => {
  const { overview } = stats || {};
  const empQuickLinks = [
    { name: 'Bookings', path: '/bookings' },
    { name: 'Billing', path: '/billing' },
    { name: 'Payments', path: '/payments' },
    { name: 'Reports', path: '/reports' },
    { name: 'Role workspace', path: '/employee' }
  ];

  return (
    <div className="admin-dashboard erp-admin-container employee-dashboard">
      <div className="erp-menu-bar">
        <div className="erp-menu-item">Employee</div>
        <div className="erp-user-info">OPERATIONS</div>
      </div>
      <div className="erp-toolbar">
        <button type="button" className="erp-button" onClick={() => window.location.reload()}>Refresh</button>
      </div>
      <div className="erp-main-content">
        <div className="erp-center-content">
          <div className="section-header">YOUR METRICS</div>
          <div className="dashboard-summary">
            <div className="summary-panel">
              <div className="summary-title">BOOKINGS</div>
              <div className="summary-value">{overview?.totalBookings || 0}</div>
            </div>
            <div className="summary-panel">
              <div className="summary-title">PENDING</div>
              <div className="summary-value">{overview?.pendingBookings || 0}</div>
            </div>
            <div className="summary-panel">
              <div className="summary-title">CONFIRMED</div>
              <div className="summary-value">{overview?.confirmedBookings || 0}</div>
            </div>
            <div className="summary-panel">
              <div className="summary-title">REVENUE</div>
              <div className="summary-value">₹{(overview?.revenueGenerated ?? 0).toLocaleString()}</div>
            </div>
          </div>
          <div className="section-header">QUICK NAVIGATION</div>
          <div className="quick-nav-section">
            {empQuickLinks.map((link, i) => (
              <button key={i} type="button" className="nav-button" onClick={() => onNavigate(link.path)}>
                {link.name}
              </button>
            ))}
          </div>
          <div className="section-header">RECENT BOOKINGS</div>
          <div className="panel" style={{ padding: '12px' }}>
            <p className="summary-details" style={{ margin: 0 }}>Use Bookings for full history; metrics refresh from the live dashboard API.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Customer Dashboard Component
const CustomerDashboard = ({ stats, onNavigate }) => {
  const { overview, corporateInfo } = stats || {};
  const custQuickLinks = [
    { name: 'My Bookings', path: '/customer/bookings' },
    { name: 'Bills & payments', path: '/customer/bills-payments' },
    { name: 'New booking', path: '/customer/booking/new' },
    { name: 'Profile', path: '/customer/profile' }
  ];

  return (
    <div className="admin-dashboard erp-admin-container customer-dashboard">
      <div className="erp-menu-bar">
        <div className="erp-menu-item">Customer portal</div>
        <div className="erp-user-info">SELF-SERVICE</div>
      </div>
      <div className="erp-main-content">
        <div className="erp-center-content">
          <div className="section-header">YOUR TRAVEL SUMMARY</div>
          <div className="dashboard-summary">
            <div className="summary-panel">
              <div className="summary-title">BOOKINGS</div>
              <div className="summary-value">{overview?.totalBookings || 0}</div>
            </div>
            <div className="summary-panel">
              <div className="summary-title">PENDING</div>
              <div className="summary-value">{overview?.pendingBookings || 0}</div>
            </div>
            <div className="summary-panel">
              <div className="summary-title">CONFIRMED</div>
              <div className="summary-value">{overview?.confirmedBookings || 0}</div>
            </div>
            <div className="summary-panel">
              <div className="summary-title">PAID</div>
              <div className="summary-value">₹{(overview?.totalPaid ?? 0).toLocaleString()}</div>
            </div>
          </div>

          <div className="section-header">PAYMENT SUMMARY</div>
          <div className="section-content">
            <table className="financial-table">
              <tbody>
                <tr><td>Total amount</td><td>₹{(overview?.totalAmount ?? 0).toLocaleString()}</td></tr>
                <tr><td>Paid</td><td>₹{(overview?.totalPaid ?? 0).toLocaleString()}</td></tr>
                <tr><td>Pending</td><td>₹{(overview?.totalPending ?? 0).toLocaleString()}</td></tr>
              </tbody>
            </table>
          </div>

          <div className="section-header">QUICK NAVIGATION</div>
          <div className="quick-nav-section">
            {custQuickLinks.map((link, i) => (
              <button key={i} type="button" className="nav-button" onClick={() => onNavigate(link.path)}>
                {link.name}
              </button>
            ))}
          </div>

          {corporateInfo && (
            <>
              <div className="section-header">CORPORATE</div>
              <div className="section-content">
                <p><strong>Company:</strong> {corporateInfo.companyName}</p>
                <p><strong>Credit limit:</strong> ₹{corporateInfo.creditLimit?.toLocaleString() || '0'}</p>
                <p><strong>Credit used:</strong> ₹{corporateInfo.creditUsed?.toLocaleString() || '0'}</p>
                <p><strong>Available:</strong> ₹{(corporateInfo.creditLimit - corporateInfo.creditUsed)?.toLocaleString() || '0'}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;