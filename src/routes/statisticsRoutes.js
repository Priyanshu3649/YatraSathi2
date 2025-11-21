const express = require('express');
const {
  getSystemStats,
  getBookingStats,
  getFinancialStats,
  getEmployeeStats,
  getCorporateStats
} = require('../controllers/statisticsController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// System statistics (admin only)
router.get('/system', async (req, res, next) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin access required.' });
  }
  next();
}, getSystemStats);

// Booking statistics
router.get('/bookings', getBookingStats);

// Financial statistics (admin and accounts only)
router.get('/financial', async (req, res, next) => {
  if (req.user.userType !== 'admin' && req.user.department !== 'accounts') {
    return res.status(403).json({ message: 'Access denied. Admin or Accounts access required.' });
  }
  next();
}, getFinancialStats);

// Employee statistics (admin and management only)
router.get('/employees', async (req, res, next) => {
  if (req.user.userType !== 'admin' && 
      !(req.user.userType === 'employee' && req.user.department === 'management')) {
    return res.status(403).json({ message: 'Access denied. Admin or Management access required.' });
  }
  next();
}, getEmployeeStats);

// Corporate statistics (admin and relationship managers only)
router.get('/corporate', async (req, res, next) => {
  if (req.user.userType !== 'admin' && 
      !(req.user.userType === 'employee' && req.user.department === 'relationship_manager')) {
    return res.status(403).json({ message: 'Access denied. Admin or Relationship Manager access required.' });
  }
  next();
}, getCorporateStats);

module.exports = router;