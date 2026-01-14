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

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Check if user is an employee
router.use((req, res, next) => {
  // Check if user has employee role or admin role (using role ID)
  const allowedRoles = ['AGT', 'ACC', 'HR', 'CC', 'MKT', 'MGT', 'ADM']; // Include admin role
  if (!allowedRoles.includes(req.user.us_roid)) {
    return res.status(403).json({ 
      success: false, 
      error: { code: 'FORBIDDEN', message: 'Access denied. Employee role required.' } 
    });
  }
  next();
});

// Employee dashboard route - accessible to all employees
router.get('/dashboard', (req, res) => {
  res.json({ message: 'Employee dashboard access granted', user: req.user });
});

// Apply department access control to specific routes
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