const { User, Employee, Role, RolePermission, UserTVL, EmployeeTVL, RolePermissionTVL, RoleTVL, PermissionTVL } = require('../models');

/**
 * Department Access Control Middleware
 * Fetches role permissions from database and attaches to request
 */
const departmentAccessControl = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' } 
      });
    }

    // Check if this is a TVL user by ID prefix
    const isTVLUser = req.user.us_usid.startsWith('ADM') || req.user.us_usid.startsWith('EMP') || 
                      req.user.us_usid.startsWith('ACC') || req.user.us_usid.startsWith('CUS');

    let user = null;
    let employee = null;
    
    if (isTVLUser) {
      // Get TVL user's role and department
      user = await UserTVL.findByPk(req.user.us_usid);
      
      // Get employee details separately to avoid circular dependency
      if (req.user.us_usid.startsWith('EMP') || req.user.us_usid.startsWith('ADM') || 
          req.user.us_usid.startsWith('ACC')) {
        employee = await EmployeeTVL.findByPk(req.user.us_usid);
      }
    } else {
      // Get regular user's role and department
      user = await User.findOne({
        where: { us_usid: req.user.us_usid },
        include: [
          {
            model: Employee,
            attributes: ['em_dept', 'em_status']
          }
        ]
      });
      
      // Extract employee from the included data
      employee = user?.Employee;
    }

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: { code: 'USER_NOT_FOUND', message: 'User not found' } 
      });
    }

    // Check if employee is active
    if (employee && employee.em_status !== 'ACTIVE') {
      return res.status(403).json({ 
        success: false, 
        error: { code: 'EMPLOYEE_INACTIVE', message: 'Employee account is inactive' } 
      });
    }

    // Get role permissions
    let permissions = [];
    if (isTVLUser && user.us_roid) {
      const rolePermissions = await RolePermissionTVL.findAll({
        where: { 
          fp_fnid: user.us_roid,
          fp_active: 1 
        },
        include: [
          {
            model: RoleTVL,
            as: 'Role',
            attributes: ['fn_fnshort', 'fn_fndesc']
          }
        ]
      });

      // Map TVL permissions to common format
      // Note: TVL uses composite ID in fp_opid which implicitly defines the permission/function
      // We are using RoleTVL to get the function name/description
      permissions = rolePermissions.map(p => ({
        function: p.Role?.fn_fnshort,
        type: p.Role?.fn_fndesc,
        allow: p.fp_allow
      }));

    } else if (!isTVLUser && user.us_roid) {
      const rolePermissions = await RolePermission.findAll({
        where: { 
          rp_roid: user.us_roid,
          rp_active: 1 
        },
        include: [
          {
            model: Role,
            attributes: ['fn_fnshort', 'fn_fndesc']
          }
        ]
      });

      permissions = rolePermissions.map(p => ({
        function: p.fnXfunction?.fn_fnshort,
        type: p.fnXfunction?.fn_fndesc,
        allow: p.rp_allow
      }));
    }

    // Attach user details and permissions to request
    req.userDetails = {
      userId: user.us_usid,
      role: user.us_roid || user.us_usertype,
      department: employee?.em_dept,
      status: employee?.em_status,
      permissions: permissions
    };

    next();
  } catch (error) {
    console.error('Department access control error:', error);
    res.status(500).json({ 
      success: false, 
      error: { code: 'SERVER_ERROR', message: 'Internal server error' } 
    });
  }
};

/**
 * Check if user has specific permission
 */
const hasPermission = (functionName, allowType = 1) => {
  return (req, res, next) => {
    if (!req.userDetails || !req.userDetails.permissions) {
      return res.status(403).json({ 
        success: false, 
        error: { code: 'FORBIDDEN', message: 'Access denied' } 
      });
    }

    const permission = req.userDetails.permissions.find(p => 
      p.function === functionName && p.allow >= allowType
    );

    if (!permission) {
      return res.status(403).json({ 
        success: false, 
        error: { code: 'INSUFFICIENT_PERMISSIONS', message: 'Insufficient permissions' } 
      });
    }

    next();
  };
};

/**
 * Check department access
 */
const checkDepartmentAccess = (allowedDepartments) => {
  return (req, res, next) => {
    if (!req.userDetails || !req.userDetails.department) {
      return res.status(403).json({ 
        success: false, 
        error: { code: 'FORBIDDEN', message: 'Department access required' } 
      });
    }

    if (!allowedDepartments.includes(req.userDetails.department)) {
      return res.status(403).json({ 
        success: false, 
        error: { code: 'DEPARTMENT_ACCESS_DENIED', message: 'Department access denied' } 
      });
    }

    next();
  };
};

module.exports = {
  departmentAccessControl,
  hasPermission,
  checkDepartmentAccess
};