const ReportQueryEngine = require('../services/reportQueryEngine');
const ReportAudit = require('../services/reportAudit');
const QueryPerformance = require('../services/queryPerformance');
const TimePeriodReports = require('../services/timePeriodReports');
const FinancialReports = require('../services/financialReports');
const ExportService = require('../services/exportService');

/**
 * Generic Report Controller
 * Handles all report generation requests through the unified API endpoint
 */
class GenericReportController {
  constructor() {
    this.queryEngine = new ReportQueryEngine();
    this.auditService = new ReportAudit();
  }

  /**
   * Execute a generic report query
   * POST /api/reports/run
   */
  runReport = async (req, res) => {
    try {
      const { reportType, columns, filters, groupBy, aggregates, orderBy, limit, offset } = req.body;
      
      // Validate required fields
      if (!reportType) {
        return res.status(400).json({ 
          success: false, 
          message: 'Report type is required' 
        });
      }

      // Prepare query configuration
      const queryConfig = {
        reportType: reportType.toLowerCase(),
        columns: columns || [],
        filters: filters || {},
        groupBy: groupBy || [],
        aggregates: aggregates || {},
        orderBy: orderBy || [],
        limit: limit || 1000,
        offset: offset || 0
      };

      // Validate query configuration
      try {
        this.queryEngine.validateQueryConfig(queryConfig);
      } catch (validationError) {
        return res.status(400).json({
          success: false,
          message: validationError.message
        });
      }

      // Get user context from request
      const userContext = {
        us_usid: req.user.us_usid,
        us_usertype: req.user.us_usertype,
        us_roid: req.user.us_roid,
        us_name: `${req.user.us_fname} ${req.user.us_lname}`.trim()
      };

      // Log report access for audit
      await this.auditService.logReportAccess(
        userContext.us_usid,
        reportType,
        filters,
        req.ip
      );

      // Execute the report query
      const results = await this.queryEngine.executeQuery(queryConfig, userContext);

      // Return successful response
      res.json({
        success: true,
        data: results.data,
        metadata: results.metadata,
        aggregates: results.aggregates,
        message: 'Report generated successfully'
      });

    } catch (error) {
      console.error('Report generation error:', error);
      
      // Log error for audit
      await this.auditService.logReportError(
        req.user?.us_usid || 'unknown',
        req.body.reportType,
        error.message,
        req.ip
      );

      res.status(500).json({
        success: false,
        message: 'Failed to generate report',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  };

  /**
   * Get available report types and columns
   * GET /api/reports/schema
   */
  getReportSchema = async (req, res) => {
    try {
      const reportTypes = Object.keys(this.queryEngine.reportTypes);
      const schema = {};

      // Get available columns for each report type
      reportTypes.forEach(type => {
        schema[type] = {
          columns: this.queryEngine.getAvailableColumns(type),
          filters: this.getAvailableFilters(type),
          aggregates: ['SUM', 'COUNT', 'AVG', 'MIN', 'MAX']
        };
      });

      res.json({
        success: true,
        data: schema,
        message: 'Report schema retrieved successfully'
      });

    } catch (error) {
      console.error('Schema retrieval error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve report schema',
        error: error.message
      });
    }
  };

  /**
   * Get available filters for a report type
   * @param {string} reportType - Report type
   * @returns {Array} Available filters
   */
  getAvailableFilters(reportType) {
    const baseFilters = [
      { name: 'dateFrom', type: 'date', description: 'Start date filter' },
      { name: 'dateTo', type: 'date', description: 'End date filter' }
    ];

    const typeSpecificFilters = {
      booking: [
        { name: 'bk_status', type: 'string', description: 'Booking status' },
        { name: 'bk_fromst', type: 'string', description: 'From station' },
        { name: 'bk_tost', type: 'string', description: 'To station' },
        { name: 'bk_class', type: 'string', description: 'Travel class' },
        { name: 'bk_agent', type: 'string', description: 'Assigned agent' }
      ],
      billing: [
        { name: 'bi_status', type: 'string', description: 'Bill status' },
        { name: 'bi_customer_id', type: 'string', description: 'Customer ID' }
      ],
      payment: [
        { name: 'pt_mode', type: 'string', description: 'Payment mode' },
        { name: 'pt_status', type: 'string', description: 'Payment status' },
        { name: 'pt_amount_from', type: 'number', description: 'Minimum amount' },
        { name: 'pt_amount_to', type: 'number', description: 'Maximum amount' }
      ],
      customer: [
        { name: 'cu_custtype', type: 'string', description: 'Customer type' },
        { name: 'cu_status', type: 'string', description: 'Customer status' }
      ],
      employee: [
        { name: 'em_dept', type: 'string', description: 'Department' },
        { name: 'em_desig', type: 'string', description: 'Designation' },
        { name: 'em_status', type: 'string', description: 'Employee status' }
      ]
    };

    return [...baseFilters, ...(typeSpecificFilters[reportType] || [])];
  }

  /**
   * Save report template
   * POST /api/reports/templates
   */
  saveTemplate = async (req, res) => {
    try {
      const { name, description, config, isPublic } = req.body;
      const userId = req.user.us_usid;

      // Validate required fields
      if (!name || !config) {
        return res.status(400).json({
          success: false,
          message: 'Template name and configuration are required'
        });
      }

      // Create template record
      const template = {
        rt_name: name,
        rt_description: description,
        rt_type: config.reportType,
        rt_config: JSON.stringify(config),
        rt_role_access: isPublic ? 'all' : req.user.us_roid,
        rt_created_by: userId,
        rt_is_public: isPublic ? 1 : 0
      };

      // Save to database (this would use a ReportTemplate model)
      // const savedTemplate = await ReportTemplate.create(template);
      
      // For now, return mock response
      const savedTemplate = {
        rt_rtid: Date.now(),
        ...template,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Log template creation
      await this.auditService.logTemplateCreation(
        userId,
        savedTemplate.rt_rtid,
        name,
        req.ip
      );

      res.json({
        success: true,
        data: savedTemplate,
        message: 'Report template saved successfully'
      });

    } catch (error) {
      console.error('Template save error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to save report template',
        error: error.message
      });
    }
  };

  /**
   * Get user's saved templates
   * GET /api/reports/templates
   */
  getTemplates = async (req, res) => {
    try {
      const userId = req.user.us_usid;
      const userRole = req.user.us_roid;

      // Get templates (this would query ReportTemplate model)
      // const templates = await ReportTemplate.findAll({
      //   where: {
      //     [Op.or]: [
      //       { rt_created_by: userId },
      //       { rt_role_access: userRole },
      //       { rt_is_public: 1 }
      //     ]
      //   },
      //   order: [['createdAt', 'DESC']]
      // });

      // For now, return empty array
      const templates = [];

      res.json({
        success: true,
        data: templates,
        message: 'Templates retrieved successfully'
      });

    } catch (error) {
      console.error('Template retrieval error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve templates',
        error: error.message
      });
    }
  };

  /**
   * Delete report template
   * DELETE /api/reports/templates/:id
   */
  deleteTemplate = async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.us_usid;

      // Check if user owns the template (this would query database)
      // const template = await ReportTemplate.findByPk(id);
      // if (!template) {
      //   return res.status(404).json({
      //     success: false,
      //     message: 'Template not found'
      //   });
      // }

      // if (template.rt_created_by !== userId && req.user.us_roid !== 'ADM') {
      //   return res.status(403).json({
      //     success: false,
      //     message: 'Permission denied'
      //   });
      // }

      // Delete template
      // await template.destroy();

      // For now, return success response
      res.json({
        success: true,
        message: 'Template deleted successfully'
      });

    } catch (error) {
      console.error('Template deletion error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete template',
        error: error.message
      });
    }
  };

  /**
   * Get report execution history
   * GET /api/reports/history
   */
  getReportHistory = async (req, res) => {
    try {
      const userId = req.user.us_usid;
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;

      // Get audit logs for this user
      const history = await this.auditService.getReportHistory(
        userId,
        limit,
        offset
      );

      res.json({
        success: true,
        data: history,
        message: 'Report history retrieved successfully'
      });

    } catch (error) {
      console.error('History retrieval error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve report history',
        error: error.message
      });
    }
  };
  
  /**
   * Get performance metrics and optimization data
   * GET /api/reports/performance
   */
  getPerformanceMetrics = async (req, res) => {
    try {
      const metrics = this.queryEngine.getPerformanceMetrics();
      const slowQueryAnalysis = this.queryEngine.getSlowQueryAnalysis();
      
      res.json({
        success: true,
        data: {
          metrics,
          slowQueryAnalysis,
          recommendations: slowQueryAnalysis.recommendations
        },
        message: 'Performance metrics retrieved successfully'
      });
    } catch (error) {
      console.error('Performance metrics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve performance metrics',
        error: error.message
      });
    }
  };
  
  /**
   * Clear report cache
   * DELETE /api/reports/cache
   */
  clearReportCache = async (req, res) => {
    try {
      const { reportType } = req.query;
      
      if (reportType) {
        this.queryEngine.clearReportCache(reportType);
        res.json({
          success: true,
          message: `Cache cleared for report type: ${reportType}`
        });
      } else {
        QueryPerformance.clearAllCache();
        res.json({
          success: true,
          message: 'All cache cleared successfully'
        });
      }
    } catch (error) {
      console.error('Cache clear error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to clear cache',
        error: error.message
      });
    }
  };
  
  /**
   * Generate time period report
   * POST /api/reports/time-period
   */
  generateTimePeriodReport = async (req, res) => {
    try {
      const { periodType, periodParam, reportType, filters = {} } = req.body;
      
      // Validate required fields
      if (!periodType || !reportType) {
        return res.status(400).json({
          success: false,
          message: 'periodType and reportType are required'
        });
      }
      
      const timePeriodReports = new TimePeriodReports();
      
      let result;
      
      if (periodType.toLowerCase() === 'daily') {
        result = await timePeriodReports.generateDailyReport(periodParam, filters, reportType);
      } else if (periodType.toLowerCase() === 'weekly') {
        result = await timePeriodReports.generateWeeklyReport(periodParam, filters, reportType);
      } else if (periodType.toLowerCase() === 'monthly') {
        const [month, year] = periodParam.split('-').map(Number);
        result = await timePeriodReports.generateMonthlyReport(month, year, filters, reportType);
      } else if (periodType.toLowerCase() === 'quarterly') {
        const [quarter, year] = periodParam.split('-').map(Number);
        result = await timePeriodReports.generateQuarterlyReport(quarter, year, filters, reportType);
      } else if (periodType.toLowerCase() === 'annually') {
        result = await timePeriodReports.generateAnnualReport(periodParam, filters, reportType);
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid period type. Use: daily, weekly, monthly, quarterly, annually'
        });
      }
      
      res.json({
        success: true,
        data: result,
        message: `Time period report generated successfully`
      });
      
    } catch (error) {
      console.error('Time period report generation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate time period report',
        error: error.message
      });
    }
  };
  
  /**
   * Generate comparative report
   * POST /api/reports/comparative
   */
  generateComparativeReport = async (req, res) => {
    try {
      const { period1, period1Param, period2, period2Param, reportType } = req.body;
      
      // Validate required fields
      if (!period1 || !period1Param || !period2 || !period2Param || !reportType) {
        return res.status(400).json({
          success: false,
          message: 'period1, period1Param, period2, period2Param, and reportType are required'
        });
      }
      
      const timePeriodReports = new TimePeriodReports();
      
      const result = await timePeriodReports.generateComparativeReport(
        period1, period1Param, period2, period2Param, reportType
      );
      
      res.json({
        success: true,
        data: result,
        message: 'Comparative report generated successfully'
      });
      
    } catch (error) {
      console.error('Comparative report generation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate comparative report',
        error: error.message
      });
    }
  };
  
  /**
   * Generate trend analysis
   * POST /api/reports/trend-analysis
   */
  generateTrendAnalysis = async (req, res) => {
    try {
      const { periodType, count, reportType, filters = {} } = req.body;
      
      // Validate required fields
      if (!periodType || !count || !reportType) {
        return res.status(400).json({
          success: false,
          message: 'periodType, count, and reportType are required'
        });
      }
      
      const timePeriodReports = new TimePeriodReports();
      
      const result = await timePeriodReports.generateTrendAnalysis(
        periodType, count, reportType, filters
      );
      
      res.json({
        success: true,
        data: result,
        message: 'Trend analysis generated successfully'
      });
      
    } catch (error) {
      console.error('Trend analysis generation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate trend analysis',
        error: error.message
      });
    }
  };
  
  /**
   * Generate financial report
   * POST /api/reports/financial
   */
  generateFinancialReport = async (req, res) => {
    try {
      const { reportType, startDate, endDate, filters = {} } = req.body;
      
      // Validate required fields
      if (!reportType || !startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'reportType, startDate, and endDate are required'
        });
      }
      
      const financialReports = new FinancialReports();
      
      let result;
      
      switch (reportType.toLowerCase()) {
        case 'credit-debit':
          result = await financialReports.generateCreditDebitStatement(new Date(startDate), new Date(endDate), filters);
          break;
        case 'gst-summary':
          result = await financialReports.generateGSTSummary(new Date(startDate), new Date(endDate), filters);
          break;
        case 'revenue-analysis':
          result = await financialReports.generateRevenueAnalysis(new Date(startDate), new Date(endDate), filters);
          break;
        case 'profit-loss':
          result = await financialReports.generateProfitLossStatement(new Date(startDate), new Date(endDate), filters);
          break;
        case 'cash-flow':
          result = await financialReports.generateCashFlowStatement(new Date(startDate), new Date(endDate), filters);
          break;
        case 'dashboard':
          result = await financialReports.generateFinancialDashboard(new Date(startDate), new Date(endDate), filters);
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid report type. Use: credit-debit, gst-summary, revenue-analysis, profit-loss, cash-flow, dashboard'
          });
      }
      
      res.json({
        success: true,
        data: result,
        message: `Financial report generated successfully`
      });
      
    } catch (error) {
      console.error('Financial report generation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate financial report',
        error: error.message
      });
    }
  };
  
  /**
   * Export report
   * POST /api/reports/export
   */
  exportReport = async (req, res) => {
    try {
      const { queryConfig, format, templateName, description } = req.body;
      
      // Validate required fields
      if (!queryConfig || !format) {
        return res.status(400).json({
          success: false,
          message: 'queryConfig and format are required'
        });
      }
      
      const exportService = new ExportService();
      
      const exportData = await exportService.exportReport(
        queryConfig,
        format,
        req.user,
        {
          templateName,
          description,
          ip: req.ip
        }
      );
      
      // Set appropriate content type and headers
      let contentType;
      let disposition;
      
      switch (format.toLowerCase()) {
        case 'pdf':
          contentType = 'application/pdf';
          disposition = `attachment; filename="${exportService.generateFileName(templateName || 'report', 'pdf')}"`;
          break;
        case 'xlsx':
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          disposition = `attachment; filename="${exportService.generateFileName(templateName || 'report', 'xlsx')}"`;
          break;
        case 'csv':
          contentType = 'text/csv';
          disposition = `attachment; filename="${exportService.generateFileName(templateName || 'report', 'csv')}"`;
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid format. Use: pdf, xlsx, or csv'
          });
      }
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', disposition);
      
      res.send(exportData);
      
      // Log the export action
      await this.auditService.logExportActivity(
        req.user.us_usid,
        templateName || 'Unknown Report',
        format,
        req.ip
      );
      
    } catch (error) {
      console.error('Report export error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export report',
        error: error.message
      });
    }
  };
  
  /**
   * Export report by ID
   * GET /api/reports/:id/export/:format
   */
  exportReportById = async (req, res) => {
    try {
      const { id } = req.params;
      const { format } = req.query;
      
      // Fetch saved report template
      const ReportTemplate = require('../models/ReportTemplate');
      const template = await ReportTemplate.findOne({ where: { rt_rtid: id } });
      
      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Report template not found'
        });
      }
      
      // Check if user has permission to access this template
      if (template.rt_created_by !== req.user.us_usid && req.user.us_usertype !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this report template'
        });
      }
      
      const exportService = new ExportService();
      
      // Parse the saved config
      const queryConfig = JSON.parse(template.rt_config);
      
      const exportData = await exportService.exportReport(
        queryConfig,
        format,
        req.user,
        {
          templateName: template.rt_name,
          description: template.rt_description,
          ip: req.ip
        }
      );
      
      // Set appropriate content type and headers
      let contentType;
      let disposition;
      
      switch (format.toLowerCase()) {
        case 'pdf':
          contentType = 'application/pdf';
          disposition = `attachment; filename="${exportService.generateFileName(template.rt_name, 'pdf')}"`;
          break;
        case 'xlsx':
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          disposition = `attachment; filename="${exportService.generateFileName(template.rt_name, 'xlsx')}"`;
          break;
        case 'csv':
          contentType = 'text/csv';
          disposition = `attachment; filename="${exportService.generateFileName(template.rt_name, 'csv')}"`;
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid format. Use: pdf, xlsx, or csv'
          });
      }
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', disposition);
      
      res.send(exportData);
      
    } catch (error) {
      console.error('Report export by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export report',
        error: error.message
      });
    }
  };
}

module.exports = new GenericReportController();