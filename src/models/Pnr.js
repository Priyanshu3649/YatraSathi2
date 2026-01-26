const { DataTypes } = require('sequelize');
const { sequelize, BaseModel } = require('./baseModel');
const Booking = require('./Booking');
const Train = require('./Train');

const Pnr = sequelize.define('pnXpnr', {
  pn_pnid: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
    comment: 'PNR ID'
  },
  pn_bkid: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: 'Booking ID'
  },
  pn_pnrnum: {
    type: DataTypes.STRING(20),
    allowNull: true,
    unique: true,
    comment: 'PNR Number'
  },
  pn_trid: {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: 'Train ID'
  },
  pn_trvldt: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'Travel Date'
  },
  pn_class: {
    type: DataTypes.STRING(10),
    allowNull: false,
    comment: 'Travel Class'
  },
  pn_quota: {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: 'Quota'
  },
  pn_passengers: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Number of Passengers'
  },
  pn_status: {
    type: DataTypes.STRING(15),
    defaultValue: 'CNF',
    comment: 'PNR Status'
  },
  pn_bookdt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Booking Date'
  },
  pn_chartdt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Chart Preparation Date'
  },
  pn_bkgamt: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    comment: 'Booking Amount'
  },
  pn_svcamt: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    comment: 'Service Charge'
  },
  pn_totamt: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    comment: 'Total Amount'
  },
  pn_paidamt: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    allowNull: false,
    comment: 'Paid Amount (calculated from allocations - DO NOT UPDATE MANUALLY)'
  },
  pn_pendingamt: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    allowNull: false,
    comment: 'Pending Amount (pn_totamt - pn_paidamt - calculated real-time)'
  },
  pn_payment_status: {
    type: DataTypes.STRING(15),
    defaultValue: 'UNPAID',
    allowNull: false,
    comment: 'Payment Status: UNPAID | PARTIAL | PAID (calculated automatically)'
  },
  pn_closed_flag: {
    type: DataTypes.STRING(1),
    defaultValue: 'N',
    allowNull: false,
    comment: 'Closed Flag: Y (closed) | N (open) - for year-end closing'
  },
  pn_fyear: {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: 'Financial Year (for year-end closing)'
  },
  // Audit fields
  ...BaseModel
}, {
  tableName: 'pnXpnr',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['pn_pnrnum']
    }
  ]
});

// Define associations (minimal to avoid circular dependencies)
// Full associations are set up in models/index.js
Pnr.belongsTo(Train, {
  foreignKey: 'pn_trid',
  targetKey: 'tr_trid'
});

module.exports = Pnr;