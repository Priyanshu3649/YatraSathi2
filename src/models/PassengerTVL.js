const { DataTypes } = require('sequelize');
const { sequelizeTVL } = require('../../config/db');

const PassengerTVL = sequelizeTVL.define('psXpassenger', {
  ps_psid: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
    comment: 'Passenger ID'
  },
  ps_bkno: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: 'Booking Number'
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
  tableName: 'psXpassenger',
  timestamps: false
});

module.exports = PassengerTVL;