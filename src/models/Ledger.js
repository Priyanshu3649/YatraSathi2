const { DataTypes } = require('sequelize');
const { sequelize, BaseModel } = require('./baseModel');

/**
 * Ledger / Audit Table
 * 
 * IMMUTABLE financial history.
 * 
 * Tracks:
 * - Opening balance
 * - Debit (Booking/PNR creation)
 * - Credit (Payment received)
 * - Closing balance
 * - Entry reference (PNR / Payment ID)
 * - Entry timestamp
 * 
 * CRITICAL: This is the source of truth for financial reconciliation.
 * Never delete or modify ledger entries.
 */
const Ledger = sequelize.define('lgLedger', {
  lg_lgid: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
    comment: 'Ledger ID (Primary Key)'
  },
  lg_usid: {
    type: DataTypes.STRING(15),
    allowNull: false,
    comment: 'Customer User ID'
  },
  lg_entry_type: {
    type: DataTypes.STRING(10),
    allowNull: false,
    comment: 'Entry Type: DEBIT (booking) | CREDIT (payment)'
  },
  lg_entry_ref: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'Entry Reference (PNR number / Payment ID / etc.)'
  },
  lg_amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    comment: 'Transaction Amount'
  },
  lg_opening_bal: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    allowNull: false,
    comment: 'Opening Balance (before this transaction)'
  },
  lg_closing_bal: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    allowNull: false,
    comment: 'Closing Balance (after this transaction)'
  },
  lg_pnid: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: 'PNR ID (if entry is related to PNR)'
  },
  lg_ptid: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: 'Payment ID (if entry is related to payment)'
  },
  lg_paid: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: 'Payment Allocation ID (if entry is from allocation)'
  },
  lg_fyear: {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: 'Financial Year'
  },
  lg_remarks: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Ledger Entry Remarks'
  },
  // Audit fields
  ...BaseModel
}, {
  tableName: 'lgLedger',
  timestamps: false,
  indexes: [
    { fields: ['lg_usid'] },
    { fields: ['lg_entry_type'] },
    { fields: ['lg_pnid'] },
    { fields: ['lg_ptid'] },
    { fields: ['lg_fyear'] },
    { fields: ['edtm'] }
  ]
});

module.exports = Ledger;