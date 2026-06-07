/**
 * Universal Audit Middleware
 * ─────────────────────────
 * Attaches helpers to `req` so any controller can easily:
 *   - Populate audit fields (eby/edtm/mby/mdtm/cby/cdtm) via Sequelize options
 *   - Log forensic audit entries (INSERT / UPDATE / DELETE / CANCEL / CLOSE)
 *
 * Usage in routes:
 *   router.post('/', auditMiddleware.attach, controller.create);
 *   router.put('/:id', auditMiddleware.attach, controller.update);
 *   router.delete('/:id', auditMiddleware.attach, controller.delete);
 *
 * Usage in controllers:
 *   const options = req.audit.sequelizeOptions();        // { userId }
 *   req.audit.logInsert(record, { module, recordId });
 *   req.audit.logFieldChanges(oldRecord, newRecord, { module, recordId });
 *   req.audit.logAction({ module, recordId, action });
 */

'use strict';

const ForensicAuditService = require('../services/forensicAuditService');
const { MODULES, ACTIONS } = ForensicAuditService;

/**
 * Attach audit helpers to every request.
 * Lightweight — does zero DB work until a helper is called.
 */
function attach(req, _res, next) {
  const userId = req.user?.us_usid || 'SYSTEM';
  const userName = req.user
    ? [req.user.us_fname, req.user.us_lname].filter(Boolean).join(' ').trim() || userId
    : 'System';

  req.audit = {
    userId,
    userName,

    /**
     * Returns Sequelize options object that triggers beforeCreate/beforeUpdate hooks
     * to auto-populate eby/edtm/mby/mdtm/cby/cdtm.
     * Merge with any existing options.
     */
    sequelizeOptions(extra = {}) {
      return { ...extra, userId };
    },

    /**
     * Log a record creation (INSERT) — fire-and-forget.
     * @param {Object} record   - The created Sequelize model (or plain object)
     * @param {Object} opts     - { module, recordId, skipFields? }
     */
    logInsert(record, { module, recordId, skipFields = [] } = {}) {
      ForensicAuditService.logInsert(record, { module, recordId, req, skipFields });
    },

    /**
     * Log field-level changes (UPDATE) — fire-and-forget.
     * @param {Object} oldRecord - Snapshot before update
     * @param {Object} newRecord - Record after update
     * @param {Object} opts      - { module, recordId, skipFields? }
     */
    logFieldChanges(oldRecord, newRecord, { module, recordId, skipFields = [] } = {}) {
      ForensicAuditService.logFieldChanges(oldRecord, newRecord, { module, recordId, req, skipFields });
    },

    /**
     * Log a single action (DELETE, CANCEL, CLOSE, etc.) — fire-and-forget.
     * @param {Object} opts - { module, recordId, action, fieldName?, oldValue?, newValue? }
     */
    logAction({ module, recordId, action, fieldName = null, oldValue = null, newValue = null } = {}) {
      ForensicAuditService.logAction({ module, recordId, action, req, fieldName, oldValue, newValue });
    },

    /**
     * Convenience: log authentication event.
     */
    logAuthEvent(action, extraUserId, extraUserName, extra) {
      const ip = (req.headers && req.headers['x-forwarded-for'])
        ? req.headers['x-forwarded-for'].split(',')[0].trim()
        : (req.ip || req.connection?.remoteAddress || null);
      const agent = (req.headers && req.headers['user-agent']) || null;
      ForensicAuditService.logAuthEvent(
        action,
        extraUserId || userId,
        extraUserName || userName,
        ip,
        agent,
        extra
      );
    },

    // Expose constants for convenience
    MODULES,
    ACTIONS,
  };

  next();
}

module.exports = { attach, MODULES, ACTIONS };
