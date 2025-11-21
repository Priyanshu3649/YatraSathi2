const express = require('express');
const {
  searchAll,
  searchUsers,
  searchBookings,
  searchPayments,
  searchCustomers,
  searchEmployees
} = require('../controllers/searchController');
const authMiddleware = require('../middleware/authMiddleware');
const { User, Employee } = require('../models');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Search routes
router.get('/', searchAll);
router.get('/users', searchUsers);
router.get('/bookings', searchBookings);
router.get('/customers', searchCustomers);
router.get('/employees', searchEmployees);

// Payment search (accounts team and admin only)
router.get('/payments', async (req, res, next) => {
  // For employees, we need to check their department from the Employee model
  if (req.user.us_usertype === 'employee') {
    try {
      const employee = await Employee.findOne({ where: { em_usid: req.user.us_usid } });
      if (!employee || employee.em_dept !== 'accounts') {
        return res.status(403).json({ message: 'Access denied. Accounts team or Admin access required.' });
      }
    } catch (error) {
      return res.status(500).json({ message: 'Error checking permissions' });
    }
  } else if (req.user.us_usertype !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Accounts team or Admin access required.' });
  }
  next();
}, searchPayments);

module.exports = router;