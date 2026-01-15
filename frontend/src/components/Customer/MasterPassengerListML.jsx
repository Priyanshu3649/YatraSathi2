import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { masterPassengerAPI } from '../../services/api';

const MasterPassengerListML = () => {
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
    aadhaar: ''
  });

  // Load passengers
  useEffect(() => {
    loadPassengers();
  }, []);

  const loadPassengers = async () => {
    try {
      setLoading(true);
      setError(''); // Clear any previous errors
      const data = await masterPassengerAPI.getMasterPassengersML();
      setPassengers(data.data);
    } catch (err) {
      setError(err.message || 'Failed to load passengers');
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
        aadhaar: formData.aadhaar || null
      };

      try {
        if (editingPassenger) {
          await masterPassengerAPI.updateMasterPassengerML(editingPassenger.ml_mlid, passengerData);
        } else {
          await masterPassengerAPI.createMasterPassengerML(passengerData);
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
        aadhaar: ''
      });
      setShowForm(false);
      setEditingPassenger(null);
      loadPassengers();
    } catch (err) {
      setError(err.message || 'Operation failed');
    }
  };

  const handleEdit = (passenger) => {
    setEditingPassenger(passenger);
    setFormData({
      firstName: passenger.ml_firstname,
      lastName: passenger.ml_lastname || '',
      age: passenger.ml_age.toString(),
      gender: passenger.ml_gender,
      berthPreference: passenger.ml_berthpref || '',
      idType: passenger.ml_idtype || '',
      idNumber: passenger.ml_idnumber || '',
      aadhaar: passenger.ml_aadhaar || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (passengerId) => {
    if (window.confirm('Are you sure you want to deactivate this passenger?')) {
      try {
        try {
          await masterPassengerAPI.deleteMasterPassengerML(passengerId);
        } catch (err) {
          setError(err.message || 'Failed to deactivate passenger');
          console.error('Delete passenger error:', err);
          return; // Stop execution if API call fails
        }
        loadPassengers();
      } catch (err) {
        setError(err.message || 'Failed to deactivate passenger');
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
      aadhaar: ''
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
          <div className="erp-menu-item">File</div>
          <div className="erp-menu-item">Edit</div>
          <div className="erp-menu-item">View</div>
          <div className="erp-menu-item">Tools</div>
          <div className="erp-menu-item">Help</div>
        </div>
        <div className="erp-main-content">
          <div className="erp-center-content">
            <div>Loading master passenger list...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="erp-admin-container">
      {/* Menu Bar */}
      <div className="erp-menu-bar">
        <div className="erp-menu-item">File</div>
        <div className="erp-menu-item">Edit</div>
        <div className="erp-menu-item">View</div>
        <div className="erp-menu-item">Tools</div>
        <div className="erp-menu-item">Help</div>
      </div>

      {/* Main Content */}
      <div className="erp-main-content">
        <div className="erp-center-content">
          {/* Toolbar */}
          <div className="erp-toolbar">
            <button 
              className="erp-button" 
              onClick={() => setShowForm(true)}
            >
              New Passenger
            </button>
            <div className="erp-tool-separator"></div>
            <button 
              className="erp-button" 
              onClick={loadPassengers}
            >
              Refresh
            </button>
            <button 
              className="erp-button" 
              onClick={() => navigate('/customer/dashboard')}
            >
              Back to Dashboard
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
              Master Passenger List (mlXmasterlist) ({passengers.length} passengers)
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
                        <th>Age</th>
                        <th>Gender</th>
                        <th>ID Type</th>
                        <th>ID Number</th>
                        <th>Berth Preference</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {passengers.map((passenger, index) => (
                        <tr 
                          key={passenger.ml_mlid} 
                          className={index % 2 === 0 ? 'erp-row-even' : 'erp-row-odd'}
                        >
                          <td>
                            {passenger.ml_firstname} {passenger.ml_lastname}
                          </td>
                          <td>{passenger.ml_age}</td>
                          <td>{getGenderDisplay(passenger.ml_gender)}</td>
                          <td>{passenger.ml_idtype || '-'}</td>
                          <td>{maskIdNumber(passenger.ml_idnumber) || '-'}</td>
                          <td>{passenger.ml_berthpref || 'No Preference'}</td>
                          <td>
                            <span className={`erp-status-badge ${passenger.ml_active ? 'erp-status-active' : 'erp-status-inactive'}`}>
                              {passenger.ml_active ? 'Active' : 'Inactive'}
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
                              onClick={() => handleDelete(passenger.ml_mlid)}
                              disabled={!passenger.ml_active}
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
        <div className="erp-status-item">Master Passenger List (mlXmasterlist)</div>
        <div className="erp-status-item">Total: {passengers.length} passengers</div>
        <div className="erp-status-panel">Ready</div>
      </div>
    </div>
  );
};

export default MasterPassengerListML;