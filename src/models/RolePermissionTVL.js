const { DataTypes } = require('sequelize');
const { sequelizeTVL } = require('../../config/db');

const RolePermissionTVL = sequelizeTVL.define('fpXfuncperm', {
  fp_fnid: {
    type: DataTypes.STRING(6),
    primaryKey: true,
    allowNull: false,
    defaultValue: '',
    comment: 'Function/Role ID'
  },
  fp_opid: {
    type: DataTypes.STRING(12),
    primaryKey: true,
    allowNull: false,
    defaultValue: '',
    comment: 'Operation ID (ap_apid + mo_moid + op_opid)'
  },
  fp_allow: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: 'Allow? (1=Allow, 0=Deny)'
  },
  fp_rmrks: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
    comment: 'Remarks'
  },
  fp_active: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: 'Active?'
  },
  fp_edtm: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Entered On'
  },
  fp_eby: {
    type: DataTypes.STRING(30),
    allowNull: true,
    defaultValue: '',
    comment: 'Entered By'
  },
  fp_mdtm: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Modified On'
  },
  fp_mby: {
    type: DataTypes.STRING(30),
    allowNull: true,
    defaultValue: '',
    comment: 'Modified By'
  },
  fp_cdtm: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Closed On'
  },
  fp_cby: {
    type: DataTypes.STRING(30),
    allowNull: true,
    defaultValue: '',
    comment: 'Closed By'
  }
}, {
  tableName: 'fpXfuncperm',
  timestamps: false
});

module.exports = RolePermissionTVL;
