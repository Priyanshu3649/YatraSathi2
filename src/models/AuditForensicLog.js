const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');

const AuditForensicLog = sequelize.define('AuditForensicLog', {
  audit_id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  module_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  record_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  action_type: {
    type: DataTypes.ENUM(
      'INSERT',
      'UPDATE',
      'DELETE',
      'CANCEL',
      'CLOSE',
      'LOGIN',
      'LOGOUT',
      'FAILED_LOGIN',
      'PASSWORD_RESET',
      'USER_LOCK',
      'USER_UNLOCK',
      'ROLE_CHANGE',
      'PERMISSION_CHANGE'
    ),
    allowNull: false
  },
  field_name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  old_value: {
    type: DataTypes.LONGTEXT,
    allowNull: true
  },
  new_value: {
    type: DataTypes.LONGTEXT,
    allowNull: true
  },
  changed_by: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  changed_by_name: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  ip_address: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  machine_name: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  change_timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'audit_forensic_log',
  timestamps: false,
  indexes: [
    { name: 'idx_module', fields: ['module_name'] },
    { name: 'idx_record', fields: ['record_id'] },
    { name: 'idx_user', fields: ['changed_by'] },
    { name: 'idx_timestamp', fields: ['change_timestamp'] }
  ]
});

module.exports = AuditForensicLog;