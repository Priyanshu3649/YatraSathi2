const { DataTypes } = require('sequelize');
const { sequelize, BaseModel } = require('./baseModel');
const Booking = require('./Booking');
const Customer = require('./Customer');

const Account = sequelize.define('acAccount', {
  ac_acid: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
    comment: 'Account ID'
  },
  ac_bkid: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: 'Booking ID'
  },
  ac_usid: {
    type: DataTypes.STRING(15),
    allowNull: false,
    comment: 'Customer User ID'
  },
  ac_totamt: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    comment: 'Total Amount'
  },
  ac_rcvdamt: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    comment: 'Received Amount'
  },
  ac_pendamt: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    comment: 'Pending Amount'
  },
  ac_duedt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Due Date'
  },
  ac_fyear: {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: 'Financial Year'
  },
  ac_status: {
    type: DataTypes.STRING(15),
    defaultValue: 'PENDING',
    comment: 'Account Status'
  },
  // Audit fields
  ...BaseModel
}, {
  tableName: 'acAccount',
  timestamps: false
});

// Define associations
Account.belongsTo(Booking, {
  foreignKey: 'ac_bkid',
  targetKey: 'bk_bkid',
  as: 'booking'
});

Account.belongsTo(Customer, {
  foreignKey: 'ac_usid',
  targetKey: 'cu_usid'
});

// Virtual field for pending amount
Account.beforeValidate((account) => {
  account.ac_pendamt = account.ac_totamt - account.ac_rcvdamt;
});

module.exports = Account;