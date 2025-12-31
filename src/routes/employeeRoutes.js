const express = require('express');
const {
  getAgentDashboard,
  getAccountsDashboard,
  getHRDashboard,
  getCallCenterDashboard,
  getMarketingDashboard,
  getManagementDashboard
} = require('../controllers/dashboardController');
const { getAllEmployees } = require('../controllers/employeeController');
const authMiddleware = require('../middleware/authMiddleware');
const { departmentAccessControl, hasPermission, checkDepartmentAccess } = require('../middleware/departmentAccessControl');

const router = express.Router();

// Apply authentication and department access control to all routes
router.use(authMiddleware);
router.use(departmentAccessControl);

// Employee Management Routes
router.get('/', getAllEmployees);

// Agent Dashboard Routes
router.get('/agent/dashboard', hasPermission('BOOKING_MANAGEMENT'), getAgentDashboard);

// Accounts Dashboard Routes  
router.get('/accounts/dashboard', hasPermission('PAYMENT_PROCESSING'), getAccountsDashboard);

// HR Dashboard Routes
router.get('/hr/dashboard', checkDepartmentAccess(['HR']), getHRDashboard);

// Call Center Dashboard Routes
router.get('/callcenter/dashboard', checkDepartmentAccess(['SUPPORT', 'CALLCENTER']), getCallCenterDashboard);

// Marketing Dashboard Routes
router.get('/marketing/dashboard', checkDepartmentAccess(['MARKETING', 'SALES']), getMarketingDashboard);

// Management Dashboard Routes
router.get('/management/dashboard', hasPermission('MANAGEMENT_OVERVIEW'), getManagementDashboard);

module.exports = router;