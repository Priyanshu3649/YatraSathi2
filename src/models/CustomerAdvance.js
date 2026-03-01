const { DataTypes } = require('sequelize');
const { sequelize, BaseModel } = require('./baseModel');
const Customer = require('./Customer');

/**
 * Customer Advance Balance Model
 * 
 * Tracks unallocated advance payments received from customers.
 * These can be applied to future PNRs.
 * 
 * CRITICAL: Advance balance is calculated from:
 * - Payments received but not allocated to any PNR
 * - Excess payments (payment amount > allocated amount)
 */
const CustomerAdvance = sequelize.define('caCustomerAdvance', {
  ca_caid: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
    comment: 'Customer Advance ID'
  },
  ca_usid: {
    type: DataTypes.STRING(15),
    allowNull: false,
    comment: 'Customer User ID'
  },
  ca_advance_amt: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    allowNull: false,
    comment: 'Advance Amount (unallocated payment)'
  },
  ca_fyear: {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: 'Financial Year'
  },
  ca_last_updated: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false,
    comment: 'Last Updated Date'
  },
  // Audit fields
  ...BaseModel
}, {
  tableName: 'caCustomerAdvance',
  timestamps: false,
  indexes: [
    { unique: true, fields: ['ca_usid', 'ca_fyear'] },
    { fields: ['ca_usid'] },
    { fields: ['ca_fyear'] }
  ]
});

// Define associations
CustomerAdvance.belongsTo(Customer, {
  foreignKey: 'ca_usid',
  targetKey: 'cu_usid',
  as: 'customer'
});

module.exports = CustomerAdvance;


