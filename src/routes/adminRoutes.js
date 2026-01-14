const express = require('express');
const { getAdminDashboard } = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/rbacMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Admin dashboard route - only for ADM role
router.get('/dashboard', requireRole(['ADM']), getAdminDashboard);

// Admin management routes
router.get('/employees', requireRole(['ADM']), (req, res) => {
  res.json({ message: 'Employee management data' });
});

router.get('/customers', requireRole(['ADM']), (req, res) => {
  res.json({ message: 'Customer management data' });
});

router.get('/bookings', requireRole(['ADM']), (req, res) => {
  res.json({ message: 'Booking management data' });
});

router.get('/payments', requireRole(['ADM']), (req, res) => {
  res.json({ message: 'Payment management data' });
});

router.get('/reports', requireRole(['ADM']), (req, res) => {
  res.json({ message: 'Report data' });
});

router.get('/settings', requireRole(['ADM']), (req, res) => {
  res.json({ message: 'System settings data' });
});

module.exports = router;