const { User, Employee, Role, RolePermission } = require('../models');

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

    // Get user's role and department
    const user = await User.findOne({
      where: { us_usid: req.user.us_usid },
      include: [
        {
          model: Employee,
          attributes: ['em_dept', 'em_designation', 'em_status']
        }
      ]
    });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: { code: 'USER_NOT_FOUND', message: 'User not found' } 
      });
    }

    // Check if employee is active
    if (user.Employee && user.Employee.em_status !== 'ACTIVE') {
      return res.status(403).json({ 
        success: false, 
        error: { code: 'EMPLOYEE_INACTIVE', message: 'Employee account is inactive' } 
      });
    }

    // Get role permissions
    const permissions = await RolePermission.findAll({
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

    // Attach user details and permissions to request
    req.userDetails = {
      userId: user.us_usid,
      role: user.us_roid,
      department: user.Employee?.em_dept,
      designation: user.Employee?.em_designation,
      status: user.Employee?.em_status,
      permissions: permissions.map(p => ({
        function: p.fnXfunction?.fn_fnshort,
        type: p.fnXfunction?.fn_fndesc,
        allow: p.rp_allow
      }))
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