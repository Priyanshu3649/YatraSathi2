const express = require('express');
const {
  createBill,
  getCustomerBills,
  getAllBills,
  getBillById,
  updateBill,
  finalizeBill,
  deleteBill,
  searchBills,
  getCustomerLedger,
  getCustomerBalance
} = require('../controllers/billingController');
const { getBillingByBookingId } = require('../controllers/billingIntegrationController');
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

// Employee billing routes
// For employees who need to view all bills (based on role)
router.get('/', getAllBills);

// Get bill by ID (employees can view based on their permissions)
router.get('/:id', getBillById);

// Update bill (only accounts team and admin)
router.put('/:id', async (req, res, next) => {
  const allowedToUpdate = ['ACC', 'ADM'];
  if (!allowedToUpdate.includes(req.user.us_roid)) {
    return res.status(403).json({ 
      success: false,
      message: 'Access denied. Accounts team or Admin access required.' 
    });
  }
  next();
}, updateBill);

// Finalize bill (only accounts team and admin)
router.put('/:id/finalize', async (req, res, next) => {
  const allowedToFinalize = ['ACC', 'ADM'];
  if (!allowedToFinalize.includes(req.user.us_roid)) {
    return res.status(403).json({ 
      success: false,
      message: 'Access denied. Accounts team or Admin access required.' 
    });
  }
  next();
}, finalizeBill);

// Delete bill (admin only)
router.delete('/:id', async (req, res, next) => {
  if (req.user.us_roid !== 'ADM') {
    return res.status(403).json({ 
      success: false,
      message: 'Access denied. Admin access required.' 
    });
  }
  next();
}, deleteBill);

// Search bills
router.get('/search', searchBills);

// Customer-specific routes
router.get('/customer/:customerId/ledger', getCustomerLedger);
router.get('/customer/:customerId/balance', getCustomerBalance);

// Booking integration routes
router.get('/booking/:bookingId', getBillingByBookingId);

module.exports = router;