const express = require('express');
const {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeBookings,
  getCorporateCustomers
} = require('../controllers/employeeController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Admin-only routes
router.get('/', async (req, res, next) => {
  console.log('=== Employee Route Check ===');
  console.log('req.user:', req.user ? req.user.toJSON() : 'No user');
  console.log('req.user.us_usertype:', req.user?.us_usertype);
  console.log('Checking if us_usertype === admin:', req.user?.us_usertype === 'admin');
  
  if (req.user.us_usertype !== 'admin') {
    console.log('Access denied - user type is:', req.user.us_usertype);
    return res.status(403).json({ message: 'Access denied. Admin access required.' });
  }
  console.log('Access granted - proceeding to getAllEmployees');
  next();
}, getAllEmployees);

router.get('/:id', async (req, res, next) => {
  if (req.user.us_usertype !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin access required.' });
  }
  next();
}, getEmployeeById);

router.post('/', async (req, res, next) => {
  if (req.user.us_usertype !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin access required.' });
  }
  next();
}, createEmployee);

router.put('/:id', async (req, res, next) => {
  if (req.user.us_usertype !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin access required.' });
  }
  next();
}, updateEmployee);

router.delete('/:id', async (req, res, next) => {
  if (req.user.us_usertype !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin access required.' });
  }
  next();
}, deleteEmployee);

// Employee routes
router.get('/my/bookings', async (req, res, next) => {
  if (req.user.us_usertype !== 'employee' && req.user.us_usertype !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Employee access required.' });
  }
  next();
}, getEmployeeBookings);

// Relationship manager routes
router.get('/corporate-customers', async (req, res, next) => {
  if (req.user.us_usertype !== 'employee' && req.user.us_usertype !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Employee access required.' });
  }
  next();
}, getCorporateCustomers);

module.exports = router;