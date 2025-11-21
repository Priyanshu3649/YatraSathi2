import React, { useState } from 'react';
import '../styles/layout.css';

const SampleLayout = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    status: 'active'
  });

  const [data, setData] = useState([
    { id: 1, name: 'John Doe', email: 'john@example.com', department: 'Sales', status: 'active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', department: 'Marketing', status: 'active' },
    { id: 3, name: 'Robert Johnson', email: 'robert@example.com', department: 'IT', status: 'inactive' },
    { id: 4, name: 'Emily Davis', email: 'emily@example.com', department: 'HR', status: 'active' },
    { id: 5, name: 'Michael Wilson', email: 'michael@example.com', department: 'Finance', status: 'inactive' }
  ]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add new item to data
    const newItem = {
      id: data.length + 1,
      ...formData
    };
    setData(prev => [...prev, newItem]);
    
    // Reset form
    setFormData({
      name: '',
      email: '',
      department: '',
      status: 'active'
    });
  };

  return (
    <div className="app-layout panel">
      {/* Top Navigation Bar */}
      <nav className="top-navbar panel-header">
        <div className="navbar-content">
          <h1 className="app-title">YatraSathi Employee Management</h1>
          <div className="user-info">
            <span className="user-name">Admin User</span>
            <button className="logout-btn btn btn-primary">Logout</button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="main-content">
        {/* Left Sidebar for Form Inputs */}
        <div className="sidebar panel">
          <h2 className="sidebar-title">Add New Employee</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Name</label>
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
              <label className="form-label">Email</label>
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
              <label className="form-label">Department</label>
              <select
                name="department"
                className="form-control"
                value={formData.department}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Department</option>
                <option value="Sales">Sales</option>
                <option value="Marketing">Marketing</option>
                <option value="IT">IT</option>
                <option value="HR">HR</option>
                <option value="Finance">Finance</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                name="status"
                className="form-control"
                value={formData.status}
                onChange={handleInputChange}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            
            <button type="submit" className="btn btn-primary">
              Add Employee
            </button>
          </form>
        </div>

        {/* Right Panel for Data Grid */}
        <div className="content-panel panel">
          <div className="panel-header">
            <h2 className="panel-title">Employee List</h2>
            <div>
              <button className="btn btn-secondary">Export</button>
            </div>
          </div>
          
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map(item => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.name}</td>
                    <td>{item.email}</td>
                    <td>{item.department}</td>
                    <td>
                      <span className={`status-badge status-${item.status}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-secondary mr-1">
                        Edit
                      </button>
                      <button className="btn btn-danger">
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

export default SampleLayout;