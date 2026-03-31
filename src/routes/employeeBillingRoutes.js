const express = require('express');
const {
  createBill,
  getCustomerBills,
  getAllBills,
  getBillById,
  getPrintableBill,
  downloadBillPDF,
  updateBill,
  finalizeBill,
  deleteBill,
  cancelBill,
  searchBills,
  getCustomerLedger,
  getCustomerBalance,
  getCancellationHistory
} = require('../controllers/billingController');
const { getBillingByBookingId } = require('../controllers/billingIntegrationController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Check if user is an employee (has employee role)
router.use((req, res, next) => {
  const allowedRoles = ['AGT', 'ACC', 'HR', 'CC', 'MKT', 'MGT', 'ADM'];
  const userType = (req.user.us_usertype || req.user.usertype || '').toLowerCase();
  if (allowedRoles.includes(req.user.us_roid) || userType === 'admin') {
    return next();
  }
  return res.status(403).json({ 
    success: false, 
    error: { code: 'FORBIDDEN', message: 'Access denied. Employee role required.' } 
  });
});

// Employee billing routes
// For employees who need to view all bills (based on role)
router.get('/', getAllBills);

// Printable tax invoice (same handler as main billing; must be before /:id)
router.get('/print/:billId', getPrintableBill);
router.get('/download/:billId', downloadBillPDF);

router.get('/cancellations/history', getCancellationHistory);

router.post('/:id/cancel', async (req, res, next) => {
  const ut = (req.user.us_usertype || req.user.usertype || '').toLowerCase();
  const allowed = ['ACC', 'ADM', 'MGT'].includes(req.user.us_roid) || ut === 'admin';
  if (!allowed) {
    return res.status(403).json({
      success: false,
      message: 'Only Accounts, Management, or Admin may cancel bills.'
    });
  }
  next();
}, cancelBill);

router.get('/search', searchBills);
router.get('/customer/:customerId/ledger', getCustomerLedger);
router.get('/customer/:customerId/balance', getCustomerBalance);
router.get('/booking/:bookingId', getBillingByBookingId);

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

module.exports = router;