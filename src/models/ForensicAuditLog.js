/**
 * ForensicAuditLog — Sequelize Model (v2)
 * Maps to audit_forensic_log (new per-field normalized schema)
 *
 * IMMUTABLE: no updates or deletes allowed at model level.
 * Raw inserts are handled by ForensicAuditService via sequelizeTVL.query()
 * for maximum performance. This model is used for reads and associations.
 */

'use strict';

const { DataTypes } = require('sequelize');
const { sequelizeTVL } = require('../../config/db');

const ForensicAuditLog = sequelizeTVL.define('ForensicAuditLog', {
  audit_id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    field: 'audit_id',
  },
  module_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'module_name',
  },
  record_id: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'record_id',
  },
  action_type: {
    type: DataTypes.ENUM(
      'INSERT', 'UPDATE', 'DELETE', 'CANCEL', 'CLOSE',
      'LOGIN', 'LOGOUT', 'FAILED_LOGIN',
      'PASSWORD_RESET', 'USER_LOCK', 'USER_UNLOCK',
      'ROLE_CHANGE', 'PERMISSION_CHANGE'
    ),
    allowNull: false,
    field: 'action_type',
  },
  field_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'field_name',
  },
  old_value: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
    field: 'old_value',
  },
  new_value: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
    field: 'new_value',
  },
  changed_by: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'changed_by',
  },
  changed_by_name: {
    type: DataTypes.STRING(200),
    allowNull: true,
    field: 'changed_by_name',
  },
  ip_address: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'ip_address',
  },
  machine_name: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'machine_name',
  },
  change_timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'change_timestamp',
  },
}, {
  tableName: 'audit_forensic_log',
  timestamps: false,
  indexes: [
    { fields: ['module_name'] },
    { fields: ['record_id'] },
    { fields: ['module_name', 'record_id'] },
    { fields: ['changed_by'] },
    { fields: ['change_timestamp'] },
    { fields: ['action_type'] },
  ],
});

// ── Immutability hooks ────────────────────────────────────────────────────────
ForensicAuditLog.addHook('beforeUpdate', () => {
  throw new Error('YatraSathi ERP: Forensic audit logs are immutable and cannot be modified.');
});
ForensicAuditLog.addHook('beforeDestroy', () => {
  throw new Error('YatraSathi ERP: Forensic audit logs are immutable and cannot be deleted.');
});
ForensicAuditLog.addHook('beforeBulkUpdate', () => {
  throw new Error('YatraSathi ERP: Forensic audit logs are immutable and cannot be modified.');
});
ForensicAuditLog.addHook('beforeBulkDestroy', () => {
  throw new Error('YatraSathi ERP: Forensic audit logs are immutable and cannot be deleted.');
});

module.exports = ForensicAuditLog;