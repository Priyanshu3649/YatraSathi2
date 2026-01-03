import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation, useSearchParams } from 'react-router-dom';
import '../styles/vintage-erp-theme.css';
import '../styles/classic-enterprise-global.css';

const Reports = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get initial tab from URL parameters or default to 'bookings'
  const getInitialTab = () => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['bookings', 'employeePerformance', 'financial', 'customerAnalytics', 'corporateCustomers'].includes(tabParam)) {
      return tabParam;
    }
    return 'bookings';
  };
  
  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [reports, setReports] = useState({
    bookings: [],
    employeePerformance: [],
    financial: null,
    corporateCustomers: [],
    customerAnalytics: null
  });
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: '',
    employeeId: '',
    customerId: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Update activeTab when URL parameters change
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['bookings', 'employeePerformance', 'financial', 'customerAnalytics', 'corporateCustomers'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Fetch reports when component mounts or when filters change
  useEffect(() => {
    if (user) {
      fetchReport();
    }
  }, [user, activeTab, filters]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError('');
      
      let url = `/api/reports/${activeTab.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      
      // Add filters for booking report
      if (activeTab === 'bookings') {
        const queryParams = new URLSearchParams();
        Object.keys(filters).forEach(key => {
          if (filters[key]) {
            queryParams.append(key, filters[key]);
          }
        });
        if (queryParams.toString()) {
          url += `?${queryParams.toString()}`;
        }
      }
      
      // Add date filters for financial and customer analytics reports
      if (activeTab === 'financial' || activeTab === 'customerAnalytics') {
        const queryParams = new URLSearchParams();
        if (filters.startDate) {
          queryParams.append('startDate', filters.startDate);
        }
        if (filters.endDate) {
          queryParams.append('endDate', filters.endDate);
        }
        if (queryParams.toString()) {
          url += `?${queryParams.toString()}`;
        }
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch report');
      }
      
      setReports(prev => ({
        ...prev,
        [activeTab]: activeTab === 'financial' || activeTab === 'customerAnalytics' ? data : data.data || data
      }));
    } catch (err) {
      setError(err.message || 'Failed to fetch report');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      status: '',
      employeeId: '',
      customerId: ''
    });
  };

  const exportToCSV = () => {
    // In a real implementation, you would generate and download a CSV file
    alert('CSV export functionality would be implemented here');
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return 'status-confirmed';
      case 'PENDING':
        return 'status-pending';
      case 'CANCELLED':
        return 'status-cancelled';
      case 'APPROVED':
        return 'status-approved';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="erp-admin-container">
        <div className="erp-loading">Loading reports...</div>
      </div>
    );
  }

  return (
    <div className="erp-admin-container">
      {/* Title Bar */}
      <div className="title-bar">
        <div className="system-menu">📊</div>
        <div className="title-text">Reports Management System</div>
        <div className="close-button">×</div>
      </div>

      {/* Menu Bar */}
      <div className="menu-bar">
        <div className="menu-item">File</div>
        <div className="menu-item">Edit</div>
        <div className="menu-item">View</div>
        <div className="menu-item">Reports</div>
        <div className="menu-item">Export</div>
        <div className="menu-item">Help</div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <button className="tool-button" onClick={fetchReport}>Refresh</button>
        <div className="tool-separator"></div>
        <button className="tool-button" onClick={exportToCSV}>Export CSV</button>
        <button className="tool-button">Print</button>
        <div className="tool-separator"></div>
        <button className="tool-button" onClick={clearFilters}>Clear Filters</button>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Left Navigation Panel */}
        <div className="nav-panel">
          <div className="nav-header">Report Types</div>
          <div 
            className={`nav-item ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => handleTabChange('bookings')}
          >
            Booking Reports
          </div>
          {user && user.us_usertype === 'admin' && (
            <>
              <div 
                className={`nav-item ${activeTab === 'employeePerformance' ? 'active' : ''}`}
                onClick={() => handleTabChange('employeePerformance')}
              >
                Employee Performance
              </div>
              <div 
                className={`nav-item ${activeTab === 'financial' ? 'active' : ''}`}
                onClick={() => handleTabChange('financial')}
              >
                Financial Summary
              </div>
              <div 
                className={`nav-item ${activeTab === 'customerAnalytics' ? 'active' : ''}`}
                onClick={() => handleTabChange('customerAnalytics')}
              >
                Customer Analytics
              </div>
              <div 
                className={`nav-item ${activeTab === 'corporateCustomers' ? 'active' : ''}`}
                onClick={() => handleTabChange('corporateCustomers')}
              >
                Corporate Customers
              </div>
            </>
          )}
        </div>

        {/* Work Area */}
        <div className="work-area">
          {error && <div className="alert alert-error">{error}</div>}

          {/* Filter Panel for Booking Reports */}
          {activeTab === 'bookings' && (
            <div className="form-panel">
              <div className="panel-header">Booking Report Filters</div>
              <div className="form-grid">
                <label htmlFor="startDate" className="form-label">Start Date</label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  className="form-input"
                />

                <label htmlFor="endDate" className="form-label">End Date</label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  className="form-input"
                />

                <label htmlFor="status" className="form-label">Status</label>
                <select
                  id="status"
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="form-input"
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <div className="form-actions">
                <button className="tool-button" onClick={fetchReport}>Apply Filters</button>
                <button className="tool-button" onClick={clearFilters}>Clear</button>
              </div>
            </div>
          )}

          {/* Filter Panel for Financial and Customer Analytics */}
          {(activeTab === 'financial' || activeTab === 'customerAnalytics') && (
            <div className="form-panel">
              <div className="panel-header">{activeTab === 'financial' ? 'Financial Report' : 'Customer Analytics'} Filters</div>
              <div className="form-grid">
                <label htmlFor="startDate" className="form-label">Start Date</label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  className="form-input"
                />

                <label htmlFor="endDate" className="form-label">End Date</label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  className="form-input"
                />
              </div>

              <div className="form-actions">
                <button className="tool-button" onClick={fetchReport}>Apply Filters</button>
                <button className="tool-button" onClick={clearFilters}>Clear</button>
              </div>
            </div>
          )}

          {/* Grid Panel */}
          <div className="grid-panel">
            <div className="panel-header">
              {activeTab === 'bookings' && 'Booking Report Data'}
              {activeTab === 'employeePerformance' && 'Employee Performance Data'}
              {activeTab === 'financial' && 'Financial Summary Data'}
              {activeTab === 'customerAnalytics' && 'Customer Analytics Data'}
              {activeTab === 'corporateCustomers' && 'Corporate Customer Data'}
            </div>

            <div className="grid-container">
              {/* Booking Reports */}
              {activeTab === 'bookings' && (
                <>
                  {reports.bookings.length === 0 ? (
                    <p>No booking data found.</p>
                  ) : (
                    <table className="grid-table">
                      <thead>
                        <tr>
                          <th>Booking ID</th>
                          <th>From</th>
                          <th>To</th>
                          <th>Travel Date</th>
                          <th>Class</th>
                          <th>Status</th>
                          <th>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reports.bookings.map((booking) => (
                          <tr key={booking.bk_bkid} className={getStatusClass(booking.bk_status)}>
                            <td>{booking.bk_bkid}</td>
                            <td>
                              {booking.fromStation ? 
                                `${booking.fromStation.st_stcode} - ${booking.fromStation.st_city}` : 
                                booking.bk_fromst
                              }
                            </td>
                            <td>
                              {booking.toStation ? 
                                `${booking.toStation.st_stcode} - ${booking.toStation.st_city}` : 
                                booking.bk_tost
                              }
                            </td>
                            <td>{new Date(booking.bk_trvldt).toLocaleDateString()}</td>
                            <td>{booking.bk_class}</td>
                            <td>
                              <span className={`status-badge ${getStatusClass(booking.bk_status)}`}>
                                {booking.bk_status}
                              </span>
                            </td>
                            <td>₹{parseFloat(booking.bk_total_amount || 0).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </>
              )}

              {/* Employee Performance Reports */}
              {activeTab === 'employeePerformance' && user && user.us_usertype === 'admin' && (
                <>
                  {reports.employeePerformance.length === 0 ? (
                    <p>No employee data found.</p>
                  ) : (
                    <table className="grid-table">
                      <thead>
                        <tr>
                          <th>Employee</th>
                          <th>Employee Number</th>
                          <th>Department</th>
                          <th>Designation</th>
                          <th>Total Bookings</th>
                          <th>Confirmed Bookings</th>
                          <th>Success Rate</th>
                          <th>Total Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reports.employeePerformance.map(employee => (
                          <tr key={employee.employeeId}>
                            <td>{employee.name}</td>
                            <td>{employee.employeeNumber}</td>
                            <td>{employee.department}</td>
                            <td>{employee.designation}</td>
                            <td>{employee.totalBookings}</td>
                            <td>{employee.confirmedBookings}</td>
                            <td>{employee.successRate}%</td>
                            <td>₹{parseFloat(employee.totalRevenue).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </>
              )}

              {/* Financial Summary Reports */}
              {activeTab === 'financial' && user && user.us_usertype === 'admin' && (
                <>
                  {reports.financial ? (
                    <div className="financial-summary">
                      {/* Summary Cards */}
                      <div className="summary-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
                        <div className="summary-card" style={{ background: '#e8f4f8', border: '1px solid #cccccc', padding: '10px' }}>
                          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Total Bookings</div>
                          <div style={{ fontSize: '18px', color: '#4169E1' }}>₹{parseFloat(reports.financial.summary.totalBookings || 0).toFixed(2)}</div>
                        </div>
                        <div className="summary-card" style={{ background: '#e8f4f8', border: '1px solid #cccccc', padding: '10px' }}>
                          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Total Revenue</div>
                          <div style={{ fontSize: '18px', color: '#4169E1' }}>₹{parseFloat(reports.financial.summary.totalRevenue || 0).toFixed(2)}</div>
                        </div>
                        <div className="summary-card" style={{ background: '#e8f4f8', border: '1px solid #cccccc', padding: '10px' }}>
                          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Net Revenue</div>
                          <div style={{ fontSize: '18px', color: '#4169E1' }}>₹{parseFloat(reports.financial.summary.netRevenue || 0).toFixed(2)}</div>
                        </div>
                      </div>

                      {/* Payment Mode Table */}
                      <div style={{ marginBottom: '20px' }}>
                        <h4 style={{ background: '#4169E1', color: 'white', padding: '6px 12px', margin: '0 0 10px 0' }}>Payments by Mode</h4>
                        <table className="grid-table">
                          <thead>
                            <tr>
                              <th>Payment Mode</th>
                              <th>Total Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(reports.financial.paymentsByMode || {}).map(([mode, amount]) => (
                              <tr key={mode}>
                                <td>{mode}</td>
                                <td>₹{parseFloat(amount || 0).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Booking Status Table */}
                      <div>
                        <h4 style={{ background: '#4169E1', color: 'white', padding: '6px 12px', margin: '0 0 10px 0' }}>Bookings by Status</h4>
                        <table className="grid-table">
                          <thead>
                            <tr>
                              <th>Status</th>
                              <th>Count</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(reports.financial.bookingsByStatus || {}).map(([status, count]) => (
                              <tr key={status}>
                                <td>{status}</td>
                                <td>{count}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <p>No financial data available.</p>
                  )}
                </>
              )}

              {/* Customer Analytics Reports */}
              {activeTab === 'customerAnalytics' && user && user.us_usertype === 'admin' && (
                <>
                  {reports.customerAnalytics ? (
                    <div className="customer-analytics">
                      {/* Analytics Cards */}
                      <div className="analytics-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
                        <div className="analytics-card" style={{ background: '#e8f4f8', border: '1px solid #cccccc', padding: '10px' }}>
                          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Total Customers</div>
                          <div style={{ fontSize: '18px', color: '#4169E1' }}>{reports.customerAnalytics.analytics.totalCustomers}</div>
                        </div>
                        <div className="analytics-card" style={{ background: '#e8f4f8', border: '1px solid #cccccc', padding: '10px' }}>
                          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Active Customers</div>
                          <div style={{ fontSize: '18px', color: '#4169E1' }}>{reports.customerAnalytics.analytics.activeCustomers}</div>
                        </div>
                        <div className="analytics-card" style={{ background: '#e8f4f8', border: '1px solid #cccccc', padding: '10px' }}>
                          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Inactive Customers</div>
                          <div style={{ fontSize: '18px', color: '#4169E1' }}>{reports.customerAnalytics.analytics.inactiveCustomers}</div>
                        </div>
                      </div>

                      {/* Top Customers Table */}
                      <div>
                        <h4 style={{ background: '#4169E1', color: 'white', padding: '6px 12px', margin: '0 0 10px 0' }}>Top Customers by Spending</h4>
                        <table className="grid-table">
                          <thead>
                            <tr>
                              <th>Customer Name</th>
                              <th>Email</th>
                              <th>Booking Count</th>
                              <th>Total Spent</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(reports.customerAnalytics.analytics.topCustomers || []).map((customer, index) => (
                              <tr key={index}>
                                <td>{customer.name}</td>
                                <td>{customer.email}</td>
                                <td>{customer.bookingCount}</td>
                                <td>₹{parseFloat(customer.totalSpent).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <p>No customer analytics data available.</p>
                  )}
                </>
              )}

              {/* Corporate Customers Reports */}
              {activeTab === 'corporateCustomers' && user && user.us_usertype === 'admin' && (
                <>
                  {reports.corporateCustomers.length === 0 ? (
                    <p>No corporate customer data found.</p>
                  ) : (
                    <table className="grid-table">
                      <thead>
                        <tr>
                          <th>Company Name</th>
                          <th>Contact Person</th>
                          <th>Email</th>
                          <th>Phone</th>
                          <th>Credit Limit</th>
                          <th>Credit Used</th>
                          <th>Total Bookings</th>
                          <th>Total Paid</th>
                          <th>Total Pending</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reports.corporateCustomers.map(customer => (
                          <tr key={customer.customerId}>
                            <td>{customer.companyName}</td>
                            <td>{customer.contactPerson}</td>
                            <td>{customer.email}</td>
                            <td>{customer.phone}</td>
                            <td>₹{parseFloat(customer.creditLimit).toFixed(2)}</td>
                            <td>₹{parseFloat(customer.creditUsed).toFixed(2)}</td>
                            <td>₹{parseFloat(customer.totalBookings).toFixed(2)}</td>
                            <td>₹{parseFloat(customer.totalPaid).toFixed(2)}</td>
                            <td>₹{parseFloat(customer.totalPending).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="status-bar">
        <div className="status-item">Report: {activeTab}</div>
        <div className="status-item">User: {user?.us_name || 'Unknown'}</div>
        <div className="status-panel">Ready</div>
      </div>
    </div>
  );
};

export default Reports;