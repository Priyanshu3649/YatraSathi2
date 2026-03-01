// Audit Trail Controller
// Handles forensic audit log queries and administration

const { ForensicAuditLog, UserTVL } = require('../models');

// Get audit logs with filtering and pagination
const getAuditLogs = async (req, res) => {
  try {
    // Check admin permissions
    if (req.user.us_usertype !== 'admin' && req.user.us_roid !== 'ADM') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin access required.'
      });
    }

    // Extract query parameters
    const {
      entityName,
      entityId,
      actionType,
      performedBy,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20
    } = req.query;

    // Build query conditions
    const whereConditions = {};

    if (entityName) {
      whereConditions.entityName = entityName;
    }

    if (entityId) {
      whereConditions.entityId = parseInt(entityId);
    }

    if (actionType) {
      whereConditions.actionType = actionType;
    }

    if (performedBy) {
      whereConditions.performedBy = parseInt(performedBy);
    }

    // Date range filtering
    if (dateFrom || dateTo) {
      whereConditions.performedOn = {};
      if (dateFrom) {
        whereConditions.performedOn[Sequelize.Op.gte] = new Date(dateFrom);
      }
      if (dateTo) {
        // Set to end of day for inclusive date range
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        whereConditions.performedOn[Sequelize.Op.lte] = endDate;
      }
    }

    // Calculate offset for pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Fetch audit logs with pagination
    const { count, rows: logs } = await ForensicAuditLog.findAndCountAll({
      where: whereConditions,
      order: [['performedOn', 'DESC']],
      limit: parseInt(limit),
      offset: offset,
      include: [
        {
          model: UserTVL,
          as: 'performedByUser',
          attributes: ['us_usid', 'us_fname', 'us_lname'],
          required: false
        }
      ]
    });

    // Transform data for frontend
    const transformedLogs = logs.map(log => {
      const logData = log.toJSON();
      return {
        id: logData.id,
        entityName: logData.entityName,
        entityId: logData.entityId,
        actionType: logData.actionType,
        changedFields: logData.changedFields,
        oldValues: logData.oldValues,
        newValues: logData.newValues,
        performedBy: logData.performedBy,
        performedByUserName: logData.performedByUser ? 
          `${logData.performedByUser.us_fname} ${logData.performedByUser.us_lname}` : 
          `User ${logData.performedBy}`,
        performedOn: logData.performedOn,
        ipAddress: logData.ipAddress,
        userAgent: logData.userAgent,
        branchId: logData.branchId
      };
    });

    res.json({
      success: true,
      data: {
        logs: transformedLogs,
        totalCount: count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / parseInt(limit)),
        hasNext: parseInt(page) < Math.ceil(count / parseInt(limit)),
        hasPrevious: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit logs',
      error: error.message
    });
  }
};

// Get audit log by ID
const getAuditLogById = async (req, res) => {
  try {
    // Check admin permissions
    if (req.user.us_usertype !== 'admin' && req.user.us_roid !== 'ADM') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin access required.'
      });
    }

    const { id } = req.params;
    
    const log = await ForensicAuditLog.findByPk(id, {
      include: [
        {
          model: UserTVL,
          as: 'performedByUser',
          attributes: ['us_usid', 'us_fname', 'us_lname'],
          required: false
        }
      ]
    });

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Audit log not found'
      });
    }

    // Transform data
    const logData = log.toJSON();
    const transformedLog = {
      id: logData.id,
      entityName: logData.entityName,
      entityId: logData.entityId,
      actionType: logData.actionType,
      changedFields: logData.changedFields,
      oldValues: logData.oldValues,
      newValues: logData.newValues,
      performedBy: logData.performedBy,
      performedByUserName: logData.performedByUser ? 
        `${logData.performedByUser.us_fname} ${logData.performedByUser.us_lname}` : 
        `User ${logData.performedBy}`,
      performedOn: logData.performedOn,
      ipAddress: logData.ipAddress,
      userAgent: logData.userAgent,
      branchId: logData.branchId
    };

    res.json({
      success: true,
      data: transformedLog
    });

  } catch (error) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit log',
      error: error.message
    });
  }
};

// Get audit summary statistics
const getAuditSummary = async (req, res) => {
  try {
    // Check admin permissions
    if (req.user.us_usertype !== 'admin' && req.user.us_roid !== 'ADM') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin access required.'
      });
    }

    // Get total audit log count
    const totalLogs = await ForensicAuditLog.count();

    // Get counts by action type
    const actionTypeCounts = await ForensicAuditLog.findAll({
      attributes: [
        'actionType',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      group: ['actionType'],
      order: [[Sequelize.fn('COUNT', Sequelize.col('id')), 'DESC']]
    });

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentActivity = await ForensicAuditLog.count({
      where: {
        performedOn: {
          [Sequelize.Op.gte]: thirtyDaysAgo
        }
      }
    });

    // Get top active users
    const topUsers = await ForensicAuditLog.findAll({
      attributes: [
        'performedBy',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'activityCount']
      ],
      where: {
        performedOn: {
          [Sequelize.Op.gte]: thirtyDaysAgo
        }
      },
      group: ['performedBy'],
      order: [[Sequelize.fn('COUNT', Sequelize.col('id')), 'DESC']],
      limit: 10
    });

    // Get entity type distribution
    const entityTypeCounts = await ForensicAuditLog.findAll({
      attributes: [
        'entityName',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      group: ['entityName'],
      order: [[Sequelize.fn('COUNT', Sequelize.col('id')), 'DESC']]
    });

    res.json({
      success: true,
      data: {
        totalLogs,
        actionTypeDistribution: actionTypeCounts,
        recentActivity,
        topActiveUsers: topUsers,
        entityTypeDistribution: entityTypeCounts
      }
    });

  } catch (error) {
    console.error('Error fetching audit summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit summary',
      error: error.message
    });
  }
};

// Export controller functions
module.exports = {
  getAuditLogs,
  getAuditLogById,
  getAuditSummary
};