import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { employeeAPI, authAPI } from '../services/api';
import '../styles/layout.css';

const EmployeeManagement = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: 'employee123', // Default password
    aadhaarNumber: '',
    department: '',
    designation: '',
    salary: '',
    joinDate: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingEmployee) {
        // Update existing employee
        await employeeAPI.updateEmployee(editingEmployee.us_usid, formData);
        setEditingEmployee(null);
      } else {
        // Create new employee
        await employeeAPI.createEmployee(formData);
      }
      
      // Reset form and reload employees
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: 'employee123',
        aadhaarNumber: '',
        department: '',
        designation: '',
        salary: '',
        joinDate: '',
        address: '',
        city: '',
        state: '',
        pincode: ''
      });
      setShowForm(false);
      loadEmployees();
    } catch (err) {
      setError(err.message || 'Operation failed');
    }
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.us_fname || '',
      email: employee.us_email || '',
      phone: employee.us_phone || '',
      password: 'employee123',
      aadhaarNumber: employee.us_aadhaar || '',
      department: employee.Employee?.em_dept || '',
      designation: employee.Employee?.em_designation || '',
      salary: employee.Employee?.em_salary || '',
      joinDate: employee.Employee?.em_joindt ? employee.Employee.em_joindt.split('T')[0] : '',
      address: employee.Employee?.em_address || '',
      city: employee.Employee?.em_city || '',
      state: employee.Employee?.em_state || '',
      pincode: employee.Employee?.em_pincode || ''
    });
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
      designation: '',
      salary: '',
      joinDate: '',
      address: '',
      city: '',
      state: '',
      pincode: ''
    });
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
                <label className="form-label">Designation</label>
                <select
                  name="designation"
                  className="form-control"
                  value={formData.designation}
                  onChange={handleInputChange}
                >
                  <option value="">Select Designation</option>
                  <option value="Manager">Manager</option>
                  <option value="Senior Executive">Senior Executive</option>
                  <option value="Executive">Executive</option>
                  <option value="Team Leader">Team Leader</option>
                  <option value="Booking Agent">Booking Agent</option>
                  <option value="Travel Consultant">Travel Consultant</option>
                  <option value="Customer Support">Customer Support</option>
                  <option value="Accountant">Accountant</option>
                  <option value="HR Executive">HR Executive</option>
                  <option value="IT Support">IT Support</option>
                  <option value="Administrator">Administrator</option>
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
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Salary</th>
                  <th>Join Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(item => (
                  <tr key={item.us_usid}>
                    <td>{item.us_usid}</td>
                    <td>{item.us_fname} {item.us_lname}</td>
                    <td>{item.us_email}</td>
                    <td>{item.us_phone}</td>
                    <td>{item.Employee?.em_dept || ''}</td>
                    <td>{item.Employee?.em_designation || ''}</td>
                    <td>{item.Employee?.em_salary ? `₹${parseFloat(item.Employee.em_salary).toFixed(2)}` : ''}</td>
                    <td>{item.Employee?.em_joindt ? new Date(item.Employee.em_joindt).toLocaleDateString() : ''}</td>
                    <td>
                      <button className="btn btn-secondary mr-1" onClick={() => handleEdit(item)}>
                        Edit
                      </button>
                      <button className="btn btn-danger" onClick={() => handleDelete(item.us_usid)}>
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