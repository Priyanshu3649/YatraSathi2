const { Role, Permission, RolePermission } = require('../models');
const Sequelize = require('sequelize');

// Middleware to check if user has a specific role
const requireRole = (roles) => {
  return async (req, res, next) => {
    try {
      // If roles is a string, convert to array
      const allowedRoles = Array.isArray(roles) ? roles : [roles];
      
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({ message: 'Access denied. No user authenticated.' });
      }
      
      // Check if user's role is in allowed roles
      // For TVL users, role is stored in us_roid field
      if (!allowedRoles.includes(req.user.us_roid)) {
        return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
      }
      
      next();
    } catch (error) {
      console.error('RBAC error:', error.message);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
};

// Middleware to check if user has specific permissions
const requirePermission = (permissions) => {
  return async (req, res, next) => {
    try {
      // If permissions is a string, convert to array
      const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];
      
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({ message: 'Access denied. No user authenticated.' });
      }
      
      // Get user's role
      const userRole = await Role.findByPk(req.user.us_roid);
      
      if (!userRole) {
        return res.status(403).json({ message: 'Access denied. User role not found.' });
      }
      
      // Get all permissions for this role
      const rolePermissions = await RolePermission.findAll({
        where: { rp_roid: userRole.ur_roid },
        include: [{
          model: Permission,
          as: 'Permission'
        }]
      });
      
      // Extract permission codes
      const userPermissions = rolePermissions.map(rp => {
        return rp.Permission ? rp.Permission.pr_peid : null;
      }).filter(Boolean);
      
      const userPermissionShortNames = rolePermissions.map(rp => {
        return rp.Permission ? rp.Permission.pr_peshort : null;
      }).filter(Boolean);
      
      // Check if user has all required permissions
      const hasPermission = requiredPermissions.every(permission => 
        userPermissions.includes(permission) || userPermissionShortNames.includes(permission)
      );
      
      if (!hasPermission) {
        return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
      }
      
      // Attach role permissions to request
      req.rolePermissions = rolePermissions;
      next();
    } catch (error) {
      console.error('RBAC permission error:', error.message);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
};

// Middleware to check if user has specific permission actions (view, add, modify, delete)
const requirePermissionAction = (permission, action) => {
  return async (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({ message: 'Access denied. No user authenticated.' });
      }
      
      // Get user's role
      const userRole = await Role.findByPk(req.user.us_roid);
      
      if (!userRole) {
        return res.status(403).json({ message: 'Access denied. User role not found.' });
      }
      
      // Get the specific permission
      const perm = await Permission.findOne({
        where: {
          [Sequelize.Op.or]: [
            { pr_peid: permission },
            { pr_peshort: permission }
          ]
        }
      });
      
      if (!perm) {
        return res.status(400).json({ message: 'Invalid permission specified.' });
      }
      
      // Get role permission for this specific permission
      const rolePermission = await RolePermission.findOne({
        where: {
          rp_roid: userRole.ur_roid,
          rp_peid: perm.pr_peid
        }
      });
      
      if (!rolePermission) {
        return res.status(403).json({ message: 'Access denied. Permission not granted.' });
      }
      
      // Check if user has the required action permission
      let hasActionPermission = false;
      switch (action.toLowerCase()) {
        case 'view':
          hasActionPermission = rolePermission.rp_canview === 1;
          break;
        case 'add':
        case 'create':
          hasActionPermission = rolePermission.rp_canadd === 1;
          break;
        case 'modify':
        case 'update':
        case 'edit':
          hasActionPermission = rolePermission.rp_canmod === 1;
          break;
        case 'delete':
        case 'remove':
          hasActionPermission = rolePermission.rp_candel === 1;
          break;
        default:
          return res.status(400).json({ message: 'Invalid action specified.' });
      }
      
      if (!hasActionPermission) {
        return res.status(403).json({ message: `Access denied. No permission to ${action} this resource.` });
      }
      
      // Attach role permission to request
      req.rolePermission = rolePermission;
      next();
    } catch (error) {
      console.error('RBAC permission action error:', error.message);
      console.error('Error stack:', error.stack);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
};

module.exports = {
  requireRole,
  requirePermission,
  requirePermissionAction
};