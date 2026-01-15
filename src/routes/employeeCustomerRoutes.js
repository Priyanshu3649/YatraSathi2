const express = require('express');
const { 
  searchCustomers,
  getCustomerById 
} = require('../controllers/customerController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Check if user is an employee (has employee role)
router.use((req, res, next) => {
  // Allow access for employees and admin
  const allowedRoles = ['AGT', 'ACC', 'HR', 'CC', 'MKT', 'MGT', 'ADM'];
  if (!allowedRoles.includes(req.user.us_roid)) {
    return res.status(403).json({ 
      success: false, 
      error: { code: 'FORBIDDEN', message: 'Access denied. Employee role required.' } 
    });
  }
  next();
});

// Employee customer search and access routes
router.get('/search', searchCustomers);
router.get('/:id', getCustomerById);

module.exports = router;