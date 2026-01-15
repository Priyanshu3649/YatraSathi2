const express = require('express');
const {
  getCustomerMasterPassengers,
  createMasterPassenger,
  updateMasterPassenger,
  deleteMasterPassenger,
  getMasterPassengerById
} = require('../controllers/masterPassengerController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Check if user is a customer
router.use((req, res, next) => {
  if (req.user.us_roid !== 'CUS') {
    return res.status(403).json({ 
      success: false, 
      error: { code: 'FORBIDDEN', message: 'Access denied. Customer role required.' } 
    });
  }
  next();
});

// Master passenger routes
router.get('/', getCustomerMasterPassengers);
router.post('/', createMasterPassenger);
router.get('/:id', getMasterPassengerById);
router.put('/:id', updateMasterPassenger);
router.delete('/:id', deleteMasterPassenger);

module.exports = router;