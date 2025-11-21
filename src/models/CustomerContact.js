const { DataTypes } = require('sequelize');
const { sequelize, BaseModel } = require('./baseModel');
const Customer = require('./Customer');

const CustomerContact = sequelize.define('ccCustContact', {
  cc_ccid: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
    comment: 'Contact ID'
  },
  cc_usid: {
    type: DataTypes.STRING(15),
    allowNull: false,
    comment: 'Customer User ID'
  },
  cc_fname: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'First Name'
  },
  cc_lname: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Last Name'
  },
  cc_email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Email Address'
  },
  cc_phone: {
    type: DataTypes.STRING(15),
    allowNull: false,
    comment: 'Phone Number'
  },
  cc_designation: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Designation'
  },
  cc_isprimary: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: 'Is Primary Contact'
  },
  cc_active: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: 'Active Status'
  },
  // Audit fields
  ...BaseModel
}, {
  tableName: 'ccCustContact',
  timestamps: false
});

// Define associations
CustomerContact.belongsTo(Customer, {
  foreignKey: 'cc_usid',
  targetKey: 'cu_usid'
});

module.exports = CustomerContact;