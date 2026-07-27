const { DataTypes } = require('sequelize');
const { sequelizeTVL } = require('../../config/db');

const MasterPassengerTVL = sequelizeTVL.define('mpXmasterpassenger', {
  mp_mpid: {
    type: DataTypes.STRING(20),
    primaryKey: true,
    allowNull: false,
    field: 'mp_mpid'
  },
  mp_usid: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'mp_usid',
    references: {
      model: 'usXuser',
      key: 'us_usid'
    }
  },
  mp_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'mp_name'
  },
  mp_dob: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'mp_dob'
  },
  mp_gender: {
    type: DataTypes.ENUM('M', 'F', 'O'),
    allowNull: false,
    field: 'mp_gender'
  },
  mp_birthpref: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'mp_birthpref'
  },
  mp_active: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    allowNull: false,
    field: 'mp_active'
  },
  eby: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'eby'
  },
  mby: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'mby'
  }
}, {
  tableName: 'mpXmasterpassenger',
  timestamps: true,
  createdAt: 'edtm',
  updatedAt: 'mdtm',
  underscored: false
});

module.exports = MasterPassengerTVL;
