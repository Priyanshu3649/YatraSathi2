import React, { useState } from 'react';

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
    <div className="profile panel">
      <h2 className="panel-header">Profile</h2>
      
      {!isEditing ? (
        <div className="profile-view">
          <div className="form-group">
            <label className="form-label">Name:</label>
            <span>{profile.name}</span>
          </div>
          <div className="form-group">
            <label className="form-label">Email:</label>
            <span>{profile.email}</span>
          </div>
          <div className="form-group">
            <label className="form-label">Phone:</label>
            <span>{profile.phone}</span>
          </div>
          <div className="form-group">
            <label className="form-label">Aadhaar:</label>
            <span>{profile.aadhaar}</span>
          </div>
          <div className="form-group">
            <label className="form-label">User Type:</label>
            <span>{profile.userType}</span>
          </div>
          <div className="form-group">
            <button className="btn btn-primary" onClick={() => setIsEditing(true)}>Edit Profile</button>
          </div>
        </div>
      ) : (
        <div className="profile-edit">
          <form onSubmit={onSubmit}>
            <div className="form-group">
              <label htmlFor="name" className="form-label">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={onChange}
                required
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={onChange}
                required
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label htmlFor="phone" className="form-label">Phone</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={onChange}
                required
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label htmlFor="aadhaar" className="form-label">Aadhaar</label>
              <input
                type="text"
                id="aadhaar"
                name="aadhaar"
                value={formData.aadhaar}
                onChange={onChange}
                required
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label htmlFor="userType" className="form-label">User Type</label>
              <select
                id="userType"
                name="userType"
                value={formData.userType}
                onChange={onChange}
                className="form-control"
              >
                <option value="customer">Customer</option>
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="form-group">
              <button type="submit" className="btn btn-primary">Update Profile</button>
              <button type="button" className="btn ml-2" onClick={() => setIsEditing(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Profile;