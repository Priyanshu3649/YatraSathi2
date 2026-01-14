const express = require('express');
const {
  getAdminDashboard,
  getEmployeeDashboard,
  getCustomerDashboard
} = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Dashboard routes based on user type
router.get('/admin', async (req, res, next) => {
  if (req.user.us_roid !== 'ADM') {
    return res.status(403).json({ message: 'Access denied. Admin access required.' });
  }
  next();
}, getAdminDashboard);

router.get('/employee', async (req, res, next) => {
  const employeeRoles = ['AGT', 'ACC', 'HR', 'CC', 'MKT', 'MGT'];
  if (!employeeRoles.includes(req.user.us_roid)) {
    return res.status(403).json({ message: 'Access denied. Employee access required.' });
  }
  next();
}, getEmployeeDashboard);

router.get('/customer', async (req, res, next) => {
  if (req.user.us_roid !== 'CUS') {
    return res.status(403).json({ message: 'Access denied. Customer access required.' });
  }
  next();
}, getCustomerDashboard);

// Generic dashboard route that redirects based on user type
router.get('/', (req, res) => {
  switch (req.user.us_roid) {
    case 'ADM':
      res.redirect('/api/dashboard/admin');
      break;
    case 'AGT':
    case 'ACC':
    case 'HR':
    case 'CC':
    case 'MKT':
    case 'MGT':
      res.redirect('/api/dashboard/employee');
      break;
    case 'CUS':
      res.redirect('/api/dashboard/customer');
      break;
    default:
      res.status(403).json({ message: 'Access denied. Invalid user type.' });
  }
});

module.exports = router;