import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/customer-profile.css';

const CustomerProfile = () => {
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setProfile(data.data);
        setEditData({
          phone: data.data.phone || '',
          email: data.data.email || '',
          name: data.data.name || ''
        });
      } else {
        setError(data.error?.message || 'Failed to load profile');
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editData)
      });

      const data = await response.json();

      if (data.success) {
        setProfile(prev => ({ ...prev, ...editData }));
        setIsEditing(false);
      } else {
        setError(data.error?.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData({
      phone: profile.phone || '',
      email: profile.email || '',
      name: profile.name || ''
    });
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="customer-profile-loading">
        <div className="loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="customer-profile-error">
        <h3>Error Loading Profile</h3>
        <p>{error}</p>
        <button onClick={fetchProfile} className="retry-btn">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="customer-profile-container">
      <div className="page-header">
        <h1>My Profile</h1>
        <button 
          onClick={handleEditToggle}
          className="btn-primary"
        >
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            {profile.name ? profile.name.charAt(0).toUpperCase() : '?'}
          </div>
          <div className="profile-basic-info">
            <h2>{isEditing ? (
              <input
                type="text"
                name="name"
                value={editData.name}
                onChange={handleInputChange}
                className="profile-input"
              />
            ) : (
              profile.name
            )}</h2>
            <p>Customer ID: {profile.customerId || profile.id}</p>
            <p>Member since: {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-IN') : 'N/A'}</p>
          </div>
        </div>

        <div className="profile-details">
          <div className="detail-section">
            <h3>Personal Information</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <label>Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={editData.email}
                    onChange={handleInputChange}
                    className="profile-input"
                  />
                ) : (
                  <span>{profile.email}</span>
                )}
              </div>
              <div className="detail-item">
                <label>Phone</label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={editData.phone}
                    onChange={handleInputChange}
                    className="profile-input"
                  />
                ) : (
                  <span>{profile.phone}</span>
                )}
              </div>
              <div className="detail-item">
                <label>Customer Type</label>
                <span>{profile.customerType || 'Individual'}</span>
              </div>
              <div className="detail-item">
                <label>Credit Limit</label>
                <span>₹{profile.creditLimit ? profile.creditLimit.toLocaleString() : '0'}</span>
              </div>
            </div>
          </div>

          <div className="detail-section">
            <h3>Account Summary</h3>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="label">Total Bookings</span>
                <span className="value">{profile.totalBookings || 0}</span>
              </div>
              <div className="summary-item">
                <span className="label">Total Spent</span>
                <span className="value">₹{(profile.totalSpent || 0).toLocaleString()}</span>
              </div>
              <div className="summary-item">
                <span className="label">Outstanding Amount</span>
                <span className="value">₹{(profile.outstandingAmount || 0).toLocaleString()}</span>
              </div>
              <div className="summary-item">
                <span className="label">Last Activity</span>
                <span className="value">{profile.lastActivity ? new Date(profile.lastActivity).toLocaleDateString('en-IN') : 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {isEditing && (
          <div className="profile-actions">
            <button 
              onClick={handleSave}
              className="btn-primary"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button 
              onClick={handleCancel}
              className="btn-outline"
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerProfile;