const { DataTypes } = require('sequelize');
const { sequelize, BaseModel } = require('./baseModel');
const Payment = require('./Payment');
const Pnr = require('./Pnr');

/**
 * Payment Allocation Table (CRITICAL)
 * 
 * This table links payments to PNRs.
 * Each row = how much of a payment went to which PNR.
 * 
 * NON-NEGOTIABLE: This table is the source of truth for payment allocation.
 * Never delete allocations - only create new ones for adjustments.
 */
const PaymentAlloc = sequelize.define('paXpayalloc', {
  pa_paid: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
    comment: 'Payment Allocation ID (Primary Key)'
  },
  pa_ptid: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: 'Payment ID (Foreign Key to ptPayment)'
  },
  pa_pnid: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: 'PNR ID (Foreign Key to pnXpnr)'
  },
  pa_pnr: {
    type: DataTypes.STRING(15),
    allowNull: true,
    comment: 'PNR Number (for quick reference and validation)'
  },
  pa_allocamt: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    comment: 'Allocated Amount (must be <= PNR pending amount)'
  },
  pa_alloctn_date: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW,
    comment: 'Allocation Date'
  },
  pa_alloctn_type: {
    type: DataTypes.STRING(10),
    defaultValue: 'MANUAL',
    allowNull: true,
    comment: 'Allocation Type: AUTO (FIFO) | MANUAL (user selected)'
  },
  pa_remarks: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Allocation Remarks'
  },
  pa_allocdt: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'Allocation Date (legacy field)'
  },
  pa_status: {
    type: DataTypes.STRING(15),
    defaultValue: 'ALLOCATED',
    allowNull: false,
    comment: 'Allocation Status'
  },
  pa_rmrks: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Allocation Remarks (legacy field)'
  },
  // Audit fields
  edtm: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false,
    comment: 'Entered Date Time'
  },
  eby: {
    type: DataTypes.STRING(15),
    allowNull: false,
    comment: 'Entered By (User ID who made the allocation)'
  }
}, {
  tableName: 'paXpayalloc',
  timestamps: false,
  indexes: [
    { fields: ['pa_ptid'] },
    { fields: ['pa_pnid'] },
    { fields: ['pa_pnr'] },
    { fields: ['pa_alloctn_date'] },
    { fields: ['pa_allocdt'] }
  ]
});

// Define associations (minimal to avoid circular dependencies)
// Full associations are set up in models/index.js

module.exports = PaymentAlloc;