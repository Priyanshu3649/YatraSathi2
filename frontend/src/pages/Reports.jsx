import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import '../styles/reports.css';

const Reports = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('bookings');
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
      
      let url = `http://127.0.0.1:5001/api/reports/${activeTab.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      
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
    return <div className="reports panel">Loading reports...</div>;
  }

  return (
    <div className="reports panel">
      <div className="reports-header panel-header">
        <h2>Reports</h2>
        <div className="reports-actions">
          <button className="btn btn-primary" onClick={exportToCSV}>Export to CSV</button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="reports-tabs mb-3">
        <button 
          className={`btn ${activeTab === 'bookings' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          Booking Reports
        </button>
        {user && user.us_usertype === 'admin' && (
          <>
            <button 
              className={`btn ml-2 ${activeTab === 'employeePerformance' ? 'btn-primary' : ''}`}
              onClick={() => setActiveTab('employeePerformance')}
            >
              Employee Performance
            </button>
            <button 
              className={`btn ml-2 ${activeTab === 'financial' ? 'btn-primary' : ''}`}
              onClick={() => setActiveTab('financial')}
            >
              Financial Summary
            </button>
            <button 
              className={`btn ml-2 ${activeTab === 'customerAnalytics' ? 'btn-primary' : ''}`}
              onClick={() => setActiveTab('customerAnalytics')}
            >
              Customer Analytics
            </button>
            <button 
              className={`btn ml-2 ${activeTab === 'corporateCustomers' ? 'btn-primary' : ''}`}
              onClick={() => setActiveTab('corporateCustomers')}
            >
              Corporate Customers
            </button>
          </>
        )}
      </div>

      {activeTab === 'bookings' && (
        <div className="report-content panel mb-3">
          <div className="report-filters panel mb-3">
            <h3>Filters</h3>
            <div className="form-row">
              <div className="form-group col-3">
                <label htmlFor="startDate" className="form-label">Start Date</label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  className="form-control"
                />
              </div>
              <div className="form-group col-3">
                <label htmlFor="endDate" className="form-label">End Date</label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  className="form-control"
                />
              </div>
              <div className="form-group col-3">
                <label htmlFor="status" className="form-label">Status</label>
                <select
                  id="status"
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="form-control"
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div className="form-group col-3" style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button className="btn btn-primary" onClick={fetchReport}>Apply</button>
                <button className="btn ml-2" onClick={clearFilters}>Clear</button>
              </div>
            </div>
          </div>

          <h3>Booking Report</h3>
          {reports.bookings.length === 0 ? (
            <p>No booking data found.</p>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
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
            </div>
          )}
        </div>
      )}

      {activeTab === 'employeePerformance' && user && user.us_usertype === 'admin' && (
        <div className="report-content panel mb-3">
          <div className="report-data">
            <h3>Employee Performance Report</h3>
            {reports.employeePerformance.length === 0 ? (
              <p>No employee data found.</p>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
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
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'financial' && user && user.us_usertype === 'admin' && (
        <div className="report-content panel mb-3">
          <div className="report-filters panel mb-3">
            <h3>Filters</h3>
            <div className="form-row">
              <div className="form-group col-4">
                <label htmlFor="startDate" className="form-label">Start Date</label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  className="form-control"
                />
              </div>
              <div className="form-group col-4">
                <label htmlFor="endDate" className="form-label">End Date</label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  className="form-control"
                />
              </div>
              <div className="form-group col-4" style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button className="btn btn-primary" onClick={fetchReport}>Apply</button>
                <button className="btn ml-2" onClick={clearFilters}>Clear</button>
              </div>
            </div>
          </div>

          <div className="report-data">
            <h3>Financial Summary Report</h3>
            {reports.financial ? (
              <div className="financial-summary">
                <div className="row">
                  <div className="col-4 mb-3">
                    <div className="card">
                      <div className="card-header">Total Bookings</div>
                      <div className="p-2 text-center">
                        <h3>₹{parseFloat(reports.financial.summary.totalBookings || 0).toFixed(2)}</h3>
                      </div>
                    </div>
                  </div>
                  <div className="col-4 mb-3">
                    <div className="card">
                      <div className="card-header">Total Revenue</div>
                      <div className="p-2 text-center">
                        <h3>₹{parseFloat(reports.financial.summary.totalRevenue || 0).toFixed(2)}</h3>
                      </div>
                    </div>
                  </div>
                  <div className="col-4 mb-3">
                    <div className="card">
                      <div className="card-header">Net Revenue</div>
                      <div className="p-2 text-center">
                        <h3>₹{parseFloat(reports.financial.summary.netRevenue || 0).toFixed(2)}</h3>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="row">
                  <div className="col-4 mb-3">
                    <div className="card">
                      <div className="card-header">Total Pending</div>
                      <div className="p-2 text-center">
                        <h3>₹{parseFloat(reports.financial.summary.totalPending || 0).toFixed(2)}</h3>
                      </div>
                    </div>
                  </div>
                  <div className="col-4 mb-3">
                    <div className="card">
                      <div className="card-header">Total Payments</div>
                      <div className="p-2 text-center">
                        <h3>{reports.financial.summary.totalPayments || 0}</h3>
                      </div>
                    </div>
                  </div>
                  <div className="col-4 mb-3">
                    <div className="card">
                      <div className="card-header">Total Refunds</div>
                      <div className="p-2 text-center">
                        <h3>₹{parseFloat(reports.financial.summary.totalRefunds || 0).toFixed(2)}</h3>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="panel mb-3">
                  <h4>Payments by Mode</h4>
                  <div className="table-responsive">
                    <table className="data-table">
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
                </div>
                
                {reports.financial.refundsByMode && Object.keys(reports.financial.refundsByMode).length > 0 && (
                  <div className="panel mb-3">
                    <h4>Refunds by Mode</h4>
                    <div className="table-responsive">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Refund Mode</th>
                            <th>Total Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(reports.financial.refundsByMode).map(([mode, amount]) => (
                            <tr key={mode}>
                              <td>{mode}</td>
                              <td>₹{parseFloat(amount || 0).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                
                <div className="panel mb-3">
                  <h4>Bookings by Status</h4>
                  <div className="table-responsive">
                    <table className="data-table">
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
                
                <div className="panel mb-3">
                  <h4>Bookings by Class</h4>
                  <div className="table-responsive">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Class</th>
                          <th>Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(reports.financial.bookingsByClass || {}).map(([travelClass, count]) => (
                          <tr key={travelClass}>
                            <td>{travelClass}</td>
                            <td>{count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="panel">
                  <h4>Top Stations by Booking Count</h4>
                  <div className="table-responsive">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Station</th>
                          <th>Booking Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(reports.financial.topStations || []).map((stationData, index) => (
                          <tr key={index}>
                            <td>{stationData.station}</td>
                            <td>{stationData.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <p>No financial data available.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'customerAnalytics' && user && user.us_usertype === 'admin' && (
        <div className="report-content panel mb-3">
          <div className="report-filters panel mb-3">
            <h3>Filters</h3>
            <div className="form-row">
              <div className="form-group col-4">
                <label htmlFor="startDate" className="form-label">Start Date</label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  className="form-control"
                />
              </div>
              <div className="form-group col-4">
                <label htmlFor="endDate" className="form-label">End Date</label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  className="form-control"
                />
              </div>
              <div className="form-group col-4" style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button className="btn btn-primary" onClick={fetchReport}>Apply</button>
                <button className="btn ml-2" onClick={clearFilters}>Clear</button>
              </div>
            </div>
          </div>

          <div className="report-data">
            <h3>Customer Analytics Report</h3>
            {reports.customerAnalytics ? (
              <div className="customer-analytics">
                <div className="row">
                  <div className="col-4 mb-3">
                    <div className="card">
                      <div className="card-header">Total Customers</div>
                      <div className="p-2 text-center">
                        <h3>{reports.customerAnalytics.analytics.totalCustomers}</h3>
                      </div>
                    </div>
                  </div>
                  <div className="col-4 mb-3">
                    <div className="card">
                      <div className="card-header">Active Customers</div>
                      <div className="p-2 text-center">
                        <h3>{reports.customerAnalytics.analytics.activeCustomers}</h3>
                      </div>
                    </div>
                  </div>
                  <div className="col-4 mb-3">
                    <div className="card">
                      <div className="card-header">Inactive Customers</div>
                      <div className="p-2 text-center">
                        <h3>{reports.customerAnalytics.analytics.inactiveCustomers}</h3>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="panel mb-3">
                  <h4>Booking Frequency</h4>
                  <div className="table-responsive">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Booking Frequency</th>
                          <th>Customer Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(reports.customerAnalytics.analytics.bookingFrequency || {}).map(([frequency, count]) => (
                          <tr key={frequency}>
                            <td>{frequency}</td>
                            <td>{count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="panel">
                  <h4>Top Customers by Spending</h4>
                  <div className="table-responsive">
                    <table className="data-table">
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
              </div>
            ) : (
              <p>No customer analytics data available.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'corporateCustomers' && user && user.us_usertype === 'admin' && (
        <div className="report-content panel">
          <div className="report-data">
            <h3>Corporate Customers Report</h3>
            {reports.corporateCustomers.length === 0 ? (
              <p>No corporate customer data found.</p>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
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
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;