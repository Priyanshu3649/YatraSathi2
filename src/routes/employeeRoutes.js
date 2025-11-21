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
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin access required.' });
  }
  next();
}, getAllEmployees);

router.get('/:id', async (req, res, next) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin access required.' });
  }
  next();
}, getEmployeeById);

router.post('/', async (req, res, next) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin access required.' });
  }
  next();
}, createEmployee);

router.put('/:id', async (req, res, next) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin access required.' });
  }
  next();
}, updateEmployee);

router.delete('/:id', async (req, res, next) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin access required.' });
  }
  next();
}, deleteEmployee);

// Employee routes
router.get('/my/bookings', async (req, res, next) => {
  if (req.user.userType !== 'employee' && req.user.userType !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Employee access required.' });
  }
  next();
}, getEmployeeBookings);

// Relationship manager routes
router.get('/corporate-customers', async (req, res, next) => {
  if (req.user.userType !== 'employee' && req.user.userType !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Employee access required.' });
  }
  next();
}, getCorporateCustomers);

module.exports = router;