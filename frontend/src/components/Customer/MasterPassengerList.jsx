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
    name: '',
    age: '',
    dob: '',
    gender: '',
    berthPreference: ''
  });

  // Load passengers
  useEffect(() => {
    loadPassengers();
  }, []);

  const loadPassengers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await masterPassengerAPI.getMasterPassengers();
      if (response.success) {
        const passengersData = Array.isArray(response.data) ? response.data : (response.data?.passengers || []);
        setPassengers(passengersData);
      } else {
        setError(response.message || 'Failed to load passengers');
        setPassengers([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load passengers');
      setPassengers([]);
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
      if (!formData.age && !formData.dob) {
        setError('Please provide either Age or Date of Birth');
        return;
      }

      const passengerData = {
        name: formData.name,
        age: formData.age ? parseInt(formData.age) : null,
        dateOfBirth: formData.dob || null,
        gender: formData.gender,
        berthPreference: formData.berthPreference || null
      };

      if (editingPassenger) {
        await masterPassengerAPI.updateMasterPassenger(editingPassenger.id, passengerData);
        setEditingPassenger(null);
      } else {
        await masterPassengerAPI.createMasterPassenger(passengerData);
      }
      
      setFormData({
        name: '',
        age: '',
        dob: '',
        gender: '',
        berthPreference: ''
      });
      setShowForm(false);
      loadPassengers();
    } catch (err) {
      setError(err.message || 'Operation failed');
    }
  };

  const handleEdit = (passenger) => {
    setEditingPassenger(passenger);
    
    // Calculate approximate age if only DOB is available
    let age = '';
    if (passenger.dateOfBirth) {
      const dobDate = new Date(passenger.dateOfBirth);
      age = Math.abs(new Date(Date.now() - dobDate.getTime()).getUTCFullYear() - 1970).toString();
    }

    setFormData({
      name: passenger.name || '',
      age: age,
      dob: passenger.dateOfBirth || '',
      gender: passenger.gender || '',
      berthPreference: passenger.birthPreference || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (passengerId) => {
    if (window.confirm('Are you sure you want to deactivate this passenger?')) {
      try {
        setError('');
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
      name: '',
      age: '',
      dob: '',
      gender: '',
      berthPreference: ''
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

          {/* Form Section */}
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
                    <div className="erp-form-group" style={{ flex: 2 }}>
                      <label className="erp-form-label required">Full Name:</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="erp-form-input"
                        placeholder="Enter passenger's full name"
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
                      <label className="erp-form-label">Age (or provide DOB):</label>
                      <input
                        type="number"
                        name="age"
                        value={formData.age}
                        onChange={handleInputChange}
                        min="1"
                        max="120"
                        className="erp-form-input"
                        placeholder="Age in years"
                      />
                    </div>
                    <div className="erp-form-group">
                      <label className="erp-form-label">Date of Birth (or provide Age):</label>
                      <input
                        type="date"
                        name="dob"
                        value={formData.dob}
                        onChange={handleInputChange}
                        className="erp-form-input"
                      />
                    </div>
                    <div className="erp-form-group">
                      <label className="erp-form-label">Berth Preference (Optional):</label>
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
                        <th>Full Name</th>
                        <th>Age / DOB</th>
                        <th>Gender</th>
                        <th>Berth Preference</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {passengers.map((passenger, index) => {
                        let displayAge = '';
                        if (passenger.dateOfBirth) {
                          const dobDate = new Date(passenger.dateOfBirth);
                          displayAge = 'DOB: ' + passenger.dateOfBirth;
                        } else {
                          displayAge = 'Age: ' + passenger.age;
                        }
                        
                        return (
                          <tr 
                            key={passenger.id || index} 
                            className={index % 2 === 0 ? 'erp-row-even' : 'erp-row-odd'}
                          >
                            <td>
                              <strong>{passenger.name}</strong>
                            </td>
                            <td>
                              {displayAge}
                            </td>
                            <td>{getGenderDisplay(passenger.gender)}</td>
                            <td>{passenger.birthPreference || 'No Preference'}</td>
                            <td>
                              <button 
                                className="erp-button erp-small-button"
                                onClick={() => handleEdit(passenger)}
                                style={{ marginRight: '5px' }}
                              >
                                Edit
                              </button>
                              <button 
                                className="erp-button erp-small-button erp-button-danger"
                                onClick={() => handleDelete(passenger.id)}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })}
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