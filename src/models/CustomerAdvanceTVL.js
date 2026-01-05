const { DataTypes } = require('sequelize');
const { sequelizeTVL } = require('../../config/db');

/**
 * Customer Advance Balance Model (TVL Version)
 * 
 * Tracks unallocated advance payments received from customers in the TVL database.
 * These can be applied to future PNRs.
 * 
 * CRITICAL: Advance balance is calculated from:
 * - Payments received but not allocated to any PNR
 * - Excess payments (payment amount > allocated amount)
 */
const CustomerAdvanceTVL = sequelizeTVL.define('caXcustomeradvance', {
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
  tableName: 'caXcustomeradvance',
  timestamps: false,
  indexes: [
    { unique: true, fields: ['ca_usid', 'ca_fyear'], name: 'uk_ca_usid_fyear' },
    { fields: ['ca_usid'], name: 'idx_ca_usid' },
    { fields: ['ca_fyear'], name: 'idx_ca_fyear' }
  ]
});

module.exports = CustomerAdvanceTVL;