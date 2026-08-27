const express = require('express');
const router = express.Router();
const reconciliationController = require('../controllers/reconciliationController');
const requireAuth = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/rbacMiddleware');

// Booking Reconciliation
router.post('/bookings/bulk-reconcile', requireAuth, requireRole(['ADM', 'admin', 'ACC', 'Accounts']), reconciliationController.bulkReconcileBookings);
router.post('/bookings/:id/reconcile', requireAuth, requireRole(['ADM', 'admin', 'ACC', 'Accounts']), reconciliationController.reconcileBooking);
router.post('/bookings/:id/unreconcile', requireAuth, requireRole(['ADM', 'admin']), reconciliationController.unreconcileBooking);

// Billing Reconciliation
router.post('/bills/bulk-reconcile', requireAuth, requireRole(['ADM', 'admin', 'ACC', 'Accounts']), reconciliationController.bulkReconcileBills);
router.post('/bills/:id/reconcile', requireAuth, requireRole(['ADM', 'admin', 'ACC', 'Accounts']), reconciliationController.reconcileBill);
router.post('/bills/:id/unreconcile', requireAuth, requireRole(['ADM', 'admin']), reconciliationController.unreconcileBill);

// Payment Reconciliation
router.post('/payments/bulk-reconcile', requireAuth, requireRole(['ADM', 'admin', 'ACC', 'Accounts']), reconciliationController.bulkReconcilePayments);
router.post('/payments/:id/reconcile', requireAuth, requireRole(['ADM', 'admin', 'ACC', 'Accounts']), reconciliationController.reconcilePayment);
router.post('/payments/:id/unreconcile', requireAuth, requireRole(['ADM', 'admin']), reconciliationController.unreconcilePayment);

// Receipt Reconciliation
router.post('/receipts/bulk-reconcile', requireAuth, requireRole(['ADM', 'admin', 'ACC', 'Accounts']), reconciliationController.bulkReconcileReceipts);
router.post('/receipts/:id/reconcile', requireAuth, requireRole(['ADM', 'admin', 'ACC', 'Accounts']), reconciliationController.reconcileReceipt);
router.post('/receipts/:id/unreconcile', requireAuth, requireRole(['ADM', 'admin']), reconciliationController.unreconcileReceipt);

// Station Boy Payment Reconciliation
router.post('/station-boy-payments/bulk-reconcile', requireAuth, requireRole(['ADM', 'admin', 'ACC', 'Accounts']), reconciliationController.bulkReconcileStationBoyPayments);
router.post('/station-boy-payments/:id/reconcile', requireAuth, requireRole(['ADM', 'admin', 'ACC', 'Accounts']), reconciliationController.reconcileStationBoyPayment);
router.post('/station-boy-payments/:id/unreconcile', requireAuth, requireRole(['ADM', 'admin']), reconciliationController.unreconcileStationBoyPayment);

// Contra Reconciliation
router.post('/contras/bulk-reconcile', requireAuth, requireRole(['ADM', 'admin', 'ACC', 'Accounts']), reconciliationController.bulkReconcileContras);
router.post('/contras/:id/reconcile', requireAuth, requireRole(['ADM', 'admin', 'ACC', 'Accounts']), reconciliationController.reconcileContra);
router.post('/contras/:id/unreconcile', requireAuth, requireRole(['ADM', 'admin']), reconciliationController.unreconcileContra);

// Journal Reconciliation
router.post('/journals/bulk-reconcile', requireAuth, requireRole(['ADM', 'admin', 'ACC', 'Accounts']), reconciliationController.bulkReconcileJournals);

module.exports = router;
