import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
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
      const data = await authAPI.getProfile();
      
      // Safely transform the data to match the expected format
      const profileData = {
        id: data.id || data.us_usid || '',
        name: `${data.firstName || data.us_fname || ''} ${data.lastName || data.us_lname || ''}
`.trim(),
        firstName: data.firstName || data.us_fname || '',
        lastName: data.lastName || data.us_lname || '',
        email: data.email || data.us_email || '',
        phone: data.phone || data.us_phone || '',
        customerId: data.id || data.us_usid || '',
        customerType: data.customer?.customerType || data.customerType || 'Individual',
        creditLimit: data.customer?.creditLimit || data.creditLimit || 0,
        totalBookings: 0, // Would need to fetch from bookings API
        totalSpent: 0, // Would need to fetch from payments API
        outstandingAmount: 0, // Would need to calculate
        lastActivity: data.updatedAt || data.us_mdtm || data.modified_on || new Date(),
        createdAt: data.createdAt || data.us_edtm || data.created_on || new Date(),
        address: data.address || data.us_addr1 || '',
        city: data.city || data.us_city || '',
        state: data.state || data.us_state || '',
        pincode: data.pincode || data.us_pin || '',
        aadhaar: data.aadhaar || data.us_aadhaar || '',
        pan: data.pan || data.us_pan || ''
      };
      
      setProfile(profileData);
      setEditData({
        phone: profileData.phone || '',
        email: profileData.email || '',
        firstName: profileData.firstName || '',
        lastName: profileData.lastName || '',
        address: profileData.address || '',
        city: profileData.city || '',
        state: profileData.state || '',
        pincode: profileData.pincode || '',
        aadhaar: profileData.aadhaar || '',
        pan: profileData.pan || ''
      });
    } catch (error) {
      console.error('Profile fetch error:', error);
      setError(error.message || 'Failed to load profile. Please try again.');
      // Set default profile data to prevent UI crashes
      setProfile({
        id: 'Unknown',
        name: 'Customer',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        customerId: 'Unknown',
        customerType: 'Individual',
        creditLimit: 0,
        totalBookings: 0,
        totalSpent: 0,
        outstandingAmount: 0,
        lastActivity: new Date(),
        createdAt: new Date()
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Validate input based on field type
    let validatedValue = value;
    
    switch(name) {
      case 'phone':
        // Allow only numbers and limit to 10 digits
        validatedValue = value.replace(/[^0-9]/g, '').slice(0, 10);
        break;
      case 'email':
        // Basic email validation
        validatedValue = value.toLowerCase();
        break;
      case 'pincode':
        // Allow only numbers and limit to 6 digits
        validatedValue = value.replace(/[^0-9]/g, '').slice(0, 6);
        break;
      case 'aadhaar':
        // Allow only numbers and limit to 12 digits
        validatedValue = value.replace(/[^0-9]/g, '').slice(0, 12);
        break;
      case 'pan':
        // Allow alphanumeric, limit to 10 characters, uppercase
        validatedValue = value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10).toUpperCase();
        break;
      default:
        break;
    }
    
    setEditData(prev => ({
      ...prev,
      [name]: validatedValue
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(''); // Clear previous errors
    
    try {
      // Validate required fields
      if (!editData.firstName?.trim() || !editData.email?.trim()) {
        throw new Error('First name and email are required');
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editData.email)) {
        throw new Error('Please enter a valid email address');
      }
      
      // Validate phone number if provided
      if (editData.phone && editData.phone.length !== 10) {
        throw new Error('Phone number must be 10 digits');
      }
      
      // Transform editData to match API expected format
      const updateData = {
        firstName: editData.firstName.trim(),
        lastName: editData.lastName.trim(),
        email: editData.email.trim().toLowerCase(),
        phone: editData.phone || null,
        address: editData.address || null,
        city: editData.city || null,
        state: editData.state || null,
        pincode: editData.pincode || null,
        aadhaar: editData.aadhaar || null,
        pan: editData.pan || null
      };
      
      const response = await authAPI.updateProfile(updateData);
      
      // Update local profile state
      setProfile(prev => ({
        ...prev,
        ...updateData,
        name: `${updateData.firstName || ''} ${updateData.lastName || ''}`.trim(),
        lastActivity: new Date()
      }));
      setIsEditing(false);
    } catch (error) {
      console.error('Profile update error:', error);
      setError(error.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
setEditData({
      phone: profile.phone || '',
      email: profile.email || '',
      firstName: profile.firstName || '',
      lastName: profile.lastName || ''
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
          disabled={saving}
        >
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>
      
      {error && (
        <div className="alert alert-error" style={{margin: '15px', padding: '12px', backgroundColor: '#fee', border: '1px solid #fcc', borderRadius: '4px', color: '#c33'}}>
          {error}
        </div>
      )}

      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            {profile.name ? profile.name.charAt(0).toUpperCase() : '?'}
          </div>
          <div className="profile-basic-info">
<h2>{isEditing ? (
              <div style={{display: 'flex', gap: '10px'}}>
                <input
                  type="text"
                  name="firstName"
                  value={editData.firstName}
                  onChange={handleInputChange}
                  className="profile-input"
                  placeholder="First Name"
                />
                <input
                  type="text"
                  name="lastName"
                  value={editData.lastName}
                  onChange={handleInputChange}
                  className="profile-input"
                  placeholder="Last Name"
                />
              </div>
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
                <label>Email *</label>
{isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={editData.email}
                    onChange={handleInputChange}
                    className="profile-input"
                    required
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
                    placeholder="10-digit mobile number"
                    maxLength="10"
                  />
                ) : (
                  <span>{profile.phone || 'Not provided'}</span>
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
              <div className="detail-item">
                <label>Address</label>
{isEditing ? (
                  <input
                    type="text"
                    name="address"
                    value={editData.address}
                    onChange={handleInputChange}
                    className="profile-input"
                    placeholder="Street address"
                  />
                ) : (
                  <span>{profile.address || 'Not provided'}</span>
                )}
              </div>
              <div className="detail-item">
                <label>City</label>
{isEditing ? (
                  <input
                    type="text"
                    name="city"
                    value={editData.city}
                    onChange={handleInputChange}
                    className="profile-input"
                  />
                ) : (
                  <span>{profile.city || 'Not provided'}</span>
                )}
              </div>
              <div className="detail-item">
                <label>State</label>
{isEditing ? (
                  <input
                    type="text"
                    name="state"
                    value={editData.state}
                    onChange={handleInputChange}
                    className="profile-input"
                  />
                ) : (
                  <span>{profile.state || 'Not provided'}</span>
                )}
              </div>
              <div className="detail-item">
                <label>Pincode</label>
{isEditing ? (
                  <input
                    type="text"
                    name="pincode"
                    value={editData.pincode}
                    onChange={handleInputChange}
                    className="profile-input"
                    placeholder="6-digit pincode"
                    maxLength="6"
                  />
                ) : (
                  <span>{profile.pincode || 'Not provided'}</span>
                )}
              </div>
              <div className="detail-item">
                <label>Aadhaar</label>
{isEditing ? (
                  <input
                    type="text"
                    name="aadhaar"
                    value={editData.aadhaar}
                    onChange={handleInputChange}
                    className="profile-input"
                    placeholder="12-digit Aadhaar number"
                    maxLength="12"
                  />
                ) : (
                  <span>{profile.aadhaar ? '**** **** ' + profile.aadhaar.slice(-4) : 'Not provided'}</span>
                )}
              </div>
              <div className="detail-item">
                <label>PAN Card</label>
{isEditing ? (
                  <input
                    type="text"
                    name="pan"
                    value={editData.pan}
                    onChange={handleInputChange}
                    className="profile-input"
                    placeholder="10-character PAN"
                    maxLength="10"
                  />
                ) : (
                  <span>{profile.pan || 'Not provided'}</span>
                )}
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