const express = require('express');
const {
  createPayment,
  allocatePayment,
  refundPayment,
  getAllPayments,
  getCustomerPayments,
  getPaymentById,
  getPaymentAllocations,
  getPNRPayments,
  getCustomerPendingPNRs,
  getCustomerAdvance,
  getOutstandingReceivables,
  performYearEndClosing
} = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');
const { emEmployee: Employee } = require('../models');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// ============================================================================
// PAYMENT OPERATIONS
// ============================================================================

/**
 * POST /api/payments
 * Create a new payment
 * Access: Admin, Accounts Team
 */
router.post('/', async (req, res, next) => {
  if (req.user.us_usertype === 'employee') {
    try {
      const employee = await Employee.findOne({ where: { em_usid: req.user.us_usid } });
      if (!employee || employee.em_dept !== 'ACCOUNTS') {
        return res.status(403).json({ 
          success: false,
          message: 'Access denied. Accounts team access required.' 
        });
      }
    } catch (error) {
      return res.status(500).json({ 
        success: false,
        message: 'Error checking permissions' 
      });
    }
  } else if (req.user.us_usertype !== 'admin') {
    return res.status(403).json({ 
      success: false,
      message: 'Access denied. Admin or Accounts team access required.' 
    });
  }
  next();
}, createPayment);

/**
 * POST /api/payments/:paymentId/allocate
 * Allocate payment to PNRs
 * Access: Admin, Accounts Team
 */
router.post('/:paymentId/allocate', async (req, res, next) => {
  if (req.user.us_usertype === 'employee') {
    try {
      const employee = await Employee.findOne({ where: { em_usid: req.user.us_usid } });
      if (!employee || employee.em_dept !== 'ACCOUNTS') {
        return res.status(403).json({ 
          success: false,
          message: 'Access denied. Accounts team access required.' 
        });
      }
    } catch (error) {
      return res.status(500).json({ 
        success: false,
        message: 'Error checking permissions' 
      });
    }
  } else if (req.user.us_usertype !== 'admin') {
    return res.status(403).json({ 
      success: false,
      message: 'Access denied. Admin or Accounts team access required.' 
    });
  }
  next();
}, allocatePayment);

/**
 * POST /api/payments/:paymentId/refund
 * Refund a payment
 * Access: Admin, Accounts Team
 */
router.post('/:paymentId/refund', async (req, res, next) => {
  if (req.user.us_usertype === 'employee') {
    try {
      const employee = await Employee.findOne({ where: { em_usid: req.user.us_usid } });
      if (!employee || employee.em_dept !== 'ACCOUNTS') {
        return res.status(403).json({ 
          success: false,
          message: 'Access denied. Accounts team access required.' 
        });
      }
    } catch (error) {
      return res.status(500).json({ 
        success: false,
        message: 'Error checking permissions' 
      });
    }
  } else if (req.user.us_usertype !== 'admin') {
    return res.status(403).json({ 
      success: false,
      message: 'Access denied. Admin or Accounts team access required.' 
    });
  }
  next();
}, refundPayment);

// ============================================================================
// QUERY ENDPOINTS
// ============================================================================

/**
 * GET /api/payments/my-payments
 * Get customer's own payments
 * Access: Customer
 * NOTE: Must be before /:id route to avoid route conflicts
 */
router.get('/my-payments', getCustomerPayments);

/**
 * GET /api/payments/reports/outstanding
 * Get outstanding receivables report
 * Access: Admin, Accounts Team
 * NOTE: Must be before /:id route to avoid route conflicts
 */
router.get('/reports/outstanding', async (req, res, next) => {
  if (req.user.us_usertype === 'employee') {
    try {
      const employee = await Employee.findOne({ where: { em_usid: req.user.us_usid } });
      if (!employee || employee.em_dept !== 'ACCOUNTS') {
        return res.status(403).json({ 
          success: false,
          message: 'Access denied. Accounts team access required.' 
        });
      }
    } catch (error) {
      return res.status(500).json({ 
        success: false,
        message: 'Error checking permissions' 
      });
    }
  } else if (req.user.us_usertype !== 'admin') {
    return res.status(403).json({ 
      success: false,
      message: 'Access denied. Admin or Accounts team access required.' 
    });
  }
  next();
}, getOutstandingReceivables);

/**
 * GET /api/payments/pnr/:pnrNumber
 * Get PNR payment history
 * Access: All authenticated users (with data filtering)
 * NOTE: Must be before /:id route to avoid route conflicts
 */
router.get('/pnr/:pnrNumber', getPNRPayments);

/**
 * GET /api/payments/customer/:customerId/pending-pnrs
 * Get customer pending PNRs (for payment allocation screen)
 * Access: Admin, Accounts Team, or Customer (own data)
 * NOTE: Must be before /:id route to avoid route conflicts
 */
router.get('/customer/:customerId/pending-pnrs', async (req, res, next) => {
  // Customers can only view their own pending PNRs
  if (req.user.us_usertype === 'customer' && req.params.customerId !== req.user.us_usid) {
    return res.status(403).json({ 
      success: false,
      message: 'Access denied. You can only view your own pending PNRs.' 
    });
  }
  
  // Employees need accounts department access
  if (req.user.us_usertype === 'employee') {
    try {
      const employee = await Employee.findOne({ where: { em_usid: req.user.us_usid } });
      if (!employee || employee.em_dept !== 'ACCOUNTS') {
        return res.status(403).json({ 
          success: false,
          message: 'Access denied. Accounts team access required.' 
        });
      }
    } catch (error) {
      return res.status(500).json({ 
        success: false,
        message: 'Error checking permissions' 
      });
    }
  }
  
  next();
}, getCustomerPendingPNRs);

/**
 * GET /api/payments/customer/:customerId/advance
 * Get customer advance balance
 * Access: Admin, Accounts Team, or Customer (own data)
 * NOTE: Must be before /:id route to avoid route conflicts
 */
router.get('/customer/:customerId/advance', async (req, res, next) => {
  // Customers can only view their own advance
  if (req.user.us_usertype === 'customer' && req.params.customerId !== req.user.us_usid) {
    return res.status(403).json({ 
      success: false,
      message: 'Access denied. You can only view your own advance balance.' 
    });
  }
  next();
}, getCustomerAdvance);

/**
 * GET /api/payments/:paymentId/allocations
 * Get payment allocations
 * Access: All authenticated users (with data filtering)
 * NOTE: Must be before /:id route to avoid route conflicts
 */
router.get('/:paymentId/allocations', getPaymentAllocations);

/**
 * GET /api/payments
 * Get all payments (Admin/Accounts Team) or customer payments
 * Access: Admin, Accounts Team, or Customer (own data)
 */
router.get('/', async (req, res, next) => {
  // Customers get their own payments
  if (req.user.us_usertype === 'customer') {
    return getCustomerPayments(req, res);
  }
  // Admin and Accounts Team get all payments
  next();
}, getAllPayments);

/**
 * GET /api/payments/:id
 * Get payment by ID
 * Access: Admin, Accounts Team, or Customer (own payment)
 * NOTE: This must be LAST to avoid catching other routes
 */
router.get('/:id', getPaymentById);

// ============================================================================
// REPORTS (Admin & Accounts Team Only)
// ============================================================================
// Moved to top to avoid route conflicts

// ============================================================================
// YEAR-END CLOSING (Admin Only)
// ============================================================================

/**
 * POST /api/payments/year-end-closing
 * Perform year-end closing
 * Access: Admin Only
 */
router.post('/year-end-closing', async (req, res, next) => {
  if (req.user.us_usertype !== 'admin') {
    return res.status(403).json({ 
      success: false,
      message: 'Access denied. Admin access required.' 
    });
  }
  next();
}, performYearEndClosing);

module.exports = router;
