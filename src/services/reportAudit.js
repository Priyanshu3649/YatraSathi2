const { Audit } = require('../models');

/**
 * Report Audit Service
 * Tracks all report-related activities for compliance and security
 */
class ReportAudit {
  constructor() {
    this.auditCategories = {
      REPORT_ACCESS: 'REPORT_ACCESS',
      REPORT_GENERATION: 'REPORT_GENERATION',
      TEMPLATE_CREATION: 'TEMPLATE_CREATION',
      TEMPLATE_MODIFICATION: 'TEMPLATE_MODIFICATION',
      TEMPLATE_DELETION: 'TEMPLATE_DELETION',
      EXPORT_ACTIVITY: 'EXPORT_ACTIVITY',
      REPORT_ERROR: 'REPORT_ERROR'
    };
  }

  /**
   * Log report access activity
   * @param {string} userId - User ID
   * @param {string} reportType - Report type accessed
   * @param {Object} filters - Report filters used
   * @param {string} ipAddress - IP address
   * @param {string} userAgent - User agent string
   */
  async logReportAccess(userId, reportType, filters, ipAddress, userAgent = '') {
    try {
      const auditData = {
        au_module: 'REPORTS',
        au_action: this.auditCategories.REPORT_ACCESS,
        au_user_id: userId,
        au_description: `User accessed ${reportType} report`,
        au_details: JSON.stringify({
          reportType,
          filters: this.sanitizeFilters(filters),
          ipAddress
        }),
        au_ip_address: ipAddress,
        au_user_agent: userAgent,
        au_status: 'SUCCESS'
      };

      await this.createAuditLog(auditData);
    } catch (error) {
      console.error('Failed to log report access:', error);
      // Don't throw error as this shouldn't break the main functionality
    }
  }

  /**
   * Log report generation activity
   * @param {string} userId - User ID
   * @param {string} reportType - Report type generated
   * @param {Object} config - Report configuration
   * @param {number} recordCount - Number of records returned
   * @param {string} ipAddress - IP address
   * @param {string} userAgent - User agent string
   */
  async logReportGeneration(userId, reportType, config, recordCount, ipAddress, userAgent = '') {
    try {
      const auditData = {
        au_module: 'REPORTS',
        au_action: this.auditCategories.REPORT_GENERATION,
        au_user_id: userId,
        au_description: `User generated ${reportType} report with ${recordCount} records`,
        au_details: JSON.stringify({
          reportType,
          config: this.sanitizeConfig(config),
          recordCount,
          ipAddress
        }),
        au_ip_address: ipAddress,
        au_user_agent: userAgent,
        au_status: 'SUCCESS'
      };

      await this.createAuditLog(auditData);
    } catch (error) {
      console.error('Failed to log report generation:', error);
    }
  }

  /**
   * Log template creation activity
   * @param {string} userId - User ID
   * @param {number} templateId - Template ID
   * @param {string} templateName - Template name
   * @param {string} ipAddress - IP address
   * @param {string} userAgent - User agent string
   */
  async logTemplateCreation(userId, templateId, templateName, ipAddress, userAgent = '') {
    try {
      const auditData = {
        au_module: 'REPORTS',
        au_action: this.auditCategories.TEMPLATE_CREATION,
        au_user_id: userId,
        au_description: `User created report template: ${templateName}`,
        au_details: JSON.stringify({
          templateId,
          templateName,
          ipAddress
        }),
        au_ip_address: ipAddress,
        au_user_agent: userAgent,
        au_status: 'SUCCESS'
      };

      await this.createAuditLog(auditData);
    } catch (error) {
      console.error('Failed to log template creation:', error);
    }
  }

  /**
   * Log template modification activity
   * @param {string} userId - User ID
   * @param {number} templateId - Template ID
   * @param {string} templateName - Template name
   * @param {string} ipAddress - IP address
   * @param {string} userAgent - User agent string
   */
  async logTemplateModification(userId, templateId, templateName, ipAddress, userAgent = '') {
    try {
      const auditData = {
        au_module: 'REPORTS',
        au_action: this.auditCategories.TEMPLATE_MODIFICATION,
        au_user_id: userId,
        au_description: `User modified report template: ${templateName}`,
        au_details: JSON.stringify({
          templateId,
          templateName,
          ipAddress
        }),
        au_ip_address: ipAddress,
        au_user_agent: userAgent,
        au_status: 'SUCCESS'
      };

      await this.createAuditLog(auditData);
    } catch (error) {
      console.error('Failed to log template modification:', error);
    }
  }

  /**
   * Log template deletion activity
   * @param {string} userId - User ID
   * @param {number} templateId - Template ID
   * @param {string} templateName - Template name
   * @param {string} ipAddress - IP address
   * @param {string} userAgent - User agent string
   */
  async logTemplateDeletion(userId, templateId, templateName, ipAddress, userAgent = '') {
    try {
      const auditData = {
        au_module: 'REPORTS',
        au_action: this.auditCategories.TEMPLATE_DELETION,
        au_user_id: userId,
        au_description: `User deleted report template: ${templateName}`,
        au_details: JSON.stringify({
          templateId,
          templateName,
          ipAddress
        }),
        au_ip_address: ipAddress,
        au_user_agent: userAgent,
        au_status: 'SUCCESS'
      };

      await this.createAuditLog(auditData);
    } catch (error) {
      console.error('Failed to log template deletion:', error);
    }
  }

  /**
   * Log export activity
   * @param {string} userId - User ID
   * @param {string} exportType - Export format (PDF, Excel, CSV)
   * @param {number} recordCount - Number of records exported
   * @param {string} ipAddress - IP address
   * @param {string} userAgent - User agent string
   */
  async logExportActivity(userId, exportType, recordCount, ipAddress, userAgent = '') {
    try {
      const auditData = {
        au_module: 'REPORTS',
        au_action: this.auditCategories.EXPORT_ACTIVITY,
        au_user_id: userId,
        au_description: `User exported ${recordCount} records as ${exportType}`,
        au_details: JSON.stringify({
          exportType,
          recordCount,
          ipAddress
        }),
        au_ip_address: ipAddress,
        au_user_agent: userAgent,
        au_status: 'SUCCESS'
      };

      await this.createAuditLog(auditData);
    } catch (error) {
      console.error('Failed to log export activity:', error);
    }
  }

  /**
   * Log report error
   * @param {string} userId - User ID
   * @param {string} reportType - Report type
   * @param {string} errorMessage - Error message
   * @param {string} ipAddress - IP address
   * @param {string} userAgent - User agent string
   */
  async logReportError(userId, reportType, errorMessage, ipAddress, userAgent = '') {
    try {
      const auditData = {
        au_module: 'REPORTS',
        au_action: this.auditCategories.REPORT_ERROR,
        au_user_id: userId,
        au_description: `Report generation failed for ${reportType}`,
        au_details: JSON.stringify({
          reportType,
          error: errorMessage,
          ipAddress
        }),
        au_ip_address: ipAddress,
        au_user_agent: userAgent,
        au_status: 'ERROR'
      };

      await this.createAuditLog(auditData);
    } catch (error) {
      console.error('Failed to log report error:', error);
    }
  }

  /**
   * Get user's report history
   * @param {string} userId - User ID
   * @param {number} limit - Number of records to return
   * @param {number} offset - Offset for pagination
   * @returns {Array} Audit records
   */
  async getReportHistory(userId, limit = 50, offset = 0) {
    try {
      const history = await Audit.findAll({
        where: {
          au_user_id: userId,
          au_module: 'REPORTS'
        },
        order: [['au_created_at', 'DESC']],
        limit,
        offset
      });

      return history.map(record => ({
        id: record.au_id,
        action: record.au_action,
        description: record.au_description,
        timestamp: record.au_created_at,
        status: record.au_status
      }));
    } catch (error) {
      console.error('Failed to retrieve report history:', error);
      throw new Error('Failed to retrieve report history');
    }
  }

  /**
   * Get audit reports for administrators
   * @param {Object} filters - Filter criteria
   * @param {number} limit - Number of records to return
   * @param {number} offset - Offset for pagination
   * @returns {Array} Audit records
   */
  async getAuditReport(filters = {}, limit = 100, offset = 0) {
    try {
      const whereClause = {
        au_module: 'REPORTS'
      };

      // Apply filters
      if (filters.userId) {
        whereClause.au_user_id = filters.userId;
      }
      
      if (filters.action) {
        whereClause.au_action = filters.action;
      }
      
      if (filters.startDate) {
        whereClause.au_created_at = {
          [require('sequelize').Op.gte]: new Date(filters.startDate)
        };
      }
      
      if (filters.endDate) {
        whereClause.au_created_at = {
          ...whereClause.au_created_at,
          [require('sequelize').Op.lte]: new Date(filters.endDate)
        };
      }

      const auditRecords = await Audit.findAll({
        where: whereClause,
        order: [['au_created_at', 'DESC']],
        limit,
        offset
      });

      return auditRecords.map(record => ({
        id: record.au_id,
        userId: record.au_user_id,
        action: record.au_action,
        description: record.au_description,
        details: JSON.parse(record.au_details || '{}'),
        ipAddress: record.au_ip_address,
        userAgent: record.au_user_agent,
        status: record.au_status,
        timestamp: record.au_created_at
      }));
    } catch (error) {
      console.error('Failed to generate audit report:', error);
      throw new Error('Failed to generate audit report');
    }
  }

  /**
   * Create audit log entry
   * @param {Object} auditData - Audit data to log
   */
  async createAuditLog(auditData) {
    try {
      await Audit.create({
        au_module: auditData.au_module,
        au_action: auditData.au_action,
        au_user_id: auditData.au_user_id,
        au_description: auditData.au_description,
        au_details: auditData.au_details,
        au_ip_address: auditData.au_ip_address,
        au_user_agent: auditData.au_user_agent,
        au_status: auditData.au_status
      });
    } catch (error) {
      // Log to console but don't throw - audit logging shouldn't break main functionality
      console.error('Failed to create audit log entry:', error);
    }
  }

  /**
   * Sanitize filters for logging (remove sensitive data)
   * @param {Object} filters - Filters to sanitize
   * @returns {Object} Sanitized filters
   */
  sanitizeFilters(filters) {
    if (!filters) return {};
    
    const sanitized = { ...filters };
    
    // Remove potentially sensitive fields
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.secret;
    
    return sanitized;
  }

  /**
   * Sanitize configuration for logging
   * @param {Object} config - Configuration to sanitize
   * @returns {Object} Sanitized configuration
   */
  sanitizeConfig(config) {
    if (!config) return {};
    
    const sanitized = { ...config };
    
    // Remove sensitive configuration
    delete sanitized.password;
    delete sanitized.apiKey;
    delete sanitized.secret;
    
    return sanitized;
  }
}

module.exports = ReportAudit;