const { DataTypes } = require('sequelize');
const { sequelize, BaseModel } = require('./baseModel');
const Account = require('./Account');
const Booking = require('./Booking');

/**
 * Payment Header Model
 * 
 * CRITICAL: This is a financial event, not a booking event.
 * - One payment can be applied to multiple PNRs
 * - Payments are NEVER overwritten
 * - All adjustments create new entries
 * - Full audit trail maintained
 */
const Payment = sequelize.define('ptPayment', {
  pt_ptid: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
    comment: 'Payment ID (Primary Key)'
  },
  pt_usid: {
    type: DataTypes.STRING(15),
    allowNull: false,
    comment: 'Customer User ID (who made the payment)'
  },
  pt_amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    comment: 'Total Payment Amount (immutable once posted)'
  },
  pt_mode: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: 'Payment Mode: CASH, UPI, NEFT, RTGS, CHEQUE, CARD, BANK'
  },
  pt_refno: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Reference Number (UTR / Cheque No / Transaction ID)'
  },
  pt_paydt: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'Payment Date (when payment was made)'
  },
  pt_rcvby: {
    type: DataTypes.STRING(15),
    allowNull: false,
    comment: 'Received By (User ID who recorded the payment)'
  },
  pt_status: {
    type: DataTypes.STRING(15),
    defaultValue: 'RECEIVED',
    allowNull: false,
    comment: 'Payment Status: RECEIVED | ADJUSTED | REFUNDED | BOUNCED'
  },
  pt_acct_period: {
    type: DataTypes.STRING(7),
    allowNull: false,
    comment: 'Accounting Period (YYYY-MM format)'
  },
  pt_unallocated_amt: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    comment: 'Unallocated Amount (advance payment)'
  },
  pt_remarks: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Payment Remarks'
  },
  // Legacy fields for backward compatibility (deprecated)
  pt_acid: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: 'Account ID (deprecated - use customer ID directly)'
  },
  pt_bkid: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: 'Booking ID (optional - payment can be advance)'
  },
  // Audit fields
  ...BaseModel
}, {
  tableName: 'ptPayment',
  timestamps: false,
  indexes: [
    { fields: ['pt_usid'], name: 'idx_pt_usid' },
    { fields: ['pt_paydt'], name: 'idx_pt_paydt' },
    { fields: ['pt_acct_period'], name: 'idx_pt_acct_period' },
    { fields: ['pt_status'], name: 'idx_pt_status' }
  ]
});

// Define associations
Payment.belongsTo(Account, {
  foreignKey: 'pt_acid',
  targetKey: 'ac_acid',
  as: 'account',
  required: false
});

Payment.belongsTo(Booking, {
  foreignKey: 'pt_bkid',
  targetKey: 'bk_bkid',
  as: 'booking',
  required: false
});

// Payment has many allocations (lazy load to avoid circular dependency)
// This association will be set up in models/index.js

module.exports = Payment;