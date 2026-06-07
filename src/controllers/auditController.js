'use strict';

const ForensicAuditService = require('../services/forensicAuditService');
const { MODULES, ACTIONS } = ForensicAuditService;

// ── GET /api/audit/logs ───────────────────────────────────────────────────────
const getAuditLogs = async (req, res) => {
  try {
    const {
      page  = 1,
      limit = 50,
      module,
      action,
      changedBy,
      recordId,
      fromDate,
      toDate,
      // Legacy aliases
      entityName, actionType, performedBy, entityId, dateFrom, dateTo,
    } = req.query;

    const filters = {
      module:     module     || entityName || undefined,
      action:     action     || actionType || undefined,
      changedBy:  changedBy  || performedBy || undefined,
      recordId:   recordId   || entityId   || undefined,
      fromDate:   fromDate   || dateFrom   || undefined,
      toDate:     toDate     || dateTo     || undefined,
    };

    // Remove undefined
    Object.keys(filters).forEach(k => filters[k] === undefined && delete filters[k]);

    const result = await ForensicAuditService.getAuditLogs(
      filters,
      parseInt(page, 10),
      parseInt(limit, 10)
    );

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[auditController] getAuditLogs error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch audit logs' });
  }
};

// ── GET /api/audit/logs/:id ───────────────────────────────────────────────────
const getAuditLogById = async (req, res) => {
  try {
    const { id } = req.params;
    const log = await ForensicAuditService.getById(id);
    if (!log) {
      return res.status(404).json({ success: false, message: 'Audit log not found' });
    }
    res.json({ success: true, data: log });
  } catch (error) {
    console.error('[auditController] getAuditLogById error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch audit log' });
  }
};

// ── GET /api/audit/record/:module/:recordId ───────────────────────────────────
// Full chronological drilldown for a specific record (the ERP investigation view)
const getRecordHistory = async (req, res) => {
  try {
    const { module, recordId } = req.params;

    // Normalise module name (accept aliases)
    const moduleMap = {
      billing:       MODULES.BILLING,
      bill:          MODULES.BILLING,
      booking:       MODULES.BOOKING,
      payment:       MODULES.PAYMENT,
      receipt:       MODULES.RECEIPT,
      contra:        MODULES.CONTRA,
      journal:       MODULES.JOURNAL,
      customer:      MODULES.CUSTOMER,
      employee:      MODULES.EMPLOYEE,
      user:          MODULES.USER,
      servicecharge: MODULES.SERVICE_CHARGE,
      travelplan:    MODULES.TRAVEL_PLAN,
      auth:          MODULES.AUTH,
    };
    const normalised = moduleMap[module.toLowerCase()] || module;

    const rows = await ForensicAuditService.getRecordHistory(normalised, recordId);

    res.json({ success: true, data: { module: normalised, recordId, history: rows } });
  } catch (error) {
    console.error('[auditController] getRecordHistory error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch record history' });
  }
};

// ── GET /api/audit/module/:module ─────────────────────────────────────────────
const getModuleLogs = async (req, res) => {
  try {
    const { module } = req.params;
    const { page = 1, limit = 50, action, fromDate, toDate } = req.query;

    const filters = {
      module,
      action:   action   || undefined,
      fromDate: fromDate || undefined,
      toDate:   toDate   || undefined,
    };
    Object.keys(filters).forEach(k => filters[k] === undefined && delete filters[k]);

    const result = await ForensicAuditService.getAuditLogs(
      filters,
      parseInt(page, 10),
      parseInt(limit, 10)
    );

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[auditController] getModuleLogs error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch module logs' });
  }
};

// ── GET /api/audit/logs/:entityName/:entityId (legacy alias) ──────────────────
const getAuditLogsByEntity = async (req, res) => {
  try {
    const { entityName, entityId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const result = await ForensicAuditService.getAuditLogs(
      { module: entityName, recordId: entityId },
      parseInt(page, 10),
      parseInt(limit, 10)
    );

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[auditController] getAuditLogsByEntity error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch entity audit logs' });
  }
};

// ── GET /api/audit/metrics ───────────────────────────────────────────────────
const getMetrics = (req, res) => {
  const m = ForensicAuditService.metrics;
  res.json({
    success: true,
    data: {
      queued:       m.queued,
      success:      m.success,
      failed:       m.failed,
      dropped:      m.dropped,
      retried:      m.retried,
      queueLen:     m.queueLen,
      healthStatus: m.healthStatus,
      timestamp:    new Date().toISOString(),
    },
  });
};

// ── In-memory retention policy (default 7 years) ────────────────────────────
let retentionPolicy = {
  retentionYears:       7,
  archiveEnabled:       true,
  deleteRequiresAdmin:  true,
  autoArchiveEnabled:   false,
  lastUpdatedBy:        null,
  lastUpdatedOn:        null,
};

// ── GET /api/audit/retention ────────────────────────────────────────────────
const getRetentionPolicy = (req, res) => {
  res.json({ success: true, data: retentionPolicy });
};

// ── PUT /api/audit/retention ────────────────────────────────────────────────
const updateRetentionPolicy = (req, res) => {
  try {
    const { retentionYears, archiveEnabled, deleteRequiresAdmin, autoArchiveEnabled } = req.body;
    if (retentionYears !== undefined) {
      const yr = parseInt(retentionYears, 10);
      if (isNaN(yr) || yr < 1 || yr > 100) {
        return res.status(400).json({ success: false, message: 'retentionYears must be 1–100' });
      }
      retentionPolicy.retentionYears = yr;
    }
    if (archiveEnabled      !== undefined) retentionPolicy.archiveEnabled      = !!archiveEnabled;
    if (deleteRequiresAdmin !== undefined) retentionPolicy.deleteRequiresAdmin = !!deleteRequiresAdmin;
    if (autoArchiveEnabled  !== undefined) retentionPolicy.autoArchiveEnabled  = !!autoArchiveEnabled;
    retentionPolicy.lastUpdatedBy = req.user?.us_usname || req.user?.us_usid || 'unknown';
    retentionPolicy.lastUpdatedOn = new Date().toISOString();
    res.json({ success: true, data: retentionPolicy });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/audit/retention/archive ────────────────────────────────────────
const archiveOldLogs = async (req, res) => {
  try {
    const cutoffYears = retentionPolicy.retentionYears;
    const { sequelizeTVL } = require('../../config/db');
    const { QueryTypes } = require('sequelize');

    // Count eligible rows
    const [countRow] = await sequelizeTVL.query(
      `SELECT COUNT(*) AS total FROM audit_forensic_log
       WHERE change_timestamp < DATE_SUB(NOW(), INTERVAL :years YEAR)`,
      { replacements: { years: cutoffYears }, type: QueryTypes.SELECT }
    );
    const total = parseInt(countRow.total, 10) || 0;

    if (total === 0) {
      return res.json({ success: true, message: `No records older than ${cutoffYears} years to archive.`, archived: 0 });
    }

    // Move to legacy table (audit_forensic_log_legacy must exist)
    await sequelizeTVL.query(
      `INSERT INTO audit_forensic_log_legacy
         SELECT *, NOW() AS archived_on FROM audit_forensic_log
         WHERE change_timestamp < DATE_SUB(NOW(), INTERVAL :years YEAR)`,
      { replacements: { years: cutoffYears }, type: QueryTypes.INSERT }
    );

    // Remove from active table ONLY after successful archive
    await sequelizeTVL.query(
      `DELETE FROM audit_forensic_log
       WHERE change_timestamp < DATE_SUB(NOW(), INTERVAL :years YEAR)`,
      { replacements: { years: cutoffYears }, type: QueryTypes.DELETE }
    );

    console.log(`[AUDIT ARCHIVE] ${total} rows archived by ${req.user?.us_usname} (${new Date().toISOString()})`);
    res.json({ success: true, message: `Archived ${total} record(s) older than ${cutoffYears} years.`, archived: total });
  } catch (err) {
    console.error('[AUDIT ARCHIVE] Error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getAuditLogs,
  getAuditLogById,
  getAuditLogsByEntity,
  getRecordHistory,
  getModuleLogs,
  getMetrics,
  getRetentionPolicy,
  updateRetentionPolicy,
  archiveOldLogs,
};