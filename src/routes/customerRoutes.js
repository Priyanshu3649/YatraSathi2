const express = require('express');
const customerController = require('../controllers/customerController');
const billingController = require('../controllers/billingController');
const bookingController = require('../controllers/bookingController');
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// ── IMPORTANT: All literal routes MUST come before /:id wildcard routes ──────

// ── Customer dashboard ────────────────────────────────────────────────────────
router.get('/dashboard', (req, res, next) => {
  if (typeof dashboardController.getCustomerDashboard === 'function') {
    return dashboardController.getCustomerDashboard(req, res, next);
  }
  if (typeof dashboardController.getDashboard === 'function') {
    return dashboardController.getDashboard(req, res, next);
  }
  res.json({ success: true, data: { stats: {}, financialSummary: null } });
});

// ── Customer bookings ─────────────────────────────────────────────────────────
router.post('/bookings', bookingController.createBooking);
router.get('/bookings', bookingController.getCustomerBookings);
router.get('/bookings/:id/passengers', bookingController.getBookingPassengers);
router.get('/bookings/:id', bookingController.getBookingById);

// ── Customer bills ────────────────────────────────────────────────────────────
router.get('/bills', billingController.getCustomerBills);

// ── Customer payments ─────────────────────────────────────────────────────────
router.get('/payments', async (req, res) => {
  try {
    const { sequelize } = require('../../config/db');
    const userId = req.user.us_usid;

    // Pull receipts linked to this customer's bills via the TVL DB
    const payments = await sequelize.query(
      `SELECT rc.rc_rcid AS id, rc.rc_entry_no AS payment_id,
              rc.rc_date AS payment_date, rc.rc_amount AS amount,
              rc.rc_payment_mode AS mode, rc.rc_narration AS narration,
              'Completed' AS status
       FROM rcXreceipt rc
       INNER JOIN blXbilling bl ON rc.rc_ref_number = bl.bl_bill_no
       INNER JOIN bkXbooking bk ON bl.bl_booking_id = bk.bk_bkid
       WHERE bk.bk_usid = ?
       ORDER BY rc.rc_date DESC
       LIMIT 50`,
      { replacements: [userId], type: sequelize.QueryTypes.SELECT }
    );

    res.json({ success: true, data: { payments: payments || [] } });
  } catch (err) {
    console.error('Customer payments fetch error:', err.message);
    res.json({ success: true, data: { payments: [] } });
  }
});

// ── Customer create (admin) ──────────────────────────────────────────────────
router.post('/', customerController.createCustomer);

// ── Wildcard /:id routes LAST to avoid intercepting literal routes ────────────
router.get('/:id/details', customerController.getCustomerDetails);
router.get('/:id/ledger', customerController.getCustomerLedger);

module.exports = router;
