const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');

const Audit = sequelize.define('auAudit', {
  au_auid: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
    comment: 'Audit ID'
  },
  au_table: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'Table Name'
  },
  au_pkval: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'Primary Key Value'
  },
  au_action: {
    type: DataTypes.STRING(10),
    allowNull: false,
    comment: 'Action Type'
  },
  au_oldval: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Old Values'
  },
  au_newval: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'New Values'
  },
  au_usid: {
    type: DataTypes.STRING(15),
    allowNull: false,
    comment: 'User ID'
  },
  au_ipaddr: {
    type: DataTypes.STRING(45),
    allowNull: true,
    comment: 'IP Address'
  },
  au_edtm: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false,
    comment: 'Entry Date Time'
  }
}, {
  tableName: 'auAudit',
  timestamps: false
});

module.exports = Audit;