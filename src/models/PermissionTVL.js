const { DataTypes } = require('sequelize');
const { sequelizeTVL } = require('../../config/db');

const PermissionTVL = sequelizeTVL.define('opXoperation', {
  op_apid: {
    type: DataTypes.STRING(4),
    primaryKey: true,
    allowNull: false,
    defaultValue: '',
    comment: 'Application ID'
  },
  op_moid: {
    type: DataTypes.STRING(4),
    primaryKey: true,
    allowNull: false,
    defaultValue: '',
    comment: 'Module ID'
  },
  op_opid: {
    type: DataTypes.STRING(4),
    primaryKey: true,
    allowNull: false,
    defaultValue: '',
    comment: 'Operation ID'
  },
  op_opshort: {
    type: DataTypes.STRING(30),
    allowNull: true,
    defaultValue: '',
    comment: 'Short Description'
  },
  op_opdesc: {
    type: DataTypes.STRING(60),
    allowNull: true,
    defaultValue: '',
    comment: 'Description'
  },
  op_appop: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: 'Application Operation?'
  },
  op_avail: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: 'Available?'
  },
  op_ready: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: 'Ready?'
  },
  op_rmrks: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
    comment: 'Remarks'
  },
  op_active: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: 'Active?'
  },
  op_edtm: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Entered On'
  },
  op_eby: {
    type: DataTypes.STRING(30),
    allowNull: true,
    defaultValue: '',
    comment: 'Entered By'
  },
  op_mdtm: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Modified On'
  },
  op_mby: {
    type: DataTypes.STRING(30),
    allowNull: true,
    defaultValue: '',
    comment: 'Modified By'
  },
  op_cdtm: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Closed On'
  },
  op_cby: {
    type: DataTypes.STRING(30),
    allowNull: true,
    defaultValue: '',
    comment: 'Closed By'
  },
  op_secure: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: 'Secure?'
  }
}, {
  tableName: 'opXoperation',
  timestamps: false
});

module.exports = PermissionTVL;
