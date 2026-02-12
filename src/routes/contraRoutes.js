const express = require('express');
const router = express.Router();
const contraController = require('../controllers/contraController');
const { body } = require('express-validator');
const authenticateToken = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Contra routes
router.get('/', contraController.getAllContras);
router.get('/:id', contraController.getContraById);
router.post('/', [
  body('ct_from_account').notEmpty().withMessage('From account is required'),
  body('ct_to_account').notEmpty().withMessage('To account is required'),
  body('ct_amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number')
], contraController.createContra);
router.put('/:id', contraController.updateContra);
router.delete('/:id', contraController.deleteContra);

module.exports = router;