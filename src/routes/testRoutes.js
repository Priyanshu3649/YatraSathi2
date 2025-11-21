const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole, requirePermission, requirePermissionAction } = require('../middleware/rbacMiddleware');

const router = express.Router();

// Test route that requires admin role
router.get('/admin-only', authMiddleware, requireRole(['ADM', 'ADMIN']), (req, res) => {
  res.json({ 
    message: 'Success! You have admin access.',
    user: req.user.us_fname,
    role: req.role ? req.role.ur_rodesc : 'No role assigned'
  });
});

// Test route that requires user management permission
router.get('/user-mgmt', authMiddleware, requirePermission(['USR', 'USER_MGMT']), (req, res) => {
  res.json({ 
    message: 'Success! You have user management permission.',
    user: req.user.us_fname,
    permissions: req.rolePermissions ? req.rolePermissions.length : 0
  });
});

// Test route that requires view action on booking management
router.get('/booking-view', authMiddleware, requirePermissionAction('BKG', 'view'), (req, res) => {
  res.json({ 
    message: 'Success! You can view bookings.',
    user: req.user.us_fname,
    permission: req.rolePermission ? {
      canView: req.rolePermission.rp_canview,
      canAdd: req.rolePermission.rp_canadd,
      canModify: req.rolePermission.rp_canmod,
      canDelete: req.rolePermission.rp_candel
    } : 'No permission assigned'
  });
});

module.exports = router;