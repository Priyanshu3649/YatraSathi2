/**
 * Report Role-Based Access Control Middleware
 * Enforces granular permissions for report operations
 */

// Define report permissions by role
const reportPermissions = {
  // Admin has full access to all report features
  admin: [
    'reports.access',
    'reports.all_types',
    'reports.export.pdf',
    'reports.export.excel',
    'reports.export.csv',
    'reports.templates.create',
    'reports.templates.view',
    'reports.templates.edit',
    'reports.templates.delete',
    'reports.templates.share',
    'reports.history.view',
    'reports.custom_queries',
    'reports.audit_logs'
  ],
  
  // Manager has operational and financial report access
  manager: [
    'reports.access',
    'reports.operational',
    'reports.financial_summary',
    'reports.export.pdf',
    'reports.export.excel',
    'reports.templates.create',
    'reports.templates.view',
    'reports.templates.edit',
    'reports.history.view'
  ],
  
  // Regular employees have limited access to their own data
  employee: [
    'reports.access',
    'reports.own_data',
    'reports.basic_export',
    'reports.templates.create',
    'reports.templates.view_own'
  ],
  
  // Auditors have read-only access with export capabilities
  auditor: [
    'reports.access',
    'reports.read_only',
    'reports.export.pdf',
    'reports.export.excel',
    'reports.export.csv',
    'reports.history.view',
    'reports.audit_logs'
  ],
  
  // Customers have very limited access
  customer: [
    'reports.access',
    'reports.own_bookings',
    'reports.own_bills',
    'reports.own_payments'
  ]
};

// Map user roles to permission groups
const roleMappings = {
  'ADM': 'admin',
  'MGT': 'manager',
  'AGT': 'employee',
  'ACC': 'employee',
  'HR': 'employee',
  'CC': 'employee',
  'MKT': 'employee',
  'AUD': 'auditor',
  'CUS': 'customer'
};

/**
 * Check if user has specific report permission
 * @param {Object} user - User object from auth middleware
 * @param {string} permission - Permission to check
 * @returns {boolean} Whether user has permission
 */
function hasReportPermission(user, permission) {
  const userRoleGroup = roleMappings[user.us_roid] || user.us_usertype;
  const permissions = reportPermissions[userRoleGroup] || [];
  
  return permissions.includes(permission);
}

/**
 * Check if user can access specific report type
 * @param {Object} user - User object
 * @param {string} reportType - Report type to check
 * @returns {boolean} Whether user can access report type
 */
function canAccessReportType(user, reportType) {
  const userRoleGroup = roleMappings[user.us_roid] || user.us_usertype;
  
  // Admin can access all report types
  if (userRoleGroup === 'admin') {
    return true;
  }
  
  // Define report type access by role
  const reportAccess = {
    manager: ['booking', 'billing', 'payment', 'customer', 'employee', 'financial'],
    employee: ['booking', 'billing', 'payment', 'customer'],
    auditor: ['booking', 'billing', 'payment', 'financial'],
    customer: ['booking', 'billing', 'payment']
  };
  
  const accessibleReports = reportAccess[userRoleGroup] || [];
  return accessibleReports.includes(reportType.toLowerCase());
}

/**
 * Check if user can perform export operation
 * @param {Object} user - User object
 * @param {string} exportType - Export format (pdf, excel, csv)
 * @returns {boolean} Whether user can export
 */
function canExport(user, exportType) {
  const userRoleGroup = roleMappings[user.us_roid] || user.us_usertype;
  
  const exportPermissions = {
    admin: ['pdf', 'excel', 'csv'],
    manager: ['pdf', 'excel'],
    employee: ['pdf'],
    auditor: ['pdf', 'excel', 'csv'],
    customer: []
  };
  
  const allowedExports = exportPermissions[userRoleGroup] || [];
  return allowedExports.includes(exportType.toLowerCase());
}

/**
 * Check if user can access specific data based on ownership
 * @param {Object} user - User object
 * @param {string} reportType - Report type
 * @param {Object} filters - Report filters
 * @returns {boolean} Whether user can access the data
 */
function canAccessData(user, reportType, filters) {
  const userRoleGroup = roleMappings[user.us_roid] || user.us_usertype;
  
  // Admin and manager have unrestricted access
  if (['admin', 'manager'].includes(userRoleGroup)) {
    return true;
  }
  
  // For employees and customers, check data ownership
  if (['employee', 'customer'].includes(userRoleGroup)) {
    // If no filters specified, restrict to user's own data
    if (!filters || Object.keys(filters).length === 0) {
      return false;
    }
    
    // Check if filters include user-specific constraints
    const ownershipFilters = {
      booking: ['bk_usid', 'bk_agent'],
      billing: ['bi_customer_id', 'bi_created_by'],
      payment: ['pt_customer_id', 'pt_created_by'],
      customer: ['cu_usid']
    };
    
    const requiredFilters = ownershipFilters[reportType.toLowerCase()] || [];
    const hasOwnershipFilter = requiredFilters.some(filter => 
      filters[filter] === user.us_usid
    );
    
    return hasOwnershipFilter;
  }
  
  // Auditors have read-only access to all data
  if (userRoleGroup === 'auditor') {
    return true;
  }
  
  return false;
}

/**
 * Middleware to check report access permission
 * @param {string} permission - Required permission
 */
function checkReportPermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    if (!hasReportPermission(req.user, permission)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions for this report operation'
      });
    }
    
    next();
  };
}

/**
 * Middleware to validate report type access
 */
function validateReportTypeAccess() {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const reportType = req.body.reportType || req.query.reportType;
    if (!reportType) {
      return res.status(400).json({
        success: false,
        message: 'Report type is required'
      });
    }
    
    if (!canAccessReportType(req.user, reportType)) {
      return res.status(403).json({
        success: false,
        message: `Access denied to ${reportType} reports`
      });
    }
    
    next();
  };
}

/**
 * Middleware to validate export permissions
 */
function validateExportPermission() {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const exportType = req.body.exportType || req.query.exportType || 'pdf';
    if (!canExport(req.user, exportType)) {
      return res.status(403).json({
        success: false,
        message: `Export permission denied for ${exportType} format`
      });
    }
    
    next();
  };
}

/**
 * Middleware to validate data access based on ownership
 */
function validateDataAccess() {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const reportType = req.body.reportType || req.query.reportType;
    const filters = req.body.filters || req.query.filters || {};
    
    if (!canAccessData(req.user, reportType, filters)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to requested data'
      });
    }
    
    next();
  };
}

module.exports = {
  hasReportPermission,
  canAccessReportType,
  canExport,
  canAccessData,
  checkReportPermission,
  validateReportTypeAccess,
  validateExportPermission,
  validateDataAccess,
  reportPermissions,
  roleMappings
};