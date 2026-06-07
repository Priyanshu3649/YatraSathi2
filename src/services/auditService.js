const ForensicAuditLog = require('../models/ForensicAuditLog');

class AuditService {
  static async logChange({
    entityName,
    entityId,
    actionType,
    changedFields = [],
    oldValues = {},
    newValues = {},
    performedBy,
    ipAddress,
    userAgent,
    transactionId
  }) {
    try {
      await ForensicAuditLog.create({
        entityName,
        entityId,
        actionType,
        changedFields,
        oldValues,
        newValues,
        performedBy,
        ipAddress,
        userAgent,
        transactionId
      });
    } catch (error) {
      console.error('Failed to log audit change:', error);
    }
  }

  static async getAuditLogs(filters = {}, page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    const where = {};

    if (filters.entityName) {
      where.entityName = filters.entityName;
    }
    if (filters.actionType) {
      where.actionType = filters.actionType;
    }
    if (filters.performedBy) {
      where.performedBy = filters.performedBy;
    }
    if (filters.entityId) {
      where.entityId = filters.entityId;
    }
    if (filters.fromDate || filters.toDate) {
      where.performedOn = {};
      if (filters.fromDate) {
        where.performedOn.$gte = new Date(filters.fromDate);
      }
      if (filters.toDate) {
        where.performedOn.$lte = new Date(filters.toDate);
      }
    }

    const { count, rows } = await ForensicAuditLog.findAndCountAll({
      where,
      order: [['performedOn', 'DESC']],
      limit,
      offset
    });

    return {
      logs: rows,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    };
  }

  static compareAndLog(oldRecord, newRecord, { entityName, entityId, performedBy, ipAddress, userAgent, actionType = 'UPDATE' }) {
    const changedFields = [];
    const oldValues = {};
    const newValues = {};

    for (const key in newRecord) {
      if (oldRecord[key] !== newRecord[key]) {
        changedFields.push(key);
        oldValues[key] = oldRecord[key];
        newValues[key] = newRecord[key];
      }
    }

    if (changedFields.length > 0) {
      return this.logChange({
        entityName,
        entityId,
        actionType,
        changedFields,
        oldValues,
        newValues,
        performedBy,
        ipAddress,
        userAgent
      });
    }
  }
}

module.exports = AuditService;