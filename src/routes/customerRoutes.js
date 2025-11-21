const express = require('express');
const {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerBookings,
  getCustomerPayments,
  getCorporateCustomerDetails
} = require('../controllers/customerController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Admin-only routes
router.get('/', async (req, res, next) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin access required.' });
  }
  next();
}, getAllCustomers);

router.get('/:id', async (req, res, next) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin access required.' });
  }
  next();
}, getCustomerById);

router.post('/', async (req, res, next) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin access required.' });
  }
  next();
}, createCustomer);

router.put('/:id', async (req, res, next) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin access required.' });
  }
  next();
}, updateCustomer);

router.delete('/:id', async (req, res, next) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin access required.' });
  }
  next();
}, deleteCustomer);

// Customer routes
router.get('/my/bookings', async (req, res, next) => {
  if (req.user.userType !== 'customer' && req.user.userType !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Customer access required.' });
  }
  next();
}, getCustomerBookings);

router.get('/my/payments', async (req, res, next) => {
  if (req.user.userType !== 'customer' && req.user.userType !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Customer access required.' });
  }
  next();
}, getCustomerPayments);

// Corporate customer routes
router.get('/corporate/details', async (req, res, next) => {
  if (req.user.userType !== 'customer' && req.user.userType !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Customer access required.' });
  }
  next();
}, getCorporateCustomerDetails);

module.exports = router;