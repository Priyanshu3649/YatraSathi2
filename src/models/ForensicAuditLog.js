// Forensic Audit Log Model
// Immutable audit trail for all business transactions

const { DataTypes } = require('sequelize');
const { sequelizeTVL } = require('../../config/db');

const ForensicAuditLog = sequelizeTVL.define('forensicAuditLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  entityName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'entity_name'
  },
  entityId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'entity_id'
  },
  actionType: {
    type: DataTypes.ENUM('CREATE', 'UPDATE', 'CLOSE', 'CANCEL', 'DELETE'),
    allowNull: false,
    field: 'action_type'
  },
  changedFields: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'changed_fields'
  },
  oldValues: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'old_values'
  },
  newValues: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'new_values'
  },
  performedBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'performed_by'
  },
  performedOn: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'performed_on'
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true,
    field: 'ip_address'
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'user_agent'
  },
  branchId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'branch_id'
  },
  transactionId: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'transaction_id'
  }
}, {
  tableName: 'audit_forensic_log',
  timestamps: false,
  // Make table append-only - no updates or deletes allowed
  paranoid: false
});

// Add indexes for performance
ForensicAuditLog.addIndex(['entityName', 'entityId']);
ForensicAuditLog.addIndex(['performedOn']);
ForensicAuditLog.addIndex(['performedBy']);
ForensicAuditLog.addIndex(['actionType']);

// Prevent any updates or deletes at model level
ForensicAuditLog.addHook('beforeUpdate', () => {
  throw new Error('Forensic audit logs cannot be modified');
});

ForensicAuditLog.addHook('beforeDestroy', () => {
  throw new Error('Forensic audit logs cannot be deleted');
});

module.exports = ForensicAuditLog;