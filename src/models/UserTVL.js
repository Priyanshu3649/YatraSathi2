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
  us_fname: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: '',
    comment: 'First Name'
  },
  us_lname: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: '',
    comment: 'Last Name'
  },
  us_aadhaar: {
    type: DataTypes.STRING(12),
    allowNull: true,
    defaultValue: '',
    comment: 'Aadhaar Number'
  },
  us_pan: {
    type: DataTypes.STRING(10),
    allowNull: true,
    defaultValue: '',
    comment: 'PAN Number'
  },
  us_addr1: {
    type: DataTypes.STRING(200),
    allowNull: true,
    defaultValue: '',
    comment: 'Address Line 1'
  },
  us_city: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: '',
    comment: 'City'
  },
  us_state: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: '',
    comment: 'State'
  },
  us_pin: {
    type: DataTypes.STRING(10),
    allowNull: true,
    defaultValue: '',
    comment: 'PIN Code'
  },
  us_usertype: {
    type: DataTypes.STRING(20),
    allowNull: true,
    defaultValue: null,
    comment: 'User Type'
  },
  us_roid: {
    type: DataTypes.STRING(10),
    allowNull: true,
    defaultValue: null,
    comment: 'Role ID'
  },
  us_coid: {
    type: DataTypes.STRING(10),
    allowNull: true,
    defaultValue: null,
    comment: 'Company ID'
  },
  us_appadmin: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: 'Application Administrator'
  },
  us_security: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: 'Security Administrator'
  },
  us_limit: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: true,
    comment: 'Authorization Limit'
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