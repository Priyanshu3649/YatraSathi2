const express = require('express');
const router = express.Router();
const securityController = require('../controllers/securityController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// ==================== APPLICATION ROUTES ====================
router.get('/applications', securityController.getAllApplications);
router.post('/applications', securityController.createApplication);
router.put('/applications/:id', securityController.updateApplication);
router.delete('/applications/:id', securityController.deleteApplication);

// ==================== MODULE ROUTES ====================
router.get('/modules', securityController.getAllModules);
router.get('/modules/by-app/:appId', securityController.getModulesByApplication);
router.post('/modules', securityController.createModule);

// ==================== USER ROUTES ====================
router.get('/users', securityController.getAllUsers);
router.post('/users', securityController.createUser);

// ==================== CUSTOMER ROUTES ====================
router.get('/customers', securityController.getAllCustomers);

// ==================== ROLE PERMISSION ROUTES ====================
router.get('/role-permissions', securityController.getAllRolePermissions);
router.post('/role-permissions', securityController.createRolePermission);
router.post('/role-permissions/bulk', securityController.bulkAssignRolePermissions);

// ==================== USER PERMISSION ROUTES ====================
router.get('/user-permissions', securityController.getAllUserPermissions);
router.post('/user-permissions', securityController.createUserPermission);
router.get('/user-permissions/effective/:userId', securityController.getEffectivePermissions);

module.exports = router;
