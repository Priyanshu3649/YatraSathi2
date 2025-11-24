const express = require('express');
const {
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  deleteRole,
  getAllPermissions,
  createPermission
} = require('../controllers/permissionController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Admin-only routes
router.use(async (req, res, next) => {
  // Check if user is admin
  if (req.user.us_usertype !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin access required.' });
  }
  next();
});

// Role management routes
router.post('/roles', createRole);
router.get('/roles', getAllRoles);
router.get('/roles/:id', getRoleById);
router.put('/roles/:id', updateRole);
router.delete('/roles/:id', deleteRole);

// Permission/Operation management routes
router.get('/', getAllPermissions);
router.post('/', createPermission);

module.exports = router;