import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styles/vintage-erp-theme.css';
import '../styles/dynamic-admin-panel.css';

const DynamicAdminPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeModule, setActiveModule] = useState('applications');
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [formData, setFormData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [expandedNav, setExpandedNav] = useState({ master: true, security: true });
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 100;
  
  // Dropdown data sources
  const [dropdownData, setDropdownData] = useState({
    applications: [],
    modules: [],
    operations: [],
    roles: [],
    users: []
  });
  
  // Filter state
  const [filters, setFilters] = useState({
    ap_apid: '',
    mo_apid: '',
    shortName: '',
    active: '',
    fp_allow: '',
    up_allow: ''
  });
  
  const [auditData, setAuditData] = useState({
    enteredOn: '',
    enteredBy: user?.us_usid || 'ADMIN',
    modifiedOn: '',
    modifiedBy: user?.us_usid || 'ADMIN',
    closedOn: '',
    closedBy: ''
  });

  // Helper function to create unique record identifier
  const getRecordId = (record, moduleName) => {
    const module = modules[moduleName];
    // For modules with composite keys, concatenate all key columns
    const keyColumns = module.columns.slice(0, 3); // Use first 3 columns as potential keys
    return keyColumns.map(col => record[col]).filter(val => val !== undefined).join('|');
  };

  // Helper function to compare records
  const isSameRecord = (record1, record2, moduleName) => {
    if (!record1 || !record2) return false;
    return getRecordId(record1, moduleName) === getRecordId(record2, moduleName);
  };

  // Module configurations
  const modules = {
    // ==================== SECURITY MODULES ====================
    applications: {
      name: 'Application',
      endpoint: '/api/security/applications',
      fields: [
        { name: 'ap_apid', label: 'Application ID', type: 'text', required: true, readOnly: false, maxLength: 4 },
        { name: 'ap_apshort', label: 'Short Name', type: 'text', required: true, maxLength: 30 },
        { name: 'ap_apdesc', label: 'Application Name/Description', type: 'text', maxLength: 60 },
        { name: 'ap_rmrks', label: 'Remarks', type: 'textarea' },
        { name: 'ap_active', label: 'Active', type: 'checkbox', defaultValue: 1 },
      ],
      columns: ['ap_apid', 'ap_apshort', 'ap_apdesc', 'ap_active', 'ap_edtm', 'ap_mdtm'],
      columnLabels: ['ID', 'Short Name', 'Description', 'Active', 'Entered On', 'Modified On'],
      columnWidths: ['100px', '200px', '300px', '80px', '150px', '150px'],
      filterFields: ['ap_apid', 'ap_apshort', 'active']
    },
    modules: {
      name: 'Module',
      endpoint: '/api/security/modules',
      fields: [
        { name: 'mo_apid', label: 'Application ID', type: 'dropdown', required: true, source: 'applications', displayField: 'ap_apshort', valueField: 'ap_apid' },
        { name: 'mo_moid', label: 'Module ID', type: 'text', required: true, maxLength: 4 },
        { name: 'mo_moshort', label: 'Short Name', type: 'text', required: true, maxLength: 30 },
        { name: 'mo_modesc', label: 'Module Description', type: 'text', maxLength: 60 },
        { name: 'mo_group', label: 'Group', type: 'text', maxLength: 60 },
        { name: 'mo_grsrl', label: 'Group Serial', type: 'number' },
        { name: 'mo_mhint', label: 'Module Hint', type: 'text', maxLength: 320 },
        { name: 'mo_isform', label: 'Is Form?', type: 'checkbox' },
        { name: 'mo_ready', label: 'Ready?', type: 'checkbox' },
        { name: 'mo_rmrks', label: 'Remarks', type: 'textarea' },
        { name: 'mo_active', label: 'Active', type: 'checkbox', defaultValue: 1 },
      ],
      columns: ['mo_apid', 'mo_moid', 'mo_moshort', 'mo_modesc', 'mo_group', 'mo_ready', 'mo_active', 'mo_edtm'],
      columnLabels: ['App ID', 'Module ID', 'Short Name', 'Description', 'Group', 'Ready', 'Active', 'Entered On'],
      columnWidths: ['80px', '100px', '180px', '250px', '150px', '80px', '80px', '150px'],
      filterFields: ['mo_apid', 'mo_moid', 'mo_moshort', 'mo_group', 'active']
    },
    operations: {
      name: 'Operation',
      endpoint: '/api/permissions',
      fields: [
        { name: 'op_apid', label: 'Application ID', type: 'dropdown', required: true, source: 'applications', displayField: 'ap_apshort', valueField: 'ap_apid' },
        { name: 'op_moid', label: 'Module ID', type: 'dropdown', required: true, source: 'modules', displayField: 'mo_moshort', valueField: 'mo_moid', cascadeFrom: 'op_apid' },
        { name: 'op_opid', label: 'Operation ID', type: 'text', required: true, maxLength: 4 },
        { name: 'op_opshort', label: 'Short Name', type: 'text', required: true, maxLength: 30 },
        { name: 'op_opdesc', label: 'Operation Description', type: 'text', maxLength: 60 },
        { name: 'op_appop', label: 'Application Operation?', type: 'checkbox', defaultValue: 1 },
        { name: 'op_avail', label: 'Will be Available?', type: 'checkbox' },
        { name: 'op_ready', label: 'Ready & Working?', type: 'checkbox' },
        { name: 'op_secure', label: 'Secure?', type: 'checkbox', defaultValue: 1 },
        { name: 'op_rmrks', label: 'Remarks', type: 'textarea' },
        { name: 'op_active', label: 'Active', type: 'checkbox', defaultValue: 1 },
      ],
      columns: ['op_apid', 'op_moid', 'op_opid', 'op_opshort', 'op_opdesc', 'op_ready', 'op_secure', 'op_active', 'op_edtm'],
      columnLabels: ['App', 'Module', 'Operation', 'Short Name', 'Description', 'Ready', 'Secure', 'Active', 'Entered On'],
      columnWidths: ['70px', '90px', '100px', '150px', '250px', '70px', '70px', '70px', '150px'],
      filterFields: ['op_apid', 'op_moid', 'op_opid', 'op_opshort', 'active'],
      computedFields: [
        { name: 'fullOpId', label: 'Full Operation ID', formula: (data) => `${data.op_apid || ''}${data.op_moid || ''}${data.op_opid || ''}` }
      ]
    },
    roles: {
      name: 'Role List',
      endpoint: '/api/permissions/roles',
      fields: [
        { name: 'fn_fnid', label: 'Function/Role ID', type: 'text', required: true, readOnly: false, maxLength: 6 },
        { name: 'fn_fnshort', label: 'Short Name', type: 'text', required: true, maxLength: 30 },
        { name: 'fn_fndesc', label: 'Description', type: 'text', maxLength: 60 },
        { name: 'fn_rmrks', label: 'Remarks', type: 'textarea' },
        { name: 'fn_active', label: 'Active', type: 'checkbox', defaultValue: 1 },
      ],
      columns: ['fn_fnid', 'fn_fnshort', 'fn_fndesc', 'fn_active', 'fn_edtm', 'fn_mdtm'],
      columnLabels: ['Role ID', 'Short Name', 'Description', 'Active', 'Entered On', 'Modified On'],
      columnWidths: ['120px', '200px', '300px', '80px', '150px', '150px'],
      filterFields: ['fn_fnid', 'fn_fnshort', 'active']
    },
    users: {
      name: 'User List',
      endpoint: '/api/security/users',
      fields: [
        { name: 'us_usid', label: 'User ID', type: 'text', required: true, readOnly: false, maxLength: 15 },
        { name: 'us_email', label: 'Email', type: 'email', required: true, maxLength: 120 },
        { name: 'us_usname', label: 'User Name', type: 'text', required: true, maxLength: 100 },
        { name: 'us_title', label: 'Job Title', type: 'text', maxLength: 100 },
        { name: 'us_phone', label: 'Phone', type: 'tel', maxLength: 30 },
        { name: 'us_admin', label: 'Is Application Administrator?', type: 'checkbox' },
        { name: 'us_security', label: 'Is Security Administrator?', type: 'checkbox' },
        { name: 'us_limit', label: 'Authorization Limit', type: 'number', step: '0.01' },
        { name: 'us_rmrks', label: 'Remarks', type: 'textarea' },
        { name: 'us_active', label: 'Active', type: 'checkbox', defaultValue: 1 },
      ],
      columns: ['us_usid', 'us_usname', 'us_email', 'us_title', 'us_phone', 'us_admin', 'us_active', 'us_edtm'],
      columnLabels: ['User ID', 'Name', 'Email', 'Title', 'Phone', 'Admin', 'Active', 'Entered On'],
      columnWidths: ['120px', '180px', '200px', '150px', '130px', '70px', '70px', '150px'],
      filterFields: ['us_usid', 'us_usname', 'us_email', 'us_title', 'active', 'us_admin']
    },
    rolePermissions: {
      name: 'Role Permission',
      endpoint: '/api/security/role-permissions',
      fields: [
        { name: 'fp_fnid', label: 'Function/Role', type: 'dropdown', required: true, source: 'roles', displayField: 'fn_fnshort', valueField: 'fn_fnid' },
        { name: 'fp_opid', label: 'Operation ID', type: 'dropdown', required: true, source: 'operations', displayField: 'op_opshort', valueField: 'fullOpId' },
        { name: 'fp_allow', label: 'Allow?', type: 'checkbox', defaultValue: 1 },
        { name: 'fp_rmrks', label: 'Remarks', type: 'textarea' },
        { name: 'fp_active', label: 'Active', type: 'checkbox', defaultValue: 1 },
      ],
      columns: ['fp_fnid', 'roleName', 'fp_opid', 'operationName', 'fp_allow', 'fp_active', 'fp_edtm'],
      columnLabels: ['Role ID', 'Role Name', 'Operation ID', 'Operation Name', 'Allow/Deny', 'Active', 'Entered On'],
      columnWidths: ['120px', '180px', '120px', '200px', '100px', '80px', '150px'],
      filterFields: ['fp_fnid', 'fp_opid', 'fp_allow', 'active'],
      specialFeatures: ['bulkAssign', 'colorCoding']
    },
    userPermissions: {
      name: 'User Permission',
      endpoint: '/api/security/user-permissions',
      fields: [
        { name: 'up_usid', label: 'User ID', type: 'dropdown', required: true, source: 'users', displayField: 'us_usname', valueField: 'us_usid' },
        { name: 'up_opid', label: 'Operation ID', type: 'dropdown', required: true, source: 'operations', displayField: 'op_opshort', valueField: 'fullOpId' },
        { name: 'up_allow', label: 'Allow?', type: 'checkbox', defaultValue: 1 },
        { name: 'up_rmrks', label: 'Remarks', type: 'textarea' },
        { name: 'up_active', label: 'Active', type: 'checkbox', defaultValue: 1 },
      ],
      columns: ['up_usid', 'userName', 'up_opid', 'operationName', 'up_allow', 'up_active', 'up_edtm'],
      columnLabels: ['User ID', 'User Name', 'Operation ID', 'Operation Name', 'Allow/Deny', 'Active', 'Entered On'],
      columnWidths: ['120px', '180px', '120px', '200px', '100px', '80px', '150px'],
      filterFields: ['up_usid', 'up_opid', 'up_allow', 'active'],
      specialFeatures: ['effectivePermissions', 'colorCoding']
    },
    customers: {
      name: 'Customer List',
      endpoint: '/api/security/customers',
      fields: [
        { name: 'cu_usid', label: 'User ID', type: 'text', required: true, readOnly: true },
        { name: 'cu_custno', label: 'Customer Number', type: 'text', required: true, readOnly: true },
        { name: 'cu_name', label: 'Customer Name', type: 'text', readOnly: true },
        { name: 'cu_email', label: 'Email', type: 'email', readOnly: true },
        { name: 'cu_phone', label: 'Phone', type: 'tel', readOnly: true },
        { name: 'cu_custtype', label: 'Customer Type', type: 'text' },
        { name: 'cu_company', label: 'Company Name', type: 'text' },
        { name: 'cu_gst', label: 'GST Number', type: 'text' },
        { name: 'cu_creditlmt', label: 'Credit Limit', type: 'number', step: '0.01' },
        { name: 'cu_status', label: 'Status', type: 'text' },
      ],
      columns: ['cu_custno', 'cu_name', 'cu_email', 'cu_phone', 'cu_custtype', 'cu_company', 'cu_status', 'edtm'],
      columnLabels: ['Customer No', 'Name', 'Email', 'Phone', 'Type', 'Company', 'Status', 'Registered On'],
      columnWidths: ['120px', '180px', '200px', '130px', '100px', '150px', '80px', '150px'],
      filterFields: ['cu_custno', 'cu_name', 'cu_email', 'cu_custtype', 'cu_status']
    },
    // ==================== MASTER DATA MODULES ====================
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
      columnLabels: ['Station ID', 'Code', 'Name', 'City', 'State'],
      filterFields: ['shortName']
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
      columnLabels: ['Train ID', 'Number', 'Name', 'From', 'To'],
      filterFields: ['shortName']
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
      columnLabels: ['Company ID', 'Short Name', 'Description', 'City', 'State'],
      filterFields: ['shortName']
    }
  };

  // Get unique modules for dropdown
  const getModules = () => {
    const mods = new Set();
    data.forEach(record => {
      if (record.op_moid) mods.add(record.op_moid);
    });
    return Array.from(mods).sort();
  };

  // Apply filters - live filtering
  useEffect(() => {
    let filtered = [...data];
    
    // Filter by application ID (exact match)
    if (filters.ap_apid) {
      filtered = filtered.filter(record => 
        record.ap_apid?.toLowerCase().includes(filters.ap_apid.toLowerCase())
      );
    }
    
    // Filter by application (for modules)
    if (filters.mo_apid) {
      filtered = filtered.filter(record => 
        record.mo_apid === filters.mo_apid
      );
    }
    
    // Filter by short name (LIKE) - works across different field names
    if (filters.shortName) {
      const searchTerm = filters.shortName.toLowerCase();
      filtered = filtered.filter(record => {
        // Try different short name fields
        const shortFields = ['ap_apshort', 'mo_moshort', 'op_opshort', 'fn_fnshort', 'us_usname', 'us_email'];
        return shortFields.some(field => 
          record[field]?.toLowerCase().includes(searchTerm)
        );
      });
    }
    
    // Filter by active status
    if (filters.active !== '' && filters.active !== undefined) {
      const activeValue = parseInt(filters.active);
      filtered = filtered.filter(record => {
        const activeFields = ['ap_active', 'mo_active', 'op_active', 'fn_active', 'us_active', 'fp_active', 'up_active'];
        return activeFields.some(field => record[field] === activeValue);
      });
    }
    
    // Filter by permission type (allow/deny)
    if (filters.fp_allow !== '' && filters.fp_allow !== undefined) {
      const allowValue = parseInt(filters.fp_allow);
      filtered = filtered.filter(record => 
        record.fp_allow === allowValue || record.up_allow === allowValue
      );
    }
    
    setFilteredData(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [filters, data]);

  // Auto-select first record when data changes (only on initial load or module change)
  useEffect(() => {
    if (filteredData.length > 0 && !selectedRecord && !isEditing) {
      const firstRecord = filteredData[0];
      handleRecordSelect(firstRecord);
    }
  }, [activeModule, data.length]); // Only trigger on module change or data load

  // Keyboard navigation - Arrow keys
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedRecord || isEditing) return;
      
      const paginatedData = getPaginatedData();
      const currentIndex = paginatedData.findIndex(item => 
        isSameRecord(item, selectedRecord, activeModule)
      );
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (currentIndex < paginatedData.length - 1) {
          handleRecordSelect(paginatedData[currentIndex + 1]);
          scrollToSelectedRow();
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (currentIndex > 0) {
          handleRecordSelect(paginatedData[currentIndex - 1]);
          scrollToSelectedRow();
        }
      } else if (e.key === 'Enter' && !isEditing) {
        e.preventDefault();
        handleEdit();
      } else if (e.key === 'Escape' && isEditing) {
        e.preventDefault();
        setIsEditing(false);
        if (selectedRecord) {
          setFormData(selectedRecord);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedRecord, isEditing, activeModule, filteredData, currentPage]);

  // Scroll to selected row
  const scrollToSelectedRow = () => {
    setTimeout(() => {
      const selectedRow = document.querySelector('.erp-table tbody tr.selected');
      if (selectedRow) {
        selectedRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);
  };

  useEffect(() => {
    fetchData();
    fetchDropdownData();
    // Reset filters when module changes
    setFilters({ 
      ap_apid: '', 
      mo_apid: '', 
      shortName: '', 
      active: '', 
      fp_allow: '',
      up_allow: ''
    });
  }, [activeModule]);

  const fetchDropdownData = async () => {
    const token = localStorage.getItem('token');
    try {
      // Fetch all dropdown sources
      const [appsRes, modsRes, opsRes, rolesRes, usersRes] = await Promise.all([
        fetch('http://localhost:5003/api/security/applications', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('http://localhost:5003/api/security/modules', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('http://localhost:5003/api/permissions', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('http://localhost:5003/api/permissions/roles', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('http://localhost:5003/api/security/users', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      const apps = appsRes.ok ? await appsRes.json() : [];
      const mods = modsRes.ok ? await modsRes.json() : [];
      const ops = opsRes.ok ? await opsRes.json() : [];
      const roles = rolesRes.ok ? await rolesRes.json() : [];
      const users = usersRes.ok ? await usersRes.json() : [];

      // Add computed fullOpId to operations
      const opsWithFullId = (Array.isArray(ops) ? ops : ops.data || []).map(op => ({
        ...op,
        fullOpId: `${op.op_apid || ''}${op.op_moid || ''}${op.op_opid || ''}`
      }));

      setDropdownData({
        applications: Array.isArray(apps) ? apps : apps.data || [],
        modules: Array.isArray(mods) ? mods : mods.data || [],
        operations: opsWithFullId,
        roles: Array.isArray(roles) ? roles : roles.data || [],
        users: Array.isArray(users) ? users : users.data || []
      });
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5003${modules[activeModule].endpoint}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const result = await response.json();
        const dataArray = Array.isArray(result) ? result : result.data || [];
        setData(dataArray);
        setFilteredData(dataArray);
      } else {
        setData([]);
        setFilteredData([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setData([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleModuleChange = (module) => {
    setActiveModule(module);
    setSelectedRecord(null);
    setFormData({});
    setIsEditing(false);
    setCurrentPage(1);
  };

  const handleRecordSelect = (record) => {
    setSelectedRecord(record);
    setFormData(record);
    setIsEditing(false);
    
    // Try different field name patterns for audit fields based on table prefix
    const prefixes = ['ap_', 'mo_', 'op_', 'fn_', 'us_', 'fp_', 'up_', 'st_', 'tr_', 'co_'];
    let edtm, eby, mdtm, mby, cdtm, cby;
    
    for (const prefix of prefixes) {
      if (record[`${prefix}edtm`]) edtm = record[`${prefix}edtm`];
      if (record[`${prefix}eby`]) eby = record[`${prefix}eby`];
      if (record[`${prefix}mdtm`]) mdtm = record[`${prefix}mdtm`];
      if (record[`${prefix}mby`]) mby = record[`${prefix}mby`];
      if (record[`${prefix}cdtm`]) cdtm = record[`${prefix}cdtm`];
      if (record[`${prefix}cby`]) cby = record[`${prefix}cby`];
    }
    
    setAuditData({
      enteredOn: edtm ? new Date(edtm).toLocaleString() : '',
      enteredBy: eby || '',
      modifiedOn: mdtm ? new Date(mdtm).toLocaleString() : '',
      modifiedBy: mby || '',
      closedOn: cdtm ? new Date(cdtm).toLocaleString() : '',
      closedBy: cby || ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
    }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleClearFilters = () => {
    setFilters({ 
      ap_apid: '', 
      mo_apid: '', 
      shortName: '', 
      active: '', 
      fp_allow: '',
      up_allow: ''
    });
  };

  const handleNew = () => {
    setSelectedRecord(null);
    const newData = {};
    modules[activeModule].fields.forEach(field => {
      if (field.defaultValue !== undefined) {
        newData[field.name] = field.defaultValue;
      } else if (field.type === 'checkbox') {
        newData[field.name] = 0;
      } else {
        newData[field.name] = '';
      }
    });
    setFormData(newData);
    setIsEditing(true);
    
    setAuditData({
      enteredOn: '',
      enteredBy: user?.us_usid || 'ADMIN',
      modifiedOn: '',
      modifiedBy: '',
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
    const paginatedData = getPaginatedData();
    if (paginatedData.length === 0) return;
    
    let newIndex = 0;
    if (selectedRecord) {
      const currentIndex = paginatedData.findIndex(item => 
        isSameRecord(item, selectedRecord, activeModule)
      );
      
      switch(direction) {
        case 'first': newIndex = 0; break;
        case 'prev': newIndex = currentIndex > 0 ? currentIndex - 1 : 0; break;
        case 'next': newIndex = currentIndex < paginatedData.length - 1 ? currentIndex + 1 : paginatedData.length - 1; break;
        case 'last': newIndex = paginatedData.length - 1; break;
        default: break;
      }
    }
    
    handleRecordSelect(paginatedData[newIndex]);
  };

  const toggleNav = (section) => {
    setExpandedNav(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Pagination
  const getPaginatedData = () => {
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    return filteredData.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(filteredData.length / recordsPerPage);
  const paginatedData = getPaginatedData();
  
  // Check if navigation buttons should be disabled
  const isFirstRecord = selectedRecord && paginatedData.length > 0 && 
    paginatedData[0][modules[activeModule].columns[0]] === selectedRecord[modules[activeModule].columns[0]];
  const isLastRecord = selectedRecord && paginatedData.length > 0 && 
    paginatedData[paginatedData.length - 1][modules[activeModule].columns[0]] === selectedRecord[modules[activeModule].columns[0]];

  const currentModule = modules[activeModule];

  return (
    <div className="erp-admin-container">
      {/* Top Menu Bar - Static */}
      <div className="erp-menu-bar">
        <div className="erp-menu-item" onClick={() => navigate('/dashboard')}>← Start</div>
        <div className="erp-menu-item" onClick={() => handleModuleChange('applications')}>Application</div>
        <div className="erp-menu-item" onClick={() => handleModuleChange('modules')}>Module</div>
        <div className="erp-menu-item" onClick={() => handleModuleChange('operations')}>Operation</div>
        <div className="erp-menu-item" onClick={() => handleModuleChange('roles')}>Role List</div>
        <div className="erp-menu-item" onClick={() => handleModuleChange('users')}>User List</div>
        <div className="erp-menu-item" onClick={() => handleModuleChange('rolePermissions')}>Role Permission</div>
        <div className="erp-menu-item" onClick={() => handleModuleChange('userPermissions')}>User Permission</div>
        <div className="erp-user-info">ADMINISTRATOR ⚙</div>
      </div>

      {/* Toolbar - Static */}
      <div className="erp-toolbar">
        <button className="erp-icon-button" onClick={() => navigate('/dashboard')} title="Home">🏠</button>
        <button 
          className="erp-icon-button" 
          onClick={() => handleNavigation('first')} 
          disabled={!selectedRecord || isFirstRecord}
          title="First"
        >
          |◀
        </button>
        <button 
          className="erp-icon-button" 
          onClick={() => handleNavigation('prev')} 
          disabled={!selectedRecord || isFirstRecord}
          title="Previous"
        >
          ◀
        </button>
        <button 
          className="erp-icon-button" 
          onClick={() => handleNavigation('next')} 
          disabled={!selectedRecord || isLastRecord}
          title="Next"
        >
          ▶
        </button>
        <button 
          className="erp-icon-button" 
          onClick={() => handleNavigation('last')} 
          disabled={!selectedRecord || isLastRecord}
          title="Last"
        >
          ▶|
        </button>
        <button className="erp-button" onClick={handleNew} title="New">New</button>
        <button className="erp-button" onClick={handleEdit} title="Edit">Edit</button>
        <button className="erp-button" onClick={handleDelete} title="Delete">Delete</button>
        <div className="erp-tool-separator"></div>
        <button className="erp-button" onClick={handleSave} disabled={!isEditing}>Save</button>
        <button className="erp-button" onClick={fetchData}>Refresh</button>
      </div>

      {/* Main Content Area - Scrollable */}
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
                  className={`erp-nav-item sub-item ${activeModule === 'applications' ? 'active' : ''}`}
                  onClick={() => handleModuleChange('applications')}
                >
                  Application
                </div>
                <div 
                  className={`erp-nav-item sub-item ${activeModule === 'modules' ? 'active' : ''}`}
                  onClick={() => handleModuleChange('modules')}
                >
                  Module
                </div>
                <div 
                  className={`erp-nav-item sub-item ${activeModule === 'operations' ? 'active' : ''}`}
                  onClick={() => handleModuleChange('operations')}
                >
                  Operation
                </div>
                <div 
                  className={`erp-nav-item sub-item ${activeModule === 'roles' ? 'active' : ''}`}
                  onClick={() => handleModuleChange('roles')}
                >
                  Role List
                </div>
                <div 
                  className={`erp-nav-item sub-item ${activeModule === 'users' ? 'active' : ''}`}
                  onClick={() => handleModuleChange('users')}
                >
                  User List
                </div>
                <div 
                  className={`erp-nav-item sub-item ${activeModule === 'rolePermissions' ? 'active' : ''}`}
                  onClick={() => handleModuleChange('rolePermissions')}
                >
                  Role Permission
                </div>
                <div 
                  className={`erp-nav-item sub-item ${activeModule === 'userPermissions' ? 'active' : ''}`}
                  onClick={() => handleModuleChange('userPermissions')}
                >
                  User Permission
                </div>
                <div 
                  className={`erp-nav-item sub-item ${activeModule === 'customers' ? 'active' : ''}`}
                  onClick={() => handleModuleChange('customers')}
                >
                  Customer List
                </div>
              </>
            )}
          </div>
        </div>

        {/* Center Content */}
        <div className="erp-center-content">
          {/* Form Panel - Static */}
          <div className="erp-form-section">
            {(() => {
              const fields = currentModule.fields;
              const renderedFields = [];
              let checkboxGroup = [];
              
              fields.forEach((field, index) => {
                // Handle cascading dropdowns
                let dropdownOptions = [];
                if (field.type === 'dropdown' && field.source) {
                  dropdownOptions = dropdownData[field.source] || [];
                  // Filter by cascade if needed
                  if (field.cascadeFrom && formData[field.cascadeFrom]) {
                    const cascadeValue = formData[field.cascadeFrom];
                    if (field.source === 'modules') {
                      dropdownOptions = dropdownOptions.filter(opt => opt.mo_apid === cascadeValue);
                    }
                  }
                }

                // If it's a checkbox, add to group
                if (field.type === 'checkbox') {
                  checkboxGroup.push(field);
                  
                  // If we have 3 checkboxes or it's the last field, render the group
                  if (checkboxGroup.length === 3 || index === fields.length - 1) {
                    renderedFields.push(
                      <div key={`checkbox-group-${index}`} className="erp-checkbox-group">
                        {checkboxGroup.map(cbField => (
                          <div key={cbField.name} className="erp-checkbox-item">
                            <input
                              type="checkbox"
                              id={cbField.name}
                              name={cbField.name}
                              checked={formData[cbField.name] === 1}
                              onChange={handleInputChange}
                              disabled={!isEditing}
                            />
                            <label htmlFor={cbField.name}>{cbField.label}</label>
                          </div>
                        ))}
                      </div>
                    );
                    checkboxGroup = [];
                  }
                } else {
                  // Render any pending checkbox group first
                  if (checkboxGroup.length > 0) {
                    renderedFields.push(
                      <div key={`checkbox-group-${index}`} className="erp-checkbox-group">
                        {checkboxGroup.map(cbField => (
                          <div key={cbField.name} className="erp-checkbox-item">
                            <input
                              type="checkbox"
                              id={cbField.name}
                              name={cbField.name}
                              checked={formData[cbField.name] === 1}
                              onChange={handleInputChange}
                              disabled={!isEditing}
                            />
                            <label htmlFor={cbField.name}>{cbField.label}</label>
                          </div>
                        ))}
                      </div>
                    );
                    checkboxGroup = [];
                  }
                  
                  // Render non-checkbox field
                  renderedFields.push(
                    <div key={field.name} className="erp-form-row">
                      <label className={`erp-form-label ${field.required ? 'required' : ''}`}>
                        {field.label}
                      </label>
                      {field.type === 'dropdown' ? (
                        <select
                          name={field.name}
                          className="erp-input"
                          value={formData[field.name] || ''}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        >
                          <option value="">Select...</option>
                          {dropdownOptions.map(opt => (
                            <option key={opt[field.valueField]} value={opt[field.valueField]}>
                              {opt[field.valueField]} - {opt[field.displayField]}
                            </option>
                          ))}
                        </select>
                      ) : field.type === 'select' ? (
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
                      ) : field.type === 'textarea' ? (
                        <textarea
                          name={field.name}
                          className="erp-input"
                          value={formData[field.name] || ''}
                          onChange={handleInputChange}
                          disabled={!isEditing || (field.readOnly && selectedRecord)}
                          readOnly={field.readOnly && selectedRecord}
                          rows={3}
                        />
                      ) : (
                        <input
                          type={field.type}
                          name={field.name}
                          className="erp-input"
                          value={formData[field.name] || ''}
                          onChange={handleInputChange}
                          disabled={!isEditing || (field.readOnly && selectedRecord)}
                          readOnly={field.readOnly && selectedRecord}
                          maxLength={field.maxLength}
                          step={field.step}
                        />
                      )}
                    </div>
                  );
                }
              });
              
              return renderedFields;
            })()}

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

          {/* Data Grid - Scrollable */}
          <div className="erp-grid-section">
            <div className="erp-panel-header">{currentModule.name}</div>
            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>
            ) : (
              <div className="erp-grid-container" style={{ maxHeight: 'calc(100vh - 450px)', overflowY: 'auto' }}>
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th style={{ width: '30px' }}></th>
                      {currentModule.columnLabels.map((label, idx) => (
                        <th key={idx} style={{ width: currentModule.columnWidths?.[idx] }}>{label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.length === 0 ? (
                      <tr><td colSpan={currentModule.columns.length + 1} style={{ textAlign: 'center' }}>No records found</td></tr>
                    ) : (
                      paginatedData.map((record, idx) => {
                        const isSelected = selectedRecord && isSameRecord(record, selectedRecord, activeModule);
                        return (
                          <tr 
                            key={idx}
                            className={isSelected ? 'selected' : ''}
                            onClick={() => handleRecordSelect(record)}
                          >
                            <td><input type="checkbox" checked={isSelected} onChange={() => {}} /></td>
                            {currentModule.columns.map((col, colIdx) => {
                              let value = record[col];
                              
                              // Handle checkbox/boolean columns
                              if (col.includes('active') || col.includes('admin') || col.includes('security') || 
                                  col.includes('allow') || col.includes('ready') || col.includes('secure')) {
                                value = value === 1 ? '☑' : '☐';
                                // Color coding for allow/deny
                                if (col.includes('allow')) {
                                  return <td key={colIdx} style={{ color: value === '☑' ? 'green' : 'red', fontWeight: 'bold' }}>{value === '☑' ? 'Allow' : 'Deny'}</td>;
                                }
                              }
                              // Handle date columns
                              else if (col.includes('edtm') || col.includes('mdtm') || col.includes('cdtm')) {
                                value = value ? new Date(value).toLocaleDateString() : '-';
                              }
                              // Default
                              else if (!value && value !== 0) {
                                value = '-';
                              }
                              
                              return <td key={colIdx}>{value}</td>;
                            })}
                          </tr>
                        );
                      })
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
          
          {/* Dynamic filters based on module */}
          {currentModule.filterFields?.includes('ap_apid') && (
            <div className="erp-form-row">
              <label className="erp-form-label">Application ID</label>
              <input 
                type="text" 
                name="ap_apid"
                className="erp-input"
                value={filters.ap_apid || ''}
                onChange={handleFilterChange}
                placeholder="Search..."
              />
            </div>
          )}
          
          {currentModule.filterFields?.includes('mo_apid') && (
            <div className="erp-form-row">
              <label className="erp-form-label">Application</label>
              <select 
                name="mo_apid"
                className="erp-input"
                value={filters.mo_apid || ''}
                onChange={handleFilterChange}
              >
                <option value="">All</option>
                {dropdownData.applications.map(app => (
                  <option key={app.ap_apid} value={app.ap_apid}>{app.ap_apid} - {app.ap_apshort}</option>
                ))}
              </select>
            </div>
          )}
          
          {(currentModule.filterFields?.includes('shortName') || 
            currentModule.filterFields?.includes('ap_apshort') ||
            currentModule.filterFields?.includes('mo_moshort') ||
            currentModule.filterFields?.includes('op_opshort') ||
            currentModule.filterFields?.includes('fn_fnshort')) && (
            <div className="erp-form-row">
              <label className="erp-form-label">Short Name</label>
              <input 
                type="text" 
                name="shortName"
                className="erp-input"
                value={filters.shortName || ''}
                onChange={handleFilterChange}
                placeholder="Type to search..."
              />
            </div>
          )}
          
          {currentModule.filterFields?.includes('active') && (
            <div className="erp-form-row">
              <label className="erp-form-label">Active Status</label>
              <select 
                name="active"
                className="erp-input"
                value={filters.active || ''}
                onChange={handleFilterChange}
              >
                <option value="">All</option>
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>
            </div>
          )}
          
          {currentModule.filterFields?.includes('fp_allow') && (
            <div className="erp-form-row">
              <label className="erp-form-label">Permission Type</label>
              <select 
                name="fp_allow"
                className="erp-input"
                value={filters.fp_allow || ''}
                onChange={handleFilterChange}
              >
                <option value="">All</option>
                <option value="1">Allow</option>
                <option value="0">Deny</option>
              </select>
            </div>
          )}
          
          <div style={{ marginTop: '12px' }}>
            <button 
              className="erp-button" 
              style={{ width: '100%', marginBottom: '4px' }}
              onClick={handleClearFilters}
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Status Bar - Static */}
      <div className="erp-status-bar">
        <div className="erp-status-item">{isEditing ? 'Editing' : 'Ready'}</div>
        <div className="erp-status-item">
          Records: {filteredData.length !== data.length ? `${filteredData.length}/${data.length}` : filteredData.length}
        </div>
        <div className="erp-status-item">
          Showing: {paginatedData.length > 0 ? `${((currentPage - 1) * recordsPerPage) + 1}-${Math.min(currentPage * recordsPerPage, filteredData.length)}` : '0'} of {filteredData.length}
        </div>
        <div className="erp-status-item" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button 
            className="erp-icon-button" 
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            title="First Page"
          >
            |◀
          </button>
          <button 
            className="erp-icon-button" 
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            title="Previous Page"
          >
            ◀
          </button>
          <span style={{ margin: '0 4px', fontSize: '12px' }}>Page {currentPage}/{totalPages || 1}</span>
          <button 
            className="erp-icon-button" 
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
            title="Next Page"
          >
            ▶
          </button>
          <button 
            className="erp-icon-button" 
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages || totalPages === 0}
            title="Last Page"
          >
            ▶|
          </button>
        </div>
      </div>
    </div>
  );
};

export default DynamicAdminPanel;
