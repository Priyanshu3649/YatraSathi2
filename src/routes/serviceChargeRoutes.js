const express = require('express');
const router = express.Router();
const serviceChargeController = require('../controllers/serviceChargeController');
const auth = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/rbacMiddleware');

/**
 * Service Charge Calculation
 * GET /api/service-charge/calculate
 */
router.get('/calculate', auth, serviceChargeController.calculateServiceCharge);

/**
 * Admin: Service Charge Management (CRUD)
 */
router.get('/customer-rules', auth, requireRole(['ADM', 'admin']), serviceChargeController.getAllCustomerRules);
router.get('/default-rules', auth, requireRole(['ADM', 'admin']), serviceChargeController.getAllDefaultRules);
router.post('/rules', auth, requireRole(['ADM', 'admin']), serviceChargeController.createRule);
router.put('/rules/:id', auth, requireRole(['ADM', 'admin']), serviceChargeController.updateRule);
router.delete('/rules/:id', auth, requireRole(['ADM', 'admin']), serviceChargeController.deleteRule);

module.exports = router;
