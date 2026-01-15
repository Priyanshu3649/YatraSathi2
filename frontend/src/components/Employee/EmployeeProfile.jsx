import React, { useState, useEffect } from 'react';
import { profileAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const EmployeeProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  const { user: authUser } = useAuth();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await profileAPI.getProfile();
      setProfile(response.data);
      setFormData(response.data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load profile');
      console.error('Profile fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await profileAPI.updateProfile(formData);
      setProfile(response.data);
      setFormData(response.data);
      setIsEditing(false);
    } catch (error) {
      console.error('Profile update error:', error);
      setError(error.message || 'Failed to update profile');
    }
  };

  if (loading) {
    return (
      <div className="employee-profile-container">
        <div className="loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="employee-profile-container">
        <div className="error-message">Error: {error}</div>
        <button className="btn btn-primary" onClick={fetchProfile}>Retry</button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="employee-profile-container">
        <div className="error-message">No profile data found</div>
      </div>
    );
  }

  return (
    <div className="employee-profile-container">
      <div className="profile-header">
        <h2>Employee Profile</h2>
        <div className="profile-actions">
          <button 
            className={`btn ${isEditing ? 'btn-secondary' : 'btn-primary'}`} 
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>
      </div>

      <div className="profile-content">
        {!isEditing ? (
          <div className="profile-view">
            <div className="profile-card">
              <div className="profile-info">
                <div className="info-group">
                  <label>Name:</label>
                  <span>{profile.name}</span>
                </div>
                <div className="info-group">
                  <label>Email:</label>
                  <span>{profile.email}</span>
                </div>
                <div className="info-group">
                  <label>Phone:</label>
                  <span>{profile.phone}</span>
                </div>
                <div className="info-group">
                  <label>Role:</label>
                  <span>{profile.role}</span>
                </div>
                <div className="info-group">
                  <label>Department:</label>
                  <span>{profile.department}</span>
                </div>
                {profile.employeeId && (
                  <div className="info-group">
                    <label>Employee ID:</label>
                    <span>{profile.employeeId}</span>
                  </div>
                )}
                {profile.joinDate && (
                  <div className="info-group">
                    <label>Join Date:</label>
                    <span>{profile.joinDate}</span>
                  </div>
                )}
                {profile.status && (
                  <div className="info-group">
                    <label>Status:</label>
                    <span>{profile.status}</span>
                  </div>
                )}
                <div className="info-group">
                  <label>User Type:</label>
                  <span>{profile.userType}</span>
                </div>
              </div>
              
              <div className="audit-info">
                <h3>Audit Information</h3>
                <div className="info-group">
                  <label>Created Timestamp:</label>
                  <span>{profile.createdTimestamp || 'N/A'}</span>
                </div>
                <div className="info-group">
                  <label>Created By:</label>
                  <span>{profile.createdBy || 'N/A'}</span>
                </div>
                <div className="info-group">
                  <label>Updated Timestamp:</label>
                  <span>{profile.updatedTimestamp || 'N/A'}</span>
                </div>
                <div className="info-group">
                  <label>Updated By:</label>
                  <span>{profile.updatedBy || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="profile-edit">
            <form onSubmit={onSubmit}>
              <div className="profile-card">
                <div className="profile-info">
                  <div className="form-group">
                    <label htmlFor="name">Name:</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name || ''}
                      onChange={onChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="email">Email:</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email || ''}
                      onChange={onChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="phone">Phone:</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone || ''}
                      onChange={onChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="role">Role:</label>
                    <input
                      type="text"
                      id="role"
                      name="role"
                      value={formData.role || ''}
                      onChange={onChange}
                      readOnly
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="department">Department:</label>
                    <input
                      type="text"
                      id="department"
                      name="department"
                      value={formData.department || ''}
                      onChange={onChange}
                      readOnly
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="userType">User Type:</label>
                    <input
                      type="text"
                      id="userType"
                      name="userType"
                      value={formData.userType || ''}
                      onChange={onChange}
                      readOnly
                    />
                  </div>
                </div>
                
                <div className="form-actions">
                  <button type="submit" className="btn btn-success">Update Profile</button>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeProfile;