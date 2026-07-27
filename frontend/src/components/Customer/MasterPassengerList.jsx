import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { masterPassengerAPI } from '../../services/api';
import '../../styles/vintage-erp-theme.css';
import '../../styles/dynamic-admin-panel.css';

const MasterPassengerList = () => {
  const navigate = useNavigate();
  const [passengers, setPassengers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPassenger, setEditingPassenger] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    age: '',
    gender: '',
    berthPreference: '',
    idType: '',
    idNumber: '',
    aadhaar: '',
    dob: '',
    nationality: '',
    phone: '',
    email: '',
    lastBookingRef: ''
  });

  // Load passengers
  useEffect(() => {
    loadPassengers();
  }, []);

  const loadPassengers = async () => {
    try {
      setLoading(true);
      setError(''); // Clear any previous errors
      const response = await masterPassengerAPI.getMasterPassengers();
      if (response.success) {
        const passengersData = Array.isArray(response.data) ? response.data : (response.data?.passengers || []);
        setPassengers(passengersData);
      } else {
        setError(response.message || 'Failed to load passengers');
        setPassengers([]); // Ensure state is always an array
      }
    } catch (err) {
      setError(err.message || 'Failed to load passengers');
      setPassengers([]); // Ensure state is always an array on error
      console.error('Load passengers error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const passengerData = {
        firstName: formData.firstName,
        lastName: formData.lastName || null,
        age: parseInt(formData.age),
        gender: formData.gender,
        berthPreference: formData.berthPreference || null,
        idType: formData.idType || null,
        idNumber: formData.idNumber || null,
        aadhaar: formData.aadhaar || null,
        dob: formData.dob || null,
        nationality: formData.nationality || null,
        phone: formData.phone || null,
        email: formData.email || null,
        lastBookingRef: formData.lastBookingRef || null
      };

      try {
        if (editingPassenger) {
          await masterPassengerAPI.updateMasterPassenger(editingPassenger.cmp_cmpid, passengerData);
          setEditingPassenger(null);
        } else {
          await masterPassengerAPI.createMasterPassenger(passengerData);
        }
      } catch (err) {
        setError(err.message || 'Operation failed');
        return; // Stop execution if API call fails
      }
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        age: '',
        gender: '',
        berthPreference: '',
        idType: '',
        idNumber: '',
        aadhaar: '',
        dob: '',
        nationality: '',
        phone: '',
        email: '',
        lastBookingRef: ''
      });
      setShowForm(false);
      loadPassengers();
    } catch (err) {
      setError(err.message || 'Operation failed');
    }
  };

  const handleEdit = (passenger) => {
    setEditingPassenger(passenger);
    setFormData({
      firstName: passenger.cmp_firstname,
      lastName: passenger.cmp_lastname || '',
      age: passenger.cmp_age.toString(),
      gender: passenger.cmp_gender,
      berthPreference: passenger.cmp_berthpref || '',
      idType: passenger.cmp_idtype || '',
      idNumber: passenger.cmp_idnumber || '',
      aadhaar: passenger.cmp_aadhaar || '',
      dob: passenger.cmp_dob || '',
      nationality: passenger.cmp_nationality || '',
      phone: passenger.cmp_phone || '',
      email: passenger.cmp_email || '',
      lastBookingRef: passenger.cmp_last_booking_ref || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (passengerId) => {
    if (window.confirm('Are you sure you want to deactivate this passenger?')) {
      try {
        setError(''); // Clear any previous errors
        await masterPassengerAPI.deleteMasterPassenger(passengerId);
        loadPassengers();
      } catch (err) {
        setError(err.message || 'Failed to deactivate passenger');
        console.error('Delete passenger error:', err);
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingPassenger(null);
    setFormData({
      firstName: '',
      lastName: '',
      age: '',
      gender: '',
      berthPreference: '',
      idType: '',
      idNumber: '',
      aadhaar: '',
      dob: '',
      nationality: '',
      phone: '',
      email: '',
      lastBookingRef: ''
    });
  };

  const getGenderDisplay = (gender) => {
    switch (gender) {
      case 'M': return 'Male';
      case 'F': return 'Female';
      case 'O': return 'Other';
      default: return gender;
    }
  };

  const maskIdNumber = (idNumber) => {
    if (!idNumber) return '';
    if (idNumber.length <= 4) return idNumber;
    return '****' + idNumber.slice(-4);
  };

  if (loading) {
    return (
      <div className="erp-admin-container">
        <div className="erp-menu-bar">
          <div className="erp-menu-item">← Dashboard</div>
          <div className="erp-menu-item active">Passenger List</div>
          <div className="erp-user-info">MASTER PASSENGER LIST 👤</div>
        </div>
        <div className="erp-main-content" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <div>Loading master passengers...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="erp-admin-container">
      {/* Menu Bar */}
      <div className="erp-menu-bar">
        <div className="erp-menu-item" onClick={() => navigate('/customer/dashboard')}>← Dashboard</div>
        <div className="erp-menu-item" onClick={() => navigate('/customer/booking/new')}>New Booking</div>
        <div className="erp-menu-item" onClick={() => navigate('/customer/bookings')}>My Bookings</div>
        <div className="erp-menu-item active">Passenger List</div>
        <div className="erp-user-info">MASTER PASSENGER LIST 👤</div>
      </div>

      {/* Main Content */}
      <div className="erp-main-content">
        <div className="erp-center-content">
          {/* Toolbar */}
          <div className="erp-toolbar">
            <button 
              className="erp-button erp-primary-button"
              onClick={() => setShowForm(true)}
            >
              + New Passenger
            </button>
            <div className="erp-tool-separator"></div>
            <button 
              className="erp-button" 
              onClick={loadPassengers}
            >
              Refresh
            </button>
            <div className="erp-tool-separator"></div>
            <button 
              className="erp-button"
              onClick={() => navigate('/customer/booking/new')}
              title="Start a booking — saved passengers can be picked from within the booking form"
            >
              Book a Ticket →
            </button>
            <button 
              className="erp-button" 
              onClick={() => navigate('/customer/dashboard')}
            >
              Dashboard
            </button>
          </div>

          {/* Form Section (when adding/editing) */}
          {showForm && (
            <div className="erp-form-section">
              <div className="section-header">
                {editingPassenger ? 'Edit Passenger' : 'Add New Passenger'}
              </div>
              <div className="section-content">
                {error && (
                  <div className="erp-message erp-error-message">
                    {error}
                  </div>
                )}
                <form onSubmit={handleSubmit}>
                  <div className="erp-form-row">
                    <div className="erp-form-group">
                      <label className="erp-form-label required">First Name:</label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                        className="erp-form-input"
                      />
                    </div>
                    <div className="erp-form-group">
                      <label className="erp-form-label">Last Name:</label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="erp-form-input"
                      />
                    </div>
                  </div>
                  
                  <div className="erp-form-row">
                    <div className="erp-form-group">
                      <label className="erp-form-label required">Age:</label>
                      <input
                        type="number"
                        name="age"
                        value={formData.age}
                        onChange={handleInputChange}
                        required
                        min="1"
                        max="120"
                        className="erp-form-input"
                      />
                    </div>
                    <div className="erp-form-group">
                      <label className="erp-form-label required">Gender:</label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        required
                        className="erp-form-input"
                      >
                        <option value="">Select Gender</option>
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                        <option value="O">Other</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="erp-form-row">
                    <div className="erp-form-group">
                      <label className="erp-form-label">Date of Birth:</label>
                      <input
                        type="date"
                        name="dob"
                        value={formData.dob}
                        onChange={handleInputChange}
                        className="erp-form-input"
                      />
                    </div>
                    <div className="erp-form-group">
                      <label className="erp-form-label">Nationality:</label>
                      <input
                        type="text"
                        name="nationality"
                        value={formData.nationality}
                        onChange={handleInputChange}
                        className="erp-form-input"
                        placeholder="e.g. Indian"
                      />
                    </div>
                  </div>

                  <div className="erp-form-row">
                    <div className="erp-form-group">
                      <label className="erp-form-label">Phone:</label>
                      <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="erp-form-input"
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div className="erp-form-group">
                      <label className="erp-form-label">Email:</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="erp-form-input"
                        placeholder="Enter email address"
                      />
                    </div>
                  </div>

                  <div className="erp-form-row">
                    <div className="erp-form-group">
                      <label className="erp-form-label">Last Booking Ref:</label>
                      <input
                        type="text"
                        name="lastBookingRef"
                        value={formData.lastBookingRef}
                        onChange={handleInputChange}
                        className="erp-form-input"
                        placeholder="Enter booking reference"
                      />
                    </div>
                    <div className="erp-form-group">
                      <label className="erp-form-label">Berth Preference:</label>
                      <select
                        name="berthPreference"
                        value={formData.berthPreference}
                        onChange={handleInputChange}
                        className="erp-form-input"
                      >
                        <option value="">No Preference</option>
                        <option value="LOWER">Lower</option>
                        <option value="UPPER">Upper</option>
                        <option value="MIDDLE">Middle</option>
                        <option value="SIDE_LOWER">Side Lower</option>
                        <option value="SIDE_UPPER">Side Upper</option>
                      </select>
                    </div>
                    <div className="erp-form-group">
                      <label className="erp-form-label">ID Type:</label>
                      <select
                        name="idType"
                        value={formData.idType}
                        onChange={handleInputChange}
                        className="erp-form-input"
                      >
                        <option value="">Select ID Type</option>
                        <option value="AADHAAR">Aadhaar</option>
                        <option value="PAN">PAN Card</option>
                        <option value="PASSPORT">Passport</option>
                        <option value="DRIVING_LICENSE">Driving License</option>
                        <option value="VOTER_ID">Voter ID</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="erp-form-row">
                    <div className="erp-form-group">
                      <label className="erp-form-label">ID Number:</label>
                      <input
                        type="text"
                        name="idNumber"
                        value={formData.idNumber}
                        onChange={handleInputChange}
                        className="erp-form-input"
                      />
                    </div>
                    <div className="erp-form-group">
                      <label className="erp-form-label">Aadhaar (12 digits):</label>
                      <input
                        type="text"
                        name="aadhaar"
                        value={formData.aadhaar}
                        onChange={handleInputChange}
                        maxLength="12"
                        pattern="[0-9]{12}"
                        className="erp-form-input"
                      />
                    </div>
                  </div>
                  
                  <div className="erp-form-actions">
                    <button type="submit" className="erp-button erp-primary-button">
                      {editingPassenger ? 'Update Passenger' : 'Add Passenger'}
                    </button>
                    <button type="button" className="erp-button" onClick={handleCancel}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Data Grid Section */}
          <div className="erp-grid-section">
            <div className="section-header">
              Master Passenger List ({passengers.length} passengers)
            </div>
            <div className="section-content">
              {error && !showForm && (
                <div className="erp-message erp-error-message">
                  {error}
                </div>
              )}
              
              {passengers.length === 0 ? (
                <div className="erp-empty-state">
                  <div className="erp-empty-icon">👤</div>
                  <h3>No Passengers Found</h3>
                  <p>You haven't added any passengers to your master list yet.</p>
                  <button 
                    className="erp-button erp-primary-button"
                    onClick={() => setShowForm(true)}
                  >
                    Add Your First Passenger
                  </button>
                </div>
              ) : (
                <div className="erp-data-grid">
                  <table className="erp-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Age / DOB</th>
                        <th>Gender</th>
                        <th>Nationality</th>
                        <th>Contact</th>
                        <th>ID Info</th>
                        <th>Last Booking</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {passengers.map((passenger, index) => (
                        <tr 
                          key={passenger.cmp_cmpid || passenger.ml_mlid || passenger.id || index} 
                          className={index % 2 === 0 ? 'erp-row-even' : 'erp-row-odd'}
                        >
                          <td>
                            {passenger.cmp_firstname} {passenger.cmp_lastname}
                          </td>
                          <td>
                            {passenger.cmp_age}
                            {passenger.cmp_dob && <div style={{ fontSize: '0.8em', color: '#666' }}>({passenger.cmp_dob})</div>}
                          </td>
                          <td>{getGenderDisplay(passenger.cmp_gender)}</td>
                          <td>{passenger.cmp_nationality || '-'}</td>
                          <td>
                            {passenger.cmp_phone && <div>{passenger.cmp_phone}</div>}
                            {passenger.cmp_email && <div style={{ fontSize: '0.8em', color: '#666' }}>{passenger.cmp_email}</div>}
                          </td>
                          <td>
                            {passenger.cmp_idtype && <div>{passenger.cmp_idtype}: {maskIdNumber(passenger.cmp_idnumber)}</div>}
                            {passenger.cmp_aadhaar && <div style={{ fontSize: '0.8em', color: '#666' }}>Aadhaar: {maskIdNumber(passenger.cmp_aadhaar)}</div>}
                          </td>
                          <td>{passenger.cmp_last_booking_ref || '-'}</td>
                          <td>
                            <span className={`erp-status-badge ${passenger.cmp_active ? 'erp-status-active' : 'erp-status-inactive'}`}>
                              {passenger.cmp_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>
                            <button 
                              className="erp-button erp-small-button"
                              onClick={() => handleEdit(passenger)}
                            >
                              Edit
                            </button>
                            <button 
                              className="erp-button erp-small-button erp-button-danger"
                              onClick={() => handleDelete(passenger.cmp_cmpid)}
                              disabled={!passenger.cmp_active}
                            >
                              Deactivate
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="erp-status-bar">
        <div className="erp-status-item">Master Passenger List</div>
        <div className="erp-status-item">Total: {passengers.length} passengers</div>
        <div className="erp-status-panel">Ready</div>
      </div>
    </div>
  );
};

export default MasterPassengerList;