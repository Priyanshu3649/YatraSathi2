const { DataTypes } = require('sequelize');
const { sequelize, BaseModel } = require('./baseModel');
const Booking = require('./Booking');

const Passenger = sequelize.define('psPassenger', {
  ps_psid: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
    comment: 'Passenger ID'
  },
  ps_bkid: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: 'Booking ID'
  },
  ps_fname: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'First Name'
  },
  ps_lname: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Last Name'
  },
  ps_age: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Age'
  },
  ps_gender: {
    type: DataTypes.STRING(10),
    allowNull: false,
    comment: 'Gender'
  },
  ps_berthpref: {
    type: DataTypes.STRING(15),
    allowNull: true,
    comment: 'Berth Preference'
  },
  ps_berthalloc: {
    type: DataTypes.STRING(15),
    allowNull: true,
    comment: 'Berth Allocated'
  },
  ps_seatno: {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: 'Seat Number'
  },
  ps_coach: {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: 'Coach'
  },
  ps_aadhaar: {
    type: DataTypes.STRING(12),
    allowNull: true,
    comment: 'Aadhaar Number'
  },
  ps_idtype: {
    type: DataTypes.STRING(15),
    allowNull: true,
    comment: 'ID Type'
  },
  ps_idno: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'ID Number'
  },
  ps_active: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: 'Active Status'
  },
  // Audit fields
  ...BaseModel
}, {
  tableName: 'psPassenger',
  timestamps: false
});

// Define associations
Passenger.belongsTo(Booking, {
  foreignKey: 'ps_bkid',
  targetKey: 'bk_bkid',
  as: 'booking'
});

module.exports = Passenger;