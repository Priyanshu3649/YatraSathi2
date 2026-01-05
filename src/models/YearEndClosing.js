const { DataTypes } = require('sequelize');
const { sequelize, BaseModel } = require('./baseModel');

/**
 * Year-End Closing Snapshot Model
 * 
 * FINANCE-CRITICAL: This table stores year-end snapshots for audit purposes.
 * 
 * On March 31 (year-end):
 * - Freeze all pending PNR balances
 * - Capture customer-wise outstanding
 * - Capture advance balances
 * - Carry forward to next financial year
 * 
 * NEVER DELETE these records - they are audit trail.
 */
const YearEndClosing = sequelize.define('yeYearEndClosing', {
  ye_yeid: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
    comment: 'Year-End Closing ID'
  },
  ye_fyear: {
    type: DataTypes.STRING(10),
    allowNull: false,
    comment: 'Financial Year (e.g., 2023-24)'
  },
  ye_closing_date: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'Year-End Closing Date (typically March 31)'
  },
  ye_total_pending_receivables: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    comment: 'Total Pending Receivables (sum of all pending PNRs)'
  },
  ye_total_advance_balance: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    comment: 'Total Advance Balance (sum of all customer advances)'
  },
  ye_total_customers: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Total Number of Customers with Outstanding'
  },
  ye_total_pending_pnrs: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Total Number of Pending PNRs'
  },
  ye_status: {
    type: DataTypes.STRING(15),
    defaultValue: 'DRAFT',
    allowNull: false,
    comment: 'Status: DRAFT | FINALIZED | CARRY_FORWARDED'
  },
  ye_remarks: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Closing Remarks'
  },
  // Audit fields
  ...BaseModel
}, {
  tableName: 'yeYearEndClosing',
  timestamps: false,
  indexes: [
    { unique: true, fields: ['ye_fyear'] },
    { fields: ['ye_closing_date'] },
    { fields: ['ye_status'] }
  ]
});

module.exports = YearEndClosing;

