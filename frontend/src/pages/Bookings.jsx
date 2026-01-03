import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { bookingAPI } from '../services/api';
import '../styles/vintage-erp-theme.css';
import '../styles/classic-enterprise-global.css';

const Bookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    fromStation: '',
    toStation: '',
    travelDate: new Date().toISOString().split('T')[0], // Pre-fill with today's date
    travelClass: '3A',
    berthPreference: '',
    totalPassengers: 1,
    remarks: ''
  });
  const [searchParams, setSearchParams] = useState({
    status: '',
    fromDate: '',
    toDate: '',
    fromStation: '',
    toStation: ''
  });
  const [showSearch, setShowSearch] = useState(false);

  // Fetch bookings when component mounts
  useEffect(() => {
    fetchBookings();
  }, [user]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      let data;
      
      if (user && user.us_usertype === 'admin') {
        data = await bookingAPI.getAllBookings();
      } else {
        data = await bookingAPI.getMyBookings();
      }
      
      setBookings(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSearchChange = (e) => {
    setSearchParams({ ...searchParams, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await bookingAPI.createBooking(formData);
      // Reset form and hide it
      setFormData({ 
        fromStation: '', 
        toStation: '', 
        travelDate: new Date().toISOString().split('T')[0], 
        travelClass: '3A',
        berthPreference: '',
        totalPassengers: 1,
        remarks: ''
      });
      setShowForm(false);
      // Refresh bookings list
      fetchBookings();
    } catch (error) {
      setError(error.message || 'Failed to create booking');
    }
  };

  const onSearchSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const data = await bookingAPI.searchBookings(searchParams);
      setBookings(data.bookings || data);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to search bookings');
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        await bookingAPI.cancelBooking(bookingId);
        // Refresh bookings list
        fetchBookings();
      } catch (error) {
        setError(error.message || 'Failed to cancel booking');
      }
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    if (window.confirm('Are you sure you want to delete this booking? This action cannot be undone.')) {
      try {
        await bookingAPI.deleteBooking(bookingId);
        // Refresh bookings list
        fetchBookings();
      } catch (error) {
        setError(error.message || 'Failed to delete booking');
      }
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return 'status-confirmed';
      case 'PENDING':
        return 'status-pending';
      case 'CANCELLED':
        return 'status-cancelled';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="erp-admin-container">
        <div className="erp-loading">Loading bookings...</div>
      </div>
    );
  }

  return (
    <div className="erp-admin-container">
      {/* Title Bar */}
      <div className="title-bar">
        <div className="system-menu">🚂</div>
        <div className="title-text">Booking Management System</div>
        <div className="close-button">×</div>
      </div>

      {/* Menu Bar */}
      <div className="menu-bar">
        <div className="menu-item">File</div>
        <div className="menu-item">Edit</div>
        <div className="menu-item">View</div>
        <div className="menu-item">Booking</div>
        <div className="menu-item">Reports</div>
        <div className="menu-item">Help</div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <button className="tool-button" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'New'}
        </button>
        <div className="tool-separator"></div>
        <button className="tool-button" onClick={() => setShowSearch(!showSearch)}>
          {showSearch ? 'Hide Search' : 'Search'}
        </button>
        <div className="tool-separator"></div>
        <button className="tool-button" onClick={fetchBookings}>Refresh</button>
        <button className="tool-button">Export</button>
        <button className="tool-button">Print</button>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Left Navigation Panel */}
        <div className="nav-panel">
          <div className="nav-header">Booking Actions</div>
          <div className={`nav-item ${showForm ? 'active' : ''}`} onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel Form' : 'New Booking'}
          </div>
          <div className={`nav-item ${showSearch ? 'active' : ''}`} onClick={() => setShowSearch(!showSearch)}>
            {showSearch ? 'Hide Search' : 'Search Bookings'}
          </div>
          <div className="nav-item" onClick={fetchBookings}>Refresh List</div>
          <div className="nav-item">Export Data</div>
          <div className="nav-item">Print Report</div>
          <div className="nav-item">Booking History</div>
        </div>

        {/* Work Area */}
        <div className="work-area">
          {/* Form Panel */}
          {showForm && (
            <div className="form-panel">
              <div className="panel-header">Create New Booking</div>
              <form onSubmit={onSubmit} className="erp-form">
                <div className="form-grid">
                  <label htmlFor="fromStation" className="form-label required">From Station</label>
                  <input
                    type="text"
                    id="fromStation"
                    name="fromStation"
                    value={formData.fromStation}
                    onChange={onChange}
                    required
                    className="form-input"
                  />

                  <label htmlFor="toStation" className="form-label required">To Station</label>
                  <input
                    type="text"
                    id="toStation"
                    name="toStation"
                    value={formData.toStation}
                    onChange={onChange}
                    required
                    className="form-input"
                  />

                  <label htmlFor="travelDate" className="form-label required">Travel Date</label>
                  <input
                    type="date"
                    id="travelDate"
                    name="travelDate"
                    value={formData.travelDate}
                    onChange={onChange}
                    required
                    className="form-input"
                  />

                  <label htmlFor="travelClass" className="form-label">Travel Class</label>
                  <select
                    id="travelClass"
                    name="travelClass"
                    value={formData.travelClass}
                    onChange={onChange}
                    className="form-input"
                  >
                    <option value="3A">3rd AC</option>
                    <option value="SL">Sleeper</option>
                    <option value="2A">2nd AC</option>
                    <option value="1A">1st AC</option>
                    <option value="CC">Chair Car</option>
                  </select>

                  <label htmlFor="berthPreference" className="form-label">Berth Preference</label>
                  <select
                    id="berthPreference"
                    name="berthPreference"
                    value={formData.berthPreference}
                    onChange={onChange}
                    className="form-input"
                  >
                    <option value="">No Preference</option>
                    <option value="LB">Lower Berth</option>
                    <option value="MB">Middle Berth</option>
                    <option value="UB">Upper Berth</option>
                    <option value="SL">Side Lower</option>
                    <option value="SU">Side Upper</option>
                  </select>

                  <label htmlFor="totalPassengers" className="form-label">Total Passengers</label>
                  <input
                    type="number"
                    id="totalPassengers"
                    name="totalPassengers"
                    value={formData.totalPassengers}
                    onChange={onChange}
                    min="1"
                    max="6"
                    className="form-input"
                  />

                  <label htmlFor="remarks" className="form-label">Remarks</label>
                  <textarea
                    id="remarks"
                    name="remarks"
                    value={formData.remarks}
                    onChange={onChange}
                    className="form-input"
                    rows="3"
                  ></textarea>
                </div>

                <div className="form-actions">
                  <button type="submit" className="tool-button">Save Booking</button>
                  <button type="button" className="tool-button" onClick={() => setShowForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* Search Panel */}
          {showSearch && (
            <div className="form-panel">
              <div className="panel-header">Search Bookings</div>
              <form onSubmit={onSearchSubmit}>
                <div className="form-grid">
                  <label htmlFor="status" className="form-label">Status</label>
                  <select
                    id="status"
                    name="status"
                    value={searchParams.status}
                    onChange={onSearchChange}
                    className="form-input"
                  >
                    <option value="">All Statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>

                  <label htmlFor="fromDate" className="form-label">From Date</label>
                  <input
                    type="date"
                    id="fromDate"
                    name="fromDate"
                    value={searchParams.fromDate}
                    onChange={onSearchChange}
                    className="form-input"
                  />

                  <label htmlFor="toDate" className="form-label">To Date</label>
                  <input
                    type="date"
                    id="toDate"
                    name="toDate"
                    value={searchParams.toDate}
                    onChange={onSearchChange}
                    className="form-input"
                  />

                  <label htmlFor="fromStation" className="form-label">From Station</label>
                  <input
                    type="text"
                    id="fromStation"
                    name="fromStation"
                    value={searchParams.fromStation}
                    onChange={onSearchChange}
                    className="form-input"
                  />

                  <label htmlFor="toStation" className="form-label">To Station</label>
                  <input
                    type="text"
                    id="toStation"
                    name="toStation"
                    value={searchParams.toStation}
                    onChange={onSearchChange}
                    className="form-input"
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="tool-button">Search</button>
                  <button type="button" className="tool-button" onClick={() => {
                    setSearchParams({
                      status: '',
                      fromDate: '',
                      toDate: '',
                      fromStation: '',
                      toStation: ''
                    });
                  }}>Clear</button>
                </div>
              </form>
            </div>
          )}

          {/* Grid Panel */}
          <div className="grid-panel">
            <div className="panel-header">Booking Records</div>
            
            {error && <div className="alert alert-error">{error}</div>}

            <div className="grid-toolbar">
              <input
                type="text"
                placeholder="Quick search..."
                className="filter-input"
              />
              <button className="tool-button">Filter</button>
              <button className="tool-button">Clear</button>
            </div>

            <div className="grid-container">
              {bookings.length === 0 ? (
                <p>No bookings found.</p>
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
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking) => (
                      <tr key={booking.bk_bkid} className={getStatusClass(booking.bk_status)}>
                        <td>{booking.bk_bkid}</td>
                        <td>{booking.fromStation?.st_stname || booking.bk_fromstation || booking.bk_fromst}</td>
                        <td>{booking.toStation?.st_stname || booking.bk_tostation || booking.bk_tost}</td>
                        <td>{new Date(booking.bk_trvldt || booking.bk_travelldate).toLocaleDateString()}</td>
                        <td>{booking.bk_class || booking.bk_travelclass}</td>
                        <td>{booking.bk_status}</td>
                        <td>
                          {booking.bk_status === 'PENDING' && (
                            <button 
                              className="tool-button" 
                              onClick={() => handleCancelBooking(booking.bk_bkid)}
                            >
                              Cancel
                            </button>
                          )}
                          {user && (user.us_usertype === 'admin' || user.us_usertype === 'employee') && (
                            <button 
                              className="tool-button" 
                              onClick={() => handleDeleteBooking(booking.bk_bkid)}
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="status-bar">
        <div className="status-item">Records: {bookings.length}</div>
        <div className="status-item">User: {user?.us_name || 'Unknown'}</div>
        <div className="status-panel">Ready</div>
      </div>
    </div>
  );
};

export default Bookings;