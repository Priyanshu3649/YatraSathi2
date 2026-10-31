const { DataTypes } = require('sequelize');
const { sequelizeTVL } = require('../../config/db');

/**
 * One row per financial year holding the last bill number issued in that year.
 * Issuance locks this row inside the bill transaction, so concurrent
 * requests cannot receive the same number.
 */
const BillNumberSequence = sequelizeTVL.define('BillNumberSequence', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  financial_year: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true,
    comment: 'Indian FY label, e.g. 2026-27 (1 April - 31 March)'
  },
  last_issued_number: {
    type: DataTypes.BIGINT,
    allowNull: false,
    defaultValue: 0,
    comment: 'Highest sequence issued for this financial year'
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  }
}, {
  tableName: 'bill_number_sequences',
  timestamps: false
});

module.exports = BillNumberSequence;
