const { DataTypes } = require('sequelize');
const { sequelize, BaseModel } = require('./baseModel');
const User = require('./User');

const Customer = sequelize.define('cuCustomer', {
  cu_usid: {
    type: DataTypes.STRING(15),
    primaryKey: true,
    allowNull: false,
    comment: 'User ID'
  },
  cu_custno: {
    type: DataTypes.STRING(15),
    allowNull: false,
    unique: true,
    comment: 'Customer Number'
  },
  cu_custtype: {
    type: DataTypes.STRING(15),
    allowNull: false,
    comment: 'Customer Type'
  },
  cu_company: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Company Name'
  },
  cu_gst: {
    type: DataTypes.STRING(15),
    allowNull: true,
    comment: 'GST Number'
  },
  cu_creditlmt: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    comment: 'Credit Limit'
  },
  cu_creditused: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    comment: 'Credit Used'
  },
  cu_paymentterms: {
    type: DataTypes.STRING(20),
    defaultValue: 'IMMEDIATE',
    comment: 'Payment Terms'
  },
  cu_status: {
    type: DataTypes.STRING(10),
    defaultValue: 'ACTIVE',
    comment: 'Customer Status'
  },
  // Audit fields
  ...BaseModel
}, {
  tableName: 'cuCustomer',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['cu_custno']
    }
  ]
});

// Define associations
Customer.belongsTo(User, {
  foreignKey: 'cu_usid',
  targetKey: 'us_usid'
});

module.exports = Customer;