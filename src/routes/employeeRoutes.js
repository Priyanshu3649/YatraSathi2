const express = require('express');
const {
  getAgentDashboard,
  getAccountsDashboard,
  getHRDashboard,
  getCallCenterDashboard,
  getMarketingDashboard,
  getManagementDashboard
} = require('../controllers/dashboardController');
const { 
  getAllEmployees, 
  getEmployeeById, 
  createEmployee, 
  updateEmployee, 
  deleteEmployee,
  getEmployeeBookings,
  getCorporateCustomers,
  changeEmployeePassword
} = require('../controllers/employeeController');
const authMiddleware = require('../middleware/authMiddleware');
const { departmentAccessControl, hasPermission, checkDepartmentAccess } = require('../middleware/departmentAccessControl');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Check if user is an employee or admin
router.use((req, res, next) => {
  const allowedRoles = ['AGT', 'ACC', 'HR', 'CC', 'MKT', 'MGT', 'ADM'];
  if (!allowedRoles.includes(req.user.us_roid) && req.user.us_usertype !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      error: { code: 'FORBIDDEN', message: 'Access denied. Employee or Admin role required.' } 
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
router.get('/:id', getEmployeeById);
router.post('/', createEmployee);
router.put('/:id', updateEmployee);
router.delete('/:id', deleteEmployee);
router.put('/:id/password', changeEmployeePassword);
router.get('/:id/bookings', getEmployeeBookings);
router.get('/corporate/customers', getCorporateCustomers);

// Agent Dashboard Routes
router.get('/agent/dashboard', (req, res, next) => {
  const agentRoles = ['AGT', 'ACC', 'CC', 'MKT', 'MGT'];
  if (!agentRoles.includes(req.user.us_roid) && req.user.us_usertype !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      error: { code: 'FORBIDDEN', message: 'Access denied. Agent role required.' } 
    });
  }
  next();
}, getAgentDashboard);

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