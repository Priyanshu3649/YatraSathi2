const express = require('express');
const {
  generateEmployeePerformanceReport,
  generateFinancialReport,
  generateCorporateCustomerReport,
  generateBookingReport,
  generateTravelPlanReport,
  downloadReport,
  generateCustomerAnalytics
} = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Admin reports
router.get('/employee-performance', async (req, res, next) => {
  if (req.user.us_usertype !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin access required.' });
  }
  next();
}, generateEmployeePerformanceReport);

router.get('/financial', async (req, res, next) => {
  if (req.user.us_usertype !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin access required.' });
  }
  next();
}, generateFinancialReport);

router.get('/corporate-customers', async (req, res, next) => {
  if (req.user.us_usertype !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin access required.' });
  }
  next();
}, generateCorporateCustomerReport);

router.get('/customer-analytics', async (req, res, next) => {
  if (req.user.us_usertype !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin access required.' });
  }
  next();
}, generateCustomerAnalytics);

// Employee and Admin reports
router.get('/bookings', async (req, res, next) => {
  if (req.user.us_usertype !== 'admin' && req.user.us_usertype !== 'employee') {
    return res.status(403).json({ message: 'Access denied. Employee or Admin access required.' });
  }
  next();
}, generateBookingReport);

// Travel plan reports (for customers)
router.get('/travel-plan/:id', generateTravelPlanReport);

// Download reports
router.get('/download/:fileName', downloadReport);

module.exports = router;