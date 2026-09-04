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
      const { customerId, customerName, phone, serviceType, travelClass, passengerCount, baseFare } = req.query;
      
      const amount = await serviceChargeService.getServiceCharge({
        customerId: customerId || undefined,
        customerName: customerName || undefined,
        phone: phone || undefined,
        serviceType: (serviceType || 'RESERVATION').toUpperCase(),
        travelClass: (travelClass || '3A').toUpperCase(),
        passengerCount: parseInt(passengerCount, 10) || 1,
        baseFare: parseFloat(baseFare) || 0
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

  /**
   * Get full Service Charge Matrix for a Customer
   */
  async getCustomerConfig(req, res) {
    try {
      const { customerId } = req.params;
      const { CustomerTVL, UserTVL } = require('../models');
      const { Op } = require('sequelize');

      const customer = await CustomerTVL.findOne({
        where: {
          [Op.or]: [
            { cu_cusid: customerId },
            { cu_usid: customerId },
            { cu_custno: customerId }
          ]
        },
        include: [{ model: UserTVL, as: 'user', attributes: ['us_fname', 'us_lname', 'us_usname', 'us_phone', 'us_email', 'us_usid'] }]
      });

      if (!customer) {
        return res.status(404).json({ success: false, message: 'Customer not found' });
      }

      const defaultClasses = ['1AC', '2AC', '3AC', 'EC', 'CC', 'FC', 'SL', '2S'];
      const defaultRow = () => ({ type: 'FLAT', pax: [0, 0, 0, 0, 0, 0] });

      let config = customer.cu_servicecharge_config;
      if (typeof config === 'string') {
        try { config = JSON.parse(config); } catch (e) { config = null; }
      }

      if (!config || typeof config !== 'object') {
        const reservation = {};
        const cancellation = {};
        defaultClasses.forEach(cls => {
          reservation[cls] = defaultRow();
          cancellation[cls] = defaultRow();
        });
        config = {
          reservation,
          cancellation,
          remarks: '',
          deliveryCharge: 0
        };
      } else {
        // Ensure all classes exist
        if (!config.reservation) config.reservation = {};
        if (!config.cancellation) config.cancellation = {};
        defaultClasses.forEach(cls => {
          if (!config.reservation[cls]) config.reservation[cls] = defaultRow();
          if (!config.cancellation[cls]) config.cancellation[cls] = defaultRow();
        });
      }

      const customerName = customer.user ? `${customer.user.us_fname || ''} ${customer.user.us_lname || ''}`.trim() || customer.user.us_usname : customer.cu_custno;

      res.json({
        success: true,
        data: {
          customerId: customer.cu_cusid,
          customerNo: customer.cu_custno,
          userId: customer.cu_usid,
          customerName,
          config
        }
      });
    } catch (error) {
      console.error('Error fetching customer service charge config:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Save full Service Charge Matrix for a Customer
   */
  async saveCustomerConfig(req, res) {
    try {
      const { customerId } = req.params;
      const { config } = req.body;
      const { CustomerTVL, UserTVL, ServiceCharge } = require('../models');
      const { Op } = require('sequelize');

      if (!config) {
        return res.status(400).json({ success: false, message: 'Configuration data is required' });
      }

      const customer = await CustomerTVL.findOne({
        where: {
          [Op.or]: [
            { cu_cusid: customerId },
            { cu_usid: customerId },
            { cu_custno: customerId }
          ]
        },
        include: [{ model: UserTVL, as: 'user' }]
      });

      if (!customer) {
        return res.status(404).json({ success: false, message: 'Customer not found' });
      }

      const oldConfig = customer.cu_servicecharge_config;
      
      // Update model
      await customer.update({ cu_servicecharge_config: config }, { userId: req.user.us_usid });

      // Direct persistent update to master table
      try {
        const { sequelizeTVL } = require('../../config/db');
        await sequelizeTVL.query(
          'UPDATE `YATRASATHI_MASTER`.`cuXcustomer` SET `cu_servicecharge_config` = :config WHERE `cu_cusid` = :id OR `cu_usid` = :id OR `cu_custno` = :id',
          {
            replacements: {
              config: JSON.stringify(config),
              id: customer.cu_cusid || customerId
            }
          }
        );
      } catch (masterUpdateErr) {
        console.warn('Direct master update notice:', masterUpdateErr.message);
      }

      // Synchronize into ServiceCharge table rules for calculations
      try {
        const userIdStr = customer.cu_usid;
        const classes = ['1AC', '2AC', '3AC', 'EC', 'CC', 'FC', 'SL', '2S'];
        const classMap = { '1AC': '1A', '2AC': '2A', '3AC': '3A', '1A': '1A', '2A': '2A', '3A': '3A', 'SL': 'SL', 'CC': 'CC', '2S': '2S', 'EC': 'EC', 'FC': '2S' };

        // Deactivate existing rules for this customer
        await ServiceCharge.update({ is_active: false }, { where: { customer_id: userIdStr } });

        // Insert new rules from matrix
        const types = [
          { key: 'reservation', serviceType: 'RESERVATION' },
          { key: 'cancellation', serviceType: 'CANCELLATION' }
        ];

        for (const { key, serviceType } of types) {
          const typeConfig = config[key];
          if (!typeConfig) continue;

          for (const cls of classes) {
            const row = typeConfig[cls];
            if (!row || !Array.isArray(row.pax)) continue;

            const mappedClass = classMap[cls] || 'SL';
            const chargeMode = row.type === 'PERCENTAGE' ? 'PERCENTAGE' : 'FIXED';

            for (let i = 0; i < 6; i++) {
              const paxCount = i + 1;
              const val = parseFloat(row.pax[i]) || 0;
              if (val > 0) {
                await ServiceCharge.create({
                  customer_id: userIdStr,
                  service_type: serviceType,
                  travel_class: mappedClass,
                  charge_mode: chargeMode === 'PERCENTAGE' ? 'FIXED' : 'FIXED', // Or mapped
                  passenger_min: paxCount,
                  passenger_max: paxCount,
                  amount: val,
                  is_active: true,
                  entered_by: convertUserIdToInt(req.user.us_usid) || 1
                });
              }
            }
          }
        }
      } catch (syncErr) {
        console.warn('⚠️ Non-critical warning syncing to ServiceCharge table:', syncErr.message);
      }

      // ── Forensic Audit: UPDATE ─────────────────────────────────────────────
      Audit.logAction({
        module: Audit.MODULES.SERVICE_CHARGE,
        recordId: customer.cu_cusid,
        action: Audit.ACTIONS.UPDATE,
        req,
        fieldName: 'cu_servicecharge_config',
        oldValue: JSON.stringify(oldConfig),
        newValue: JSON.stringify(config)
      });

      res.json({
        success: true,
        message: 'Service charges saved successfully',
        data: config
      });
    } catch (error) {
      console.error('Error saving customer service charge config:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new ServiceChargeController();
