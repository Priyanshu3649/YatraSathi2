import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { bookingAPI, customerAPI } from '../services/api';
import CustomerLookupInput from '../components/common/CustomerLookupInput';
import '../styles/vintage-erp-theme.css';
import '../styles/classic-enterprise-global.css';
import '../styles/vintage-admin-panel.css';
import '../styles/dynamic-admin-panel.css';
import '../styles/vintage-erp-global.css';

const Bookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [formData, setFormData] = useState({
    bookingId: '',
    bookingDate: new Date().toISOString().split('T')[0],
    customerId: '',
    customerName: '',
    totalPassengers: 0,
    fromStation: '',
    toStation: '',
    travelDate: new Date().toISOString().split('T')[0],
    travelClass: '3A',
    berthPreference: '',
    remarks: '',
    status: 'Draft',
    createdBy: user?.us_name || 'system',
    createdOn: new Date().toISOString(),
    modifiedBy: '',
    modifiedOn: '',
    closedBy: '',
    closedOn: ''
  });
  const [passengerList, setPassengerList] = useState([{
    id: Date.now(),
    name: '',
    age: '',
    gender: '',
    berthPreference: '',
    idProofType: '',
    idProofNumber: ''
  }]);
  
  // Auto-calculate total passengers when passenger list changes
  useEffect(() => {
    const total = passengerList.filter(p => p.name.trim() !== '').length;
    setFormData(prev => ({
      ...prev,
      totalPassengers: total
    }));
  }, [passengerList]);
  
  const [isEditing, setIsEditing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 100;
  
  // State for passenger details modal
  const [showPassengerModal, setShowPassengerModal] = useState(false);
  const [passengerDetails, setPassengerDetails] = useState([]);
  const [loadingPassengers, setLoadingPassengers] = useState(false);

  // Filter state for inline grid filtering
  const [inlineFilters, setInlineFilters] = useState({});
  
  // Fetch bookings when component mounts
  useEffect(() => {
    fetchBookings();
  }, [user]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      let data;
      
      // Check if user is admin or employee
      if (user && (user.us_usertype === 'admin' || user.us_roid !== 'CUS')) {
        data = await bookingAPI.getAllBookings();
      } else {
        const response = await bookingAPI.getMyBookings();
        // Handle the wrapped response structure for customer bookings
        data = response.success ? response.data.bookings : [];
      }
      
      // Ensure data is always an array
      const bookingsArray = Array.isArray(data) ? data : [];
      
      setBookings(bookingsArray);
      setFilteredBookings(bookingsArray);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...bookings];
    
    // Apply inline filters
    Object.entries(inlineFilters).forEach(([column, value]) => {
      if (value !== undefined && value !== '') {
        filtered = filtered.filter(record => 
          record[column]?.toString().toLowerCase().includes(value.toLowerCase())
        );
      }
    });
    
    setFilteredBookings(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [inlineFilters, bookings]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle customer selection from CustomerLookupInput component
  const handleCustomerChange = (customer) => {
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customerId: customer.code || customer.id,
        customerName: customer.name
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        customerId: '',
        customerName: ''
      }));
    }
  };
  


  const handleInlineFilterChange = (column, value) => {
    setInlineFilters(prev => ({
      ...prev,
      [column]: value
    }));
  };

  const handleNew = () => {
    setSelectedBooking(null);
    setFormData({
      bookingId: '',
      bookingDate: new Date().toISOString().split('T')[0],
      customerId: '',
      customerName: '',
      totalPassengers: 0,
      fromStation: '',
      toStation: '',
      travelDate: new Date().toISOString().split('T')[0],
      travelClass: '3A',
      berthPreference: '',
      remarks: '',
      status: 'Draft',
      createdBy: user?.us_name || 'system',
      createdOn: new Date().toISOString(),
      modifiedBy: '',
      modifiedOn: '',
      closedBy: '',
      closedOn: ''
    });
    setPassengerList([{
      id: Date.now(),
      name: '',
      age: '',
      gender: '',
      berthPreference: '',
      idProofType: '',
      idProofNumber: ''
    }]);
    setIsEditing(true);
  };

  const handleEdit = () => {
    if (selectedBooking) {
      setIsEditing(true);
    } else {
      alert('Please select a record first');
    }
  };

  // Function to fetch and show passenger details
  const showPassengerDetails = async (bookingId) => {
    try {
      setLoadingPassengers(true);
      const response = await bookingAPI.getBookingPassengers(bookingId);
      const passengers = response.passengers || [];
      setPassengerDetails(passengers);
      setShowPassengerModal(true);
    } catch (error) {
      console.error('Error fetching passenger details:', error);
      alert(`Error fetching passenger details: ${error.message}`);
    } finally {
      setLoadingPassengers(false);
    }
  };

  const handleSave = async () => {
    try {
      const bookingData = {
        ...formData,
        passengerList,
        totalPassengers: passengerList.filter(p => p.name.trim() !== '').length,
        // Map fields to match backend expectations
        customerId: formData.customerId,
        customerName: formData.customerName,
        fromStation: formData.fromStation,
        toStation: formData.toStation,
        travelDate: formData.travelDate,
        travelClass: formData.travelClass,
        berthPreference: formData.berthPreference,
        remarks: formData.remarks,
        status: formData.status,
        createdOn: formData.createdOn || new Date().toISOString(),
        createdBy: formData.createdBy || user?.us_name || 'system',
        modifiedBy: user?.us_name || 'system',
        modifiedOn: new Date().toISOString()
      };
      
      if (selectedBooking) {
        // Identify the correct booking ID field from the selected booking
        const bookingId = selectedBooking.bk_bkid || selectedBooking.id || selectedBooking.bookingId;
        if (!bookingId) {
          throw new Error('Booking ID is missing');
        }
        await bookingAPI.updateBooking(bookingId, bookingData);
      } else {
        await bookingAPI.createBooking(bookingData);
      }
      
      // Refresh the data list in background
      await fetchBookings();
      setIsEditing(false);
    } catch (error) {
      setError(error.message || 'Failed to save booking');
    }
  };

  const handleDelete = async () => {
    if (!selectedBooking) {
      alert('Please select a record to delete');
      return;
    }

    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        await bookingAPI.deleteBooking(selectedBooking.bk_bkid);
        fetchBookings();
      } catch (error) {
        setError(error.message || 'Failed to delete booking');
      }
    }
  };

  const handleRecordSelect = (record) => {
    setSelectedBooking(record);
    setFormData({
      bookingId: record.bk_bkid || '',
      bookingDate: record.bk_bookingdt ? new Date(record.bk_bookingdt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      customerId: record.customerId || record.bk_customerid || record.cu_usid || '',
      customerName: record.customerName || record.bk_customername || '',
      totalPassengers: record.totalPassengers || 0,
      fromStation: record.fromStation?.st_stname || record.bk_fromstation || record.bk_fromst || '',
      toStation: record.toStation?.st_stname || record.bk_tostation || record.bk_tost || '',
      travelDate: record.bk_trvldt ? new Date(record.bk_trvldt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      travelClass: record.bk_class || record.bk_travelclass || '3A',
      berthPreference: record.bk_birthpreference || record.bk_berthpreference || '',
      remarks: record.bk_remarks || '',
      status: record.bk_status || 'Draft',
      createdBy: record.createdBy || record.bk_createdby || 'system',
      createdOn: record.createdOn || record.bk_createdon || new Date().toISOString(),
      modifiedBy: record.modifiedBy || record.bk_modifiedby || '',
      modifiedOn: record.modifiedOn || record.bk_modifiedon || '',
      closedBy: record.closedBy || record.bk_closedby || '',
      closedOn: record.closedOn || record.bk_closedon || ''
    });
    setPassengerList(record.passengerList || [{
      id: Date.now(),
      name: '',
      age: '',
      gender: '',
      berthPreference: '',
      idProofType: '',
      idProofNumber: ''
    }]);
    setIsEditing(false);
  };

  const addPassenger = () => {
    setPassengerList([...passengerList, {
      id: Date.now(),
      name: '',
      age: '',
      gender: '',
      berthPreference: '',
      idProofType: '',
      idProofNumber: ''
    }]);
  };

  const removePassenger = (id) => {
    if (passengerList.length <= 1) {
      setError('At least one passenger is required');
      return;
    }
    setPassengerList(passengerList.filter(p => p.id !== id));
  };

  const updatePassenger = (id, field, value) => {
    setPassengerList(passengerList.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  // Pagination
  const getPaginatedData = () => {
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    return filteredBookings.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(filteredBookings.length / recordsPerPage);
  const paginatedData = getPaginatedData();

  return (
    <div className="erp-admin-container">
      {/* Top Menu Bar - Static */}
      <div className="erp-menu-bar">
        <div className="erp-menu-item">File</div>
        <div className="erp-menu-item">Edit</div>
        <div className="erp-menu-item">View</div>
        <div className="erp-menu-item">Booking</div>
        <div className="erp-menu-item">Reports</div>
        <div className="erp-menu-item">Help</div>
        <div className="erp-user-info">USER: {user?.us_name || 'ADMIN'} ⚙</div>
      </div>

      {/* Toolbar - Static */}
      <div className="erp-toolbar">
        <button className="erp-button" onClick={handleNew}>New</button>
        <button className="erp-button" onClick={handleEdit}>Edit</button>
        <button className="erp-button" onClick={handleDelete}>Delete</button>
        <div className="erp-tool-separator"></div>
        <button className="erp-button" onClick={handleSave} disabled={!isEditing}>Save</button>
        <button className="erp-button" onClick={fetchBookings}>Refresh</button>
        <div className="erp-tool-separator"></div>
        <button className="erp-button">Filters</button>
        <button className="erp-button">Print</button>
        <button className="erp-button">Export</button>
      </div>

      {/* Main Content Area - Scrollable */}
      <div className="erp-main-content">
        {/* Center Content - Now takes full space since left sidebar is removed */}
        <div className="erp-center-content">
          {/* Form Panel - Static */}
          <div className="erp-form-section">
            <div className="erp-panel-header">Booking Details</div>
            
            {/* Booking ID and Date Row */}
            <div className="erp-form-row">
              <label className="erp-form-label required">Booking ID</label>
              <input
                type="text"
                name="bookingId"
                className="erp-input"
                value={formData.bookingId}
                onChange={handleInputChange}
                readOnly
              />
              <label className="erp-form-label required">Booking Date</label>
              <input
                type="date"
                name="bookingDate"
                className="erp-input"
                value={formData.bookingDate}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </div>

            {/* Customer ID and Name Row - Using CustomerLookupInput */}
            <div className="erp-form-row" style={{ gridColumn: 'span 4' }}>
              <CustomerLookupInput
                customerId={formData.customerId}
                customerName={formData.customerName}
                onCustomerChange={handleCustomerChange}
                disabled={!isEditing}
                required={true}
              />
            </div>
            
            {/* Total Passengers and Contact Number Row */}
            <div className="erp-form-row">
              <label className="erp-form-label">Total Passengers</label>
              <input
                type="text"
                name="totalPassengers"
                className="erp-input"
                value={formData.totalPassengers}
                readOnly
                disabled
              />
              <label className="erp-form-label">Contact Number</label>
              <input
                type="text"
                name="contactNumber"
                className="erp-input"
                value={formData.contactNumber || ''}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </div>

            {/* Journey Details Row */}
            <div className="erp-form-row">
              <label className="erp-form-label required">From Station</label>
              <input
                type="text"
                name="fromStation"
                className="erp-input"
                value={formData.fromStation}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
              <label className="erp-form-label required">To Station</label>
              <input
                type="text"
                name="toStation"
                className="erp-input"
                value={formData.toStation}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </div>

            {/* Travel Date and Class Row */}
            <div className="erp-form-row">
              <label className="erp-form-label required">Travel Date</label>
              <input
                type="date"
                name="travelDate"
                className="erp-input"
                value={formData.travelDate}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
              <label className="erp-form-label required">Travel Class</label>
              <select
                name="travelClass"
                className="erp-input"
                value={formData.travelClass}
                onChange={handleInputChange}
                disabled={!isEditing}
              >
                <option value="SL">Sleeper (SL)</option>
                <option value="3A">3rd AC (3A)</option>
                <option value="2A">2nd AC (2A)</option>
                <option value="1A">1st AC (1A)</option>
                <option value="CC">Chair Car (CC)</option>
                <option value="EC">Executive Chair (EC)</option>
              </select>
            </div>

            {/* Berth Preference and Quota Type Row */}
            <div className="erp-form-row">
              <label className="erp-form-label">Berth Preference</label>
              <select
                name="berthPreference"
                className="erp-input"
                value={formData.berthPreference}
                onChange={handleInputChange}
                disabled={!isEditing}
              >
                <option value="">Any</option>
                <option value="LB">Lower Berth</option>
                <option value="UB">Upper Berth</option>
                <option value="MB">Middle Berth</option>
                <option value="SL">Side Lower</option>
                <option value="SU">Side Upper</option>
              </select>
              <label className="erp-form-label">Quota Type</label>
              <select
                name="quotaType"
                className="erp-input"
                value={formData.quotaType}
                onChange={handleInputChange}
                disabled={!isEditing}
              >
                <option value="GN">General (GN)</option>
                <option value="TQ">Tatkal (TQ)</option>
                <option value="LD">Ladies (LD)</option>
                <option value="DF">Defence (DF)</option>
                <option value="FT">Foreign Tourist (FT)</option>
              </select>
            </div>

            {/* Passenger Details Section */}
            <div className="erp-form-row">
              <label className="erp-form-label" style={{ gridColumn: 'span 4' }}>
                Passenger Details
                <button 
                  type="button" 
                  className="erp-button" 
                  style={{ marginLeft: '10px', padding: '2px 8px', fontSize: '11px' }} 
                  onClick={addPassenger}
                  disabled={!isEditing}
                >
                  Add Passenger
                </button>
              </label>
            </div>
            <div style={{ border: '1px solid var(--border-gray)', padding: '5px', maxHeight: '150px', overflowY: 'auto', marginBottom: '10px' }}>
              <table className="grid-table" style={{ width: '100%', fontSize: '11px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '15%' }}>Name</th>
                    <th style={{ width: '8%' }}>Age</th>
                    <th style={{ width: '8%' }}>Gender</th>
                    <th style={{ width: '12%' }}>Berth</th>
                    <th style={{ width: '15%' }}>ID Type</th>
                    <th style={{ width: '20%' }}>ID Number</th>
                    <th style={{ width: '12%' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {passengerList.map((passenger) => (
                    <tr key={passenger.id}>
                      <td>
                        <input 
                          type="text" 
                          value={passenger.name} 
                          onChange={(e) => updatePassenger(passenger.id, 'name', e.target.value)} 
                          className="erp-input" 
                          style={{ padding: '2px', fontSize: '11px', width: '100%' }} 
                          disabled={!isEditing}
                        />
                      </td>
                      <td>
                        <input 
                          type="number" 
                          value={passenger.age} 
                          onChange={(e) => updatePassenger(passenger.id, 'age', e.target.value)} 
                          className="erp-input" 
                          style={{ padding: '2px', fontSize: '11px', width: '100%' }} 
                          disabled={!isEditing}
                        />
                      </td>
                      <td>
                        <select 
                          value={passenger.gender} 
                          onChange={(e) => updatePassenger(passenger.id, 'gender', e.target.value)} 
                          className="erp-input" 
                          style={{ padding: '2px', fontSize: '11px', width: '100%' }}
                          disabled={!isEditing}
                        >
                          <option value="">-</option>
                          <option value="M">M</option>
                          <option value="F">F</option>
                          <option value="O">O</option>
                        </select>
                      </td>
                      <td>
                        <select 
                          value={passenger.berthPreference} 
                          onChange={(e) => updatePassenger(passenger.id, 'berthPreference', e.target.value)} 
                          className="erp-input" 
                          style={{ padding: '2px', fontSize: '11px', width: '100%' }}
                          disabled={!isEditing}
                        >
                          <option value="">-</option>
                          <option value="LB">LB</option>
                          <option value="UB">UB</option>
                          <option value="MB">MB</option>
                        </select>
                      </td>
                      <td>
                        <select 
                          value={passenger.idProofType} 
                          onChange={(e) => updatePassenger(passenger.id, 'idProofType', e.target.value)} 
                          className="erp-input" 
                          style={{ padding: '2px', fontSize: '11px', width: '100%' }}
                          disabled={!isEditing}
                        >
                          <option value="">-</option>
                          <option value="ADHAAR">ADHAAR</option>
                          <option value="PAN">PAN</option>
                          <option value="PASSPORT">PASSPORT</option>
                        </select>
                      </td>
                      <td>
                        <input 
                          type="text" 
                          value={passenger.idProofNumber} 
                          onChange={(e) => updatePassenger(passenger.id, 'idProofNumber', e.target.value)} 
                          className="erp-input" 
                          style={{ padding: '2px', fontSize: '11px', width: '100%' }} 
                          disabled={!isEditing}
                        />
                      </td>
                      <td>
                        <button 
                          type="button" 
                          className="erp-button" 
                          style={{ padding: '2px 6px', fontSize: '11px' }} 
                          onClick={() => removePassenger(passenger.id)}
                          disabled={!isEditing}
                        >
                          Del
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Remarks Row */}
            <div className="erp-form-row">
              <label className="erp-form-label">Remarks</label>
              <textarea
                name="remarks"
                className="erp-input"
                value={formData.remarks}
                onChange={handleInputChange}
                rows="2"
                disabled={!isEditing}
                style={{ height: '40px' }}
              ></textarea>
            </div>

            {/* Status Row */}
            <div className="erp-form-row">
              <label className="erp-form-label">Status</label>
              <select
                name="status"
                className="erp-input"
                value={formData.status}
                onChange={handleInputChange}
                disabled={!isEditing}
              >
                <option value="Draft">Draft</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Waitlisted">Waitlisted</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            {/* Audit Section */}
            <div className="erp-audit-section">
              <div className="erp-audit-row">
                <label className="erp-audit-label">Entered On</label>
                <input type="text" className="erp-audit-input" value={new Date(formData.createdOn).toLocaleString()} readOnly />
                <label className="erp-audit-label">Entered By</label>
                <input type="text" className="erp-audit-input" value={formData.createdBy} readOnly />
              </div>
              <div className="erp-audit-row">
                <label className="erp-audit-label">Modified On</label>
                <input type="text" className="erp-audit-input" value={formData.modifiedOn ? new Date(formData.modifiedOn).toLocaleString() : '-'} readOnly />
                <label className="erp-audit-label">Modified By</label>
                <input type="text" className="erp-audit-input" value={formData.modifiedBy || '-'} readOnly />
              </div>
              <div className="erp-audit-row">
                <label className="erp-audit-label">Closed On</label>
                <input type="text" className="erp-audit-input" value={formData.closedOn ? new Date(formData.closedOn).toLocaleString() : '-'} readOnly />
                <label className="erp-audit-label">Closed By</label>
                <input type="text" className="erp-audit-input" value={formData.closedBy || '-'} readOnly />
              </div>
            </div>
          </div>

          {/* Data Grid - Scrollable */}
          <div className="erp-grid-section">
            <div className="erp-panel-header">Booking Records</div>
            <div className="grid-toolbar">
              <input
                type="text"
                placeholder="Quick search..."
                className="filter-input"
                style={{ width: '200px' }}
              />
              <button className="erp-button">Filter</button>
              <button className="erp-button">Clear</button>
            </div>
            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>
            ) : (
              <div className="erp-grid-container" style={{ maxHeight: 'calc(100vh - 450px)', overflowY: 'auto' }}>
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th style={{ width: '30px' }}><input type="checkbox" /></th>
                      <th>Booking ID</th>
                      <th>Booking Date</th>
                      <th>Customer ID</th>
                      <th>Customer Name</th>
                      <th>Total Passengers</th>
                      <th>From Station</th>
                      <th>To Station</th>
                      <th>Travel Date</th>
                      <th>Travel Class</th>
                      <th>Status</th>
                      <th>Created By</th>
                    </tr>
                    {/* Inline Filter Row */}
                    <tr className="inline-filter-row">
                      <td></td>
                      <td>
                        <input
                          type="text"
                          className="inline-filter-input"
                          value={inlineFilters['bk_bkid'] || ''}
                          onChange={(e) => handleInlineFilterChange('bk_bkid', e.target.value)}
                          placeholder="Filter ID..."
                          style={{ width: '100%', padding: '2px', fontSize: '11px', backgroundColor: '#f0f0f0' }}
                        />
                      </td>
                      <td>
                        <input
                          type="date"
                          className="inline-filter-input"
                          value={inlineFilters['bk_bookingdt'] || ''}
                          onChange={(e) => handleInlineFilterChange('bk_bookingdt', e.target.value)}
                          style={{ width: '100%', padding: '2px', fontSize: '11px', backgroundColor: '#f0f0f0' }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="inline-filter-input"
                          value={inlineFilters['customerId'] || ''}
                          onChange={(e) => handleInlineFilterChange('customerId', e.target.value)}
                          placeholder="Filter customer ID..."
                          style={{ width: '100%', padding: '2px', fontSize: '11px', backgroundColor: '#f0f0f0' }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="inline-filter-input"
                          value={inlineFilters['customerName'] || ''}
                          onChange={(e) => handleInlineFilterChange('customerName', e.target.value)}
                          placeholder="Filter customer..."
                          style={{ width: '100%', padding: '2px', fontSize: '11px', backgroundColor: '#f0f0f0' }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="inline-filter-input"
                          value={inlineFilters['totalPassengers'] || ''}
                          onChange={(e) => handleInlineFilterChange('totalPassengers', e.target.value)}
                          placeholder="Filter passengers..."
                          style={{ width: '100%', padding: '2px', fontSize: '11px', backgroundColor: '#f0f0f0' }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="inline-filter-input"
                          value={inlineFilters['fromStation'] || ''}
                          onChange={(e) => handleInlineFilterChange('fromStation', e.target.value)}
                          placeholder="Filter from..."
                          style={{ width: '100%', padding: '2px', fontSize: '11px', backgroundColor: '#f0f0f0' }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="inline-filter-input"
                          value={inlineFilters['toStation'] || ''}
                          onChange={(e) => handleInlineFilterChange('toStation', e.target.value)}
                          placeholder="Filter to..."
                          style={{ width: '100%', padding: '2px', fontSize: '11px', backgroundColor: '#f0f0f0' }}
                        />
                      </td>
                      <td>
                        <input
                          type="date"
                          className="inline-filter-input"
                          value={inlineFilters['bk_trvldt'] || ''}
                          onChange={(e) => handleInlineFilterChange('bk_trvldt', e.target.value)}
                          style={{ width: '100%', padding: '2px', fontSize: '11px', backgroundColor: '#f0f0f0' }}
                        />
                      </td>
                      <td>
                        <select
                          className="inline-filter-input"
                          value={inlineFilters['bk_class'] || ''}
                          onChange={(e) => handleInlineFilterChange('bk_class', e.target.value)}
                          style={{ width: '100%', padding: '2px', fontSize: '11px', backgroundColor: '#f0f0f0' }}
                        >
                          <option value="">All</option>
                          <option value="SL">SL</option>
                          <option value="3A">3A</option>
                          <option value="2A">2A</option>
                        </select>
                      </td>
                      <td>
                        <select
                          className="inline-filter-input"
                          value={inlineFilters['bk_status'] || ''}
                          onChange={(e) => handleInlineFilterChange('bk_status', e.target.value)}
                          style={{ width: '100%', padding: '2px', fontSize: '11px', backgroundColor: '#f0f0f0' }}
                        >
                          <option value="">All</option>
                          <option value="Draft">Draft</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td>
                        <input
                          type="text"
                          className="inline-filter-input"
                          value={inlineFilters['createdBy'] || ''}
                          onChange={(e) => handleInlineFilterChange('createdBy', e.target.value)}
                          placeholder="Filter user..."
                          style={{ width: '100%', padding: '2px', fontSize: '11px', backgroundColor: '#f0f0f0' }}
                        />
                      </td>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.length === 0 ? (
                      <tr><td colSpan="10" style={{ textAlign: 'center' }}>No records found</td></tr>
                    ) : (
                      paginatedData.map((record, idx) => {
                        const isSelected = selectedBooking && selectedBooking.bk_bkid === record.bk_bkid;
                        return (
                          <tr 
                            key={idx}
                            className={isSelected ? 'selected' : ''}
                            onClick={() => handleRecordSelect(record)}
                          >
                            <td><input type="checkbox" checked={!!isSelected} onChange={() => {}} /></td>
                            <td>{record.bk_bkid}</td>
                            <td>{new Date(record.bk_bookingdt || record.createdOn || new Date()).toLocaleDateString()}</td>
                            <td>{record.customerId || record.bk_customerid || record.cu_usid || 'N/A'}</td>
                            <td>{record.customerName || record.bk_customername || 'N/A'}</td>
                            <td>
                              <button 
                                className="erp-button" 
                                style={{ padding: '2px 6px', fontSize: '11px', cursor: 'pointer' }} 
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent row selection
                                  showPassengerDetails(record.bk_bkid);
                                }}
                              >
                                {record.totalPassengers || passengerList.filter(p => p.name.trim() !== '').length || 0}
                              </button>
                            </td>
                            <td>{record.fromStation?.st_stname || record.bk_fromstation || record.bk_fromst || 'N/A'}</td>
                            <td>{record.toStation?.st_stname || record.bk_tostation || record.bk_tost || 'N/A'}</td>
                            <td>{new Date(record.bk_trvldt || record.bk_travelldate || new Date()).toLocaleDateString()}</td>
                            <td>{record.bk_class || record.bk_travelclass || 'N/A'}</td>
                            <td>{record.bk_status || 'Draft'}</td>
                            <td>{record.createdBy || record.bk_createdby || 'system'}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Filter Panel */}
        <div className="erp-filter-panel">
          <div className="erp-filter-header">
            Filter Criteria
            {(filteredBookings.length !== bookings.length) && (
              <span className="erp-filter-indicator">{filteredBookings.length}/{bookings.length}</span>
            )}
          </div>
          
          <div className="erp-form-row">
            <label className="erp-form-label">Booking ID</label>
            <input 
              type="text" 
              className="erp-input"
              value={inlineFilters['bk_bkid'] || ''}
              onChange={(e) => handleInlineFilterChange('bk_bkid', e.target.value)}
              placeholder="Search ID..."
            />
          </div>
          <div className="erp-form-row">
            <label className="erp-form-label">Booking Date</label>
            <input 
              type="date" 
              className="erp-input"
              value={inlineFilters['bk_bookingdt'] || ''}
              onChange={(e) => handleInlineFilterChange('bk_bookingdt', e.target.value)}
              placeholder="Search date..."
            />
          </div>
          <div className="erp-form-row">
            <label className="erp-form-label">Customer ID</label>
            <input 
              type="text" 
              className="erp-input"
              value={inlineFilters['customerId'] || ''}
              onChange={(e) => handleInlineFilterChange('customerId', e.target.value)}
              placeholder="Search customer ID..."
            />
          </div>
          <div className="erp-form-row">
            <label className="erp-form-label">Customer Name</label>
            <input 
              type="text" 
              className="erp-input"
              value={inlineFilters['customerName'] || ''}
              onChange={(e) => handleInlineFilterChange('customerName', e.target.value)}
              placeholder="Search customer..."
            />
          </div>
          <div className="erp-form-row">
            <label className="erp-form-label">Total Passengers</label>
            <input 
              type="number" 
              className="erp-input"
              value={inlineFilters['totalPassengers'] || ''}
              onChange={(e) => handleInlineFilterChange('totalPassengers', e.target.value)}
              placeholder="Search passengers..."
            />
          </div>
          <div className="erp-form-row">
            <label className="erp-form-label">From Station</label>
            <input 
              type="text" 
              className="erp-input"
              value={inlineFilters['fromStation'] || ''}
              onChange={(e) => handleInlineFilterChange('fromStation', e.target.value)}
              placeholder="Search from..."
            />
          </div>
          <div className="erp-form-row">
            <label className="erp-form-label">To Station</label>
            <input 
              type="text" 
              className="erp-input"
              value={inlineFilters['toStation'] || ''}
              onChange={(e) => handleInlineFilterChange('toStation', e.target.value)}
              placeholder="Search to..."
            />
          </div>
          <div className="erp-form-row">
            <label className="erp-form-label">Travel Date</label>
            <input 
              type="date" 
              className="erp-input"
              value={inlineFilters['bk_trvldt'] || ''}
              onChange={(e) => handleInlineFilterChange('bk_trvldt', e.target.value)}
              placeholder="Search date..."
            />
          </div>
          <div className="erp-form-row">
            <label className="erp-form-label">Travel Class</label>
            <select 
              className="erp-input"
              value={inlineFilters['bk_class'] || ''}
              onChange={(e) => handleInlineFilterChange('bk_class', e.target.value)}
            >
              <option value="">All Classes</option>
              <option value="SL">Sleeper (SL)</option>
              <option value="3A">3rd AC (3A)</option>
              <option value="2A">2nd AC (2A)</option>
              <option value="1A">1st AC (1A)</option>
              <option value="CC">Chair Car (CC)</option>
            </select>
          </div>
          <div className="erp-form-row">
            <label className="erp-form-label">Status</label>
            <select 
              className="erp-input"
              value={inlineFilters['bk_status'] || ''}
              onChange={(e) => handleInlineFilterChange('bk_status', e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Waitlisted">Waitlisted</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          
          <div style={{ marginTop: '12px', display: 'flex', gap: '4px' }}>
            <button 
              className="erp-button" 
              style={{ flex: 1 }}
              onClick={() => {
                setInlineFilters({});
                fetchBookings();
              }}
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Passenger Details Modal */}
      {showPassengerModal && (
        <div className="erp-modal-overlay" onClick={() => setShowPassengerModal(false)}>
          <div className="erp-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', width: '90%' }}>
            <div className="erp-modal-title">
              <span>Passenger Details</span>
              <button 
                className="erp-modal-close" 
                onClick={() => setShowPassengerModal(false)}
              >
                ×
              </button>
            </div>
            <div className="erp-modal-body">
              {loadingPassengers ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>Loading passenger details...</div>
              ) : passengerDetails.length > 0 ? (
                <table className="erp-table" style={{ width: '100%', fontSize: '12px' }}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Age</th>
                      <th>Gender</th>
                      <th>Berth Pref</th>
                      <th>Berth Alloc</th>
                      <th>Coach</th>
                      <th>Seat No</th>
                      <th>ID Type</th>
                      <th>ID Number</th>
                    </tr>
                  </thead>
                  <tbody>
                    {passengerDetails.map((passenger, index) => (
                      <tr key={index}>
                        <td>{passenger.firstName} {passenger.lastName || ''}</td>
                        <td>{passenger.age || ''}</td>
                        <td>{passenger.gender || ''}</td>
                        <td>{passenger.berthPreference || ''}</td>
                        <td>{passenger.berthAllocated || ''}</td>
                        <td>{passenger.coach || ''}</td>
                        <td>{passenger.seatNo || ''}</td>
                        <td>{passenger.idProofType || ''}</td>
                        <td>{passenger.idProofNumber || ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px' }}>No passenger details available</div>
              )}
            </div>
            <div className="erp-modal-footer">
              <button 
                className="erp-button" 
                onClick={() => setShowPassengerModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Bar - Static */}
      <div className="erp-status-bar">
        <div className="erp-status-item">{isEditing ? 'Editing' : 'Ready'}</div>
        <div className="erp-status-item">
          Records: {filteredBookings.length !== bookings.length ? `${filteredBookings.length}/${bookings.length}` : filteredBookings.length}
        </div>
        <div className="erp-status-item">
          Showing: {paginatedData.length > 0 ? `${((currentPage - 1) * recordsPerPage) + 1}-${Math.min(currentPage * recordsPerPage, filteredBookings.length)}` : '0'} of {filteredBookings.length}
        </div>
        <div className="erp-status-item" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button 
            className="erp-icon-button" 
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            title="First Page"
          >
            |◀
          </button>
          <button 
            className="erp-icon-button" 
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            title="Previous Page"
          >
            ◀
          </button>
          <span style={{ margin: '0 4px', fontSize: '11px' }}>Page {currentPage}/{totalPages || 1}</span>
          <button 
            className="erp-icon-button" 
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
            title="Next Page"
          >
            ▶
          </button>
          <button 
            className="erp-icon-button" 
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages || totalPages === 0}
            title="Last Page"
          >
            ▶|
          </button>
        </div>
      </div>
    </div>
  );
};

export default Bookings;