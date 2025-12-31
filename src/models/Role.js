const { DataTypes } = require('sequelize');
const { sequelize, BaseModel } = require('./baseModel');

const Role = sequelize.define('fnXfunction', {
  fn_fnid: {
    type: DataTypes.STRING(3),
    primaryKey: true,
    allowNull: false,
    defaultValue: '',
    comment: 'Function Id.'
  },
  fn_fnshort: {
    type: DataTypes.STRING(30),
    allowNull: true,
    defaultValue: '',
    unique: true,
    comment: 'Short Description'
  },
  fn_fndesc: {
    type: DataTypes.STRING(60),
    allowNull: true,
    defaultValue: '',
    comment: 'Description'
  },
  fn_rmrks: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
    comment: 'Remarks'
  },
  fn_active: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: 'Active ?'
  },
  fn_edtm: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Entered On'
  },
  fn_eby: {
    type: DataTypes.STRING(30),
    allowNull: true,
    defaultValue: '',
    comment: 'Entered By'
  },
  fn_mdtm: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Modified On'
  },
  fn_mby: {
    type: DataTypes.STRING(30),
    allowNull: true,
    defaultValue: '',
    comment: 'Modified By'
  },
  fn_cdtm: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Closed On'
  },
  fn_cby: {
    type: DataTypes.STRING(30),
    allowNull: true,
    defaultValue: '',
    comment: 'Closed By'
  }
}, {
  tableName: 'fnXfunction',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['fn_fnshort']
    }
  ]
});

module.exports = Role;