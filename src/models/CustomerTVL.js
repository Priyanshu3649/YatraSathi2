const { DataTypes } = require('sequelize');
const { sequelizeTVL } = require('../../config/db');

const CustomerTVL = sequelizeTVL.define('cuXcustomer', {
  cu_cusid: {
    type: DataTypes.STRING(15),
    primaryKey: true,
    allowNull: false,
    comment: 'Customer ID'
  },
  cu_usid: {
    type: DataTypes.STRING(15),
    allowNull: false,
    unique: true,
    comment: 'User ID'
  },
  cu_custno: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    comment: 'Customer Number'
  },
  cu_custtype: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'INDIVIDUAL',
    comment: 'Customer Type'
  },
  cu_compid: {
    type: DataTypes.STRING(15),
    allowNull: true,
    comment: 'Company ID (for corporate customers)'
  },
  cu_creditlimit: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    comment: 'Credit Limit'
  },
  cu_creditdays: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Credit Days'
  },
  cu_discount: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    comment: 'Discount Percentage'
  },
  cu_active: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: 'Active? (1=Active, 0=Inactive)'
  },
  cu_panno: {
    type: DataTypes.STRING(15),
    allowNull: true,
    comment: 'PAN Number'
  },
  cu_gstno: {
    type: DataTypes.STRING(15),
    allowNull: true,
    comment: 'GST Number'
  },
  // Audit fields
  edtm: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: true,
    comment: 'Entered Date Time'
  },
  eby: {
    type: DataTypes.STRING(15),
    allowNull: true,
    comment: 'Entered By'
  },
  mdtm: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: true,
    onUpdate: DataTypes.NOW,
    comment: 'Modified Date Time'
  },
  mby: {
    type: DataTypes.STRING(15),
    allowNull: true,
    comment: 'Modified By'
  }
}, {
  tableName: 'cuXcustomer',
  timestamps: false
});

// Define associations
CustomerTVL.belongsTo(require('./UserTVL'), {
  foreignKey: 'cu_usid',
  targetKey: 'us_usid',
  as: 'user'
});

module.exports = CustomerTVL;