const express = require('express');
const {
  getCustomerMasterPassengersML,
  createMasterPassengerML,
  updateMasterPassengerML,
  deleteMasterPassengerML,
  getMasterPassengerByIdML
} = require('../controllers/masterPassengerListController');
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

// Master passenger list routes (mlXmasterlist version)
router.get('/', getCustomerMasterPassengersML);
router.post('/', createMasterPassengerML);
router.get('/:id', getMasterPassengerByIdML);
router.put('/:id', updateMasterPassengerML);
router.delete('/:id', deleteMasterPassengerML);

module.exports = router;