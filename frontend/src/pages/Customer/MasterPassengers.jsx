import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { masterPassengerAPI } from '../../services/api';
import '../../styles/master-passengers.css';

const MasterPassengers = () => {
  const [passengers, setPassengers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: '',
    gender: 'M',
    birthPreference: ''
  });
  const navigate = useNavigate();

  // Load passengers on mount
  useEffect(() => {
    loadPassengers();
  }, []);

  const loadPassengers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await masterPassengerAPI.getMasterPassengers();
      if (response.success) {
        setPassengers(response.data || []);
      } else {
        setError(response.error || 'Failed to load passengers');
      }
    } catch (err) {
      console.error('Error loading passengers:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      dateOfBirth: '',
      gender: 'M',
      birthPreference: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate
    if (!formData.name || !formData.dateOfBirth || !formData.gender) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      let response;

      if (editingId) {
        response = await masterPassengerAPI.updateMasterPassenger(editingId, formData);
        if (response.success) {
          setSuccess('Passenger updated successfully');
          loadPassengers();
          resetForm();
        } else {
          setError(response.error || 'Failed to update passenger');
        }
      } else {
        response = await masterPassengerAPI.createMasterPassenger(formData);
        if (response.success) {
          setSuccess('Passenger created successfully');
          loadPassengers();
          resetForm();
        } else {
          setError(response.error || 'Failed to create passenger');
        }
      }
    } catch (err) {
      console.error('Form submission error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (passenger) => {
    setEditingId(passenger.id);
    setFormData({
      name: passenger.name,
      dateOfBirth: passenger.dateOfBirth,
      gender: passenger.gender,
      birthPreference: passenger.birthPreference || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (passengerId) => {
    if (!window.confirm('Are you sure you want to delete this passenger?')) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await masterPassengerAPI.deleteMasterPassenger(passengerId);
      if (response.success) {
        setSuccess('Passenger deleted successfully');
        loadPassengers();
      } else {
        setError(response.error || 'Failed to delete passenger');
      }
    } catch (err) {
      console.error('Error deleting passenger:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const berthPreferences = [
    { value: 'NO_PREF', label: 'No Preference' },
    { value: 'LOWER', label: 'Lower Berth' },
    { value: 'MIDDLE', label: 'Middle Berth' },
    { value: 'UPPER', label: 'Upper Berth' },
    { value: 'SIDE_LOWER', label: 'Side Lower' },
    { value: 'SIDE_UPPER', label: 'Side Upper' }
  ];

  const calculateAge = (dob) => {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="master-passengers-container">
      <div className="master-passengers-header">
        <div className="header-top">
          <button onClick={() => navigate('/customer/dashboard')} className="back-btn">
            <i className="fas fa-arrow-left"></i> Back
          </button>
          <h1>My Saved Passengers</h1>
          <button onClick={() => navigate('/customer/bookings')} className="booking-btn">
            <i className="fas fa-calendar"></i> New Booking
          </button>
        </div>
        <p className="subtitle">Create and manage your favorite passenger profiles to quickly add them to bookings</p>
      </div>

      <div className="master-passengers-content">
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {/* Form Section */}
        {!showForm ? (
          <button onClick={() => setShowForm(true)} className="btn-add-passenger">
            <i className="fas fa-plus"></i> Add New Passenger
          </button>
        ) : (
          <div className="form-card">
            <div className="form-header">
              <h2>{editingId ? 'Edit Passenger' : 'Add New Passenger'}</h2>
              <button onClick={resetForm} className="close-btn">
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Full Name *</label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter full name"
                  required
                  autoFocus
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="dateOfBirth">Date of Birth *</label>
                  <input
                    id="dateOfBirth"
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="gender">Gender *</label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="O">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="birthPreference">Birth Preference (Berth)</label>
                <select
                  id="birthPreference"
                  name="birthPreference"
                  value={formData.birthPreference}
                  onChange={handleInputChange}
                >
                  <option value="">Select preference</option>
                  {berthPreferences.map(pref => (
                    <option key={pref.value} value={pref.value}>{pref.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-actions">
                <button type="button" onClick={resetForm} className="btn-cancel" disabled={loading}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : (editingId ? 'Update Passenger' : 'Add Passenger')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Passengers List */}
        {loading && !showForm ? (
          <div className="loading">Loading passengers...</div>
        ) : passengers.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-users"></i>
            <p>No saved passengers yet</p>
            <small>Add your favorite passengers to quickly select them during bookings</small>
          </div>
        ) : (
          <div className="passengers-grid">
            {passengers.map(passenger => (
              <div key={passenger.id} className="passenger-card">
                <div className="card-header">
                  <h3>{passenger.name}</h3>
                  <div className="card-actions">
                    <button onClick={() => handleEdit(passenger)} title="Edit" className="btn-icon edit">
                      <i className="fas fa-edit"></i>
                    </button>
                    <button onClick={() => handleDelete(passenger.id)} title="Delete" className="btn-icon delete">
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>

                <div className="card-details">
                  <div className="detail-item">
                    <span className="label">Date of Birth</span>
                    <span className="value">{new Date(passenger.dateOfBirth).toLocaleDateString()}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Age</span>
                    <span className="value">{calculateAge(passenger.dateOfBirth)} years</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Gender</span>
                    <span className="value">{passenger.gender === 'M' ? 'Male' : passenger.gender === 'F' ? 'Female' : 'Other'}</span>
                  </div>
                  {passenger.birthPreference && (
                    <div className="detail-item">
                      <span className="label">Birth Preference</span>
                      <span className="value">{berthPreferences.find(p => p.value === passenger.birthPreference)?.label}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MasterPassengers;
