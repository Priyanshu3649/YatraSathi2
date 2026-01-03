const express = require('express');
const {
  createPayment,
  refundPayment,
  allocatePayment,
  getPaymentAllocations,
  getPNRPayments,
  getCustomerPayments,
  getAllPayments,
  getPaymentById,
  updatePayment,
  deletePayment,
  getPaymentsByBookingId,
  getEarningsReport
} = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');
const { Employee } = require('../models');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Customer routes
router.get('/my-payments', getCustomerPayments);
router.get('/booking/:bookingId', getPaymentsByBookingId);

// Employee routes (accounts department)
router.post('/', async (req, res, next) => {
  // For employees, we need to check their department from the Employee model
  if (req.user.us_usertype === 'employee') {
    try {
      const employee = await Employee.findOne({ where: { em_usid: req.user.us_usid } });
      if (!employee || employee.em_dept !== 'accounts') {
        return res.status(403).json({ message: 'Access denied. Accounts team access required.' });
      }
    } catch (error) {
      return res.status(500).json({ message: 'Error checking permissions' });
    }
  } else if (req.user.us_usertype !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin access required.' });
  }
  next();
}, createPayment);

router.post('/:id/refund', async (req, res, next) => {
  // For employees, we need to check their department from the Employee model
  if (req.user.us_usertype === 'employee') {
    try {
      const employee = await Employee.findOne({ where: { em_usid: req.user.us_usid } });
      if (!employee || employee.em_dept !== 'accounts') {
        return res.status(403).json({ message: 'Access denied. Accounts team access required.' });
      }
    } catch (error) {
      return res.status(500).json({ message: 'Error checking permissions' });
    }
  } else if (req.user.us_usertype !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin access required.' });
  }
  next();
}, refundPayment);

router.put('/:id', async (req, res, next) => {
  // For employees, we need to check their department from the Employee model
  if (req.user.us_usertype === 'employee') {
    try {
      const employee = await Employee.findOne({ where: { em_usid: req.user.us_usid } });
      if (!employee || employee.em_dept !== 'accounts') {
        return res.status(403).json({ message: 'Access denied. Accounts team access required.' });
      }
    } catch (error) {
      return res.status(500).json({ message: 'Error checking permissions' });
    }
  } else if (req.user.us_usertype !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin access required.' });
  }
  next();
}, updatePayment);

// Admin routes
router.get('/', async (req, res, next) => {
  if (req.user.us_usertype !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin access required.' });
  }
  next();
}, getAllPayments);

router.get('/:id', async (req, res, next) => {
  if (req.user.us_usertype !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin access required.' });
  }
  next();
}, getPaymentById);

router.delete('/:id', async (req, res, next) => {
  if (req.user.us_usertype !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin access required.' });
  }
  next();
}, deletePayment);

// Payment allocation routes
router.post('/:paymentId/allocate', async (req, res, next) => {
  // For employees, we need to check their department from the Employee model
  if (req.user.us_usertype === 'employee') {
    try {
      const employee = await Employee.findOne({ where: { em_usid: req.user.us_usid } });
      if (!employee || employee.em_dept !== 'accounts') {
        return res.status(403).json({ message: 'Access denied. Accounts team access required.' });
      }
    } catch (error) {
      return res.status(500).json({ message: 'Error checking permissions' });
    }
  } else if (req.user.us_usertype !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin access required.' });
  }
  next();
}, allocatePayment);

router.get('/:paymentId/allocations', getPaymentAllocations);
router.get('/pnr/:pnrId/payments', getPNRPayments);

// Earnings report (admin only)
router.get('/reports/earnings', async (req, res, next) => {
  if (req.user.us_usertype !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin access required.' });
  }
  next();
}, getEarningsReport);

module.exports = router;