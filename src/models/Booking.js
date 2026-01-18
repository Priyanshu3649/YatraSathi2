const { DataTypes } = require('sequelize');
const { sequelize, BaseModel } = require('./baseModel');
const Customer = require('./Customer');
const Employee = require('./Employee');
const Station = require('./Station');
const User = require('./User');

const Booking = sequelize.define('bkBooking', {
  bk_bkid: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
    comment: 'Booking ID'
  },
  bk_bkno: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    comment: 'Booking Number'
  },
  bk_usid: {
    type: DataTypes.STRING(15),
    allowNull: false,
    comment: 'Customer User ID'
  },
  bk_fromst: {
    type: DataTypes.STRING(10),
    allowNull: false,
    comment: 'From Station'
  },
  bk_tost: {
    type: DataTypes.STRING(10),
    allowNull: false,
    comment: 'To Station'
  },
  bk_trvldt: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'Travel Date'
  },
  bk_class: {
    type: DataTypes.STRING(10),
    allowNull: false,
    comment: 'Travel Class'
  },
  bk_quota: {
    type: DataTypes.STRING(10),
    defaultValue: 'TATKAL',
    comment: 'Quota'
  },
  bk_berthpref: {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: 'Berth Preference'
  },
  bk_totalpass: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: 'Total Passengers'
  },
  bk_reqdt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: 'Request Date'
  },
  bk_status: {
    type: DataTypes.STRING(15),
    defaultValue: 'DRAFT',
    comment: 'Booking Status'
  },
  bk_agent: {
    type: DataTypes.STRING(15),
    allowNull: true,
    comment: 'Assigned Agent'
  },
  bk_priority: {
    type: DataTypes.STRING(10),
    defaultValue: 'NORMAL',
    comment: 'Booking Priority'
  },
  bk_remarks: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Remarks'
  },
  // Audit fields
  ...BaseModel
}, {
  tableName: 'bkXbooking',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['bk_bkno']
    }
  ]
});

// Define associations
Booking.belongsTo(Customer, {
  foreignKey: 'bk_usid',
  targetKey: 'cu_usid'
});

Booking.belongsTo(Employee, {
  foreignKey: 'bk_agent',
  targetKey: 'em_usid'
});

Booking.belongsTo(Station, {
  foreignKey: 'bk_fromst',
  targetKey: 'st_stid',
  as: 'fromStation'
});

Booking.belongsTo(Station, {
  foreignKey: 'bk_tost',
  targetKey: 'st_stid',
  as: 'toStation'
});

// Add associations for customer and agent users
Booking.belongsTo(User, {
  foreignKey: 'bk_usid',
  targetKey: 'us_usid',
  as: 'customer'
});

Booking.belongsTo(User, {
  foreignKey: 'bk_agent',
  targetKey: 'us_usid',
  as: 'agent'
});

module.exports = Booking;