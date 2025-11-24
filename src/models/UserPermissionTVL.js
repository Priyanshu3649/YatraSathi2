const { DataTypes } = require('sequelize');
const { sequelizeTVL } = require('../../config/db');

const UserPermissionTVL = sequelizeTVL.define('upXusrperm', {
  up_usid: {
    type: DataTypes.STRING(15),
    primaryKey: true,
    allowNull: false,
    defaultValue: '',
    comment: 'User ID'
  },
  up_opid: {
    type: DataTypes.STRING(12),
    primaryKey: true,
    allowNull: false,
    defaultValue: '',
    comment: 'Operation ID (ap_apid + mo_moid + op_opid)'
  },
  up_allow: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: 'Allow? (1=Allow, 0=Deny)'
  },
  up_rmrks: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
    comment: 'Remarks'
  },
  up_active: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: 'Active?'
  },
  up_edtm: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Entered On'
  },
  up_eby: {
    type: DataTypes.STRING(30),
    allowNull: true,
    defaultValue: '',
    comment: 'Entered By'
  },
  up_mdtm: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Modified On'
  },
  up_mby: {
    type: DataTypes.STRING(30),
    allowNull: true,
    defaultValue: '',
    comment: 'Modified By'
  },
  up_cdtm: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Closed On'
  },
  up_cby: {
    type: DataTypes.STRING(30),
    allowNull: true,
    defaultValue: '',
    comment: 'Closed By'
  }
}, {
  tableName: 'upXusrperm',
  timestamps: false
});

module.exports = UserPermissionTVL;
