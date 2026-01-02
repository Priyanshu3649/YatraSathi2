const { DataTypes } = require('sequelize');
const { sequelizeTVL } = require('../../config/db');

const AccountTVL = sequelizeTVL.define('acXaccount', {
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
  edtm: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false,
    comment: 'Entered Date Time'
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
    comment: 'Modified Date Time'
  },
  mby: {
    type: DataTypes.STRING(15),
    allowNull: true,
    comment: 'Modified By'
  }
}, {
  tableName: 'acXaccount',
  timestamps: false
});

// Define associations
AccountTVL.belongsTo(require('./BookingTVL'), {
  foreignKey: 'ac_bkid',
  targetKey: 'bk_bkid',
  as: 'booking'
});

AccountTVL.belongsTo(require('./UserTVL'), {
  foreignKey: 'ac_usid',
  targetKey: 'us_usid',
  as: 'customer'
});

module.exports = AccountTVL;