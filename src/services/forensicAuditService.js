/**
 * YatraSathi Forensic Audit Service v3
 * =====================================
 * ERP-grade, per-field, immutable, asynchronous audit trail.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * DESIGN GUARANTEES
 * ═══════════════════════════════════════════════════════════════════════
 *
 *  1. NON-BLOCKING — Every public method returns immediately.
 *     Business transactions (Booking, Bill, Payment, Receipt, Journal, etc.)
 *     NEVER wait for an audit write under any circumstances.
 *
 *  2. FAULT-ISOLATED — Audit failure never propagates to the caller.
 *     The in-process queue catches all exceptions internally.
 *     Business logic sees zero errors from this module.
 *
 *  3. STRUCTURED FAILURE LOGGING — Every failure is logged with:
 *       module, record_id, action_type, changed_by, error message
 *     so it appears in server logs and can be picked up by monitoring.
 *
 *  4. RETRY — Each job is attempted TWICE before being dropped.
 *     Second attempt uses a 500ms delay (non-blocking via setTimeout).
 *
 *  5. MONITORING — ForensicAuditService.metrics exposes:
 *       queued   — total jobs enqueued since process start
 *       success  — total jobs written successfully
 *       failed   — total jobs that permanently failed (after retry)
 *       dropped  — total jobs dropped due to queue overflow
 *       queueLen — current queue depth
 *     Can be exposed via /health or /metrics endpoint.
 *
 *  6. BOUNDED QUEUE — Max 2000 pending jobs. Overflow jobs are dropped
 *     with a warning log, never blocking the event loop.
 *
 *  7. NORMALIZED — One DB row per changed field, not a JSON blob.
 *
 * ═══════════════════════════════════════════════════════════════════════
 */

'use strict';

const { sequelizeTVL } = require('../../config/db');
const { QueryTypes }   = require('sequelize');

// ── Module name constants ─────────────────────────────────────────────────────
const MODULES = {
  BOOKING:        'Booking',
  BILLING:        'Billing',
  PAYMENT:        'Payment',
  RECEIPT:        'Receipt',
  CONTRA:         'Contra',
  JOURNAL:        'Journal',
  CUSTOMER:       'Customer',
  EMPLOYEE:       'Employee',
  USER:           'User',
  SERVICE_CHARGE: 'ServiceCharge',
  TRAVEL_PLAN:    'TravelPlan',
  LEDGER:         'Ledger',
  CHART_ACCOUNTS: 'ChartOfAccounts',
  AUTH:           'Auth',
};

// ── Action type constants ─────────────────────────────────────────────────────
const ACTIONS = {
  INSERT:            'INSERT',
  UPDATE:            'UPDATE',
  DELETE:            'DELETE',
  CANCEL:            'CANCEL',
  CLOSE:             'CLOSE',
  LOGIN:             'LOGIN',
  LOGOUT:            'LOGOUT',
  FAILED_LOGIN:      'FAILED_LOGIN',
  PASSWORD_RESET:    'PASSWORD_RESET',
  USER_LOCK:         'USER_LOCK',
  USER_UNLOCK:       'USER_UNLOCK',
  ROLE_CHANGE:       'ROLE_CHANGE',
  PERMISSION_CHANGE: 'PERMISSION_CHANGE',
};

// ── Fields excluded from forensic diff ───────────────────────────────────────
const EXCLUDED_FIELDS = new Set([
  'createdAt', 'updatedAt', 'deletedAt',
  'entered_by', 'entered_on', 'modified_by', 'modified_on',
  'closed_by',  'closed_on',
  'eby', 'mby', 'edtm', 'mdtm',
  'us_eby', 'us_mby', 'us_edtm', 'us_mdtm',
  'bl_created_at', 'bl_modified_at',
]);

// ── Monitoring counters (process lifetime) ────────────────────────────────────
const metrics = {
  queued:   0,
  success:  0,
  failed:   0,
  dropped:  0,
  retried:  0,
  get queueLen()    { return _queue.length; },
  get healthStatus() {
    const q = _queue.length;
    if (q >= 1000) return 'Critical';
    if (q >= 100)  return 'Warning';
    return 'Healthy';
  },
};

// ── In-process async queue ────────────────────────────────────────────────────
const MAX_QUEUE   = 2000;
const RETRY_DELAY = 500; // ms before second attempt

/** @type {Array<{ row: object, attempt: number }>} */
const _queue     = [];
let   _processing = false;

/**
 * Enqueue a single audit row object.
 * Always returns synchronously — NEVER awaited by callers.
 */
function _enqueue(row) {
  if (_queue.length >= MAX_QUEUE) {
    metrics.dropped++;
    console.warn(
      `[FORENSIC AUDIT] Queue full (${MAX_QUEUE}). Dropping audit event.`,
      `module=${row.module_name} record=${row.record_id} action=${row.action_type}`
    );
    return;
  }
  _queue.push({ row, attempt: 1 });
  metrics.queued++;
  // Kick the drain loop without blocking the current tick
  if (!_processing) {
    setImmediate(_drain);
  }
}

/**
 * Drain loop — processes queue entries one at a time.
 * Runs entirely in the background; business code never awaits it.
 */
async function _drain() {
  if (_processing) return;
  _processing = true;

  while (_queue.length > 0) {
    const job = _queue[0]; // peek
    try {
      await _insertAuditRow(job.row);
      _queue.shift();       // remove on success
      metrics.success++;
    } catch (err) {
      if (job.attempt < 2) {
        // First failure → retry after delay
        job.attempt++;
        metrics.retried++;
        _queue.shift();
        _queue.push(job);   // move to end of queue for retry
        _processing = false;
        setTimeout(() => {
          if (!_processing) setImmediate(_drain);
        }, RETRY_DELAY);
        return; // yield — let other event-loop work proceed
      } else {
        // Second failure → permanent drop with structured log
        metrics.failed++;
        const r = job.row;
        console.error(
          '[FORENSIC AUDIT] PERMANENT FAILURE — audit row dropped after retry.',
          JSON.stringify({
            module:      r.module_name,
            record_id:   r.record_id,
            action_type: r.action_type,
            field_name:  r.field_name,
            changed_by:  r.changed_by,
            error:       err.message,
          })
        );
        _queue.shift();
      }
    }
  }

  _processing = false;
}

// ── Raw INSERT ────────────────────────────────────────────────────────────────
async function _insertAuditRow({
  module_name,
  record_id,
  action_type,
  field_name      = null,
  old_value       = null,
  new_value       = null,
  changed_by,
  changed_by_name = null,
  ip_address      = null,
  machine_name    = null,
}) {
  await sequelizeTVL.query(
    `INSERT INTO audit_forensic_log
       (module_name, record_id, action_type, field_name, old_value, new_value,
        changed_by, changed_by_name, ip_address, machine_name, change_timestamp)
     VALUES
       (:module_name, :record_id, :action_type, :field_name, :old_value, :new_value,
        :changed_by, :changed_by_name, :ip_address, :machine_name, NOW())`,
    {
      replacements: {
        module_name:     String(module_name),
        record_id:       String(record_id),
        action_type:     String(action_type),
        field_name:      field_name      != null ? String(field_name)      : null,
        old_value:       old_value       != null ? String(old_value)       : null,
        new_value:       new_value       != null ? String(new_value)       : null,
        changed_by:      String(changed_by),
        changed_by_name: changed_by_name != null ? String(changed_by_name) : null,
        ip_address:      ip_address  || null,
        machine_name:    machine_name || null,
      },
      type: QueryTypes.INSERT,
    }
  );
}

// ── Request metadata helpers ──────────────────────────────────────────────────
function _getRequestMeta(req) {
  if (!req) return { ip: null, agent: null };
  const ip = req.headers?.['x-forwarded-for']
    ? req.headers['x-forwarded-for'].split(',')[0].trim()
    : (req.ip || req.connection?.remoteAddress || null);
  const agent = req.headers?.['user-agent'] || null;
  return { ip, agent };
}

function _getUserInfo(req) {
  if (!req || !req.user) return { id: 'SYSTEM', name: 'System' };
  const u = req.user;
  const name = [u.us_fname, u.us_lname].filter(Boolean).join(' ').trim()
    || u.us_usname || u.us_usid || 'Unknown';
  return { id: String(u.us_usid), name };
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API
// All public methods are synchronous from the caller's perspective.
// They enqueue work and return immediately — business code MUST NOT await them.
// ─────────────────────────────────────────────────────────────────────────────

const ForensicAuditService = {

  MODULES,
  ACTIONS,
  metrics,

  /**
   * Log a single action-level event (INSERT, DELETE, CANCEL, CLOSE, auth, etc.)
   *
   * USAGE (NON-BLOCKING — do NOT await):
   *   Audit.logAction({ module: Audit.MODULES.BILLING, recordId: bill.id,
   *                     action: Audit.ACTIONS.CANCEL, req,
   *                     fieldName: 'bl_status', oldValue: 'ACT', newValue: 'CAN' });
   */
  logAction({ module, recordId, action, req, fieldName = null, oldValue = null, newValue = null }) {
    try {
      const { id, name } = _getUserInfo(req);
      const { ip, agent } = _getRequestMeta(req);
      _enqueue({
        module_name:     module,
        record_id:       recordId,
        action_type:     action,
        field_name:      fieldName,
        old_value:       oldValue,
        new_value:       newValue,
        changed_by:      id,
        changed_by_name: name,
        ip_address:      ip,
        machine_name:    agent,
      });
    } catch (err) {
      // Defensive: enqueue itself must never throw to caller
      console.error('[FORENSIC AUDIT] logAction setup error (non-fatal):', err.message);
    }
  },

  /**
   * Compare old and new record objects and log ONE row PER changed field.
   * Skips audit/timestamp fields.
   *
   * USAGE (NON-BLOCKING — do NOT await):
   *   Audit.logFieldChanges(oldRecord, newRecord, { module, recordId, req });
   */
  logFieldChanges(oldRecord, newRecord, { module, recordId, req, skipFields = [] }) {
    try {
      const { id, name } = _getUserInfo(req);
      const { ip, agent } = _getRequestMeta(req);
      const skipSet = new Set([...EXCLUDED_FIELDS, ...skipFields]);

      const allKeys = new Set([
        ...Object.keys(oldRecord || {}),
        ...Object.keys(newRecord || {}),
      ]);

      for (const key of allKeys) {
        if (skipSet.has(key)) continue;
        const oldStr = (oldRecord?.[key] != null) ? String(oldRecord[key]) : null;
        const newStr = (newRecord?.[key] != null) ? String(newRecord[key]) : null;
        if (oldStr === newStr) continue;

        _enqueue({
          module_name:     module,
          record_id:       recordId,
          action_type:     ACTIONS.UPDATE,
          field_name:      key,
          old_value:       oldStr,
          new_value:       newStr,
          changed_by:      id,
          changed_by_name: name,
          ip_address:      ip,
          machine_name:    agent,
        });
      }
    } catch (err) {
      console.error('[FORENSIC AUDIT] logFieldChanges setup error (non-fatal):', err.message);
    }
  },

  /**
   * Log all fields of a newly created record (INSERT snapshot).
   * Creates one audit row per non-null field.
   *
   * USAGE (NON-BLOCKING — do NOT await):
   *   Audit.logInsert(record, { module, recordId, req });
   */
  logInsert(record, { module, recordId, req, skipFields = [] }) {
    try {
      const { id, name } = _getUserInfo(req);
      const { ip, agent } = _getRequestMeta(req);
      const skipSet = new Set([...EXCLUDED_FIELDS, ...skipFields]);

      for (const [key, val] of Object.entries(record || {})) {
        if (skipSet.has(key)) continue;
        if (val == null) continue;
        _enqueue({
          module_name:     module,
          record_id:       recordId,
          action_type:     ACTIONS.INSERT,
          field_name:      key,
          old_value:       null,
          new_value:       String(val),
          changed_by:      id,
          changed_by_name: name,
          ip_address:      ip,
          machine_name:    agent,
        });
      }
    } catch (err) {
      console.error('[FORENSIC AUDIT] logInsert setup error (non-fatal):', err.message);
    }
  },

  /**
   * Log an authentication event (LOGIN, LOGOUT, FAILED_LOGIN, etc.)
   * Parameters are explicit strings — no req object required.
   *
   * USAGE (NON-BLOCKING — do NOT await):
   *   Audit.logAuthEvent(Audit.ACTIONS.LOGIN, userId, userName, ipAddress, userAgent);
   */
  logAuthEvent(action, userId, userName, ipAddress, machineInfo = null, extra = {}) {
    try {
      _enqueue({
        module_name:     MODULES.AUTH,
        record_id:       String(userId),
        action_type:     action,
        field_name:      extra.fieldName  || null,
        old_value:       extra.oldValue   || null,
        new_value:       extra.newValue   || null,
        changed_by:      String(userId),
        changed_by_name: userName || null,
        ip_address:      ipAddress || null,
        machine_name:    machineInfo || null,
      });
    } catch (err) {
      console.error('[FORENSIC AUDIT] logAuthEvent setup error (non-fatal):', err.message);
    }
  },

  // ── Query helpers (these DO use await — only for read operations) ─────────

  /**
   * Paginated audit log query with all supported filters.
   * Used by auditController for the investigation viewer.
   */
  async getAuditLogs(filters = {}, page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    const conditions  = [];
    const replacements = {};

    if (filters.module)    { conditions.push('module_name = :module');                     replacements.module       = filters.module; }
    if (filters.action)    { conditions.push('action_type = :action');                     replacements.action       = filters.action; }
    if (filters.recordId)  { conditions.push('record_id = :recordId');                    replacements.recordId     = String(filters.recordId); }
    if (filters.changedBy) {
      conditions.push('(changed_by = :changedBy OR changed_by_name LIKE :changedByLike)');
      replacements.changedBy     = filters.changedBy;
      replacements.changedByLike = `%${filters.changedBy}%`;
    }
    if (filters.fromDate) {
      conditions.push('change_timestamp >= :fromDate');
      replacements.fromDate = new Date(filters.fromDate);
    }
    if (filters.toDate) {
      const to = new Date(filters.toDate);
      to.setHours(23, 59, 59, 999);
      conditions.push('change_timestamp <= :toDate');
      replacements.toDate = to;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [countRow] = await sequelizeTVL.query(
      `SELECT COUNT(*) AS total FROM audit_forensic_log ${where}`,
      { replacements, type: QueryTypes.SELECT }
    );

    const rows = await sequelizeTVL.query(
      `SELECT * FROM audit_forensic_log ${where}
       ORDER BY change_timestamp DESC, audit_id DESC
       LIMIT :limit OFFSET :offset`,
      { replacements: { ...replacements, limit, offset }, type: QueryTypes.SELECT }
    );

    const total = parseInt(countRow.total, 10) || 0;
    return {
      logs:        rows,
      total,
      page,
      limit,
      totalPages:  Math.ceil(total / limit) || 1,
      hasNext:     page < Math.ceil(total / limit),
      hasPrevious: page > 1,
    };
  },

  /**
   * Full chronological history for a specific record.
   * Used by auditController drilldown endpoint.
   */
  async getRecordHistory(module, recordId) {
    return sequelizeTVL.query(
      `SELECT * FROM audit_forensic_log
       WHERE module_name = :module AND record_id = :recordId
       ORDER BY change_timestamp ASC, audit_id ASC`,
      { replacements: { module, recordId: String(recordId) }, type: QueryTypes.SELECT }
    );
  },

  /**
   * Single audit log entry by primary key.
   */
  async getById(auditId) {
    const rows = await sequelizeTVL.query(
      `SELECT * FROM audit_forensic_log WHERE audit_id = :auditId LIMIT 1`,
      { replacements: { auditId }, type: QueryTypes.SELECT }
    );
    return rows[0] || null;
  },
};

module.exports = ForensicAuditService;
