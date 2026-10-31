const { BookingTVL, BillTVL, PaymentTVL, Receipt, StationBoyPayment, StationBoyPaymentAllocation, Contra, Journal, sequelizeTVL } = require('../models');
const stationBoySettlementService = require('../services/stationBoySettlementService');

// Helper to convert USID string to integer for audit hooks/reconciled_by
function convertUserIdToInt(userId) {
  if (!userId) return 1;
  const num = parseInt(userId.toString().replace(/\D/g, ''), 10);
  return isNaN(num) ? 1 : num;
}

const { Op } = require('sequelize');

const reconciliationController = {
  // Booking Reconciliation
  bulkReconcileBookings: async (req, res) => {
    const transaction = await BookingTVL.sequelize.transaction();
    try {
      const { bookingIds, remarks } = req.body;
      
      if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
        return res.status(400).json({ success: false, error: 'No booking IDs provided' });
      }

      // Fetch all bookings that match
      const bookings = await BookingTVL.findAll({
        where: { bk_bkid: { [Op.in]: bookingIds } },
        transaction
      });

      if (bookings.length !== bookingIds.length) {
        await transaction.rollback();
        return res.status(404).json({ success: false, error: 'One or more bookings not found' });
      }

      const invalidBookings = bookings.filter(b => b.bk_status !== 'CNF' && b.bk_status !== 'CAN');
      if (invalidBookings.length > 0) {
        await transaction.rollback();
        return res.status(400).json({ success: false, error: 'Only confirmed or cancelled bookings can be reconciled' });
      }

      const reconciledBy = convertUserIdToInt(req.user?.us_usid);
      const reconciledAt = new Date();
      const reconciliationRemarks = remarks || 'Reconciled';

      await BookingTVL.update(
        {
          is_reconciled: 1,
          reconciled_by: reconciledBy,
          reconciled_at: reconciledAt,
          reconciliation_remarks: reconciliationRemarks
        },
        {
          where: { bk_bkid: { [Op.in]: bookingIds } },
          transaction
        }
      );

      await transaction.commit();
      res.json({ success: true, message: 'Bookings reconciled successfully', data: { count: bookings.length } });
    } catch (error) {
      await transaction.rollback();
      console.error('Error in bulk reconciling bookings:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  reconcileBooking: async (req, res) => {
    try {
      const { id } = req.params;
      const { remarks } = req.body;
      
      const booking = await BookingTVL.findByPk(id);
      if (!booking) return res.status(404).json({ success: false, error: 'Booking not found' });
      
      if (booking.bk_status !== 'CNF' && booking.bk_status !== 'CAN') {
        return res.status(400).json({ success: false, error: 'Only confirmed or cancelled bookings can be reconciled' });
      }

      booking.is_reconciled = 1;
      booking.reconciled_by = convertUserIdToInt(req.user?.us_usid);
      booking.reconciled_at = new Date();
      booking.reconciliation_remarks = remarks || 'Reconciled';
      
      await booking.save();
      
      res.json({ success: true, message: 'Booking reconciled successfully', data: booking });
    } catch (error) {
      console.error('Error reconciling booking:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  unreconcileBooking: async (req, res) => {
    try {
      const { id } = req.params;
      
      const booking = await BookingTVL.findByPk(id);
      if (!booking) return res.status(404).json({ success: false, error: 'Booking not found' });
      
      booking.is_reconciled = 0;
      booking.reconciled_by = null;
      booking.reconciled_at = null;
      booking.reconciliation_remarks = null;
      
      await booking.save();
      
      res.json({ success: true, message: 'Booking unreconciled successfully', data: booking });
    } catch (error) {
      console.error('Error unreconciling booking:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Billing Reconciliation
  bulkReconcileBills: async (req, res) => {
    const t = await BillTVL.sequelize.transaction();
    try {
      const { ids, remarks } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        await t.rollback();
        return res.status(400).json({ success: false, error: 'No bill IDs provided' });
      }

      const bills = await BillTVL.findAll({
        where: { bl_id: { [Op.in]: ids } },
        transaction: t
      });

      if (bills.length !== ids.length) {
        await t.rollback();
        return res.status(404).json({ success: false, error: 'One or more bills not found' });
      }

      const invalidBills = bills.filter(b => {
        const status = b.bl_status;
        const paymentStatus = b.payment_status;
        const allowedStatuses = ['PAID', 'CANCELLED', 'CONFIRMED', 'CNF', 'CAN', 'FINAL'];
        return !allowedStatuses.includes(status) && paymentStatus !== 'PAID';
      });
      if (invalidBills.length > 0) {
        await t.rollback();
        return res.status(400).json({ success: false, error: 'Only confirmed, paid, or cancelled bills can be reconciled' });
      }

      const reconciledBy = convertUserIdToInt(req.user?.us_usid);
      
      await BillTVL.update(
        {
          is_reconciled: 1,
          reconciled_by: reconciledBy,
          reconciled_at: new Date(),
          reconciliation_remarks: remarks || 'Reconciled'
        },
        {
          where: { bl_id: { [Op.in]: ids } },
          transaction: t
        }
      );

      await t.commit();
      res.json({ success: true, message: `${ids.length} bills reconciled successfully` });
    } catch (error) {
      await t.rollback();
      console.error('Error bulk reconciling bills:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },
  reconcileBill: async (req, res) => {
    try {
      const { id } = req.params;
      const { remarks } = req.body;
      
      const bill = await BillTVL.findByPk(id);
      if (!bill) return res.status(404).json({ success: false, error: 'Bill not found' });
      
      const allowedStatuses = ['PAID', 'CANCELLED', 'CONFIRMED', 'CNF', 'CAN', 'FINAL'];
      if (!allowedStatuses.includes(bill.bl_status) && bill.payment_status !== 'PAID') {
        return res.status(400).json({ success: false, error: 'Only confirmed, paid, or cancelled bills can be reconciled' });
      }

      bill.is_reconciled = 1;
      bill.reconciled_by = convertUserIdToInt(req.user?.us_usid);
      bill.reconciled_at = new Date();
      bill.reconciliation_remarks = remarks || 'Reconciled';
      
      await bill.save();
      
      res.json({ success: true, message: 'Bill reconciled successfully', data: bill });
    } catch (error) {
      console.error('Error reconciling bill:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  unreconcileBill: async (req, res) => {
    try {
      const { id } = req.params;
      
      const bill = await BillTVL.findByPk(id);
      if (!bill) return res.status(404).json({ success: false, error: 'Bill not found' });
      
      bill.is_reconciled = 0;
      bill.reconciled_by = null;
      bill.reconciled_at = null;
      bill.reconciliation_remarks = null;
      
      await bill.save();
      
      res.json({ success: true, message: 'Bill unreconciled successfully', data: bill });
    } catch (error) {
      console.error('Error unreconciling bill:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Payment Reconciliation
  reconcilePayment: async (req, res) => {
    try {
      const { id } = req.params;
      const { remarks, bankStatementRef } = req.body;
      
      const payment = await PaymentTVL.findByPk(id);
      if (!payment) return res.status(404).json({ success: false, error: 'Payment not found' });

      payment.is_reconciled = 1;
      payment.reconciled_by = convertUserIdToInt(req.user?.us_usid);
      payment.reconciled_at = new Date();
      payment.reconciliation_remarks = remarks || 'Reconciled';
      if (bankStatementRef) payment.bank_statement_ref = bankStatementRef;
      
      await payment.save();
      
      res.json({ success: true, message: 'Payment reconciled successfully', data: payment });
    } catch (error) {
      console.error('Error reconciling payment:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  unreconcilePayment: async (req, res) => {
    try {
      const { id } = req.params;
      
      const payment = await PaymentTVL.findByPk(id);
      if (!payment) return res.status(404).json({ success: false, error: 'Payment not found' });
      
      payment.is_reconciled = 0;
      payment.reconciled_by = null;
      payment.reconciled_at = null;
      payment.reconciliation_remarks = null;
      payment.bank_statement_ref = null;
      
      await payment.save();
      
      res.json({ success: true, message: 'Payment unreconciled successfully', data: payment });
    } catch (error) {
      console.error('Error unreconciling payment:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Receipt Reconciliation
  reconcileReceipt: async (req, res) => {
    try {
      const { id } = req.params;
      const { remarks, bankStatementRef } = req.body;
      
      const receipt = await Receipt.findByPk(id);
      if (!receipt) return res.status(404).json({ success: false, error: 'Receipt not found' });

      receipt.is_reconciled = 1;
      receipt.reconciled_by = convertUserIdToInt(req.user?.us_usid);
      receipt.reconciled_at = new Date();
      receipt.reconciliation_remarks = remarks || 'Reconciled';
      if (bankStatementRef) receipt.bank_statement_ref = bankStatementRef;
      
      await receipt.save();
      
      res.json({ success: true, message: 'Receipt reconciled successfully', data: receipt });
    } catch (error) {
      console.error('Error reconciling receipt:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  unreconcileReceipt: async (req, res) => {
    try {
      const { id } = req.params;
      
      const receipt = await Receipt.findByPk(id);
      if (!receipt) return res.status(404).json({ success: false, error: 'Receipt not found' });
      
      receipt.is_reconciled = 0;
      receipt.reconciled_by = null;
      receipt.reconciled_at = null;
      receipt.reconciliation_remarks = null;
      receipt.bank_statement_ref = null;
      
      await receipt.save();
      
      res.json({ success: true, message: 'Receipt unreconciled successfully', data: receipt });
    } catch (error) {
      console.error('Error unreconciling receipt:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Contra Reconciliation
  reconcileContra: async (req, res) => {
    try {
      const { id } = req.params;
      const { remarks, bankStatementRef } = req.body;
      
      const contra = await Contra.findByPk(id);
      if (!contra) return res.status(404).json({ success: false, error: 'Contra entry not found' });

      contra.is_reconciled = 1;
      contra.reconciled_by = convertUserIdToInt(req.user?.us_usid);
      contra.reconciled_at = new Date();
      contra.reconciliation_remarks = remarks || 'Reconciled';
      if (bankStatementRef) contra.bank_statement_ref = bankStatementRef;
      
      await contra.save();
      
      res.json({ success: true, message: 'Contra reconciled successfully', data: contra });
    } catch (error) {
      console.error('Error reconciling contra:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  unreconcileContra: async (req, res) => {
    try {
      const { id } = req.params;
      
      const contra = await Contra.findByPk(id);
      if (!contra) return res.status(404).json({ success: false, error: 'Contra entry not found' });
      
      contra.is_reconciled = 0;
      contra.reconciled_by = null;
      contra.reconciled_at = null;
      contra.reconciliation_remarks = null;
      contra.bank_statement_ref = null;
      
      await contra.save();
      
      res.json({ success: true, message: 'Contra unreconciled successfully', data: contra });
    } catch (error) {
      console.error('Error unreconciling contra:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },
  
  // Station Boy Payment Reconciliation
  reconcileStationBoyPayment: async (req, res) => {
    const transaction = await sequelizeTVL.transaction();
    try {
      const { id } = req.params;
      const { remarks } = req.body;

      const payment = await StationBoyPayment.findByPk(id, { transaction });
      if (!payment) {
        await transaction.rollback();
        return res.status(404).json({ success: false, error: 'Station Boy Payment not found' });
      }

      if (payment.is_reconciled) {
        await transaction.rollback();
        return res.status(400).json({ success: false, error: 'Payment is already reconciled' });
      }

      const reconciledBy = convertUserIdToInt(req.user?.us_usid);

      // Legacy safety net - allocate any unsettled amount oldest-bill-first.
      await stationBoySettlementService.backfillStationBoyAllocations(
        payment.station_boy_id,
        transaction,
        reconciledBy
      );

      const settlement = await stationBoySettlementService.getPaymentSettlement(payment.id, transaction);
      const amount = stationBoySettlementService.round2(payment.amount);

      if (settlement.allocated + 0.009 < amount) {
        await transaction.rollback();
        const pending = stationBoySettlementService.round2(amount - settlement.allocated);
        return res.status(400).json({
          success: false,
          error: `Payment is not fully settled yet. ₹${pending.toFixed(2)} remains unallocated against pending bills`
        });
      }

      payment.is_reconciled = 1;
      payment.reconciled_by = reconciledBy;
      payment.reconciled_at = new Date();
      payment.reconciliation_remarks = remarks || 'Reconciled';

      await payment.save({ transaction });

      await StationBoyPaymentAllocation.update({
        is_reconciled: 1,
        reconciled_by: reconciledBy,
        reconciled_at: new Date(),
        reconciliation_remarks: remarks || 'Reconciled'
      }, {
        where: { payment_id: payment.id },
        transaction
      });

      await transaction.commit();

      res.json({ success: true, message: 'Station Boy Payment reconciled successfully', data: payment });
    } catch (error) {
      await transaction.rollback();
      console.error('Error reconciling station boy payment:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  unreconcileStationBoyPayment: async (req, res) => {
    const transaction = await sequelizeTVL.transaction();
    try {
      const { id } = req.params;

      const payment = await StationBoyPayment.findByPk(id, { transaction });
      if (!payment) {
        await transaction.rollback();
        return res.status(404).json({ success: false, error: 'Station Boy Payment not found' });
      }

      payment.is_reconciled = 0;
      payment.reconciled_by = null;
      payment.reconciled_at = null;
      payment.reconciliation_remarks = null;

      await payment.save({ transaction });

      await StationBoyPaymentAllocation.update({
        is_reconciled: 0,
        reconciled_by: null,
        reconciled_at: null,
        reconciliation_remarks: null
      }, {
        where: { payment_id: payment.id },
        transaction
      });

      await transaction.commit();

      res.json({ success: true, message: 'Station Boy Payment unreconciled successfully', data: payment });
    } catch (error) {
      await transaction.rollback();
      console.error('Error unreconciling station boy payment:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Bulk Payments
  bulkReconcilePayments: async (req, res) => {
    const t = await PaymentTVL.sequelize.transaction();
    try {
      const { ids, remarks } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        await t.rollback();
        return res.status(400).json({ success: false, error: 'No payment IDs provided' });
      }

      const reconciledBy = convertUserIdToInt(req.user?.us_usid);
      await PaymentTVL.update(
        {
          is_reconciled: 1,
          reconciled_by: reconciledBy,
          reconciled_at: new Date(),
          reconciliation_remarks: remarks || 'Reconciled'
        },
        {
          where: { pm_id: { [Op.in]: ids } },
          transaction: t
        }
      );

      await t.commit();
      res.json({ success: true, message: `${ids.length} payments reconciled successfully` });
    } catch (error) {
      await t.rollback();
      console.error('Error bulk reconciling payments:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Bulk Receipts
  bulkReconcileReceipts: async (req, res) => {
    const t = await Receipt.sequelize.transaction();
    try {
      const { ids, remarks } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        await t.rollback();
        return res.status(400).json({ success: false, error: 'No receipt IDs provided' });
      }

      const reconciledBy = convertUserIdToInt(req.user?.us_usid);
      await Receipt.update(
        {
          is_reconciled: 1,
          reconciled_by: reconciledBy,
          reconciled_at: new Date(),
          reconciliation_remarks: remarks || 'Reconciled'
        },
        {
          where: { rc_id: { [Op.in]: ids } },
          transaction: t
        }
      );

      await t.commit();
      res.json({ success: true, message: `${ids.length} receipts reconciled successfully` });
    } catch (error) {
      await t.rollback();
      console.error('Error bulk reconciling receipts:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Bulk Contras
  bulkReconcileContras: async (req, res) => {
    const t = await Contra.sequelize.transaction();
    try {
      const { ids, remarks } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        await t.rollback();
        return res.status(400).json({ success: false, error: 'No contra IDs provided' });
      }

      const reconciledBy = convertUserIdToInt(req.user?.us_usid);
      await Contra.update(
        {
          is_reconciled: 1,
          reconciled_by: reconciledBy,
          reconciled_at: new Date(),
          reconciliation_remarks: remarks || 'Reconciled'
        },
        {
          where: { ct_id: { [Op.in]: ids } },
          transaction: t
        }
      );

      await t.commit();
      res.json({ success: true, message: `${ids.length} contras reconciled successfully` });
    } catch (error) {
      await t.rollback();
      console.error('Error bulk reconciling contras:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Bulk Journals
  bulkReconcileJournals: async (req, res) => {
    const t = await Journal.sequelize.transaction();
    try {
      const { ids, remarks } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        await t.rollback();
        return res.status(400).json({ success: false, error: 'No journal IDs provided' });
      }

      const reconciledBy = convertUserIdToInt(req.user?.us_usid);
      await Journal.update(
        {
          is_reconciled: 1,
          reconciled_by: reconciledBy,
          reconciled_at: new Date(),
          reconciliation_remarks: remarks || 'Reconciled'
        },
        {
          where: { je_id: { [Op.in]: ids } },
          transaction: t
        }
      );

      await t.commit();
      res.json({ success: true, message: `${ids.length} journals reconciled successfully` });
    } catch (error) {
      await t.rollback();
      console.error('Error bulk reconciling journals:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Bulk Station Boy Payments
  bulkReconcileStationBoyPayments: async (req, res) => {
    const t = await StationBoyPayment.sequelize.transaction();
    try {
      const { ids, remarks } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        await t.rollback();
        return res.status(400).json({ success: false, error: 'No Station Boy Payment IDs provided' });
      }

      const reconciledBy = convertUserIdToInt(req.user?.us_usid);
      await StationBoyPayment.update(
        {
          is_reconciled: 1,
          reconciled_by: reconciledBy,
          reconciled_at: new Date(),
          reconciliation_remarks: remarks || 'Reconciled'
        },
        {
          where: { id: { [Op.in]: ids } },
          transaction: t
        }
      );

      await t.commit();
      res.json({ success: true, message: `${ids.length} station boy payments reconciled successfully` });
    } catch (error) {
      await t.rollback();
      console.error('Error bulk reconciling station boy payments:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

module.exports = reconciliationController;
