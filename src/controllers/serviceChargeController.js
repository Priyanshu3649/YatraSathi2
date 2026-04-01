const serviceChargeService = require('../services/serviceChargeService');
const { ServiceCharge, ServiceChargeDefault, UserTVL } = require('../models');

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
        customerId: parseInt(customerId),
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
      const rules = await ServiceCharge.findAll({
        include: [{ model: UserTVL, attributes: ['us_fname', 'us_lname', 'us_usname'] }],
        order: [['entered_on', 'DESC']]
      });
      res.json({ success: true, data: rules });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * CRUD: Get all default rules
   */
  async getAllDefaultRules(req, res) {
    try {
      const rules = await ServiceChargeDefault.findAll({
        order: [['entered_on', 'DESC']]
      });
      res.json({ success: true, data: rules });
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

      await rule.update(data, { userId: req.user.us_usid });
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
      await rule.update({ is_active: false }, { userId: req.user.us_usid });
      res.json({ success: true, message: 'Rule deactivated successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new ServiceChargeController();
