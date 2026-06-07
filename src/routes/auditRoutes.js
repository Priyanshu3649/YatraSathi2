'use strict';

const express = require('express');
const router  = express.Router();
const audit   = require('../controllers/auditController');
const auth    = require('../middleware/authMiddleware');

// All audit routes require authentication
router.use(auth);

// ── Live queue metrics ────────────────────────────────────────────────────────
// GET /api/audit/metrics
router.get('/metrics', audit.getMetrics);

// ── Paginated log viewer with filters ────────────────────────────────────────
// GET /api/audit/logs?module=Billing&action=CANCEL&fromDate=...&toDate=...&page=1&limit=50
router.get('/logs', audit.getAuditLogs);

// ── Single log entry ──────────────────────────────────────────────────────────
router.get('/logs/:id(\\d+)', audit.getAuditLogById);

// ── Record drilldown — ERP investigation view ─────────────────────────────────
// GET /api/audit/record/Billing/604  → full history of Bill #604
router.get('/record/:module/:recordId', audit.getRecordHistory);

// ── Module-level log listing ──────────────────────────────────────────────────
// GET /api/audit/module/Billing?action=CANCEL&fromDate=...
router.get('/module/:module', audit.getModuleLogs);

// ── Retention policy ──────────────────────────────────────────────────────────
// GET  /api/audit/retention        → read current policy
// PUT  /api/audit/retention        → update policy (ADM)
// POST /api/audit/retention/archive → archive old logs (ADM)
router.get('/retention',         audit.getRetentionPolicy);
router.put('/retention',         audit.updateRetentionPolicy);
router.post('/retention/archive', audit.archiveOldLogs);

// ── Legacy alias (keeps backward compatibility with old AuditTrail.jsx) ───────
router.get('/logs/:entityName/:entityId', audit.getAuditLogsByEntity);

module.exports = router;