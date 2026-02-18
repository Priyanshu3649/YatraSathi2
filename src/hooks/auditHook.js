// Centralized Audit Hook System
// Implements forensic-grade audit logging for all Sequelize models

const { DataTypes } = require('sequelize');
const cls = require('cls-hooked');

// Create CLS namespace for audit context
const namespace = cls.createNamespace('audit-namespace');

// Audit field definitions to be added to all models
const auditFields = {
  enteredBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'entered_by'
  },
  enteredOn: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'entered_on'
  },
  modifiedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'modified_by'
  },
  modifiedOn: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'modified_on'
  },
  closedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'closed_by'
  },
  closedOn: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'closed_on'
  },
  status: {
    type: DataTypes.ENUM('OPEN', 'CLOSED', 'CANCELLED'),
    defaultValue: 'OPEN'
  }
};

// Initialize audit hooks for a sequelize instance
const initAuditHooks = (sequelize) => {
  // Before create hook - sets initial audit fields
  sequelize.addHook('beforeCreate', (instance, options) => {
    const userId = namespace.get('userId');
    
    if (!userId) {
      throw new Error('User context not available for audit logging');
    }
    
    // Set creation audit fields
    instance.enteredBy = userId;
    instance.enteredOn = new Date();
    instance.modifiedBy = null;
    instance.modifiedOn = null;
    instance.closedBy = null;
    instance.closedOn = null;
    
    // Log to forensic audit table
    logForensicAudit(instance, 'CREATE', null, instance.dataValues, options.transaction);
  });

  // Before update hook - sets modification audit fields
  sequelize.addHook('beforeUpdate', (instance, options) => {
    const userId = namespace.get('userId');
    
    if (!userId) {
      throw new Error('User context not available for audit logging');
    }
    
    // Capture changed fields for forensic logging
    const changedFields = instance.changed();
    if (changedFields && changedFields.length > 0) {
      const oldValues = {};
      const newValues = {};
      
      changedFields.forEach(field => {
        // Skip audit fields themselves from being logged as changes
        if (!['enteredBy', 'enteredOn', 'modifiedBy', 'modifiedOn', 'closedBy', 'closedOn'].includes(field)) {
          oldValues[field] = instance._previousDataValues[field];
          newValues[field] = instance.dataValues[field];
        }
      });
      
      // Set modification audit fields
      instance.modifiedBy = userId;
      instance.modifiedOn = new Date();
      
      // Log to forensic audit table
      logForensicAudit(instance, 'UPDATE', oldValues, newValues, options.transaction);
    }
  });

  // Before save hook - handles status changes
  sequelize.addHook('beforeSave', (instance, options) => {
    const userId = namespace.get('userId');
    
    if (!userId) {
      throw new Error('User context not available for audit logging');
    }
    
    // Check if status changed to CLOSED
    if (instance.changed('status') && instance.status === 'CLOSED') {
      instance.closedBy = userId;
      instance.closedOn = new Date();
      
      // Log closure to forensic audit table
      logForensicAudit(instance, 'CLOSE', 
        { status: instance._previousDataValues.status }, 
        { status: instance.status }, 
        options.transaction
      );
    }
    
    // Check if status changed to CANCELLED
    if (instance.changed('status') && instance.status === 'CANCELLED') {
      // Log cancellation to forensic audit table
      logForensicAudit(instance, 'CANCEL', 
        { status: instance._previousDataValues.status }, 
        { status: instance.status }, 
        options.transaction
      );
    }
  });

  // Before destroy hook - prevents physical deletion of financial records
  sequelize.addHook('beforeDestroy', (instance, options) => {
    // For financial records, prevent physical deletion
    // Instead, mark as CANCELLED
    if (isFinancialRecord(instance)) {
      throw new Error('Financial records cannot be physically deleted. Use status=CANCELLED instead.');
    }
    
    // Log deletion to forensic audit table
    logForensicAudit(instance, 'DELETE', instance._previousDataValues, null, options.transaction);
  });
};

// Log forensic audit entry
const logForensicAudit = async (instance, actionType, oldValues, newValues, transaction) => {
  try {
    const { ForensicAuditLog } = require('../models');
    const userId = namespace.get('userId');
    const branchId = namespace.get('branchId');
    const ipAddress = namespace.get('ipAddress');
    const userAgent = namespace.get('userAgent');
    
    if (!userId) return; // Skip if no user context
    
    await ForensicAuditLog.create({
      entityName: instance.constructor.name,
      entityId: instance.id,
      actionType: actionType,
      changedFields: Object.keys(newValues || {}),
      oldValues: oldValues,
      newValues: newValues,
      performedBy: userId,
      performedOn: new Date(),
      ipAddress: ipAddress,
      userAgent: userAgent,
      branchId: branchId
    }, { transaction });
    
  } catch (error) {
    console.error('Failed to log forensic audit:', error);
    // Don't throw error to prevent blocking main operation
  }
};

// Check if model is a financial record
const isFinancialRecord = (instance) => {
  const financialModels = ['BookingTVL', 'BillingMaster', 'PaymentTVL', 'ReceiptTVL', 'JournalEntry', 'ContraEntry'];
  return financialModels.includes(instance.constructor.name);
};

// Sanitize audit fields from request body
const sanitizeAuditFields = (req, res, next) => {
  if (req.body) {
    // Remove all audit fields from request body
    delete req.body.enteredBy;
    delete req.body.enteredOn;
    delete req.body.modifiedBy;
    delete req.body.modifiedOn;
    delete req.body.closedBy;
    delete req.body.closedOn;
    delete req.body.status;
  }
  next();
};

// Set user context in CLS namespace (to be used in auth middleware)
const setUserContext = (req, res, next) => {
  if (req.user) {
    namespace.set('userId', req.user.us_usid || req.user.id);
    namespace.set('branchId', req.user.branchId || null);
    namespace.set('ipAddress', req.ip || req.connection.remoteAddress);
    namespace.set('userAgent', req.headers['user-agent'] || 'Unknown');
  }
  next();
};

module.exports = {
  auditFields,
  initAuditHooks,
  sanitizeAuditFields,
  setUserContext,
  namespace
};