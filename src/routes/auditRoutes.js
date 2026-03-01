const express = require('express');
const {
  getAuditLogs,
  getAuditLogById,
  getAuditSummary
} = require('../controllers/auditController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Admin routes
router.get('/', async (req, res, next) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin access required.' });
  }
  next();
}, getAuditLogs);

// Get audit log by ID
router.get('/:id', async (req, res, next) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin access required.' });
  }
  next();
}, getAuditLogById);

// Get audit summary statistics
router.get('/summary/stats', async (req, res, next) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin access required.' });
  }
  next();
}, getAuditSummary);

module.exports = router;