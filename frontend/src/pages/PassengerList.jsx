import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { bookingAPI } from '../services/api';
import '../styles/vintage-erp-theme.css';
import '../styles/dynamic-admin-panel.css';

const PassengerList = () => {
  const { user } = useAuth();
  const [passengers, setPassengers] = useState([]);
  const [filteredPassengers, setFilteredPassengers] = useState([]);
  const [selectedPassenger, setSelectedPassenger] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({
    passengerName: '',
    bookingId: '',
    travelDate: '',
    gender: ''
  });
  const [formData, setFormData] = useState({
    ps_name: '',
    ps_age: '',
    ps_gender: '',
    ps_nationality: '',
    ps_address: '',
    ps_phone: '',
    ps_email: '',
    bk_bookingid: '',
    ps_birth_preference: ''
  });

  // Mock data for demonstration
  const mockPassengers = [
    { ps_passengerid: 'PSG001', ps_name: 'RAJESH KUMAR', ps_age: 32, ps_gender: 'MALE', ps_nationality: 'INDIAN', ps_address: '123 MG ROAD, NEW DELHI', ps_phone: '9876543210', ps_email: 'rajesh@example.com', bk_bookingid: 'BK123456789', ps_birth_preference: 'UPPER', ps_enteredon: '2024-01-15', ps_enteredby: 'ADMIN001', ps_modifiedon: '', ps_modifiedby: '', ps_closedon: '', ps_closedby: '' },
    { ps_passengerid: 'PSG002', ps_name: 'PRIYA SHARMA', ps_age: 28, ps_gender: 'FEMALE', ps_nationality: 'INDIAN', ps_address: '456 CONNAUGHT PLACE, NEW DELHI', ps_phone: '9876543211', ps_email: 'priya@example.com', bk_bookingid: 'BK123456790', ps_birth_preference: 'LOWER', ps_enteredon: '2024-01-16', ps_enteredby: 'ADMIN001', ps_modifiedon: '', ps_modifiedby: '', ps_closedon: '', ps_closedby: '' },
    { ps_passengerid: 'PSG003', ps_name: 'VIKRAM SINGH', ps_age: 45, ps_gender: 'MALE', ps_nationality: 'INDIAN', ps_address: '789 JANPATH, NEW DELHI', ps_phone: '9876543212', ps_email: 'vikram@example.com', bk_bookingid: 'BK123456791', ps_birth_preference: 'MIDDLE', ps_enteredon: '2024-01-17', ps_enteredby: 'ADMIN002', ps_modifiedon: '2024-01-18', ps_modifiedby: 'ADMIN001', ps_closedon: '', ps_closedby: '' },
    { ps_passengerid: 'PSG004', ps_name: 'SUNITA DEVI', ps_age: 52, ps_gender: 'FEMALE', ps_nationality: 'INDIAN', ps_address: '321 OLD RAJENDRA NAGAR, NEW DELHI', ps_phone: '9876543213', ps_email: 'sunita@example.com', bk_bookingid: 'BK123456792', ps_birth_preference: 'SIDE UPPER', ps_enteredon: '2024-01-18', ps_enteredby: 'ADMIN002', ps_modifiedon: '', ps_modifiedby: '', ps_closedon: '', ps_closedby: '' },
    { ps_passengerid: 'PSG005', ps_name: 'ARJUN MEHTA', ps_age: 35, ps_gender: 'MALE', ps_nationality: 'INDIAN', ps_address: '654 GREATER KAILASH, NEW DELHI', ps_phone: '9876543214', ps_email: 'arjun@example.com', bk_bookingid: 'BK123456793', ps_birth_preference: 'SIDE LOWER', ps_enteredon: '2024-01-19', ps_enteredby: 'ADMIN001', ps_modifiedon: '', ps_modifiedby: '', ps_closedon: '', ps_closedby: '' },
  ];

  useEffect(() => {
    // Load mock data for demonstration
    setPassengers(mockPassengers);
    setFilteredPassengers(mockPassengers);
  }, []);

  // Apply filters
  useEffect(() => {
    let result = [...passengers];
    
    if (filters.passengerName) {
      result = result.filter(p => 
        p.ps_name.toLowerCase().includes(filters.passengerName.toLowerCase())
      );
    }
    
    if (filters.bookingId) {
      result = result.filter(p => 
        p.bk_bookingid.toLowerCase().includes(filters.bookingId.toLowerCase())
      );
    }
    
    if (filters.travelDate) {
      // For mock data, we don't have travel date in passenger, so we'll skip this filter
    }
    
    if (filters.gender) {
      result = result.filter(p => 
        p.ps_gender.toLowerCase().includes(filters.gender.toLowerCase())
      );
    }
    
    setFilteredPassengers(result);
  }, [filters, passengers]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNew = () => {
    setFormData({
      ps_name: '',
      ps_age: '',
      ps_gender: '',
      ps_nationality: '',
      ps_address: '',
      ps_phone: '',
      ps_email: '',
      bk_bookingid: '',
      ps_birth_preference: ''
    });
    setIsEditing(false);
    setShowForm(true);
  };

  const handleEdit = (passenger) => {
    setFormData({
      ps_passengerid: passenger.ps_passengerid,
      ps_name: passenger.ps_name,
      ps_age: passenger.ps_age,
      ps_gender: passenger.ps_gender,
      ps_nationality: passenger.ps_nationality,
      ps_address: passenger.ps_address,
      ps_phone: passenger.ps_phone,
      ps_email: passenger.ps_email,
      bk_bookingid: passenger.bk_bookingid,
      ps_birth_preference: passenger.ps_birth_preference
    });
    setSelectedPassenger(passenger);
    setIsEditing(true);
    setShowForm(true);
  };

  const handleDelete = (passengerId) => {
    if (window.confirm(`Are you sure you want to delete passenger ${passengerId}?`)) {
      setPassengers(prev => prev.filter(p => p.ps_passengerid !== passengerId));
      setFilteredPassengers(prev => prev.filter(p => p.ps_passengerid !== passengerId));
    }
  };

  const handleSave = () => {
    if (isEditing) {
      // Update existing passenger
      setPassengers(prev => 
        prev.map(p => 
          p.ps_passengerid === formData.ps_passengerid 
            ? { ...formData, ps_modifiedon: new Date().toISOString().split('T')[0], ps_modifiedby: user?.us_usid || 'ADMIN' }
            : p
        )
      );
    } else {
      // Add new passenger
      const newPassenger = {
        ...formData,
        ps_passengerid: `PSG${String(passengers.length + 1).padStart(3, '0')}`,
        ps_enteredon: new Date().toISOString().split('T')[0],
        ps_enteredby: user?.us_usid || 'ADMIN'
      };
      setPassengers(prev => [...prev, newPassenger]);
    }
    
    setShowForm(false);
    setFormData({
      ps_name: '',
      ps_age: '',
      ps_gender: '',
      ps_nationality: '',
      ps_address: '',
      ps_phone: '',
      ps_email: '',
      bk_bookingid: '',
      ps_birth_preference: ''
    });
  };

  const handleCancel = () => {
    setShowForm(false);
    setFormData({
      ps_name: '',
      ps_age: '',
      ps_gender: '',
      ps_nationality: '',
      ps_address: '',
      ps_phone: '',
      ps_email: '',
      bk_bookingid: '',
      ps_birth_preference: ''
    });
  };

  return (
    <div className="erp-admin-container">
      {/* Menu Bar */}
      <div className="erp-menu-bar">
        <div className="erp-menu-item">← Start</div>
        <div className="erp-menu-item">System</div>
        <div className="erp-menu-item">File</div>
        <div className="erp-menu-item">Edit</div>
        <div className="erp-menu-item">View</div>
        <div className="erp-menu-item">Tools</div>
        <div className="erp-menu-item">Help</div>
        <div className="erp-user-info">ADMINISTRATOR ⚙</div>
      </div>

      {/* Toolbar */}
      <div className="erp-toolbar">
        <button className="erp-tool-button" onClick={handleNew}>New</button>
        <button className="erp-tool-button" onClick={() => showForm && handleSave()} disabled={!showForm}>Save</button>
        <button className="erp-tool-button" onClick={() => showForm && handleCancel()} disabled={!showForm}>Cancel</button>
        <div className="erp-tool-separator"></div>
        <button className="erp-tool-button" onClick={() => {}} disabled={!selectedPassenger}>Edit</button>
        <button className="erp-tool-button" onClick={() => selectedPassenger && handleDelete(selectedPassenger.ps_passengerid)} disabled={!selectedPassenger}>Delete</button>
        <div className="erp-tool-separator"></div>
        <button className="erp-tool-button" onClick={() => {}}>Refresh</button>
        <button className="erp-tool-button" onClick={() => {}}>Export</button>
        <button className="erp-tool-button" onClick={() => {}}>Print</button>
        <div className="erp-tool-separator"></div>
      </div>

      {/* Main Content */}
      <div className="erp-main-content">
        {/* Form Section */}
        {showForm && (
          <div className="erp-form-section">
            <div className="erp-panel-header">Passenger Details</div>
            <div style={{ padding: '10px' }}>
              <div className="erp-form-grid">
                <label className="erp-form-label">Passenger ID</label>
                <input
                  type="text"
                  className="erp-input"
                  value={formData.ps_passengerid || ''}
                  onChange={(e) => handleFormChange('ps_passengerid', e.target.value)}
                  readOnly={isEditing}
                  placeholder="Auto-generated"
                />
                
                <label className="erp-form-label required">Passenger Name</label>
                <input
                  type="text"
                  className="erp-input"
                  value={formData.ps_name}
                  onChange={(e) => handleFormChange('ps_name', e.target.value)}
                  placeholder="Enter passenger name"
                />
                
                <label className="erp-form-label required">Age</label>
                <input
                  type="number"
                  className="erp-input"
                  value={formData.ps_age}
                  onChange={(e) => handleFormChange('ps_age', e.target.value)}
                  placeholder="Enter age"
                />
                
                <label className="erp-form-label required">Gender</label>
                <select
                  className="erp-input"
                  value={formData.ps_gender}
                  onChange={(e) => handleFormChange('ps_gender', e.target.value)}
                >
                  <option value="">Select Gender</option>
                  <option value="MALE">MALE</option>
                  <option value="FEMALE">FEMALE</option>
                  <option value="OTHER">OTHER</option>
                </select>
                
                <label className="erp-form-label">Nationality</label>
                <input
                  type="text"
                  className="erp-input"
                  value={formData.ps_nationality}
                  onChange={(e) => handleFormChange('ps_nationality', e.target.value)}
                  placeholder="Enter nationality"
                />
                
                <label className="erp-form-label">Address</label>
                <textarea
                  className="erp-input"
                  value={formData.ps_address}
                  onChange={(e) => handleFormChange('ps_address', e.target.value)}
                  placeholder="Enter address"
                  rows="2"
                ></textarea>
                
                <label className="erp-form-label">Phone</label>
                <input
                  type="text"
                  className="erp-input"
                  value={formData.ps_phone}
                  onChange={(e) => handleFormChange('ps_phone', e.target.value)}
                  placeholder="Enter phone number"
                />
                
                <label className="erp-form-label">Email</label>
                <input
                  type="email"
                  className="erp-input"
                  value={formData.ps_email}
                  onChange={(e) => handleFormChange('ps_email', e.target.value)}
                  placeholder="Enter email address"
                />
                
                <label className="erp-form-label required">Booking ID</label>
                <input
                  type="text"
                  className="erp-input"
                  value={formData.bk_bookingid}
                  onChange={(e) => handleFormChange('bk_bookingid', e.target.value)}
                  placeholder="Enter booking ID"
                />
                
                <label className="erp-form-label">Birth Preference</label>
                <select
                  className="erp-input"
                  value={formData.ps_birth_preference}
                  onChange={(e) => handleFormChange('ps_birth_preference', e.target.value)}
                >
                  <option value="">Select Birth</option>
                  <option value="UPPER">UPPER</option>
                  <option value="MIDDLE">MIDDLE</option>
                  <option value="LOWER">LOWER</option>
                  <option value="SIDE UPPER">SIDE UPPER</option>
                  <option value="SIDE LOWER">SIDE LOWER</option>
                </select>
              </div>

              {/* Audit Trail Section */}
              <div className="erp-audit-section">
                <div className="erp-panel-header">Audit Trail</div>
                <div className="erp-audit-row">
                  <label className="erp-audit-label">Entered On</label>
                  <input 
                    type="text" 
                    className="erp-audit-input" 
                    value={isEditing ? selectedPassenger?.ps_enteredon || '' : new Date().toISOString().split('T')[0]} 
                    readOnly 
                  />
                  <label className="erp-audit-label">Entered By</label>
                  <input 
                    type="text" 
                    className="erp-audit-input" 
                    value={isEditing ? selectedPassenger?.ps_enteredby || '' : user?.us_usid || 'ADMIN'} 
                    readOnly 
                  />
                </div>
                <div className="erp-audit-row">
                  <label className="erp-audit-label">Modified On</label>
                  <input 
                    type="text" 
                    className="erp-audit-input" 
                    value={isEditing ? selectedPassenger?.ps_modifiedon || '' : ''} 
                    readOnly 
                  />
                  <label className="erp-audit-label">Modified By</label>
                  <input 
                    type="text" 
                    className="erp-audit-input" 
                    value={isEditing ? selectedPassenger?.ps_modifiedby || '' : ''} 
                    readOnly 
                  />
                </div>
                <div className="erp-audit-row">
                  <label className="erp-audit-label">Closed On</label>
                  <input 
                    type="text" 
                    className="erp-audit-input" 
                    value={selectedPassenger?.ps_closedon || ''} 
                    readOnly 
                  />
                  <label className="erp-audit-label">Closed By</label>
                  <input 
                    type="text" 
                    className="erp-audit-input" 
                    value={selectedPassenger?.ps_closedby || ''} 
                    readOnly 
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Grid Section */}
        <div className="erp-grid-section">
          <div className="erp-panel-header">Passenger List</div>
          <div className="erp-grid-container">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Passenger ID</th>
                  <th>Name</th>
                  <th>Age</th>
                  <th>Gender</th>
                  <th>Nationality</th>
                  <th>Booking ID</th>
                  <th>Birth Pref</th>
                  <th>Phone</th>
                </tr>
              </thead>
              <tbody>
                {filteredPassengers.map((passenger, index) => (
                  <tr 
                    key={index} 
                    className={selectedPassenger?.ps_passengerid === passenger.ps_passengerid ? 'selected' : ''}
                    onClick={() => setSelectedPassenger(passenger)}
                  >
                    <td>{passenger.ps_passengerid}</td>
                    <td>{passenger.ps_name}</td>
                    <td>{passenger.ps_age}</td>
                    <td>{passenger.ps_gender}</td>
                    <td>{passenger.ps_nationality}</td>
                    <td>{passenger.bk_bookingid}</td>
                    <td>{passenger.ps_birth_preference}</td>
                    <td>{passenger.ps_phone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Filter Panel */}
        <div className="erp-filter-panel">
          <div className="erp-filter-header">Filters</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <label className="erp-form-label">Passenger Name</label>
              <input
                type="text"
                className="erp-input"
                value={filters.passengerName}
                onChange={(e) => handleFilterChange('passengerName', e.target.value)}
                placeholder="Filter by name"
              />
            </div>
            
            <div>
              <label className="erp-form-label">Booking ID</label>
              <input
                type="text"
                className="erp-input"
                value={filters.bookingId}
                onChange={(e) => handleFilterChange('bookingId', e.target.value)}
                placeholder="Filter by booking"
              />
            </div>
            
            <div>
              <label className="erp-form-label">Gender</label>
              <select
                className="erp-input"
                value={filters.gender}
                onChange={(e) => handleFilterChange('gender', e.target.value)}
              >
                <option value="">All Genders</option>
                <option value="MALE">MALE</option>
                <option value="FEMALE">FEMALE</option>
                <option value="OTHER">OTHER</option>
              </select>
            </div>
            
            <button 
              className="erp-button" 
              onClick={() => setFilters({ passengerName: '', bookingId: '', travelDate: '', gender: '' })}
              style={{ marginTop: '10px' }}
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="erp-status-bar">
        <div className="erp-status-item">Records: {filteredPassengers.length}</div>
        <div className="erp-status-item">Selected: {selectedPassenger ? selectedPassenger.ps_passengerid : 'None'}</div>
        <div className="erp-status-item">User: {user?.us_name || user?.us_usid || 'ADMIN'}</div>
        <div className="erp-status-item">Role: {user?.us_usertype || 'ADMIN'}</div>
        <div className="status-panel">YatraSathi Passenger Management</div>
      </div>
    </div>
  );
};

export default PassengerList;