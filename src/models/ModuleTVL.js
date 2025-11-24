const { DataTypes } = require('sequelize');
const { sequelizeTVL } = require('../../config/db');

const ModuleTVL = sequelizeTVL.define('moXmodule', {
  mo_apid: {
    type: DataTypes.STRING(4),
    primaryKey: true,
    allowNull: false,
    defaultValue: '',
    comment: 'Application ID'
  },
  mo_moid: {
    type: DataTypes.STRING(4),
    primaryKey: true,
    allowNull: false,
    defaultValue: '',
    comment: 'Module ID'
  },
  mo_moshort: {
    type: DataTypes.STRING(30),
    allowNull: false,
    defaultValue: '',
    comment: 'Short Name'
  },
  mo_modesc: {
    type: DataTypes.STRING(60),
    allowNull: true,
    defaultValue: '',
    comment: 'Description'
  },
  mo_group: {
    type: DataTypes.STRING(60),
    allowNull: true,
    defaultValue: '',
    comment: 'Group'
  },
  mo_grsrl: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Group Serial'
  },
  mo_mhint: {
    type: DataTypes.STRING(320),
    allowNull: true,
    defaultValue: '',
    comment: 'Module Hint'
  },
  mo_isform: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: 'Is Form?'
  },
  mo_ready: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: 'Ready?'
  },
  mo_rmrks: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
    comment: 'Remarks'
  },
  mo_active: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: 'Active?'
  },
  mo_edtm: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Entered On'
  },
  mo_eby: {
    type: DataTypes.STRING(30),
    allowNull: true,
    defaultValue: '',
    comment: 'Entered By'
  },
  mo_mdtm: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Modified On'
  },
  mo_mby: {
    type: DataTypes.STRING(30),
    allowNull: true,
    defaultValue: '',
    comment: 'Modified By'
  },
  mo_cdtm: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Closed On'
  },
  mo_cby: {
    type: DataTypes.STRING(30),
    allowNull: true,
    defaultValue: '',
    comment: 'Closed By'
  }
}, {
  tableName: 'moXmodule',
  timestamps: false
});

module.exports = ModuleTVL;
