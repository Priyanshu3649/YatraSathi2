const express = require('express');
const {
  getAllPayments,
  getPaymentById,
  getPaymentAllocations,
  getPNRPayments,
  getCustomerPendingPNRs,
  getCustomerAdvance,
  getOutstandingReceivables,
  allocatePayment,
  refundPayment,
  updatePayment,
  deletePayment,
  verifyPayment
} = require('../controllers/employeePaymentController');

const { createPayment } = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');
const { emEmployee: Employee } = require('../models');

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

// Employee payment routes
// For employees who need to view all payments (based on role)
router.get('/', getAllPayments);

// Get payment by ID (employees can view based on their permissions)
router.get('/:id', getPaymentById);

// Update payment (only accounts team and admin)
router.put('/:id', async (req, res, next) => {
  const allowedToUpdate = ['ACC', 'ADM'];
  if (!allowedToUpdate.includes(req.user.us_roid)) {
    return res.status(403).json({ 
      success: false,
      message: 'Access denied. Accounts team or Admin access required.' 
    });
  }
  next();
}, updatePayment);

// Delete payment (admin only)
router.delete('/:id', async (req, res, next) => {
  if (req.user.us_roid !== 'ADM') {
    return res.status(403).json({ 
      success: false,
      message: 'Access denied. Admin access required.' 
    });
  }
  next();
}, deletePayment);

// Create new payment (accounts team and admin)
router.post('/', async (req, res, next) => {
  const allowedToCreate = ['ACC', 'ADM'];
  if (!allowedToCreate.includes(req.user.us_roid)) {
    return res.status(403).json({ 
      success: false,
      message: 'Access denied. Accounts team or Admin access required.' 
    });
  }
  next();
}, createPayment);

// Allocate payment to PNRs (accounts team and admin)
router.post('/:paymentId/allocate', async (req, res, next) => {
  const allowedToAllocate = ['ACC', 'ADM'];
  if (!allowedToAllocate.includes(req.user.us_roid)) {
    return res.status(403).json({ 
      success: false,
      message: 'Access denied. Accounts team or Admin access required.' 
    });
  }
  next();
}, allocatePayment);

// Refund payment (accounts team and admin)
router.post('/:paymentId/refund', async (req, res, next) => {
  const allowedToRefund = ['ACC', 'ADM'];
  if (!allowedToRefund.includes(req.user.us_roid)) {
    return res.status(403).json({ 
      success: false,
      message: 'Access denied. Accounts team or Admin access required.' 
    });
  }
  next();
}, refundPayment);

// Verify customer payment (accounts team and admin)
router.post('/:id/verify', async (req, res, next) => {
  const allowedToVerify = ['ACC', 'ADM'];
  if (!allowedToVerify.includes(req.user.us_roid)) {
    return res.status(403).json({ 
      success: false,
      message: 'Access denied. Accounts team or Admin access required.' 
    });
  }
  next();
}, verifyPayment);

// Get payment allocations
router.get('/:paymentId/allocations', getPaymentAllocations);

// Get PNR payment history
router.get('/pnr/:pnrNumber', getPNRPayments);

// Get customer pending PNRs (for payment allocation)
router.get('/customer/:customerId/pending-pnrs', async (req, res, next) => {
  // Accounts team and admin can access
  const allowedToAccess = ['ACC', 'ADM'];
  if (!allowedToAccess.includes(req.user.us_roid)) {
    return res.status(403).json({ 
      success: false,
      message: 'Access denied. Accounts team or Admin access required.' 
    });
  }
  next();
}, getCustomerPendingPNRs);

// Get customer advance balance
router.get('/customer/:customerId/advance', async (req, res, next) => {
  // Accounts team and admin can access
  const allowedToAccess = ['ACC', 'ADM'];
  if (!allowedToAccess.includes(req.user.us_roid)) {
    return res.status(403).json({ 
      success: false,
      message: 'Access denied. Accounts team or Admin access required.' 
    });
  }
  next();
}, getCustomerAdvance);

// Get outstanding receivables report (accounts team and admin)
router.get('/reports/outstanding', async (req, res, next) => {
  const allowedToAccess = ['ACC', 'MGT', 'ADM'];
  if (!allowedToAccess.includes(req.user.us_roid)) {
    return res.status(403).json({ 
      success: false,
      message: 'Access denied. Accounts team, Management, or Admin access required.' 
    });
  }
  next();
}, getOutstandingReceivables);

module.exports = router;