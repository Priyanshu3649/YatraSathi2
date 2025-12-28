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
router.put('/modules/:appId/:moduleId', securityController.updateModule);
router.delete('/modules/:appId/:moduleId', securityController.deleteModule);

// ==================== OPERATION ROUTES ====================
router.get('/operations', securityController.getAllOperations);
router.post('/operations', securityController.createOperation);
router.put('/operations/:appId/:moduleId/:opId', securityController.updateOperation);
router.delete('/operations/:appId/:moduleId/:opId', securityController.deleteOperation);

// ==================== ROLE ROUTES ====================
router.get('/roles', securityController.getAllRoles);
router.post('/roles', securityController.createRole);
router.put('/roles/:id', securityController.updateRole);
router.delete('/roles/:id', securityController.deleteRole);

// ==================== USER ROUTES ====================
router.get('/users', securityController.getAllUsers);
router.post('/users', securityController.createUser);
router.put('/users/:id', securityController.updateUser);
router.delete('/users/:id', securityController.deleteUser);

// ==================== CUSTOMER ROUTES ====================
router.get('/customers', securityController.getAllCustomers);
router.put('/customers/:id', securityController.updateCustomer);
router.delete('/customers/:id', securityController.deleteCustomer);

// ==================== ROLE PERMISSION ROUTES ====================
router.get('/role-permissions', securityController.getAllRolePermissions);
router.post('/role-permissions', securityController.createRolePermission);
router.put('/role-permissions/:roleId/:opId', securityController.updateRolePermission);
router.delete('/role-permissions/:roleId/:opId', securityController.deleteRolePermission);
router.post('/role-permissions/bulk', securityController.bulkAssignRolePermissions);

// ==================== USER PERMISSION ROUTES ====================
router.get('/user-permissions', securityController.getAllUserPermissions);
router.post('/user-permissions', securityController.createUserPermission);
router.put('/user-permissions/:userId/:opId', securityController.updateUserPermission);
router.delete('/user-permissions/:userId/:opId', securityController.deleteUserPermission);
router.get('/user-permissions/effective/:userId', securityController.getEffectivePermissions);

module.exports = router;
