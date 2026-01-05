import React, { useState } from 'react';
import '../styles/vintage-erp-theme.css';
import '../styles/classic-enterprise-global.css';
import '../styles/vintage-admin-panel.css';
import '../styles/dynamic-admin-panel.css';
import '../styles/vintage-erp-global.css';

const Profile = () => {
  const [profile, setProfile] = useState({
    name: 'John Doe',
    email: 'john@example.com',
    phone: '9876543210',
    aadhaar: '123456789012',
    userType: 'customer'
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...profile });
  
  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const onSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Update profile logic would go here
      console.log('Profile update attempt with:', formData);
      
      // Update profile state
      setProfile(formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Profile update error:', error);
    }
  };
  
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
                  <label className="form-label">Name:</label>
                  <span className="form-input" style={{ background: '#f0f0f0', color: '#000' }}>
                    {profile.name}
                  </span>

                  <label className="form-label">Email:</label>
                  <span className="form-input" style={{ background: '#f0f0f0', color: '#000' }}>
                    {profile.email}
                  </span>

                  <label className="form-label">Phone:</label>
                  <span className="form-input" style={{ background: '#f0f0f0', color: '#000' }}>
                    {profile.phone}
                  </span>

                  <label className="form-label">Aadhaar:</label>
                  <span className="form-input" style={{ background: '#f0f0f0', color: '#000' }}>
                    {profile.aadhaar}
                  </span>

                  <label className="form-label">User Type:</label>
                  <span className="form-input" style={{ background: '#f0f0f0', color: '#000' }}>
                    {profile.userType}
                  </span>
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
                    <label htmlFor="name" className="form-label required">Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={onChange}
                      required
                      className="form-input"
                    />

                    <label htmlFor="email" className="form-label required">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={onChange}
                      required
                      className="form-input"
                    />

                    <label htmlFor="phone" className="form-label required">Phone</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={onChange}
                      required
                      className="form-input"
                    />

                    <label htmlFor="aadhaar" className="form-label required">Aadhaar</label>
                    <input
                      type="text"
                      id="aadhaar"
                      name="aadhaar"
                      value={formData.aadhaar}
                      onChange={onChange}
                      required
                      className="form-input"
                    />

                    <label htmlFor="userType" className="form-label">User Type</label>
                    <select
                      id="userType"
                      name="userType"
                      value={formData.userType}
                      onChange={onChange}
                      className="form-input"
                    >
                      <option value="customer">Customer</option>
                      <option value="employee">Employee</option>
                      <option value="admin">Admin</option>
                    </select>
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
        <div className="status-item">User: {profile.name}</div>
        <div className="status-panel">Ready</div>
      </div>
    </div>
  );
};

export default Profile;