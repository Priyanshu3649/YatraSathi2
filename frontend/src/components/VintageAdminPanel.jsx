import React, { useState } from 'react';
import '../styles/vintage-admin-panel.css';

const VintageAdminPanel = () => {
  // Navigation state
  const [activeModule, setActiveModule] = useState('Operation');
  const [selectedRecord, setSelectedRecord] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    id: 'OPR001',
    module: 'Security',
    shortName: 'SEC-OPR',
    description: 'User Authentication',
    status: 'Active',
    active: true,
    remarks: 'This operation handles user authentication and authorization.'
  });
  
  // Mock data for the table
  const tableData = [
    { id: 'OPR001', module: 'Security', shortName: 'SEC-OPR', description: 'User Authentication', status: 'Active', enteredOn: '01/15/2023', enteredBy: 'ADMIN', modifiedOn: '06/20/2023', modifiedBy: 'ADMIN' },
    { id: 'OPR002', module: 'Booking', shortName: 'BKG-CRT', description: 'Create Booking', status: 'Active', enteredOn: '02/10/2023', enteredBy: 'ADMIN', modifiedOn: '07/15/2023', modifiedBy: 'ADMIN' },
    { id: 'OPR003', module: 'Payment', shortName: 'PAY-PRC', description: 'Process Payment', status: 'Inactive', enteredOn: '03/05/2023', enteredBy: 'ADMIN', modifiedBy: 'ADMIN' },
    { id: 'OPR004', module: 'Reports', shortName: 'RPT-VIW', description: 'View Reports', status: 'Active', enteredOn: '04/12/2023', enteredBy: 'ADMIN', modifiedOn: '09/05/2023', modifiedBy: 'ADMIN' },
    { id: 'OPR005', module: 'User', shortName: 'USR-MNG', description: 'Manage Users', status: 'Active', enteredOn: '05/18/2023', enteredBy: 'ADMIN', modifiedOn: '10/01/2023', modifiedBy: 'ADMIN' },
    { id: 'OPR006', module: 'Security', shortName: 'SEC-PRM', description: 'Permission Management', status: 'Active', enteredOn: '06/22/2023', enteredBy: 'ADMIN', modifiedOn: '11/05/2023', modifiedBy: 'ADMIN' },
    { id: 'OPR007', module: 'Booking', shortName: 'BKG-UPD', description: 'Update Booking', status: 'Active', enteredOn: '07/30/2023', enteredBy: 'ADMIN', modifiedOn: '12/10/2023', modifiedBy: 'ADMIN' },
  ];
  
  // Navigation modules
  const modules = [
    'Application', 'Module', 'Operation', 'Role List', 
    'User List', 'Role Permission', 'User Permission'
  ];
  
  // Handle navigation
  const handleModuleChange = (module) => {
    setActiveModule(module);
  };
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Handle record selection
  const handleRecordSelect = (record) => {
    setSelectedRecord(record);
    setFormData({
      id: record.id,
      module: record.module,
      shortName: record.shortName,
      description: record.description,
      status: record.status,
      active: record.status === 'Active',
      remarks: 'Sample remarks for this operation.'
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
      module: '',
      shortName: '',
      description: '',
      status: 'Active',
      active: true,
      remarks: ''
    });
    setSelectedRecord(null);
  };
  
  // Handle edit
  const handleEdit = () => {
    if (selectedRecord) {
      alert('Edit mode enabled');
    } else {
      alert('Please select a record first');
    }
  };
  
  // Handle delete
  const handleDelete = () => {
    if (selectedRecord) {
      if (window.confirm('Are you sure you want to delete this record?')) {
        alert('Record deleted successfully');
        handleNew();
      }
    } else {
      alert('Please select a record first');
    }
  };
  
  // Handle save
  const handleSave = () => {
    alert('Record saved successfully');
  };

  return (
    <div className="vintage-admin-panel">
      {/* Title Bar */}
      <div className="title-bar">
        <div className="system-menu"></div>
        <div className="title-text">.:: Security - {activeModule} ::.</div>
      </div>
      
      {/* Menu Bar */}
      <div className="menu-bar">
        <div className="menu-item">File</div>
        <div className="menu-item">Edit</div>
        <div className="menu-item">View</div>
        <div className="menu-item">Tools</div>
        <div className="menu-item">Help</div>
      </div>
      
      {/* Toolbar */}
      <div className="toolbar">
        <div className="tool-button" onClick={handleFirst} title="First">|&lt;</div>
        <div className="tool-button" onClick={handlePrevious} title="Previous">&lt;</div>
        <div className="tool-button" onClick={handleNext} title="Next">&gt;</div>
        <div className="tool-button" onClick={handleLast} title="Last">&gt;|</div>
        <div className="tool-separator"></div>
        <div className="tool-button" onClick={handleNew} title="New">New</div>
        <div className="tool-button" onClick={handleEdit} title="Edit">Edit</div>
        <div className="tool-button" onClick={handleDelete} title="Delete">Delete</div>
        <div className="tool-button" onClick={handleSave} title="Save">Save</div>
      </div>
      
      {/* Main Content */}
      <div className="main-content">
        {/* Navigation Panel */}
        <div className="nav-panel">
          <div className="nav-header">Modules</div>
          {modules.map((module) => (
            <div 
              key={module}
              className={`nav-item ${activeModule === module ? 'active' : ''}`}
              onClick={() => handleModuleChange(module)}
            >
              {module}
            </div>
          ))}
        </div>
        
        {/* Work Area */}
        <div className="work-area">
          {/* Form Panel */}
          <div className="form-panel">
            <div className="panel-header">{activeModule} Entry</div>
            <div className="form-grid">
              <div className="form-label required">ID:</div>
              <input
                type="text"
                name="id"
                className="form-input"
                value={formData.id}
                onChange={handleInputChange}
                readOnly={selectedRecord !== null}
              />
              
              <div className="form-label required">Module:</div>
              <input
                type="text"
                name="module"
                className="form-input"
                value={formData.module}
                onChange={handleInputChange}
              />
              
              <div className="form-label">Short Name:</div>
              <input
                type="text"
                name="shortName"
                className="form-input"
                value={formData.shortName}
                onChange={handleInputChange}
              />
              
              <div className="form-label required">Description:</div>
              <input
                type="text"
                name="description"
                className="form-input"
                value={formData.description}
                onChange={handleInputChange}
              />
              
              <div className="form-label">Status:</div>
              <select
                name="status"
                className="form-input"
                value={formData.status}
                onChange={handleInputChange}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              
              <div className="form-label">Active:</div>
              <div>
                <input
                  type="checkbox"
                  name="active"
                  checked={formData.active}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-label">Remarks:</div>
              <div></div>
            </div>
            
            <textarea
              name="remarks"
              className="form-input"
              style={{ width: '100%', height: '40px', marginTop: '4px' }}
              value={formData.remarks}
              onChange={handleInputChange}
            />
            
            <div className="form-actions">
              <div className="tool-button" onClick={handleNew}>New</div>
              <div className="tool-button" onClick={handleEdit}>Edit</div>
              <div className="tool-button" onClick={handleDelete}>Delete</div>
              <div className="tool-button" onClick={handleSave}>Save</div>
            </div>
          </div>
          
          {/* Grid Panel */}
          <div className="grid-panel">
            <div className="panel-header">{activeModule} List</div>
            <div className="grid-toolbar">
              <div className="form-label">Module:</div>
              <input type="text" className="filter-input" placeholder="Filter" />
              <div className="form-label">Operation ID:</div>
              <input type="text" className="filter-input" placeholder="Filter" />
              <div className="form-label">Short Name:</div>
              <input type="text" className="filter-input" placeholder="Filter" />
              <div className="tool-button">Search</div>
              <div className="tool-button">Clear</div>
            </div>
            
            <div className="grid-container">
              <table className="grid-table">
                <thead>
                  <tr>
                    <th style={{ width: '20px' }}></th>
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
                          style={{ width: '14px', height: '14px' }}
                          checked={selectedRecord && selectedRecord.id === record.id}
                          onChange={() => {}}
                        />
                      </td>
                      <td>{record.module}</td>
                      <td>{record.id}</td>
                      <td>{record.shortName}</td>
                      <td>{record.description}</td>
                      <td>{record.status}</td>
                      <td>{record.enteredOn}</td>
                      <td>{record.enteredBy}</td>
                      <td>{record.modifiedOn}</td>
                      <td>{record.modifiedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="grid-pagination">
              <div className="page-button active">1</div>
              <div className="page-button">2</div>
              <div className="page-button">3</div>
              <div className="page-button">Next</div>
              <div className="page-button">Last</div>
              <div style={{ marginLeft: 'auto' }}>Records: {tableData.length}</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Status Bar */}
      <div className="status-bar">
        <div className="status-item">Ready</div>
        <div className="status-item">Record: {selectedRecord ? selectedRecord.id : 'None'}</div>
        <div className="status-panel">ADMINISTRATOR</div>
      </div>
    </div>
  );
};

export default VintageAdminPanel;