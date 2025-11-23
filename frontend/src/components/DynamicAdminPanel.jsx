import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styles/vintage-erp-theme.css';
import '../styles/dynamic-admin-panel.css';

const DynamicAdminPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeModule, setActiveModule] = useState('roles');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showDropdown, setShowDropdown] = useState(null);
  const [formData, setFormData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [expandedNav, setExpandedNav] = useState({ master: true, security: true });
  const [auditData, setAuditData] = useState({
    enteredOn: '',
    enteredBy: user?.us_usid || 'ADMIN',
    modifiedOn: '',
    modifiedBy: user?.us_usid || 'ADMIN',
    closedOn: '',
    closedBy: ''
  });

  // Module configurations
  const modules = {
    roles: {
      name: 'Role List',
      endpoint: '/api/permissions/roles',
      fields: [
        { name: 'ur_roid', label: 'Role ID', type: 'text', required: true, readOnly: true },
        { name: 'ur_roshort', label: 'Short Name', type: 'text', required: true },
        { name: 'ur_rodesc', label: 'Description', type: 'text', required: true },
        { name: 'ur_dept', label: 'Department', type: 'text' },
      ],
      columns: ['ur_roid', 'ur_roshort', 'ur_rodesc', 'ur_dept'],
      columnLabels: ['ID', 'Short Name', 'Description', 'Department']
    },
    permissions: {
      name: 'Permissions',
      endpoint: '/api/permissions',
      fields: [
        { name: 'pr_peid', label: 'Permission ID', type: 'text', required: true, readOnly: true },
        { name: 'pr_peshort', label: 'Short Name', type: 'text', required: true },
        { name: 'pr_pedesc', label: 'Description', type: 'text', required: true },
        { name: 'pr_module', label: 'Module', type: 'text' },
      ],
      columns: ['pr_peid', 'pr_peshort', 'pr_pedesc', 'pr_module'],
      columnLabels: ['ID', 'Short Name', 'Description', 'Module']
    },
    users: {
      name: 'User List',
      endpoint: '/api/users',
      fields: [
        { name: 'us_usid', label: 'User ID', type: 'text', required: true, readOnly: true },
        { name: 'us_fname', label: 'First Name', type: 'text', required: true },
        { name: 'us_lname', label: 'Last Name', type: 'text' },
        { name: 'us_email', label: 'Email', type: 'email', required: true },
        { name: 'us_phone', label: 'Phone', type: 'tel' },
        { name: 'us_usertype', label: 'User Type', type: 'select', options: ['admin', 'employee', 'customer'] },
        { name: 'us_active', label: 'Active', type: 'checkbox' },
      ],
      columns: ['us_usid', 'us_fname', 'us_lname', 'us_email', 'us_usertype', 'us_active'],
      columnLabels: ['User ID', 'First Name', 'Last Name', 'Email', 'Type', 'Active']
    },
    stations: {
      name: 'Stations',
      endpoint: '/api/stations',
      fields: [
        { name: 'st_stid', label: 'Station ID', type: 'text', required: true, readOnly: true },
        { name: 'st_stcode', label: 'Station Code', type: 'text', required: true },
        { name: 'st_stname', label: 'Station Name', type: 'text', required: true },
        { name: 'st_city', label: 'City', type: 'text', required: true },
        { name: 'st_state', label: 'State', type: 'text' },
      ],
      columns: ['st_stid', 'st_stcode', 'st_stname', 'st_city', 'st_state'],
      columnLabels: ['Station ID', 'Code', 'Name', 'City', 'State']
    },
    trains: {
      name: 'Trains',
      endpoint: '/api/trains',
      fields: [
        { name: 'tr_trid', label: 'Train ID', type: 'text', required: true, readOnly: true },
        { name: 'tr_trno', label: 'Train Number', type: 'text', required: true },
        { name: 'tr_trname', label: 'Train Name', type: 'text', required: true },
        { name: 'tr_fromst', label: 'From Station', type: 'text' },
        { name: 'tr_tost', label: 'To Station', type: 'text' },
      ],
      columns: ['tr_trid', 'tr_trno', 'tr_trname', 'tr_fromst', 'tr_tost'],
      columnLabels: ['Train ID', 'Number', 'Name', 'From', 'To']
    },
    company: {
      name: 'Company',
      endpoint: '/api/company',
      fields: [
        { name: 'co_coid', label: 'Company ID', type: 'text', required: true, readOnly: true },
        { name: 'co_coshort', label: 'Short Name', type: 'text', required: true },
        { name: 'co_codesc', label: 'Description', type: 'text', required: true },
        { name: 'co_city', label: 'City', type: 'text' },
        { name: 'co_state', label: 'State', type: 'text' },
      ],
      columns: ['co_coid', 'co_coshort', 'co_codesc', 'co_city', 'co_state'],
      columnLabels: ['Company ID', 'Short Name', 'Description', 'City', 'State']
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeModule]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5003${modules[activeModule].endpoint}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const result = await response.json();
        setData(Array.isArray(result) ? result : result.data || []);
      } else {
        setData([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleModuleChange = (module) => {
    setActiveModule(module);
    setSelectedRecord(null);
    setFormData({});
    setIsEditing(false);
    setShowDropdown(null);
  };

  const handleRecordSelect = (record) => {
    setSelectedRecord(record);
    setFormData(record);
    setIsEditing(false);
    
    setAuditData({
      enteredOn: record.edtm ? new Date(record.edtm).toLocaleString() : '',
      enteredBy: record.eby || '',
      modifiedOn: record.mdtm ? new Date(record.mdtm).toLocaleString() : '',
      modifiedBy: record.mby || '',
      closedOn: '',
      closedBy: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
    }));
  };

  const handleNew = () => {
    setSelectedRecord(null);
    const newData = {};
    modules[activeModule].fields.forEach(field => {
      newData[field.name] = field.type === 'checkbox' ? 0 : '';
    });
    setFormData(newData);
    setIsEditing(true);
    
    setAuditData({
      enteredOn: '',
      enteredBy: user?.us_usid || 'ADMIN',
      modifiedOn: '',
      modifiedBy: user?.us_usid || 'ADMIN',
      closedOn: '',
      closedBy: ''
    });
  };

  const handleEdit = () => {
    if (selectedRecord) {
      setIsEditing(true);
    } else {
      alert('Please select a record first');
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const method = selectedRecord ? 'PUT' : 'POST';
      const url = selectedRecord 
        ? `http://localhost:5003${modules[activeModule].endpoint}/${selectedRecord[modules[activeModule].columns[0]]}`
        : `http://localhost:5003${modules[activeModule].endpoint}`;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('Record saved successfully');
        fetchData();
        setIsEditing(false);
      } else {
        alert('Failed to save record');
      }
    } catch (error) {
      console.error('Error saving record:', error);
      alert('Error saving record');
    }
  };

  const handleDelete = async () => {
    if (!selectedRecord) {
      alert('Please select a record first');
      return;
    }

    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(
          `http://localhost:5003${modules[activeModule].endpoint}/${selectedRecord[modules[activeModule].columns[0]]}`,
          {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );

        if (response.ok) {
          alert('Record deleted successfully');
          fetchData();
          handleNew();
        } else {
          alert('Failed to delete record');
        }
      } catch (error) {
        console.error('Error deleting record:', error);
        alert('Error deleting record');
      }
    }
  };

  const handleNavigation = (direction) => {
    if (data.length === 0) return;
    
    let newIndex = 0;
    if (selectedRecord) {
      const currentIndex = data.findIndex(item => 
        item[modules[activeModule].columns[0]] === selectedRecord[modules[activeModule].columns[0]]
      );
      
      switch(direction) {
        case 'first': newIndex = 0; break;
        case 'prev': newIndex = currentIndex > 0 ? currentIndex - 1 : 0; break;
        case 'next': newIndex = currentIndex < data.length - 1 ? currentIndex + 1 : data.length - 1; break;
        case 'last': newIndex = data.length - 1; break;
        default: break;
      }
    }
    
    handleRecordSelect(data[newIndex]);
  };

  const toggleNav = (section) => {
    setExpandedNav(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const currentModule = modules[activeModule];

  return (
    <div className="erp-admin-container">
      {/* Top Menu Bar */}
      <div className="erp-menu-bar">
        <div className="erp-menu-item" onClick={() => navigate('/dashboard')}>← Start</div>
        <div className="erp-menu-item">Application</div>
        <div className="erp-menu-item">Module</div>
        <div className="erp-menu-item">Operation</div>
        <div className="erp-menu-item">Role List</div>
        <div className="erp-menu-item">User List</div>
        <div className="erp-menu-item">Role Permission</div>
        <div className="erp-menu-item">User Permission</div>
        <div className="erp-user-info">ADMINISTRATOR ⚙</div>
      </div>

      {/* Toolbar */}
      <div className="erp-toolbar">
        <button className="erp-icon-button" onClick={() => navigate('/dashboard')} title="Home">🏠</button>
        <button className="erp-icon-button" onClick={() => handleNavigation('first')} title="First">|◀</button>
        <button className="erp-icon-button" onClick={() => handleNavigation('prev')} title="Previous">◀</button>
        <button className="erp-icon-button" onClick={() => handleNavigation('next')} title="Next">▶</button>
        <button className="erp-icon-button" onClick={() => handleNavigation('last')} title="Last">▶|</button>
        <button className="erp-icon-button" onClick={handleNew} title="New">📄</button>
        <button className="erp-icon-button" onClick={handleEdit} title="Edit">✏️</button>
        <button className="erp-icon-button" onClick={handleDelete} title="Delete">🗑️</button>
        <div className="erp-tool-separator"></div>
        <button className="erp-button" onClick={handleSave} disabled={!isEditing}>Save</button>
        <button className="erp-button" onClick={fetchData}>Refresh</button>
      </div>

      {/* Main Content Area */}
      <div className="erp-main-content">
        {/* Left Sidebar Navigation */}
        <div className="erp-nav-sidebar">
          <div className="erp-nav-section">
            <div 
              className={`erp-nav-item expandable ${expandedNav.master ? 'expanded' : ''}`}
              onClick={() => toggleNav('master')}
            >
              Master Data
            </div>
            {expandedNav.master && (
              <>
                <div 
                  className={`erp-nav-item sub-item ${activeModule === 'company' ? 'active' : ''}`}
                  onClick={() => handleModuleChange('company')}
                >
                  Company
                </div>
                <div 
                  className={`erp-nav-item sub-item ${activeModule === 'stations' ? 'active' : ''}`}
                  onClick={() => handleModuleChange('stations')}
                >
                  Stations
                </div>
                <div 
                  className={`erp-nav-item sub-item ${activeModule === 'trains' ? 'active' : ''}`}
                  onClick={() => handleModuleChange('trains')}
                >
                  Trains
                </div>
              </>
            )}
          </div>

          <div className="erp-nav-section">
            <div 
              className={`erp-nav-item expandable ${expandedNav.security ? 'expanded' : ''}`}
              onClick={() => toggleNav('security')}
            >
              Security
            </div>
            {expandedNav.security && (
              <>
                <div 
                  className={`erp-nav-item sub-item ${activeModule === 'roles' ? 'active' : ''}`}
                  onClick={() => handleModuleChange('roles')}
                >
                  Role List
                </div>
                <div 
                  className={`erp-nav-item sub-item ${activeModule === 'permissions' ? 'active' : ''}`}
                  onClick={() => handleModuleChange('permissions')}
                >
                  Permissions
                </div>
                <div 
                  className={`erp-nav-item sub-item ${activeModule === 'users' ? 'active' : ''}`}
                  onClick={() => handleModuleChange('users')}
                >
                  User List
                </div>
              </>
            )}
          </div>
        </div>

        {/* Center Content */}
        <div className="erp-center-content">
          {/* Form Panel */}
          <div className="erp-form-section">
            {currentModule.fields.map(field => (
              <div key={field.name} className="erp-form-row">
                <label className={`erp-form-label ${field.required ? 'required' : ''}`}>
                  {field.label}
                </label>
                {field.type === 'select' ? (
                  <select
                    name={field.name}
                    className="erp-input"
                    value={formData[field.name] || ''}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  >
                    <option value="">Select...</option>
                    {field.options.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : field.type === 'checkbox' ? (
                  <input
                    type="checkbox"
                    name={field.name}
                    checked={formData[field.name] === 1}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  />
                ) : (
                  <input
                    type={field.type}
                    name={field.name}
                    className="erp-input"
                    value={formData[field.name] || ''}
                    onChange={handleInputChange}
                    disabled={!isEditing || field.readOnly}
                    readOnly={field.readOnly}
                  />
                )}
              </div>
            ))}

            {/* Audit Section */}
            <div className="erp-audit-section">
              <div className="erp-audit-row">
                <label className="erp-audit-label">Entered On</label>
                <input type="text" className="erp-audit-input" value={auditData.enteredOn} readOnly />
                <label className="erp-audit-label">Entered By</label>
                <input type="text" className="erp-audit-input" value={auditData.enteredBy} readOnly />
              </div>
              <div className="erp-audit-row">
                <label className="erp-audit-label">Modified On</label>
                <input type="text" className="erp-audit-input" value={auditData.modifiedOn} readOnly />
                <label className="erp-audit-label">Modified By</label>
                <input type="text" className="erp-audit-input" value={auditData.modifiedBy} readOnly />
              </div>
              <div className="erp-audit-row">
                <label className="erp-audit-label">Closed On</label>
                <input type="text" className="erp-audit-input" value={auditData.closedOn} readOnly />
                <label className="erp-audit-label">Closed By</label>
                <input type="text" className="erp-audit-input" value={auditData.closedBy} readOnly />
              </div>
            </div>
          </div>

          {/* Data Grid */}
          <div className="erp-grid-section">
            <div className="erp-panel-header">{currentModule.name}</div>
            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>
            ) : (
              <div className="erp-grid-container">
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th style={{ width: '30px' }}></th>
                      {currentModule.columnLabels.map((label, idx) => (
                        <th key={idx}>{label}</th>
                      ))}
                      <th>Action</th>
                      <th>Entered On</th>
                      <th>Modified On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.length === 0 ? (
                      <tr><td colSpan={currentModule.columns.length + 4} style={{ textAlign: 'center' }}>No records found</td></tr>
                    ) : (
                      data.map((record, idx) => (
                        <tr 
                          key={idx}
                          className={selectedRecord && selectedRecord[currentModule.columns[0]] === record[currentModule.columns[0]] ? 'selected' : ''}
                          onClick={() => handleRecordSelect(record)}
                        >
                          <td><input type="checkbox" checked={selectedRecord && selectedRecord[currentModule.columns[0]] === record[currentModule.columns[0]]} onChange={() => {}} /></td>
                          {currentModule.columns.map((col, colIdx) => (
                            <td key={colIdx}>
                              {col.includes('active') || col.includes('ispublic') 
                                ? (record[col] === 1 ? '☑' : '☐')
                                : record[col] || '-'}
                            </td>
                          ))}
                          <td>📝</td>
                          <td>{record.edtm ? new Date(record.edtm).toLocaleDateString() : '-'}</td>
                          <td>{record.mdtm ? new Date(record.mdtm).toLocaleDateString() : '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Filter Panel */}
        <div className="erp-filter-panel">
          <div className="erp-filter-header">Filter Criteria</div>
          <div className="erp-form-row">
            <label className="erp-form-label">Module</label>
            <input type="text" className="erp-input" placeholder="All" />
          </div>
          <div className="erp-form-row">
            <label className="erp-form-label">Short Name</label>
            <input type="text" className="erp-input" />
          </div>
          <div className="erp-form-row">
            <label className="erp-form-label">Description</label>
            <input type="text" className="erp-input" />
          </div>
          <div style={{ marginTop: '12px' }}>
            <button className="erp-button erp-button-primary" style={{ width: '100%', marginBottom: '4px' }}>Search</button>
            <button className="erp-button" style={{ width: '100%' }}>Clear</button>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="erp-status-bar">
        <div className="erp-status-item">{isEditing ? 'Editing' : 'Ready'}</div>
        <div className="erp-status-item">Records: {data.length}</div>
        <div className="erp-status-item" style={{ marginLeft: 'auto' }}>[Pg=1]</div>
      </div>
    </div>
  );
};

export default DynamicAdminPanel;
