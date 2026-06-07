const serviceChargeService = require('../services/serviceChargeService');
const { ServiceCharge, ServiceChargeDefault, UserTVL } = require('../models');
const Audit = require('../services/forensicAuditService');
const queryHelper = require('../utils/queryHelper');

// Helper function to convert string user ID to integer for database compatibility
function convertUserIdToInt(userId) {
  if (!userId) return null;
  if (typeof userId === 'number') {
    return userId;
  }
  
  if (typeof userId === 'string') {
    // Try to extract numeric part from alphanumeric ID (e.g., 'ADM001' -> 1)
    const numericPart = userId.match(/\d+/);
    if (numericPart) {
      return parseInt(numericPart[0]);
    }
    
    // If no numeric part found, use character codes as fallback
    return userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 1000000;
  }
  
  return null;
}

/**
 * Service Charge Controller
 * Handles calculation requests and admin CRUD operations for rules.
 */
class ServiceChargeController {
  
  /**
   * API Wrapper for the Service Charge Resolution Engine
   */
  async calculateServiceCharge(req, res) {
    try {
      const { customerId, serviceType, travelClass, passengerCount } = req.query;
      
      if (!customerId || !serviceType || !travelClass || !passengerCount) {
        return res.status(400).json({ success: false, message: 'Missing required parameters' });
      }

      const amount = await serviceChargeService.getServiceCharge({
        customerId: convertUserIdToInt(customerId),
        serviceType: serviceType.toUpperCase(),
        travelClass: travelClass.toUpperCase(),
        passengerCount: parseInt(passengerCount)
      });

      res.status(200).json({ success: true, amount });
    } catch (error) {
      console.error('Calculation Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * CRUD: Get all customer-specific rules
   */
  async getAllCustomerRules(req, res) {
    try {
      const { limit, offset, page } = queryHelper.getPaginationOptions(req.query);
      const { count, rows: rules } = await ServiceCharge.findAndCountAll({
        include: [{ model: UserTVL, attributes: ['us_fname', 'us_lname', 'us_usname'] }],
        order: [['entered_on', 'DESC']],
        limit,
        offset
      });
      res.json(queryHelper.formatPaginatedResponse(count, rules, page, limit));
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * CRUD: Get all default rules
   */
  async getAllDefaultRules(req, res) {
    try {
      const { limit, offset, page } = queryHelper.getPaginationOptions(req.query);
      const { count, rows: rules } = await ServiceChargeDefault.findAndCountAll({
        order: [['entered_on', 'DESC']],
        limit,
        offset
      });
      res.json(queryHelper.formatPaginatedResponse(count, rules, page, limit));
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * CRUD: Create rule
   */
  async createRule(req, res) {
    try {
      const { isDefault, ...data } = req.body;
      const Model = isDefault ? ServiceChargeDefault : ServiceCharge;
      
      const rule = await Model.create(data, { userId: req.user.us_usid });

      // ── Forensic Audit: INSERT (async) ────────────────────────────────────────────
      Audit.logAction({ module: Audit.MODULES.SERVICE_CHARGE, recordId: rule.id || rule.sc_scid,
        action: Audit.ACTIONS.INSERT, req, fieldName: 'rule',
        oldValue: null, newValue: JSON.stringify(data) });
      // ───────────────────────────────────────────────────────────────

      res.status(201).json({ success: true, data: rule });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * CRUD: Update rule
   */
  async updateRule(req, res) {
    try {
      const { id } = req.params;
      const { isDefault, ...data } = req.body;
      const Model = isDefault ? ServiceChargeDefault : ServiceCharge;

      const rule = await Model.findByPk(id);
      if (!rule) return res.status(404).json({ success: false, message: 'Rule not found' });

      const oldValues = rule.toJSON();
      await rule.update(data, { userId: req.user.us_usid });

      // ── Forensic Audit: UPDATE (async) ─────────────────────────────────────────
      Audit.logFieldChanges(oldValues, rule.toJSON(), {
        module: Audit.MODULES.SERVICE_CHARGE, recordId: rule.id || rule.sc_scid, req });
      // ───────────────────────────────────────────────────────────────────────

      res.json({ success: true, data: rule });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * CRUD: Delete/Deactivate rule
   */
  async deleteRule(req, res) {
    try {
      const { id } = req.params;
      const { isDefault } = req.query;
      const Model = isDefault === 'true' ? ServiceChargeDefault : ServiceCharge;

      const rule = await Model.findByPk(id);
      if (!rule) return res.status(404).json({ success: false, message: 'Rule not found' });

      // Usually we deactivate rather than delete in ERPs
      const oldValues = rule.toJSON();
      await rule.update({ is_active: false }, { userId: req.user.us_usid });

      // ── Forensic Audit: CLOSE (async) ─────────────────────────────────────────
      Audit.logAction({ module: Audit.MODULES.SERVICE_CHARGE, recordId: rule.id || rule.sc_scid,
        action: Audit.ACTIONS.CLOSE, req, fieldName: 'is_active',
        oldValue: 'true', newValue: 'false' });
      // ───────────────────────────────────────────────────────────────────────

      res.json({ success: true, message: 'Rule deactivated successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new ServiceChargeController();
