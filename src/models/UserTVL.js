const { DataTypes } = require('sequelize');
const { sequelizeTVL } = require('../../config/db');

const UserTVL = sequelizeTVL.define('usXuser', {
  us_usid: {
    type: DataTypes.STRING(15),
    primaryKey: true,
    allowNull: false,
    defaultValue: '',
    comment: 'User ID'
  },
  us_email: {
    type: DataTypes.STRING(120),
    allowNull: false,
    unique: true,
    defaultValue: '',
    comment: 'Email'
  },
  us_usname: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: '',
    comment: 'User Name'
  },
  us_title: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: '',
    comment: 'Job Title'
  },
  us_phone: {
    type: DataTypes.STRING(30),
    allowNull: true,
    defaultValue: '',
    comment: 'Phone'
  },
  us_admin: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: 'Is Application Administrator?'
  },
  us_security: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: 'Is Security Administrator?'
  },
  us_limit: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: true,
    comment: 'Authorization Limit'
  },
  us_rmrks: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
    comment: 'Remarks'
  },
  us_active: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: 'Active?'
  },
  us_edtm: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Entered On'
  },
  us_eby: {
    type: DataTypes.STRING(30),
    allowNull: true,
    defaultValue: '',
    comment: 'Entered By'
  },
  us_mdtm: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Modified On'
  },
  us_mby: {
    type: DataTypes.STRING(30),
    allowNull: true,
    defaultValue: '',
    comment: 'Modified By'
  },
  us_cdtm: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Closed On'
  },
  us_cby: {
    type: DataTypes.STRING(30),
    allowNull: true,
    defaultValue: '',
    comment: 'Closed By'
  }
}, {
  tableName: 'usXuser',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['us_email']
    }
  ]
});

module.exports = UserTVL;
