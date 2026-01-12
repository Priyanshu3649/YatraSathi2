import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { employeeAPI, authAPI } from '../services/api';
import '../styles/layout.css';
import '../styles/vintage-erp-theme.css';
import '../styles/classic-enterprise-global.css';
import '../styles/vintage-admin-panel.css';
import '../styles/dynamic-admin-panel.css';
import '../styles/vintage-erp-global.css';

const EmployeeManagement = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: 'employee123', // Default password
    aadhaarNumber: '',
    department: '',
    roleId: '', // Changed from designation to roleId for role-based access
    salary: '',
    joinDate: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    photo: null
  });

  // Load employees
  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const data = await employeeAPI.getAllEmployees();
      setEmployees(data);
    } catch (err) {
      setError('Failed to load employees');
      console.error(err);
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

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        photo: file
      });
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const submitData = {
        ...formData,
        // Map form fields to backend expected fields
        us_fname: formData.name.split(' ')[0] || formData.name,
        us_lname: formData.name.split(' ').slice(1).join(' ') || '',
        us_email: formData.email,
        us_phone: formData.phone,
        us_aadhaar: formData.aadhaarNumber,
        em_dept: formData.department,
        us_roid: formData.roleId, // Use roleId instead of designation
        em_salary: formData.salary,
        em_joindt: formData.joinDate,
        em_address: formData.address,
        em_city: formData.city,
        em_state: formData.state,
        em_pincode: formData.pincode,
        us_coid: 'TRV', // Default company
        password: formData.password
      };

      // Remove form-specific fields that don't map to backend
      delete submitData.name;
      delete submitData.aadhaarNumber;
      delete submitData.roleId;

      if (editingEmployee) {
        // Update existing employee
        await employeeAPI.updateEmployee(editingEmployee.us_usid, submitData);
        setEditingEmployee(null);
      } else {
        // Create new employee
        await employeeAPI.createEmployee(submitData);
      }
      
      // Reset form and reload employees
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: 'employee123',
        aadhaarNumber: '',
        department: '',
        roleId: '',
        salary: '',
        joinDate: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        photo: null
      });
      setPhotoPreview(null);
      setShowForm(false);
      loadEmployees();
    } catch (err) {
      setError(err.message || 'Operation failed');
    }
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.user?.us_fname ? 
        (employee.user?.us_lname ? 
          `${employee.user.us_fname} ${employee.user.us_lname}` : 
          employee.user.us_fname) : '',
      email: employee.user?.us_email || '',
      phone: employee.user?.us_phone || '',
      password: 'employee123',
      aadhaarNumber: employee.user?.us_aadhaar || '',
      department: employee.em_dept || '',
      roleId: employee.user?.us_roid || '', // Use roleId from user record
      salary: employee.em_salary || '',
      joinDate: employee.em_joindt ? employee.em_joindt.split('T')[0] : '',
      address: employee.em_address || '',
      city: employee.em_city || '',
      state: employee.em_state || '',
      pincode: employee.em_pincode || '',
      photo: null
    });
    setPhotoPreview(employee.user?.us_photo || null);
    setShowForm(true);
  };

  const handleDelete = async (employeeId) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await employeeAPI.deleteEmployee(employeeId);
        loadEmployees();
      } catch (err) {
        setError(err.message || 'Failed to delete employee');
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingEmployee(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: 'employee123',
      aadhaarNumber: '',
      department: '',
      roleId: '',
      salary: '',
      joinDate: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      photo: null
    });
    setPhotoPreview(null);
  };

  if (loading) {
    return <div className="app-layout panel"><div>Loading...</div></div>;
  }

  return (
    <div className="app-layout panel">
      {/* Top Navigation Bar */}
      <nav className="top-navbar panel-header">
        <div className="navbar-content">
          <h1 className="app-title">YatraSathi Employee Management</h1>
          <div className="user-info">
            <span className="user-name">{user?.us_fname}</span>
            <button className="logout-btn btn btn-primary" onClick={async () => {
              try {
                await authAPI.logout();
                window.location.href = '/login';
              } catch (error) {
                console.error('Logout failed:', error);
              }
            }}>
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="main-content">
        {/* Left Sidebar for Form Inputs */}
        <div className="sidebar panel">
          <h2 className="sidebar-title">
            {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Name *</label>
              <input
                type="text"
                name="name"
                className="form-control"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input
                type="email"
                name="email"
                className="form-control"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Phone *</label>
              <input
                type="tel"
                name="phone"
                className="form-control"
                value={formData.phone}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Password {!editingEmployee && '*'}</label>
              <input
                type="password"
                name="password"
                className="form-control"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Default: employee123"
                required={!editingEmployee}
              />
              <small style={{ color: 'var(--text-color)', fontSize: '10px' }}>
                {editingEmployee ? 'Leave blank to keep current password' : 'Default password: employee123'}
              </small>
            </div>
            
            <div className="form-group">
              <label className="form-label">Aadhaar Number *</label>
              <input
                type="text"
                name="aadhaarNumber"
                className="form-control"
                value={formData.aadhaarNumber}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-row">
              <div className="form-group col-6">
                <label className="form-label">Department</label>
                <select
                  name="department"
                  className="form-control"
                  value={formData.department}
                  onChange={handleInputChange}
                >
                  <option value="">Select Department</option>
                  <option value="Operations">Operations</option>
                  <option value="Sales">Sales</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Customer Service">Customer Service</option>
                  <option value="Finance">Finance</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="IT">IT</option>
                  <option value="Administration">Administration</option>
                </select>
              </div>
              
              <div className="form-group col-6">
                <label className="form-label">Role</label>
                <select
                  name="roleId"
                  className="form-control"
                  value={formData.roleId}
                  onChange={handleInputChange}
                >
                  <option value="">Select Role</option>
                  <option value="EMP">Employee</option>
                  <option value="MGR">Manager</option>
                  <option value="HR">HR</option>
                  <option value="ACC">Accountant</option>
                  <option value="ADM">Admin</option>
                </select>
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Salary</label>
              <input
                type="number"
                name="salary"
                className="form-control"
                value={formData.salary}
                onChange={handleInputChange}
                step="0.01"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Join Date</label>
              <input
                type="date"
                name="joinDate"
                className="form-control"
                value={formData.joinDate}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Employee Photo</label>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="form-control"
              />
              {photoPreview && (
                <div style={{ marginTop: '10px', textAlign: 'center' }}>
                  <img 
                    src={photoPreview} 
                    alt="Preview" 
                    style={{ 
                      maxWidth: '150px', 
                      maxHeight: '150px', 
                      borderRadius: '8px',
                      border: '1px solid #ddd'
                    }} 
                  />
                </div>
              )}
            </div>
            
            <div className="form-group">
              <label className="form-label">Address</label>
              <textarea
                name="address"
                className="form-control"
                value={formData.address}
                onChange={handleInputChange}
                rows="3"
              ></textarea>
            </div>
            
            <div className="form-row">
              <div className="form-group col-4">
                <label className="form-label">City</label>
                <input
                  type="text"
                  name="city"
                  className="form-control"
                  value={formData.city}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-group col-4">
                <label className="form-label">State</label>
                <input
                  type="text"
                  name="state"
                  className="form-control"
                  value={formData.state}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-group col-4">
                <label className="form-label">Pincode</label>
                <input
                  type="text"
                  name="pincode"
                  className="form-control"
                  value={formData.pincode}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div className="form-group">
              <button type="submit" className="btn btn-primary">
                {editingEmployee ? 'Update Employee' : 'Add Employee'}
              </button>
              <button type="button" className="btn ml-2" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Right Panel for Data Grid */}
        <div className="content-panel panel">
          <div className="panel-header">
            <h2 className="panel-title">Employee List</h2>
            <div>
              <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                Add New Employee
              </button>
            </div>
          </div>
          
          {error && <div className="alert alert-error">{error}</div>}
          
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Photo</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Department</th>
                  <th>Role</th>
                  <th>Salary</th>
                  <th>Join Date</th>
                  <th>Manager</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(item => (
                  <tr key={item.em_usid}>
                    <td>
                      {item.user?.us_photo ? (
                        <img 
                          src={item.user.us_photo} 
                          alt="Employee" 
                          style={{ 
                            width: '40px', 
                            height: '40px', 
                            borderRadius: '50%',
                            objectFit: 'cover' 
                          }} 
                        />
                      ) : (
                        <div style={{ 
                          width: '40px', 
                          height: '40px', 
                          borderRadius: '50%',
                          backgroundColor: '#ddd',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px'
                        }}>
                          {item.user?.us_fname?.charAt(0) || 'N'}
                        </div>
                      )}
                    </td>
                    <td>{item.user?.us_fname} {item.user?.us_lname}</td>
                    <td>{item.user?.us_email}</td>
                    <td>{item.user?.us_phone}</td>
                    <td>{item.em_dept || ''}</td>
                    <td>{item.user?.us_roid || ''}</td>
                    <td>{item.em_salary ? `₹${parseFloat(item.em_salary).toFixed(2)}` : ''}</td>
                    <td>{item.em_joindt ? new Date(item.em_joindt).toLocaleDateString() : ''}</td>
                    <td>{item.manager?.em_empno || 'N/A'}</td>
                    <td>{item.em_status || 'ACTIVE'}</td>
                    <td>
                      <button className="btn btn-secondary mr-1" onClick={() => handleEdit(item)}>
                        Edit
                      </button>
                      <button className="btn btn-danger" onClick={() => handleDelete(item.em_usid)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeManagement;