// Audit Trail Routes
// Administrative routes for forensic audit log management

const express = require('express');
const router = express.Router();
const { getAuditLogs, getAuditLogById, getAuditSummary } = require('../controllers/auditController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET /api/audit/logs - Get audit logs with filtering and pagination
router.get('/logs', getAuditLogs);

// GET /api/audit/logs/:id - Get specific audit log by ID
router.get('/logs/:id', getAuditLogById);

// GET /api/audit/summary - Get audit summary statistics
router.get('/summary', getAuditSummary);

module.exports = router;