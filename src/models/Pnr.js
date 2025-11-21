const { DataTypes } = require('sequelize');
const { sequelize, BaseModel } = require('./baseModel');
const Booking = require('./Booking');
const Train = require('./Train');

const Pnr = sequelize.define('pnPnr', {
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
  pn_pnr: {
    type: DataTypes.STRING(15),
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
  // Audit fields
  ...BaseModel
}, {
  tableName: 'pnPnr',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['pn_pnr']
    }
  ]
});

// Define associations
Pnr.belongsTo(Booking, {
  foreignKey: 'pn_bkid',
  targetKey: 'bk_bkid'
});

Pnr.belongsTo(Train, {
  foreignKey: 'pn_trid',
  targetKey: 'tr_trid'
});

module.exports = Pnr;