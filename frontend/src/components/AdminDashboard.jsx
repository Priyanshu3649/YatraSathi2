import React, { useState } from 'react';
import '../styles/admin-dashboard.css';

const AdminDashboard = () => {
  // Navigation state
  const [activeModule, setActiveModule] = useState('Application');
  const [selectedRecord, setSelectedRecord] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    id: '',
    description: '',
    module: '',
    shortName: '',
    status: 'active',
    remarks: '',
    active: true
  });
  
  // Mock data for the table
  const [tableData, setTableData] = useState([
    { id: 'OPR001', module: 'Security', shortName: 'SEC-OPR', description: 'User Authentication', status: 'active', enteredOn: '2023-01-15', enteredBy: 'ADMIN', modifiedOn: '2023-06-20', modifiedBy: 'ADMIN' },
    { id: 'OPR002', module: 'Booking', shortName: 'BKG-CRT', description: 'Create Booking', status: 'active', enteredOn: '2023-02-10', enteredBy: 'ADMIN', modifiedBy: 'ADMIN' },
    { id: 'OPR003', module: 'Payment', shortName: 'PAY-PRC', description: 'Process Payment', status: 'inactive', enteredOn: '2023-03-05', enteredBy: 'ADMIN', modifiedBy: 'ADMIN' },
    { id: 'OPR004', module: 'Reports', shortName: 'RPT-VIW', description: 'View Reports', status: 'active', enteredOn: '2023-04-12', enteredBy: 'ADMIN', modifiedOn: '2023-09-05', modifiedBy: 'ADMIN' },
    { id: 'OPR005', module: 'User', shortName: 'USR-MNG', description: 'Manage Users', status: 'active', enteredOn: '2023-05-18', enteredBy: 'ADMIN', modifiedOn: '2023-10-01', modifiedBy: 'ADMIN' },
  ]);
  
  // Navigation modules
  const modules = [
    'Application', 'Module', 'Operation', 'Role List', 
    'User List', 'Role Permission', 'User Permission'
  ];
  
  // Handle navigation
  const handleModuleChange = (module) => {
    setActiveModule(module);
    // Reset form when changing modules
    setFormData({
      id: '',
      description: '',
      module: '',
      shortName: '',
      status: 'active',
      remarks: '',
      active: true
    });
    setSelectedRecord(null);
  };
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real app, this would call an API
    console.log('Form submitted:', formData);
    alert('Record saved successfully!');
  };
  
  // Handle record selection
  const handleRecordSelect = (record) => {
    setSelectedRecord(record);
    setFormData({
      id: record.id,
      description: record.description,
      module: record.module,
      shortName: record.shortName,
      status: record.status,
      remarks: record.remarks || '',
      active: record.status === 'active'
    });
  };
  
  // Handle navigation buttons
  const handleFirst = () => {
    if (tableData.length > 0) {
      handleRecordSelect(tableData[0]);
    }
  };
  
  const handlePrevious = () => {
    if (selectedRecord && tableData.length > 0) {
      const currentIndex = tableData.findIndex(item => item.id === selectedRecord.id);
      if (currentIndex > 0) {
        handleRecordSelect(tableData[currentIndex - 1]);
      }
    }
  };
  
  const handleNext = () => {
    if (selectedRecord && tableData.length > 0) {
      const currentIndex = tableData.findIndex(item => item.id === selectedRecord.id);
      if (currentIndex < tableData.length - 1) {
        handleRecordSelect(tableData[currentIndex + 1]);
      }
    }
  };
  
  const handleLast = () => {
    if (tableData.length > 0) {
      handleRecordSelect(tableData[tableData.length - 1]);
    }
  };
  
  // Handle new record
  const handleNew = () => {
    setFormData({
      id: '',
      description: '',
      module: '',
      shortName: '',
      status: 'active',
      remarks: '',
      active: true
    });
    setSelectedRecord(null);
  };
  
  // Handle edit
  const handleEdit = () => {
    if (selectedRecord) {
      // In a real app, this would enable edit mode
      alert('Edit mode enabled');
    } else {
      alert('Please select a record first');
    }
  };
  
  // Handle delete
  const handleDelete = () => {
    if (selectedRecord) {
      if (window.confirm('Are you sure you want to delete this record?')) {
        // In a real app, this would call an API to delete the record
        setTableData(prev => prev.filter(item => item.id !== selectedRecord.id));
        handleNew();
        alert('Record deleted successfully');
      }
    } else {
      alert('Please select a record first');
    }
  };
  
  // Handle update
  const handleUpdate = () => {
    if (selectedRecord) {
      // In a real app, this would call an API to update the record
      setTableData(prev => 
        prev.map(item => 
          item.id === selectedRecord.id 
            ? { ...item, ...formData, status: formData.active ? 'active' : 'inactive', modifiedOn: new Date().toISOString().split('T')[0], modifiedBy: 'ADMIN' }
            : item
        )
      );
      alert('Record updated successfully');
    } else {
      alert('Please select a record first');
    }
  };

  return (
    <div className="admin-dashboard panel">
      {/* Fixed Top Bar */}
      <div className="top-bar panel-header">
        <h1 className="top-bar-title">.:: Security - {activeModule} ::.</h1>
        <div className="user-block">
          <span className="user-name">ADMINISTRATOR</span>
          <button className="logout-btn btn btn-primary">Logout</button>
        </div>
      </div>
      
      {/* Navigation Row */}
      <div className="nav-row panel">
        {modules.map((module) => (
          <button
            key={module}
            className={`nav-button btn ${activeModule === module ? 'btn-primary' : ''}`}
            onClick={() => handleModuleChange(module)}
          >
            {module}
          </button>
        ))}
      </div>
      
      {/* Main Content */}
      <div className="main-content">
        {/* Dashboard Content */}
        <div className="dashboard-content">
          {/* Left Panel - Form */}
          <div className="left-panel panel">
            <h2 className="panel-header">{activeModule} Entry</h2>
            
            <div className="form-container">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label required">ID:</label>
                  <input
                    type="text"
                    name="id"
                    className="form-control"
                    value={formData.id}
                    onChange={handleInputChange}
                    readOnly={selectedRecord !== null}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label required">Module:</label>
                  <input
                    type="text"
                    name="module"
                    className="form-control"
                    value={formData.module}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Short Name:</label>
                  <input
                    type="text"
                    name="shortName"
                    className="form-control"
                    value={formData.shortName}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label required">Description:</label>
                  <input
                    type="text"
                    name="description"
                    className="form-control"
                    value={formData.description}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group col-6">
                    <label className="form-label">Status:</label>
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
                  
                  <div className="form-group col-6">
                    <label className="form-label">Active:</label>
                    <div className="checkbox-group">
                      <input
                        type="checkbox"
                        name="active"
                        checked={formData.active}
                        onChange={handleInputChange}
                        className="form-control"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Remarks:</label>
                  <textarea
                    name="remarks"
                    className="remarks-box form-control"
                    value={formData.remarks}
                    onChange={handleInputChange}
                    rows="4"
                  ></textarea>
                </div>
                
                {/* Audit Fields */}
                <div className="audit-fields panel">
                  <h4 className="panel-header">Audit Information</h4>
                  <div className="audit-row">
                    <div className="audit-field">
                      <span className="audit-label">Entered On:</span>
                      <span>{selectedRecord ? selectedRecord.enteredOn : '-'}</span>
                    </div>
                    <div className="audit-field">
                      <span className="audit-label">Entered By:</span>
                      <span>{selectedRecord ? selectedRecord.enteredBy : '-'}</span>
                    </div>
                  </div>
                  <div className="audit-row">
                    <div className="audit-field">
                      <span className="audit-label">Modified On:</span>
                      <span>{selectedRecord ? selectedRecord.modifiedOn : '-'}</span>
                    </div>
                    <div className="audit-field">
                      <span className="audit-label">Modified By:</span>
                      <span>{selectedRecord ? selectedRecord.modifiedBy : '-'}</span>
                    </div>
                  </div>
                  <div className="audit-row">
                    <div className="audit-field">
                      <span className="audit-label">Closed On:</span>
                      <span>-</span>
                    </div>
                    <div className="audit-field">
                      <span className="audit-label">Closed By:</span>
                      <span>-</span>
                    </div>
                  </div>
                </div>
              </form>
            </div>
            
            {/* Action Buttons */}
            <div className="action-buttons">
              <button className="btn mr-1" onClick={handleFirst}>First</button>
              <button className="btn mr-1" onClick={handlePrevious}>Previous</button>
              <button className="btn mr-1" onClick={handleNext}>Next</button>
              <button className="btn mr-1" onClick={handleLast}>Last</button>
              <button className="btn btn-primary mr-1" onClick={handleNew}>New</button>
              <button className="btn mr-1" onClick={handleEdit}>Edit</button>
              <button className="btn mr-1" onClick={handleDelete}>Delete</button>
              <button className="btn btn-primary" onClick={handleUpdate}>Update</button>
            </div>
          </div>
          
          {/* Right Panel - Data Grid */}
          <div className="right-panel panel">
            <h2 className="panel-header">{activeModule} List</h2>
            
            {/* Filter Section */}
            <div className="filter-section panel mb-2">
              <div className="filter-row">
                <div className="filter-group">
                  <label className="filter-label form-label">Module:</label>
                  <input type="text" className="filter-control form-control" placeholder="Filter by module" />
                </div>
                <div className="filter-group">
                  <label className="filter-label form-label">Operation ID:</label>
                  <input type="text" className="filter-control form-control" placeholder="Filter by ID" />
                </div>
                <div className="filter-group">
                  <label className="filter-label form-label">Short Name:</label>
                  <input type="text" className="filter-control form-control" placeholder="Filter by short name" />
                </div>
              </div>
              <div className="filter-row">
                <div className="filter-group">
                  <label className="filter-label form-label">Description:</label>
                  <input type="text" className="filter-control form-control" placeholder="Filter by description" />
                </div>
                <div className="filter-group">
                  <label className="filter-label form-label">Status:</label>
                  <select className="filter-control form-control">
                    <option value="">All</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <button className="btn btn-primary mr-1">Search</button>
                <button className="btn">Clear</button>
              </div>
            </div>
            
            {/* Table Container */}
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}></th>
                    <th>Module</th>
                    <th>Operation ID</th>
                    <th>Short Name</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Entered On</th>
                    <th>Entered By</th>
                    <th>Modified On</th>
                    <th>Modified By</th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((record) => (
                    <tr 
                      key={record.id} 
                      className={selectedRecord && selectedRecord.id === record.id ? 'selected' : ''}
                      onClick={() => handleRecordSelect(record)}
                    >
                      <td>
                        <input 
                          type="checkbox" 
                          className="table-checkbox"
                          checked={selectedRecord && selectedRecord.id === record.id}
                          onChange={() => {}}
                        />
                      </td>
                      <td>{record.module}</td>
                      <td>{record.id}</td>
                      <td>{record.shortName}</td>
                      <td>{record.description}</td>
                      <td>
                        <span className={`status-badge status-${record.status}`}>
                          {record.status}
                        </span>
                      </td>
                      <td>{record.enteredOn}</td>
                      <td>{record.enteredBy}</td>
                      <td>{record.modifiedOn}</td>
                      <td>{record.modifiedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            <div className="pagination">
              <button className="btn btn-primary mr-1 active">1</button>
              <button className="btn mr-1">2</button>
              <button className="btn mr-1">3</button>
              <button className="btn mr-1">Next</button>
              <button className="btn">Last</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;