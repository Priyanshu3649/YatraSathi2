const { DataTypes } = require('sequelize');
const { sequelizeTVL } = require('../../config/db');

const ApplicationTVL = sequelizeTVL.define('apXapplication', {
  ap_apid: {
    type: DataTypes.STRING(4),
    primaryKey: true,
    allowNull: false,
    defaultValue: '',
    comment: 'Application ID'
  },
  ap_apshort: {
    type: DataTypes.STRING(30),
    allowNull: false,
    defaultValue: '',
    comment: 'Short Name'
  },
  ap_apdesc: {
    type: DataTypes.STRING(60),
    allowNull: true,
    defaultValue: '',
    comment: 'Description'
  },
  ap_rmrks: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
    comment: 'Remarks'
  },
  ap_active: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: 'Active?'
  },
  ap_edtm: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Entered On'
  },
  ap_eby: {
    type: DataTypes.STRING(30),
    allowNull: true,
    defaultValue: '',
    comment: 'Entered By'
  },
  ap_mdtm: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Modified On'
  },
  ap_mby: {
    type: DataTypes.STRING(30),
    allowNull: true,
    defaultValue: '',
    comment: 'Modified By'
  },
  ap_cdtm: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Closed On'
  },
  ap_cby: {
    type: DataTypes.STRING(30),
    allowNull: true,
    defaultValue: '',
    comment: 'Closed By'
  }
}, {
  tableName: 'apXapplication',
  timestamps: false
});

module.exports = ApplicationTVL;
