const express = require('express');
const {
  getAuditLogs,
  getUserAuditLogs,
  clearAuditLogs
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

router.delete('/clear', async (req, res, next) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin access required.' });
  }
  next();
}, clearAuditLogs);

// User routes
router.get('/my-logs', getUserAuditLogs);

router.get('/user/:userId', async (req, res, next) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin access required.' });
  }
  next();
}, getUserAuditLogs);

module.exports = router;