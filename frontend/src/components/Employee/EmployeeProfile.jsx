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
      // The backend returns { success: true, data: profile }
      const profileData = response.success ? response.data : response;
      setProfile(profileData);
      setFormData(profileData);
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
      // Map formData to backend field names
      const updateData = {
        firstName: formData.firstName || formData.us_fname,
        lastName: formData.lastName || formData.us_lname,
        email: formData.email || formData.us_email,
        phone: formData.phone || formData.us_phone,
        address: formData.address || formData.us_addr1,
        city: formData.city || formData.us_city,
        state: formData.state || formData.us_state,
        pincode: formData.pincode || formData.us_pin,
        aadhaar: formData.aadhaar || formData.us_aadhaar,
        pan: formData.pan || formData.us_pan
      };
      
      const response = await profileAPI.updateProfile(updateData);
      await fetchProfile(); // Refresh profile
      setIsEditing(false);
    } catch (error) {
      console.error('Profile update error:', error);
      setError(error.message || 'Failed to update profile');
    }
  };

  const displayName = (p) => {
    const fname = p.firstName || p.us_fname || '';
    const lname = p.lastName || p.us_lname || '';
    return fname && lname ? `${fname} ${lname}` : fname || lname || 'N/A';
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
                  <span>{displayName(profile)}</span>
                </div>
                <div className="info-group">
                  <label>Email:</label>
                  <span>{profile.email || profile.us_email || 'N/A'}</span>
                </div>
                <div className="info-group">
                  <label>Phone:</label>
                  <span>{profile.phone || profile.us_phone || 'N/A'}</span>
                </div>
                <div className="info-group">
                  <label>Role:</label>
                  <span>{profile.roleId || profile.us_roid || 'N/A'}</span>
                </div>
                <div className="info-group">
                  <label>Department:</label>
                  <span>{profile.employee?.em_dept || 'N/A'}</span>
                </div>
                {profile.employee?.em_empno && (
                  <div className="info-group">
                    <label>Employee ID:</label>
                    <span>{profile.employee.em_empno}</span>
                  </div>
                )}
                {profile.employee?.em_joindt && (
                  <div className="info-group">
                    <label>Join Date:</label>
                    <span>{new Date(profile.employee.em_joindt).toLocaleDateString()}</span>
                  </div>
                )}
                {profile.employee?.em_status && (
                  <div className="info-group">
                    <label>Status:</label>
                    <span>{profile.employee.em_status}</span>
                  </div>
                )}
                <div className="info-group">
                  <label>User Type:</label>
                  <span>{profile.userType || profile.us_usertype || 'N/A'}</span>
                </div>
              </div>
              
              <div className="audit-info">
                <h3>Audit Information</h3>
                <div className="info-group">
                  <label>Created Timestamp:</label>
                  <span>{profile.createdAt || profile.us_cdtm ? new Date(profile.createdAt || profile.us_cdtm).toLocaleString() : 'N/A'}</span>
                </div>
                <div className="info-group">
                  <label>Created By:</label>
                  <span>{profile.createdBy || profile.us_eby || 'N/A'}</span>
                </div>
                <div className="info-group">
                  <label>Updated Timestamp:</label>
                  <span>{profile.updatedAt || profile.us_mdtm ? new Date(profile.updatedAt || profile.us_mdtm).toLocaleString() : 'N/A'}</span>
                </div>
                <div className="info-group">
                  <label>Updated By:</label>
                  <span>{profile.updatedBy || profile.us_mby || 'N/A'}</span>
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
                    <label htmlFor="firstName">First Name:</label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName || formData.us_fname || ''}
                      onChange={onChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="lastName">Last Name:</label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName || formData.us_lname || ''}
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
                      value={formData.email || formData.us_email || ''}
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
                      value={formData.phone || formData.us_phone || ''}
                      onChange={onChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="address">Address:</label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address || formData.us_addr1 || ''}
                      onChange={onChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="city">City:</label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city || formData.us_city || ''}
                      onChange={onChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="state">State:</label>
                    <input
                      type="text"
                      id="state"
                      name="state"
                      value={formData.state || formData.us_state || ''}
                      onChange={onChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="pincode">Pincode:</label>
                    <input
                      type="text"
                      id="pincode"
                      name="pincode"
                      value={formData.pincode || formData.us_pin || ''}
                      onChange={onChange}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="roleId">Role:</label>
                    <input
                      type="text"
                      id="roleId"
                      name="roleId"
                      value={formData.roleId || formData.us_roid || ''}
                      readOnly
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="userType">User Type:</label>
                    <input
                      type="text"
                      id="userType"
                      name="userType"
                      value={formData.userType || formData.us_usertype || ''}
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