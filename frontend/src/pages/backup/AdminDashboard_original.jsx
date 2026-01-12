import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';
import './styles/admin-dashboard.css';

const AdminDashboard = () => {
  const [overview, setOverview] = useState({
    totalBookings: 0,
    activePnrs: 0,
    billsGeneratedToday: 0,
    pendingPayments: 0,
    refundsInProcess: 0
  });

  const [bookingStats, setBookingStats] = useState({
    pending: 0,
    confirmed: 0,
    cancelled: 0
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Function to fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getAdminStats();
      
      if (response.success) {
        const data = response.data;
        
        setOverview({
          totalBookings: data.overview?.totalBookings || 0,
          activePnrs: data.overview?.totalActivePnrs || 0,
          billsGeneratedToday: data.overview?.billsGeneratedToday || 0,
          pendingPayments: data.overview?.totalPending || 0,
          refundsInProcess: data.overview?.refundsInProcess || 0
        });

        setBookingStats({
          pending: data.bookingStats?.pending || 0,
          confirmed: data.bookingStats?.confirmed || 0,
          cancelled: data.bookingStats?.cancelled || 0
        });

        setRecentActivity(data.recentActivity || []);
        setAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setLastUpdated(new Date());
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();

    // Set up interval to refresh data every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);

    return () => clearInterval(interval);
  }, []);

  // Calculate financial metrics
  const revenueMetrics = [
    { metric: 'Net Fare Collected', amount: '₹2,45,000' },
    { metric: 'Service Charges', amount: '₹24,500' },
    { metric: 'Agent Fees', amount: '₹12,250' },
    { metric: 'Platform Fees', amount: '₹8,167' },
    { metric: 'Discounts Given', amount: '₹15,000' },
    { metric: 'Taxes Collected', amount: '₹42,000' },
    { metric: 'Total Revenue', amount: '₹3,16,917' }
  ];

  const outstandingMetrics = [
    { category: 'Pending Bills', count: 12, amount: '₹45,000' },
    { category: 'Partial Payments', count: 8, amount: '₹23,500' },
    { category: 'Overdue Payments', count: 5, amount: '₹18,000' },
    { category: 'Refund Pending', count: 3, amount: '₹12,000' }
  ];

  const operationalMetrics = [
    { metric: 'Trains Booked', today: 24, thisMonth: 456 },
    { metric: 'Tickets Issued', today: 187, thisMonth: 3245 },
    { metric: 'Tickets Cancelled', today: 12, thisMonth: 156 },
    { metric: 'Waitlisted PNRs', today: 8, thisMonth: 123 },
    { metric: 'Chart Prepared', today: 22, thisMonth: 432 }
  ];

  const navigationLinks = [
    { name: 'Bookings', path: '/bookings' },
    { name: 'Billing', path: '/billing' },
    { name: 'Payments', path: '/payments' },
    { name: 'Refunds', path: '/refunds' },
    { name: 'Reports', path: '/reports' },
    { name: 'Admin Panel', path: '/admin-panel' }
  ];

  const defaultAlerts = [
    { type: 'critical', message: 'Bills overdue > 7 days' },
    { type: 'warning', message: 'Partial payments pending' },
    { type: 'critical', message: 'Refunds pending approval' },
    { type: 'warning', message: 'Charts not prepared for today' }
  ];

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">ADMINISTRATIVE DASHBOARD</div>
      
      {/* System Summary - Top Row */}
      <div className="section-header">SYSTEM SUMMARY</div>
      <div className="dashboard-summary">
        <div className="summary-panel">
          <div className="summary-title">TOTAL BOOKINGS</div>
          <div className="summary-value">{overview.totalBookings}</div>
          <div className="summary-desc">All time bookings</div>
        </div>
        <div className="summary-panel">
          <div className="summary-title">ACTIVE PNRS</div>
          <div className="summary-value">{overview.activePnrs}</div>
          <div className="summary-desc">Currently active</div>
        </div>
        <div className="summary-panel">
          <div className="summary-title">BILLS GENERATED TODAY</div>
          <div className="summary-value">{overview.billsGeneratedToday}</div>
          <div className="summary-desc">Current day</div>
        </div>
        <div className="summary-panel">
          <div className="summary-title">PENDING PAYMENTS</div>
          <div className="summary-value">{overview.pendingPayments}</div>
          <div className="summary-desc">Awaiting clearance</div>
        </div>
        <div className="summary-panel">
          <div className="summary-title">REFUNDS IN PROCESS</div>
          <div className="summary-value">{overview.refundsInProcess}</div>
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
              {(recentActivity.length > 0 ? recentActivity : [
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
        {(alerts.length > 0 ? alerts : defaultAlerts).map((alert, index) => (
          <div key={index} className={`alert-item ${alert.type}`}>
            <span>{alert.message}</span>
          </div>
        ))}
      </div>

      {/* Quick Navigation */}
      <div className="section-header">QUICK NAVIGATION</div>
      <div className="quick-nav-section">
        {navigationLinks.map((link, index) => (
          <button key={index} className="nav-button" onClick={() => window.location.hash = link.path}>
            {link.name}
          </button>
        ))}
      </div>

      {/* Audit Footer */}
      <div className="audit-footer">
        <div>System Date & Time: {lastUpdated.toLocaleString()}</div>
        <div>Last Refresh: {lastUpdated.toLocaleTimeString()}</div>
        <div>Data Refresh: Auto (30s)</div>
      </div>
    </div>
  );
};

export default AdminDashboard;