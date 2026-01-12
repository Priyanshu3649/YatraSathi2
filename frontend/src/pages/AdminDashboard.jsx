import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dashboardAPI } from '../services/api';
import '../styles/vintage-erp-theme.css';
import '../styles/classic-enterprise-global.css';
import '../styles/vintage-admin-panel.css';
import '../styles/dynamic-admin-panel.css';
import '../styles/vintage-erp-global.css';
import '../styles/vintage-erp-dashboard.css';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [overview, setOverview] = useState({
    totalBookings: 0,
    totalActivePnrs: 0,
    billsGeneratedToday: 0,
    totalPending: 0,
    refundsInProcess: 0,
    netFareCollected: '₹0',
    serviceCharges: '₹0',
    agentFees: '₹0',
    platformFees: '₹0',
    discountsGiven: '₹0',
    taxesCollected: '₹0',
    totalRevenue: '₹0',
    pendingBillsCount: 0,
    pendingBillsAmount: '₹0',
    partialPaymentsCount: 0,
    partialPaymentsAmount: '₹0',
    overduePaymentsCount: 0,
    overduePaymentsAmount: '₹0',
    refundPendingCount: 0,
    refundPendingAmount: '₹0',
    trainsBookedToday: 0,
    trainsBookedThisMonth: 0,
    ticketsIssuedToday: 0,
    ticketsIssuedThisMonth: 0,
    ticketsCancelledToday: 0,
    ticketsCancelledThisMonth: 0,
    waitlistedPnrsToday: 0,
    waitlistedPnrsThisMonth: 0,
    chartsPreparedToday: 0,
    chartsPreparedThisMonth: 0
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
          totalActivePnrs: data.overview?.totalActivePnrs || 0,
          billsGeneratedToday: data.overview?.billsGeneratedToday || 0,
          totalPending: data.overview?.totalPending || 0,
          refundsInProcess: data.overview?.refundsInProcess || 0,
          netFareCollected: data.overview?.netFareCollected || '₹0',
          serviceCharges: data.overview?.serviceCharges || '₹0',
          agentFees: data.overview?.agentFees || '₹0',
          platformFees: data.overview?.platformFees || '₹0',
          discountsGiven: data.overview?.discountsGiven || '₹0',
          taxesCollected: data.overview?.taxesCollected || '₹0',
          totalRevenue: data.overview?.totalRevenue || '₹0',
          pendingBillsCount: data.overview?.pendingBillsCount || 0,
          pendingBillsAmount: data.overview?.pendingBillsAmount || '₹0',
          partialPaymentsCount: data.overview?.partialPaymentsCount || 0,
          partialPaymentsAmount: data.overview?.partialPaymentsAmount || '₹0',
          overduePaymentsCount: data.overview?.overduePaymentsCount || 0,
          overduePaymentsAmount: data.overview?.overduePaymentsAmount || '₹0',
          refundPendingCount: data.overview?.refundPendingCount || 0,
          refundPendingAmount: data.overview?.refundPendingAmount || '₹0',
          trainsBookedToday: data.overview?.trainsBookedToday || 0,
          trainsBookedThisMonth: data.overview?.trainsBookedThisMonth || 0,
          ticketsIssuedToday: data.overview?.ticketsIssuedToday || 0,
          ticketsIssuedThisMonth: data.overview?.ticketsIssuedThisMonth || 0,
          ticketsCancelledToday: data.overview?.ticketsCancelledToday || 0,
          ticketsCancelledThisMonth: data.overview?.ticketsCancelledThisMonth || 0,
          waitlistedPnrsToday: data.overview?.waitlistedPnrsToday || 0,
          waitlistedPnrsThisMonth: data.overview?.waitlistedPnrsThisMonth || 0,
          chartsPreparedToday: data.overview?.chartsPreparedToday || 0,
          chartsPreparedThisMonth: data.overview?.chartsPreparedThisMonth || 0
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

  // Initial data fetch and set up interval for real-time updates
  useEffect(() => {
    fetchDashboardData();

    // Set up interval to refresh data every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);

    return () => clearInterval(interval);
  }, []);

  // Calculate financial metrics
  const revenueMetrics = [
    { metric: 'Net Fare Collected', amount: overview.netFareCollected },
    { metric: 'Service Charges', amount: overview.serviceCharges },
    { metric: 'Agent Fees', amount: overview.agentFees },
    { metric: 'Platform Fees', amount: overview.platformFees },
    { metric: 'Discounts Given', amount: overview.discountsGiven },
    { metric: 'Taxes Collected', amount: overview.taxesCollected },
    { metric: 'Total Revenue', amount: overview.totalRevenue }
  ];

  const outstandingMetrics = [
    { category: 'Pending Bills', count: overview.pendingBillsCount, amount: overview.pendingBillsAmount },
    { category: 'Partial Payments', count: overview.partialPaymentsCount, amount: overview.partialPaymentsAmount },
    { category: 'Overdue Payments', count: overview.overduePaymentsCount, amount: overview.overduePaymentsAmount },
    { category: 'Refund Pending', count: overview.refundPendingCount, amount: overview.refundPendingAmount }
  ];

  const operationalMetrics = [
    { metric: 'Trains Booked', today: overview.trainsBookedToday, thisMonth: overview.trainsBookedThisMonth },
    { metric: 'Tickets Issued', today: overview.ticketsIssuedToday, thisMonth: overview.ticketsIssuedThisMonth },
    { metric: 'Tickets Cancelled', today: overview.ticketsCancelledToday, thisMonth: overview.ticketsCancelledThisMonth },
    { metric: 'Waitlisted PNRs', today: overview.waitlistedPnrsToday, thisMonth: overview.waitlistedPnrsThisMonth },
    { metric: 'Chart Prepared', today: overview.chartsPreparedToday, thisMonth: overview.chartsPreparedThisMonth }
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

  if (loading) {
    return (
      <div className="admin-dashboard erp-admin-container">
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

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
        <div className="erp-user-info">USER: {user?.us_name || 'ADMIN'} ⚙</div>
      </div>

      {/* Toolbar - Static */}
      <div className="erp-toolbar">
        <button className="erp-button" onClick={fetchDashboardData}>Refresh</button>
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
          <div className="section-header">SYSTEM SUMMARY</div>
          <div className="dashboard-summary">
            <div className="summary-panel">
              <div className="summary-title">TOTAL BOOKINGS</div>
              <div className="summary-value">{overview.totalBookings}</div>
              <div className="summary-desc">All time bookings</div>
            </div>
            <div className="summary-panel">
              <div className="summary-title">ACTIVE PNRS</div>
              <div className="summary-value">{overview.totalActivePnrs}</div>
              <div className="summary-desc">Currently active</div>
            </div>
            <div className="summary-panel">
              <div className="summary-title">BILLS GENERATED TODAY</div>
              <div className="summary-value">{overview.billsGeneratedToday}</div>
              <div className="summary-desc">Current day</div>
            </div>
            <div className="summary-panel">
              <div className="summary-title">PENDING PAYMENTS</div>
              <div className="summary-value">{overview.totalPending}</div>
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
        </div>
      </div>

      {/* Audit Footer */}
      <div className="erp-status-bar">
        <div className="erp-status-item">System Date & Time: {lastUpdated.toLocaleString()}</div>
        <div className="erp-status-item">Logged-in User: {user?.us_name || 'ADMIN'}</div>
        <div className="erp-status-item">Role: {user?.us_usertype || 'ADMIN'}</div>
        <div className="erp-status-item">Last Login Time: {user?.lastLoginTime || 'N/A'}</div>
      </div>
    </div>
  );
};

export default AdminDashboard;