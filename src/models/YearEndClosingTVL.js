const { DataTypes } = require('sequelize');
const { sequelizeTVL } = require('../../config/db');

/**
 * Year End Closing Model (TVL Version)
 * 
 * Records year-end closing data for financial audit trail.
 */
const YearEndClosingTVL = sequelizeTVL.define('yeXyearendclosing', {
  ye_yeid: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
    comment: 'Year End ID'
  },
  ye_fyear: {
    type: DataTypes.STRING(10),
    allowNull: false,
    comment: 'Financial Year'
  },
  ye_closing_date: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'Closing Date'
  },
  ye_total_pending_receivables: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    comment: 'Total Pending Receivables'
  },
  ye_total_advance_balance: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    comment: 'Total Advance Balance'
  },
  ye_total_customers: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Total Customers'
  },
  ye_total_pending_pnrs: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Total Pending PNRs'
  },
  ye_status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: 'Status'
  },
  ye_remarks: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Remarks'
  },
  // Audit fields
  edtm: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false,
    comment: 'Entry Date Time'
  },
  eby: {
    type: DataTypes.STRING(15),
    allowNull: false,
    comment: 'Entered By'
  },
  mdtm: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false,
    onUpdate: DataTypes.NOW,
    comment: 'Modification Date Time'
  },
  mby: {
    type: DataTypes.STRING(15),
    allowNull: true,
    comment: 'Modified By'
  }
}, {
  tableName: 'yeXyearendclosing',
  timestamps: false
});

module.exports = YearEndClosingTVL;