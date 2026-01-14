import React, { useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import '../styles/vintage-erp-theme.css';
import '../styles/classic-enterprise-global.css';
import '../styles/vintage-admin-panel.css';
import '../styles/dynamic-admin-panel.css';
import '../styles/vintage-erp-global.css';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  useEffect(() => {
    fetchProfile();
  }, []);
  
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await authAPI.getProfile();
      setProfile(data);
      setFormData({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        aadhaar: data.aadhaar,
        pan: data.pan,
        address: data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode
      });
    } catch (err) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };
  
  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      setIsUploading(true);
      
      // Preview the image
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      
      // Upload the image
      const result = await authAPI.uploadProfileImage(file);
      
      // Refresh profile data to get the new image URL
      await fetchProfile();
      
      setImagePreview(null);
    } catch (error) {
      console.error('Image upload error:', error);
      setError(error.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };
  
  const onSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await authAPI.updateProfile(formData);
      
      // Update profile state
      setProfile(prev => ({
        ...prev,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        aadhaar: formData.aadhaar,
        pan: formData.pan,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode
      }));
      
      setIsEditing(false);
    } catch (error) {
      console.error('Profile update error:', error);
      setError(error.message || 'Failed to update profile');
    }
  };
  
  if (loading) {
    return (
      <div className="erp-admin-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="erp-admin-container">
        <div className="error-container">
          <h3>Error Loading Profile</h3>
          <p>{error}</p>
          <button onClick={fetchProfile} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="erp-admin-container">
      {/* Title Bar */}
      <div className="title-bar">
        <div className="system-menu">👤</div>
        <div className="title-text">User Profile Management System</div>
        <div className="close-button">×</div>
      </div>

      {/* Menu Bar */}
      <div className="menu-bar">
        <div className="menu-item">File</div>
        <div className="menu-item">Edit</div>
        <div className="menu-item">View</div>
        <div className="menu-item">Profile</div>
        <div className="menu-item">Security</div>
        <div className="menu-item">Help</div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <button className="tool-button" onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? 'Cancel' : 'Edit'}
        </button>
        <div className="tool-separator"></div>
        <button className="tool-button">Save</button>
        <button className="tool-button">Reset</button>
        <div className="tool-separator"></div>
        <button className="tool-button">Change Password</button>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Left Navigation Panel */}
        <div className="nav-panel">
          <div className="nav-header">Profile Sections</div>
          <div className="nav-item active">Personal Info</div>
          <div className="nav-item">Contact Details</div>
          <div className="nav-item">Account Settings</div>
          <div className="nav-item">Security</div>
          <div className="nav-item">Preferences</div>
        </div>

        {/* Work Area */}
        <div className="work-area">
          {/* Form Panel */}
          <div className="form-panel">
            <div className="panel-header">User Profile Information</div>
            
            {!isEditing ? (
              <div className="profile-view">
                <div className="form-grid">
                  <label className="form-label">First Name:</label>
                  <span className="form-input" style={{ background: '#f0f0f0', color: '#000' }}>
                    {profile?.firstName}
                  </span>

                  <label className="form-label">Last Name:</label>
                  <span className="form-input" style={{ background: '#f0f0f0', color: '#000' }}>
                    {profile?.lastName}
                  </span>

                  <label className="form-label">Email:</label>
                  <span className="form-input" style={{ background: '#f0f0f0', color: '#000' }}>
                    {profile?.email}
                  </span>

                  <label className="form-label">Phone:</label>
                  <span className="form-input" style={{ background: '#f0f0f0', color: '#000' }}>
                    {profile?.phone}
                  </span>

                  <label className="form-label">Aadhaar:</label>
                  <span className="form-input" style={{ background: '#f0f0f0', color: '#000' }}>
                    {profile?.aadhaar}
                  </span>

                  <label className="form-label">PAN:</label>
                  <span className="form-input" style={{ background: '#f0f0f0', color: '#000' }}>
                    {profile?.pan}
                  </span>

                  <label className="form-label">User Type:</label>
                  <span className="form-input" style={{ background: '#f0f0f0', color: '#000' }}>
                    {profile?.userType}
                  </span>

                  <label className="form-label">Address:</label>
                  <span className="form-input" style={{ background: '#f0f0f0', color: '#000' }}>
                    {profile?.address}
                  </span>

                  <label className="form-label">City:</label>
                  <span className="form-input" style={{ background: '#f0f0f0', color: '#000' }}>
                    {profile?.city}
                  </span>

                  <label className="form-label">State:</label>
                  <span className="form-input" style={{ background: '#f0f0f0', color: '#000' }}>
                    {profile?.state}
                  </span>

                  <label className="form-label">Pincode:</label>
                  <span className="form-input" style={{ background: '#f0f0f0', color: '#000' }}>
                    {profile?.pincode}
                  </span>
                </div>

                <div className="profile-image-section">
                  <div className="profile-image-preview">
                    {profile?.photo ? (
                      <img 
                        src={`${profile.photo}`} 
                        alt="Profile" 
                        className="profile-image"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/placeholder-profile.png';
                        }}
                      />
                    ) : (
                      <div className="profile-image-placeholder">
                        <span>{profile?.firstName?.charAt(0) || 'U'}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="audit-section">
                  <div className="audit-row">
                    <label className="audit-label">Created By:</label>
                    <input type="text" value="System" className="audit-input" readOnly />
                    <label className="audit-label">Created Date:</label>
                    <input type="text" value="2024-01-01" className="audit-input" readOnly />
                  </div>
                  <div className="audit-row">
                    <label className="audit-label">Modified By:</label>
                    <input type="text" value="Admin" className="audit-input" readOnly />
                    <label className="audit-label">Modified Date:</label>
                    <input type="text" value="2024-01-03" className="audit-input" readOnly />
                  </div>
                </div>

                <div className="form-actions">
                  <button className="tool-button" onClick={() => setIsEditing(true)}>
                    Edit Profile
                  </button>
                </div>
              </div>
            ) : (
              <div className="profile-edit">
                <form onSubmit={onSubmit}>
                  <div className="form-grid">
                    <label htmlFor="firstName" className="form-label required">First Name</label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName || ''}
                      onChange={onChange}
                      required
                      className="form-input"
                    />

                    <label htmlFor="lastName" className="form-label">Last Name</label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName || ''}
                      onChange={onChange}
                      className="form-input"
                    />

                    <label htmlFor="email" className="form-label required">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email || ''}
                      onChange={onChange}
                      required
                      className="form-input"
                    />

                    <label htmlFor="phone" className="form-label required">Phone</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone || ''}
                      onChange={onChange}
                      required
                      className="form-input"
                    />

                    <label htmlFor="aadhaar" className="form-label">Aadhaar</label>
                    <input
                      type="text"
                      id="aadhaar"
                      name="aadhaar"
                      value={formData.aadhaar || ''}
                      onChange={onChange}
                      className="form-input"
                    />

                    <label htmlFor="pan" className="form-label">PAN</label>
                    <input
                      type="text"
                      id="pan"
                      name="pan"
                      value={formData.pan || ''}
                      onChange={onChange}
                      className="form-input"
                    />

                    <label htmlFor="address" className="form-label">Address</label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address || ''}
                      onChange={onChange}
                      className="form-input"
                    />

                    <label htmlFor="city" className="form-label">City</label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city || ''}
                      onChange={onChange}
                      className="form-input"
                    />

                    <label htmlFor="state" className="form-label">State</label>
                    <input
                      type="text"
                      id="state"
                      name="state"
                      value={formData.state || ''}
                      onChange={onChange}
                      className="form-input"
                    />

                    <label htmlFor="pincode" className="form-label">Pincode</label>
                    <input
                      type="text"
                      id="pincode"
                      name="pincode"
                      value={formData.pincode || ''}
                      onChange={onChange}
                      className="form-input"
                    />
                  </div>

                  <div className="profile-upload-section">
                    <div className="profile-image-upload">
                      <label className="upload-label">
                        Profile Photo
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="file-input"
                          disabled={isUploading}
                        />
                        {isUploading ? (
                          <div className="upload-progress">
                            <span>Uploading...</span>
                          </div>
                        ) : (
                          <div className="upload-button">
                            <span>Select Image</span>
                          </div>
                        )}
                      </label>
                      {imagePreview && (
                        <div className="image-preview">
                          <img src={imagePreview} alt="Preview" className="preview-image" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="audit-section">
                    <div className="audit-row">
                      <label className="audit-label">Created By:</label>
                      <input type="text" value="System" className="audit-input" readOnly />
                      <label className="audit-label">Created Date:</label>
                      <input type="text" value="2024-01-01" className="audit-input" readOnly />
                    </div>
                    <div className="audit-row">
                      <label className="audit-label">Modified By:</label>
                      <input type="text" value="Admin" className="audit-input" readOnly />
                      <label className="audit-label">Modified Date:</label>
                      <input type="text" value="2024-01-03" className="audit-input" readOnly />
                    </div>
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="tool-button">Update Profile</button>
                    <button type="button" className="tool-button" onClick={() => setIsEditing(false)}>Cancel</button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="status-bar">
        <div className="status-item">Mode: {isEditing ? 'Edit' : 'View'}</div>
        <div className="status-item">User: {profile?.firstName} {profile?.lastName}</div>
        <div className="status-panel">Ready</div>
      </div>
    </div>
  );
};

export default Profile;