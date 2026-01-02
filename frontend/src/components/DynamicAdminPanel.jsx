import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { showMessage } from './MessageDisplay';
import { parseError, validateFormData } from '../utils/errorParser';
import '../styles/vintage-erp-theme.css';
import '../styles/dynamic-admin-panel.css';

const API_BASE_URL = '/api';

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
  
  // Filter state - Enhanced with all module-specific filters
  const [filters, setFilters] = useState({
    // Application filters
    ap_apid: '',
    ap_apshort: '',
    // Module filters
    mo_apid: '',
    mo_moid: '',
    mo_moshort: '',
    mo_group: '',
    // Operation filters
    op_apid: '',
    op_moid: '',
    op_opid: '',
    op_opshort: '',
    // Role filters
    fn_fnid: '',
    fn_fnshort: '',
    // User filters
    us_usid: '',
    us_usname: '',
    us_email: '',
    us_title: '',
    // Role Permission filters
    fp_fnid: '',
    fp_opid: '',
    fp_allow: '',
    // User Permission filters
    up_usid: '',
    up_opid: '',
    up_allow: '',
    // Customer filters
    cu_custno: '',
    cu_name: '',
    cu_email: '',
    cu_custtype: '',
    cu_status: '',
    // General filters
    shortName: '',
    active: ''
  });
  
  // Filter timeout for live search
  const [filterTimeout, setFilterTimeout] = useState(null);
  
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
      endpoint: '/security/applications',
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
      endpoint: '/security/modules',
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
      endpoint: '/permissions',
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
      endpoint: '/security/roles',
      fields: [
        { name: 'fn_fnid', label: 'Function/Role ID', type: 'text', required: true, readOnly: false, maxLength: 3, pattern: '[A-Z]{1,3}', title: 'Only uppercase letters (A-Z), max 3 characters' },
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
      endpoint: '/security/users',
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
      endpoint: '/security/role-permissions',
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
      endpoint: '/security/user-permissions',
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
      endpoint: '/security/customers',
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
    employees: {
      name: 'Employee Management',
      endpoint: '/security/employees',
      fields: [
        { name: 'us_usid', label: 'Employee ID', type: 'text', required: true, readOnly: false, maxLength: 15 },
        { name: 'us_fname', label: 'First Name', type: 'text', required: true, maxLength: 50 },
        { name: 'us_lname', label: 'Last Name', type: 'text', maxLength: 50 },
        { name: 'us_email', label: 'Email', type: 'email', required: true, maxLength: 100 },
        { name: 'us_phone', label: 'Phone', type: 'tel', required: true, maxLength: 15 },
        { name: 'us_aadhaar', label: 'Aadhaar Number', type: 'text', maxLength: 12, pattern: '[0-9]{12}', title: 'Enter 12-digit Aadhaar number' },
        { name: 'us_pan', label: 'PAN Number', type: 'text', maxLength: 10, pattern: '[A-Z]{5}[0-9]{4}[A-Z]{1}', title: 'Enter valid PAN number (e.g., ABCDE1234F)' },
        { name: 'us_roid', label: 'Role', type: 'dropdown', required: true, source: 'roles', displayField: 'fn_fnshort', valueField: 'fn_fnid' },
        { name: 'us_coid', label: 'Company', type: 'dropdown', required: true, source: 'company', displayField: 'co_coshort', valueField: 'co_coid', defaultValue: 'TRV' },
        { name: 'em_empno', label: 'Employee Number', type: 'text', required: true, maxLength: 10 },
        { name: 'em_designation', label: 'Designation', type: 'text', required: true, maxLength: 50 },
        { name: 'em_dept', label: 'Department', type: 'select', required: true, options: [
          { value: 'BOOKING', label: 'Booking' },
          { value: 'ACCOUNTS', label: 'Accounts' },
          { value: 'HR', label: 'Human Resources' },
          { value: 'SUPPORT', label: 'Customer Support' },
          { value: 'MARKETING', label: 'Marketing & Sales' },
          { value: 'MANAGEMENT', label: 'Management' },
          { value: 'IT', label: 'Information Technology' },
          { value: 'OPERATIONS', label: 'Operations' }
        ]},
        { name: 'em_salary', label: 'Salary', type: 'number', step: '0.01', min: '0' },
        { name: 'em_joindt', label: 'Join Date', type: 'date', required: true },
        { name: 'em_manager', label: 'Manager', type: 'dropdown', source: 'employees', displayField: 'fullName', valueField: 'us_usid' },
        { name: 'em_status', label: 'Employment Status', type: 'select', required: true, defaultValue: 'ACTIVE', options: [
          { value: 'ACTIVE', label: 'Active' },
          { value: 'INACTIVE', label: 'Inactive' },
          { value: 'TERMINATED', label: 'Terminated' },
          { value: 'RESIGNED', label: 'Resigned' }
        ]},
        { name: 'us_addr1', label: 'Address Line 1', type: 'text', maxLength: 100 },
        { name: 'us_addr2', label: 'Address Line 2', type: 'text', maxLength: 100 },
        { name: 'us_city', label: 'City', type: 'text', maxLength: 50 },
        { name: 'us_state', label: 'State', type: 'text', maxLength: 50 },
        { name: 'us_pin', label: 'PIN Code', type: 'text', maxLength: 10, pattern: '[0-9]{6}', title: 'Enter 6-digit PIN code' },
        { name: 'us_active', label: 'User Active', type: 'checkbox', defaultValue: 1 },
        { name: 'lg_active', label: 'Login Active', type: 'checkbox', defaultValue: 1 },
        { name: 'temp_password', label: 'Temporary Password', type: 'password', maxLength: 50, placeholder: 'Leave blank to keep existing password' }
      ],
      columns: ['us_usid', 'fullName', 'us_email', 'us_phone', 'em_empno', 'em_designation', 'em_dept', 'roleName', 'em_status', 'us_active', 'edtm'],
      columnLabels: ['Employee ID', 'Full Name', 'Email', 'Phone', 'Emp No', 'Designation', 'Department', 'Role', 'Status', 'Active', 'Created On'],
      columnWidths: ['120px', '180px', '200px', '130px', '100px', '150px', '120px', '100px', '100px', '70px', '150px'],
      filterFields: ['us_usid', 'fullName', 'us_email', 'em_empno', 'em_dept', 'roleName', 'em_status', 'active'],
      computedFields: [
        { name: 'fullName', label: 'Full Name', formula: (data) => `${data.us_fname || ''} ${data.us_lname || ''}`.trim() },
        { name: 'roleName', label: 'Role Name', formula: (data) => data.Role?.fn_fnshort || data.us_roid || '' }
      ],
      specialFeatures: ['employeeCreation', 'roleAssignment', 'passwordReset']
    },
    // ==================== MASTER DATA MODULES ====================
    stations: {
      name: 'Stations',
      endpoint: '/stations',
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
      endpoint: '/trains',
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
      endpoint: '/company',
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

  // Apply filters - Enhanced live filtering with 500ms debounce
  useEffect(() => {
    let filtered = [...data];
    
    // ==================== APPLICATION FILTERS ====================
    if (filters.ap_apid) {
      filtered = filtered.filter(record => 
        record.ap_apid?.toLowerCase().includes(filters.ap_apid.toLowerCase())
      );
    }
    if (filters.ap_apshort) {
      filtered = filtered.filter(record => 
        record.ap_apshort?.toLowerCase().includes(filters.ap_apshort.toLowerCase())
      );
    }
    
    // ==================== MODULE FILTERS ====================
    if (filters.mo_apid) {
      filtered = filtered.filter(record => record.mo_apid === filters.mo_apid);
    }
    if (filters.mo_moid) {
      filtered = filtered.filter(record => 
        record.mo_moid?.toLowerCase().includes(filters.mo_moid.toLowerCase())
      );
    }
    if (filters.mo_moshort) {
      filtered = filtered.filter(record => 
        record.mo_moshort?.toLowerCase().includes(filters.mo_moshort.toLowerCase())
      );
    }
    if (filters.mo_group) {
      filtered = filtered.filter(record => 
        record.mo_group?.toLowerCase().includes(filters.mo_group.toLowerCase())
      );
    }
    
    // ==================== OPERATION FILTERS ====================
    if (filters.op_apid) {
      filtered = filtered.filter(record => record.op_apid === filters.op_apid);
    }
    if (filters.op_moid) {
      filtered = filtered.filter(record => record.op_moid === filters.op_moid);
    }
    if (filters.op_opid) {
      filtered = filtered.filter(record => 
        record.op_opid?.toLowerCase().includes(filters.op_opid.toLowerCase())
      );
    }
    if (filters.op_opshort) {
      filtered = filtered.filter(record => 
        record.op_opshort?.toLowerCase().includes(filters.op_opshort.toLowerCase())
      );
    }
    
    // ==================== ROLE FILTERS ====================
    if (filters.fn_fnid) {
      filtered = filtered.filter(record => 
        record.fn_fnid?.toLowerCase().includes(filters.fn_fnid.toLowerCase())
      );
    }
    if (filters.fn_fnshort) {
      filtered = filtered.filter(record => 
        record.fn_fnshort?.toLowerCase().includes(filters.fn_fnshort.toLowerCase())
      );
    }
    
    // ==================== USER FILTERS ====================
    if (filters.us_usid) {
      filtered = filtered.filter(record => 
        record.us_usid?.toLowerCase().includes(filters.us_usid.toLowerCase())
      );
    }
    if (filters.us_usname) {
      filtered = filtered.filter(record => 
        record.us_usname?.toLowerCase().includes(filters.us_usname.toLowerCase())
      );
    }
    if (filters.us_email) {
      filtered = filtered.filter(record => 
        record.us_email?.toLowerCase().includes(filters.us_email.toLowerCase())
      );
    }
    if (filters.us_title) {
      filtered = filtered.filter(record => 
        record.us_title?.toLowerCase().includes(filters.us_title.toLowerCase())
      );
    }
    
    // ==================== ROLE PERMISSION FILTERS ====================
    if (filters.fp_fnid) {
      filtered = filtered.filter(record => record.fp_fnid === filters.fp_fnid);
    }
    if (filters.fp_opid) {
      filtered = filtered.filter(record => 
        record.fp_opid?.toLowerCase().includes(filters.fp_opid.toLowerCase())
      );
    }
    if (filters.fp_allow !== '' && filters.fp_allow !== undefined) {
      const allowValue = parseInt(filters.fp_allow);
      filtered = filtered.filter(record => record.fp_allow === allowValue);
    }
    
    // ==================== USER PERMISSION FILTERS ====================
    if (filters.up_usid) {
      filtered = filtered.filter(record => record.up_usid === filters.up_usid);
    }
    if (filters.up_opid) {
      filtered = filtered.filter(record => 
        record.up_opid?.toLowerCase().includes(filters.up_opid.toLowerCase())
      );
    }
    if (filters.up_allow !== '' && filters.up_allow !== undefined) {
      const allowValue = parseInt(filters.up_allow);
      filtered = filtered.filter(record => record.up_allow === allowValue);
    }
    
    // ==================== CUSTOMER FILTERS ====================
    if (filters.cu_custno) {
      filtered = filtered.filter(record => 
        record.cu_custno?.toLowerCase().includes(filters.cu_custno.toLowerCase())
      );
    }
    if (filters.cu_name) {
      filtered = filtered.filter(record => 
        record.cu_name?.toLowerCase().includes(filters.cu_name.toLowerCase())
      );
    }
    if (filters.cu_email) {
      filtered = filtered.filter(record => 
        record.cu_email?.toLowerCase().includes(filters.cu_email.toLowerCase())
      );
    }
    if (filters.cu_custtype) {
      filtered = filtered.filter(record => 
        record.cu_custtype?.toLowerCase().includes(filters.cu_custtype.toLowerCase())
      );
    }
    if (filters.cu_status) {
      filtered = filtered.filter(record => 
        record.cu_status?.toLowerCase().includes(filters.cu_status.toLowerCase())
      );
    }
    
    // ==================== GENERAL FILTERS ====================
    // Filter by short name (LIKE) - works across different field names
    if (filters.shortName) {
      const searchTerm = filters.shortName.toLowerCase();
      filtered = filtered.filter(record => {
        const shortFields = ['ap_apshort', 'mo_moshort', 'op_opshort', 'fn_fnshort', 'us_usname', 'us_email', 'cu_name'];
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
        fetch(`${API_BASE_URL}/security/applications`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/security/modules`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/permissions`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/permissions/roles`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/security/users`, { headers: { 'Authorization': `Bearer ${token}` } })
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
      const response = await fetch(`${API_BASE_URL}${modules[activeModule].endpoint}`, {
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
    
    let processedValue = value;
    
    // Auto-uppercase for fn_fnid field
    if (name === 'fn_fnid') {
      // Convert to uppercase and remove non-alphabetic characters
      processedValue = value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : processedValue
    }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    
    // Clear existing timeout
    if (filterTimeout) {
      clearTimeout(filterTimeout);
    }
    
    // Update filter immediately for UI responsiveness
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Set new timeout for live search (500ms delay)
    const newTimeout = setTimeout(() => {
      // Filter will be applied automatically by useEffect
      console.log('Filter applied:', name, value);
    }, 500);
    
    setFilterTimeout(newTimeout);
  };

  const handleClearFilters = () => {
    // Clear all filters
    setFilters({
      // Application filters
      ap_apid: '',
      ap_apshort: '',
      // Module filters
      mo_apid: '',
      mo_moid: '',
      mo_moshort: '',
      mo_group: '',
      // Operation filters
      op_apid: '',
      op_moid: '',
      op_opid: '',
      op_opshort: '',
      // Role filters
      fn_fnid: '',
      fn_fnshort: '',
      // User filters
      us_usid: '',
      us_usname: '',
      us_email: '',
      us_title: '',
      // Role Permission filters
      fp_fnid: '',
      fp_opid: '',
      fp_allow: '',
      // User Permission filters
      up_usid: '',
      up_opid: '',
      up_allow: '',
      // Customer filters
      cu_custno: '',
      cu_name: '',
      cu_email: '',
      cu_custtype: '',
      cu_status: '',
      // General filters
      shortName: '',
      active: ''
    });
    
    // Clear filter timeout
    if (filterTimeout) {
      clearTimeout(filterTimeout);
    }
    
    // Reload full dataset
    fetchData();
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
      // Validate form data before saving
      const validationErrors = validateFormData(formData, modules[activeModule].fields);
      if (validationErrors.length > 0) {
        showMessage('warning', 'Validation Failed', validationErrors.join('\n'));
        return;
      }

      const token = localStorage.getItem('token');
      const method = selectedRecord ? 'PUT' : 'POST';
      
      // Build URL based on module type (handle composite keys)
      let url = `${API_BASE_URL}${modules[activeModule].endpoint}`;
      
      if (selectedRecord) {
        // Handle composite keys for different modules
        if (activeModule === 'modules') {
          url += `/${selectedRecord.mo_apid}/${selectedRecord.mo_moid}`;
        } else if (activeModule === 'operations') {
          url += `/${selectedRecord.op_apid}/${selectedRecord.op_moid}/${selectedRecord.op_opid}`;
        } else if (activeModule === 'rolePermissions') {
          url += `/${selectedRecord.fp_fnid}/${selectedRecord.fp_opid}`;
        } else if (activeModule === 'userPermissions') {
          url += `/${selectedRecord.up_usid}/${selectedRecord.up_opid}`;
        } else {
          // Single primary key (applications, roles, users, customers)
          url += `/${selectedRecord[modules[activeModule].columns[0]]}`;
        }
      }

      // Show loading message
      showMessage('info', 'Saving...', 'Please wait while we save your changes', 2000);

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const savedData = await response.json();
        console.log('Saved successfully:', savedData);
        
        // Update the selected record and form data with the saved data immediately
        setSelectedRecord(savedData);
        setFormData(savedData);
        
        // Update audit fields immediately from saved data
        const prefixes = ['ap_', 'mo_', 'op_', 'fn_', 'us_', 'fp_', 'up_', 'st_', 'tr_', 'co_', 'cu_'];
        let edtm, eby, mdtm, mby, cdtm, cby;
        
        for (const prefix of prefixes) {
          if (savedData[`${prefix}edtm`]) edtm = savedData[`${prefix}edtm`];
          if (savedData[`${prefix}eby`]) eby = savedData[`${prefix}eby`];
          if (savedData[`${prefix}mdtm`]) mdtm = savedData[`${prefix}mdtm`];
          if (savedData[`${prefix}mby`]) mby = savedData[`${prefix}mby`];
          if (savedData[`${prefix}cdtm`]) cdtm = savedData[`${prefix}cdtm`];
          if (savedData[`${prefix}cby`]) cby = savedData[`${prefix}cby`];
        }
        
        setAuditData({
          enteredOn: edtm ? new Date(edtm).toLocaleString() : '',
          enteredBy: eby || '',
          modifiedOn: mdtm ? new Date(mdtm).toLocaleString() : '',
          modifiedBy: mby || '',
          closedOn: cdtm ? new Date(cdtm).toLocaleString() : '',
          closedBy: cby || ''
        });
        
        // Refresh the data list in background
        await fetchData();
        setIsEditing(false);
        
        // Show success message
        showMessage('success', 'Record Saved', 'The record was saved successfully');
      } else {
        const errorData = await response.json();
        console.error('Save failed:', errorData);
        
        // Parse error and show user-friendly message
        const { type, title, description } = parseError(null, errorData);
        showMessage(type, title, description);
      }
    } catch (error) {
      console.error('Error saving record:', error);
      
      // Parse error and show user-friendly message
      const { type, title, description } = parseError(error);
      showMessage(type, title, description);
    }
  };

  const handleDelete = async () => {
    if (!selectedRecord) {
      showMessage('warning', 'No Selection', 'Please select a record to delete');
      return;
    }

    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        const token = localStorage.getItem('token');
        
        // Build URL based on module type (handle composite keys)
        let url = `${API_BASE_URL}${modules[activeModule].endpoint}`;
        
        if (activeModule === 'modules') {
          url += `/${selectedRecord.mo_apid}/${selectedRecord.mo_moid}`;
        } else if (activeModule === 'operations') {
          url += `/${selectedRecord.op_apid}/${selectedRecord.op_moid}/${selectedRecord.op_opid}`;
        } else if (activeModule === 'rolePermissions') {
          url += `/${selectedRecord.fp_fnid}/${selectedRecord.fp_opid}`;
        } else if (activeModule === 'userPermissions') {
          url += `/${selectedRecord.up_usid}/${selectedRecord.up_opid}`;
        } else {
          // Single primary key
          url += `/${selectedRecord[modules[activeModule].columns[0]]}`;
        }
        
        // Show loading message
        showMessage('info', 'Deleting...', 'Please wait', 2000);
        
        const response = await fetch(url, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          showMessage('success', 'Record Deleted', 'The record was deleted successfully');
          fetchData();
          handleNew();
        } else {
          const errorData = await response.json();
          console.error('Delete failed:', errorData);
          
          // Parse error and show user-friendly message
          const { type, title, description } = parseError(null, errorData);
          showMessage(type, title, description);
        }
      } catch (error) {
        const { type, title, description } = parseError(error);
        showMessage(type, title, description);
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
                <div 
                  className={`erp-nav-item sub-item ${activeModule === 'employees' ? 'active' : ''}`}
                  onClick={() => handleModuleChange('employees')}
                >
                  Employee Management
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
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
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
                          pattern={field.pattern}
                          title={field.title}
                          style={field.name === 'fn_fnid' ? { textTransform: 'uppercase' } : {}}
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

        {/* Right Filter Panel - Enhanced with Module-Specific Filters */}
        <div className="erp-filter-panel">
          <div className="erp-filter-header">
            Filter Criteria
            {(filteredData.length !== data.length) && (
              <span className="erp-filter-indicator">{filteredData.length}/{data.length}</span>
            )}
          </div>
          
          {/* ==================== APPLICATION FILTERS ==================== */}
          {activeModule === 'applications' && (
            <>
              <div className="erp-form-row">
                <label className="erp-form-label">Application ID</label>
                <input 
                  type="text" 
                  name="ap_apid"
                  className={`erp-input ${filters.ap_apid ? 'has-value' : ''}`}
                  value={filters.ap_apid || ''}
                  onChange={handleFilterChange}
                  placeholder="Search ID..."
                />
              </div>
              <div className="erp-form-row">
                <label className="erp-form-label">Short Name</label>
                <input 
                  type="text" 
                  name="ap_apshort"
                  className={`erp-input ${filters.ap_apshort ? 'has-value' : ''}`}
                  value={filters.ap_apshort || ''}
                  onChange={handleFilterChange}
                  placeholder="Search name..."
                />
              </div>
            </>
          )}
          
          {/* ==================== MODULE FILTERS ==================== */}
          {activeModule === 'modules' && (
            <>
              <div className="erp-form-row">
                <label className="erp-form-label">Application</label>
                <select 
                  name="mo_apid"
                  className={`erp-input ${filters.mo_apid ? 'has-value' : ''}`}
                  value={filters.mo_apid || ''}
                  onChange={handleFilterChange}
                >
                  <option value="">All Applications</option>
                  {dropdownData.applications.map(app => (
                    <option key={app.ap_apid} value={app.ap_apid}>{app.ap_apid} - {app.ap_apshort}</option>
                  ))}
                </select>
              </div>
              <div className="erp-form-row">
                <label className="erp-form-label">Module ID</label>
                <input 
                  type="text" 
                  name="mo_moid"
                  className={`erp-input ${filters.mo_moid ? 'has-value' : ''}`}
                  value={filters.mo_moid || ''}
                  onChange={handleFilterChange}
                  placeholder="Search module ID..."
                />
              </div>
              <div className="erp-form-row">
                <label className="erp-form-label">Short Name</label>
                <input 
                  type="text" 
                  name="mo_moshort"
                  className={`erp-input ${filters.mo_moshort ? 'has-value' : ''}`}
                  value={filters.mo_moshort || ''}
                  onChange={handleFilterChange}
                  placeholder="Search name..."
                />
              </div>
              <div className="erp-form-row">
                <label className="erp-form-label">Group</label>
                <input 
                  type="text" 
                  name="mo_group"
                  className={`erp-input ${filters.mo_group ? 'has-value' : ''}`}
                  value={filters.mo_group || ''}
                  onChange={handleFilterChange}
                  placeholder="Search group..."
                />
              </div>
            </>
          )}
          
          {/* ==================== OPERATION FILTERS ==================== */}
          {activeModule === 'operations' && (
            <>
              <div className="erp-form-row">
                <label className="erp-form-label">Application</label>
                <select 
                  name="op_apid"
                  className={`erp-input ${filters.op_apid ? 'has-value' : ''}`}
                  value={filters.op_apid || ''}
                  onChange={handleFilterChange}
                >
                  <option value="">All Applications</option>
                  {dropdownData.applications.map(app => (
                    <option key={app.ap_apid} value={app.ap_apid}>{app.ap_apid} - {app.ap_apshort}</option>
                  ))}
                </select>
              </div>
              <div className="erp-form-row">
                <label className="erp-form-label">Module</label>
                <select 
                  name="op_moid"
                  className={`erp-input ${filters.op_moid ? 'has-value' : ''}`}
                  value={filters.op_moid || ''}
                  onChange={handleFilterChange}
                >
                  <option value="">All Modules</option>
                  {dropdownData.modules
                    .filter(mod => !filters.op_apid || mod.mo_apid === filters.op_apid)
                    .map(mod => (
                      <option key={mod.mo_moid} value={mod.mo_moid}>{mod.mo_moid} - {mod.mo_moshort}</option>
                    ))}
                </select>
              </div>
              <div className="erp-form-row">
                <label className="erp-form-label">Operation ID</label>
                <input 
                  type="text" 
                  name="op_opid"
                  className={`erp-input ${filters.op_opid ? 'has-value' : ''}`}
                  value={filters.op_opid || ''}
                  onChange={handleFilterChange}
                  placeholder="Search operation..."
                />
              </div>
              <div className="erp-form-row">
                <label className="erp-form-label">Short Name</label>
                <input 
                  type="text" 
                  name="op_opshort"
                  className={`erp-input ${filters.op_opshort ? 'has-value' : ''}`}
                  value={filters.op_opshort || ''}
                  onChange={handleFilterChange}
                  placeholder="Search name..."
                />
              </div>
            </>
          )}
          
          {/* ==================== ROLE LIST FILTERS ==================== */}
          {activeModule === 'roles' && (
            <>
              <div className="erp-form-row">
                <label className="erp-form-label">Role ID</label>
                <input 
                  type="text" 
                  name="fn_fnid"
                  className={`erp-input ${filters.fn_fnid ? 'has-value' : ''}`}
                  value={filters.fn_fnid || ''}
                  onChange={handleFilterChange}
                  placeholder="Search role ID..."
                />
              </div>
              <div className="erp-form-row">
                <label className="erp-form-label">Role Name</label>
                <input 
                  type="text" 
                  name="fn_fnshort"
                  className={`erp-input ${filters.fn_fnshort ? 'has-value' : ''}`}
                  value={filters.fn_fnshort || ''}
                  onChange={handleFilterChange}
                  placeholder="Search name..."
                />
              </div>
            </>
          )}
          
          {/* ==================== USER LIST FILTERS ==================== */}
          {activeModule === 'users' && (
            <>
              <div className="erp-form-row">
                <label className="erp-form-label">User ID</label>
                <input 
                  type="text" 
                  name="us_usid"
                  className={`erp-input ${filters.us_usid ? 'has-value' : ''}`}
                  value={filters.us_usid || ''}
                  onChange={handleFilterChange}
                  placeholder="Search user ID..."
                />
              </div>
              <div className="erp-form-row">
                <label className="erp-form-label">User Name</label>
                <input 
                  type="text" 
                  name="us_usname"
                  className={`erp-input ${filters.us_usname ? 'has-value' : ''}`}
                  value={filters.us_usname || ''}
                  onChange={handleFilterChange}
                  placeholder="Search name..."
                />
              </div>
              <div className="erp-form-row">
                <label className="erp-form-label">Email</label>
                <input 
                  type="text" 
                  name="us_email"
                  className={`erp-input ${filters.us_email ? 'has-value' : ''}`}
                  value={filters.us_email || ''}
                  onChange={handleFilterChange}
                  placeholder="Search email..."
                />
              </div>
              <div className="erp-form-row">
                <label className="erp-form-label">Title</label>
                <input 
                  type="text" 
                  name="us_title"
                  className={`erp-input ${filters.us_title ? 'has-value' : ''}`}
                  value={filters.us_title || ''}
                  onChange={handleFilterChange}
                  placeholder="Search title..."
                />
              </div>
            </>
          )}
          
          {/* ==================== ROLE PERMISSION FILTERS ==================== */}
          {activeModule === 'rolePermissions' && (
            <>
              <div className="erp-form-row">
                <label className="erp-form-label">Role</label>
                <select 
                  name="fp_fnid"
                  className={`erp-input ${filters.fp_fnid ? 'has-value' : ''}`}
                  value={filters.fp_fnid || ''}
                  onChange={handleFilterChange}
                >
                  <option value="">All Roles</option>
                  {dropdownData.roles.map(role => (
                    <option key={role.fn_fnid} value={role.fn_fnid}>{role.fn_fnid} - {role.fn_fnshort}</option>
                  ))}
                </select>
              </div>
              <div className="erp-form-row">
                <label className="erp-form-label">Operation ID</label>
                <input 
                  type="text" 
                  name="fp_opid"
                  className={`erp-input ${filters.fp_opid ? 'has-value' : ''}`}
                  value={filters.fp_opid || ''}
                  onChange={handleFilterChange}
                  placeholder="Search operation..."
                />
              </div>
              <div className="erp-form-row">
                <label className="erp-form-label">Permission Type</label>
                <select 
                  name="fp_allow"
                  className={`erp-input ${filters.fp_allow !== '' ? 'has-value' : ''}`}
                  value={filters.fp_allow || ''}
                  onChange={handleFilterChange}
                >
                  <option value="">All</option>
                  <option value="1">Allow</option>
                  <option value="0">Deny</option>
                </select>
              </div>
            </>
          )}
          
          {/* ==================== USER PERMISSION FILTERS ==================== */}
          {activeModule === 'userPermissions' && (
            <>
              <div className="erp-form-row">
                <label className="erp-form-label">User</label>
                <select 
                  name="up_usid"
                  className={`erp-input ${filters.up_usid ? 'has-value' : ''}`}
                  value={filters.up_usid || ''}
                  onChange={handleFilterChange}
                >
                  <option value="">All Users</option>
                  {dropdownData.users.map(user => (
                    <option key={user.us_usid} value={user.us_usid}>{user.us_usid} - {user.us_usname}</option>
                  ))}
                </select>
              </div>
              <div className="erp-form-row">
                <label className="erp-form-label">Operation ID</label>
                <input 
                  type="text" 
                  name="up_opid"
                  className={`erp-input ${filters.up_opid ? 'has-value' : ''}`}
                  value={filters.up_opid || ''}
                  onChange={handleFilterChange}
                  placeholder="Search operation..."
                />
              </div>
              <div className="erp-form-row">
                <label className="erp-form-label">Permission Type</label>
                <select 
                  name="up_allow"
                  className={`erp-input ${filters.up_allow !== '' ? 'has-value' : ''}`}
                  value={filters.up_allow || ''}
                  onChange={handleFilterChange}
                >
                  <option value="">All</option>
                  <option value="1">Allow</option>
                  <option value="0">Deny</option>
                </select>
              </div>
            </>
          )}
          
          {/* ==================== CUSTOMER LIST FILTERS ==================== */}
          {activeModule === 'customers' && (
            <>
              <div className="erp-form-row">
                <label className="erp-form-label">Customer No</label>
                <input 
                  type="text" 
                  name="cu_custno"
                  className={`erp-input ${filters.cu_custno ? 'has-value' : ''}`}
                  value={filters.cu_custno || ''}
                  onChange={handleFilterChange}
                  placeholder="Search customer no..."
                />
              </div>
              <div className="erp-form-row">
                <label className="erp-form-label">Customer Name</label>
                <input 
                  type="text" 
                  name="cu_name"
                  className={`erp-input ${filters.cu_name ? 'has-value' : ''}`}
                  value={filters.cu_name || ''}
                  onChange={handleFilterChange}
                  placeholder="Search name..."
                />
              </div>
              <div className="erp-form-row">
                <label className="erp-form-label">Email</label>
                <input 
                  type="text" 
                  name="cu_email"
                  className={`erp-input ${filters.cu_email ? 'has-value' : ''}`}
                  value={filters.cu_email || ''}
                  onChange={handleFilterChange}
                  placeholder="Search email..."
                />
              </div>
              <div className="erp-form-row">
                <label className="erp-form-label">Customer Type</label>
                <input 
                  type="text" 
                  name="cu_custtype"
                  className={`erp-input ${filters.cu_custtype ? 'has-value' : ''}`}
                  value={filters.cu_custtype || ''}
                  onChange={handleFilterChange}
                  placeholder="Search type..."
                />
              </div>
              <div className="erp-form-row">
                <label className="erp-form-label">Status</label>
                <input 
                  type="text" 
                  name="cu_status"
                  className={`erp-input ${filters.cu_status ? 'has-value' : ''}`}
                  value={filters.cu_status || ''}
                  onChange={handleFilterChange}
                  placeholder="Search status..."
                />
              </div>
            </>
          )}
          
          {/* ==================== COMMON FILTERS ==================== */}
          {currentModule.filterFields?.includes('active') && (
            <div className="erp-form-row">
              <label className="erp-form-label">Active Status</label>
              <select 
                name="active"
                className={`erp-input ${filters.active !== '' ? 'has-value' : ''}`}
                value={filters.active || ''}
                onChange={handleFilterChange}
              >
                <option value="">All</option>
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>
            </div>
          )}
          
          <div style={{ marginTop: '12px', display: 'flex', gap: '4px' }}>
            <button 
              className="erp-button" 
              style={{ flex: 1 }}
              onClick={handleClearFilters}
              title="Clear all filters and reload data"
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
