const { DataTypes } = require('sequelize');
const { sequelize, BaseModel } = require('./baseModel');

const Ledger = sequelize.define('lgLedger', {
  lg_lgid: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
    comment: 'Ledger ID'
  },
  lg_entry_type: {
    type: DataTypes.STRING(10),
    allowNull: false,
    comment: 'Entry Type (DEBIT | CREDIT)'
  },
  lg_entry_ref: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: 'Entry Reference (PNR / Payment ID / etc.)'
  },
  lg_amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    comment: 'Amount'
  },
  lg_opening_bal: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    comment: 'Opening Balance'
  },
  lg_closing_bal: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    comment: 'Closing Balance'
  },
  lg_remarks: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Remarks'
  },
  lg_usid: {
    type: DataTypes.STRING(15),
    allowNull: true,
    comment: 'User ID'
  },
  lg_pnid: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: 'PNR ID'
  },
  lg_ptid: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: 'Payment ID'
  },
  lg_acid: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: 'Account ID'
  },
  // Audit fields
  ...BaseModel
}, {
  tableName: 'lgLedger',
  timestamps: false
});

module.exports = Ledger;