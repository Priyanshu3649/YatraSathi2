const validator = require('validator');

/**
 * Report Input Validation Middleware
 * 
 * Validates and sanitizes all incoming report requests to prevent:
 * - SQL injection attacks
 * - Cross-site scripting (XSS)
 * - Malicious query construction
 * - Invalid data types
 * - Unauthorized access patterns
 */

class ReportValidation {
  constructor() {
    // Whitelist of allowed report types
    this.allowedReportTypes = [
      'booking', 'billing', 'payment', 'customer', 'employee', 'ledger',
      'credit-debit', 'gst-summary', 'revenue-analysis', 'profit-loss',
      'cash-flow', 'dashboard', 'time-period', 'comparative', 'trend-analysis'
    ];

    // Whitelist of allowed column names (base table columns)
    this.allowedColumns = new Set([
      // Booking columns
      'bk_bkid', 'bk_bkno', 'bk_usid', 'bk_fromst', 'bk_tost', 'bk_trvldt',
      'bk_class', 'bk_quota', 'bk_berthpref', 'bk_totalpass', 'bk_reqdt',
      'bk_status', 'bk_agent', 'bk_total_amount', 'bk_created_by',
      
      // Billing columns
      'bi_biid', 'bi_customer_id', 'bi_booking_id', 'bi_bill_date',
      'bi_due_date', 'bi_gross_amount', 'bi_tax_amount', 'bi_net_amount',
      'bi_status', 'bi_created_by',
      
      // Payment columns
      'pt_ptid', 'pt_acid', 'pt_bkid', 'pt_amount', 'pt_mode',
      'pt_date', 'pt_status', 'pt_ref', 'pt_created_by',
      
      // Customer columns
      'cu_usid', 'cu_custno', 'cu_custtype', 'cu_company', 'cu_gst',
      'cu_creditlmt', 'cu_status', 'cu_created_by',
      
      // Employee columns
      'em_usid', 'em_dept', 'em_desig', 'em_manager', 'em_status',
      'em_salary', 'em_joindt', 'em_created_by',
      
      // Ledger columns
      'lg_lgid', 'lg_usid', 'lg_entry_type', 'lg_entry_ref',
      'lg_amount', 'lg_opening_bal', 'lg_closing_bal', 'edtm',
      
      // Common audit columns
      'eby', 'mby', 'edtm', 'mdtm',
      
      // Report template columns
      'rt_rtid', 'rt_name', 'rt_type', 'rt_config', 'rt_role_access', 'rt_created_by'
    ]);

    // Whitelist of allowed aggregate functions
    this.allowedAggregates = new Set([
      'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'STDDEV', 'VARIANCE'
    ]);

    // Whitelist of allowed operators
    this.allowedOperators = new Set([
      '=', '!=', '<>', '>', '<', '>=', '<=', 'LIKE', 'NOT LIKE',
      'IN', 'NOT IN', 'BETWEEN', 'NOT BETWEEN', 'IS NULL', 'IS NOT NULL'
    ]);

    // Maximum allowed values
    this.maxLimit = 10000; // Maximum records per query
    this.maxOffset = 50000; // Maximum offset to prevent deep pagination
    this.maxStringLength = 500; // Maximum length for string values
  }

  /**
   * Validate report request body
   */
  validateReportRequest = (req, res, next) => {
    try {
      const { reportType, columns, filters, groupBy, aggregates, orderBy, limit, offset } = req.body;

      // Validate report type
      if (!reportType) {
        return res.status(400).json({
          success: false,
          message: 'Report type is required'
        });
      }

      if (!this.isValidReportType(reportType)) {
        return res.status(400).json({
          success: false,
          message: `Invalid report type: ${reportType}. Allowed types: ${this.allowedReportTypes.join(', ')}`
        });
      }

      // Validate columns
      if (columns && !Array.isArray(columns)) {
        return res.status(400).json({
          success: false,
          message: 'Columns must be an array'
        });
      }

      if (columns && columns.length > 0) {
        for (const column of columns) {
          if (!this.isValidColumn(column)) {
            return res.status(400).json({
              success: false,
              message: `Invalid column name: ${column}`
            });
          }
        }
      }

      // Validate filters
      if (filters && typeof filters !== 'object') {
        return res.status(400).json({
          success: false,
          message: 'Filters must be an object'
        });
      }

      if (filters) {
        const validationResult = this.validateFilters(filters);
        if (!validationResult.valid) {
          return res.status(400).json({
            success: false,
            message: validationResult.message
          });
        }
      }

      // Validate groupBy
      if (groupBy && !Array.isArray(groupBy)) {
        return res.status(400).json({
          success: false,
          message: 'GroupBy must be an array'
        });
      }

      if (groupBy && groupBy.length > 0) {
        for (const group of groupBy) {
          if (!this.isValidColumn(group)) {
            return res.status(400).json({
              success: false,
              message: `Invalid groupBy column: ${group}`
            });
          }
        }
      }

      // Validate aggregates
      if (aggregates && typeof aggregates !== 'object') {
        return res.status(400).json({
          success: false,
          message: 'Aggregates must be an object'
        });
      }

      if (aggregates) {
        const aggregateValidation = this.validateAggregates(aggregates);
        if (!aggregateValidation.valid) {
          return res.status(400).json({
            success: false,
            message: aggregateValidation.message
          });
        }
      }

      // Validate orderBy
      if (orderBy && !Array.isArray(orderBy)) {
        return res.status(400).json({
          success: false,
          message: 'OrderBy must be an array'
        });
      }

      if (orderBy && orderBy.length > 0) {
        for (const order of orderBy) {
          if (typeof order !== 'string') {
            return res.status(400).json({
              success: false,
              message: 'OrderBy items must be strings in format "column ASC/DESC"'
            });
          }

          const parts = order.trim().split(/\s+/);
          if (parts.length > 2) {
            return res.status(400).json({
              success: false,
              message: 'Invalid orderBy format. Use "column [ASC|DESC]"'
            });
          }

          const column = parts[0];
          if (!this.isValidColumn(column)) {
            return res.status(400).json({
              success: false,
              message: `Invalid orderBy column: ${column}`
            });
          }

          if (parts.length === 2) {
            const direction = parts[1].toUpperCase();
            if (!['ASC', 'DESC'].includes(direction)) {
              return res.status(400).json({
                success: false,
                message: 'Order direction must be ASC or DESC'
              });
            }
          }
        }
      }

      // Validate limit
      if (limit !== undefined) {
        if (typeof limit !== 'number' || limit <= 0 || limit > this.maxLimit) {
          return res.status(400).json({
            success: false,
            message: `Limit must be a number between 1 and ${this.maxLimit}`
          });
        }
      }

      // Validate offset
      if (offset !== undefined) {
        if (typeof offset !== 'number' || offset < 0 || offset > this.maxOffset) {
          return res.status(400).json({
            success: false,
            message: `Offset must be a number between 0 and ${this.maxOffset}`
          });
        }
      }

      // Sanitize the request body
      req.body = this.sanitizeRequestBody(req.body);

      next();
    } catch (error) {
      console.error('Report validation error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal validation error'
      });
    }
  };

  /**
   * Validate time period report request
   */
  validateTimePeriodReportRequest = (req, res, next) => {
    try {
      const { periodType, periodParam, reportType, filters = {} } = req.body;

      // Validate required fields
      if (!periodType || !reportType) {
        return res.status(400).json({
          success: false,
          message: 'periodType and reportType are required'
        });
      }

      // Validate period type
      const allowedPeriodTypes = ['daily', 'weekly', 'monthly', 'quarterly', 'annually'];
      if (!allowedPeriodTypes.includes(periodType.toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: `Invalid period type. Use: ${allowedPeriodTypes.join(', ')}`
        });
      }

      // Validate report type
      if (!this.isValidReportType(reportType)) {
        return res.status(400).json({
          success: false,
          message: `Invalid report type: ${reportType}`
        });
      }

      // Validate period parameter based on type
      const paramValidation = this.validatePeriodParameter(periodType, periodParam);
      if (!paramValidation.valid) {
        return res.status(400).json({
          success: false,
          message: paramValidation.message
        });
      }

      // Validate filters
      const validationResult = this.validateFilters(filters);
      if (!validationResult.valid) {
        return res.status(400).json({
          success: false,
          message: validationResult.message
        });
      }

      // Sanitize the request body
      req.body = this.sanitizeRequestBody(req.body);

      next();
    } catch (error) {
      console.error('Time period report validation error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal validation error'
      });
    }
  };

  /**
   * Validate financial report request
   */
  validateFinancialReportRequest = (req, res, next) => {
    try {
      const { reportType, startDate, endDate, filters = {} } = req.body;

      // Validate required fields
      if (!reportType || !startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'reportType, startDate, and endDate are required'
        });
      }

      // Validate report type
      const allowedFinancialTypes = ['credit-debit', 'gst-summary', 'revenue-analysis', 'profit-loss', 'cash-flow', 'dashboard'];
      if (!allowedFinancialTypes.includes(reportType.toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: `Invalid financial report type. Use: ${allowedFinancialTypes.join(', ')}`
        });
      }

      // Validate dates
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Use ISO 8601 format (YYYY-MM-DD)'
        });
      }

      if (start > end) {
        return res.status(400).json({
          success: false,
          message: 'Start date must be before end date'
        });
      }

      // Check date range (max 2 years for financial reports)
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 730) { // More than 2 years
        return res.status(400).json({
          success: false,
          message: 'Financial report date range cannot exceed 2 years'
        });
      }

      // Validate filters
      const validationResult = this.validateFilters(filters);
      if (!validationResult.valid) {
        return res.status(400).json({
          success: false,
          message: validationResult.message
        });
      }

      // Sanitize the request body
      req.body = this.sanitizeRequestBody(req.body);

      next();
    } catch (error) {
      console.error('Financial report validation error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal validation error'
      });
    }
  };

  /**
   * Validate export request
   */
  validateExportRequest = (req, res, next) => {
    try {
      const { queryConfig, format, templateName, description } = req.body;

      // Validate required fields
      if (!queryConfig) {
        return res.status(400).json({
          success: false,
          message: 'queryConfig is required'
        });
      }

      if (!format) {
        return res.status(400).json({
          success: false,
          message: 'format is required (pdf, xlsx, csv)'
        });
      }

      // Validate format
      const allowedFormats = ['pdf', 'xlsx', 'csv'];
      if (!allowedFormats.includes(format.toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: `Invalid format. Use: ${allowedFormats.join(', ')}`
        });
      }

      // Validate query config using standard validation
      const tempReq = { body: queryConfig };
      const validationError = this.validateReportConfig(tempReq.body);
      if (validationError) {
        return res.status(400).json({
          success: false,
          message: validationError
        });
      }

      // Validate optional fields
      if (templateName && typeof templateName !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'templateName must be a string'
        });
      }

      if (description && typeof description !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'description must be a string'
        });
      }

      // Sanitize the request body
      req.body = this.sanitizeRequestBody(req.body);

      next();
    } catch (error) {
      console.error('Export request validation error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal validation error'
      });
    }
  };

  /**
   * Validate report configuration
   */
  validateReportConfig(config) {
    // Validate report type
    if (!config.reportType || !this.isValidReportType(config.reportType)) {
      return `Invalid report type: ${config.reportType}`;
    }

    // Validate columns
    if (config.columns && !Array.isArray(config.columns)) {
      return 'Columns must be an array';
    }

    if (config.columns && config.columns.length > 0) {
      for (const column of config.columns) {
        if (!this.isValidColumn(column)) {
          return `Invalid column name: ${column}`;
        }
      }
    }

    // Validate filters
    if (config.filters && typeof config.filters !== 'object') {
      return 'Filters must be an object';
    }

    if (config.filters) {
      const filterValidation = this.validateFilters(config.filters);
      if (!filterValidation.valid) {
        return filterValidation.message;
      }
    }

    // Validate other fields...
    if (config.groupBy && !Array.isArray(config.groupBy)) {
      return 'GroupBy must be an array';
    }

    if (config.aggregates && typeof config.aggregates !== 'object') {
      return 'Aggregates must be an object';
    }

    if (config.orderBy && !Array.isArray(config.orderBy)) {
      return 'OrderBy must be an array';
    }

    if (config.limit !== undefined && (typeof config.limit !== 'number' || config.limit <= 0 || config.limit > this.maxLimit)) {
      return `Limit must be a number between 1 and ${this.maxLimit}`;
    }

    if (config.offset !== undefined && (typeof config.offset !== 'number' || config.offset < 0 || config.offset > this.maxOffset)) {
      return `Offset must be a number between 0 and ${this.maxOffset}`;
    }

    return null; // Valid
  }

  /**
   * Validate if report type is allowed
   */
  isValidReportType(type) {
    return this.allowedReportTypes.includes(type.toLowerCase());
  }

  /**
   * Validate if column name is allowed
   */
  isValidColumn(column) {
    // Allow aggregate functions in column names (e.g., "SUM(amount)")
    if (column.includes('(') && column.includes(')')) {
      const parts = column.match(/([A-Z]+)\((.+)\)/);
      if (parts) {
        const func = parts[1];
        const col = parts[2];
        return this.allowedAggregates.has(func) && this.allowedColumns.has(col);
      }
    }
    
    // Check for basic column name
    return this.allowedColumns.has(column);
  }

  /**
   * Validate filters object
   */
  validateFilters(filters) {
    for (const [key, value] of Object.entries(filters)) {
      // Check if the key is a valid column name or date range parameter
      if (!this.isValidFilterKey(key)) {
        return {
          valid: false,
          message: `Invalid filter key: ${key}`
        };
      }

      // Validate value based on type
      const validation = this.validateFilterValue(value);
      if (!validation.valid) {
        return validation;
      }
    }

    return { valid: true };
  }

  /**
   * Validate if filter key is allowed
   */
  isValidFilterKey(key) {
    // Allow date range filters (e.g., dateFrom, dateTo)
    if (key.endsWith('From') || key.endsWith('To')) {
      const baseColumn = key.replace(/(From|To)$/, '');
      return this.allowedColumns.has(baseColumn);
    }

    // Allow array filters (e.g., column_in)
    if (key.includes('_in')) {
      const baseColumn = key.replace('_in', '');
      return this.allowedColumns.has(baseColumn);
    }

    // Allow range filters (e.g., amount_between)
    if (key.includes('_between')) {
      const baseColumn = key.replace('_between', '');
      return this.allowedColumns.has(baseColumn);
    }

    // Regular column name
    return this.allowedColumns.has(key);
  }

  /**
   * Validate filter value
   */
  validateFilterValue(value) {
    if (value === null || value === undefined) {
      return { valid: true };
    }

    if (Array.isArray(value)) {
      if (value.length > 1000) { // Prevent huge arrays
        return {
          valid: false,
          message: 'Filter array too large (max 1000 items)'
        };
      }

      for (const item of value) {
        const itemValidation = this.validateSingleValue(item);
        if (!itemValidation.valid) {
          return itemValidation;
        }
      }
    } else if (typeof value === 'object') {
      // Handle range objects like { min: 100, max: 200 }
      for (const [rangeKey, rangeValue] of Object.entries(value)) {
        if (!['min', 'max', 'gte', 'lte', 'gt', 'lt'].includes(rangeKey)) {
          return {
            valid: false,
            message: `Invalid range key: ${rangeKey}`
          };
        }

        const rangeValidation = this.validateSingleValue(rangeValue);
        if (!rangeValidation.valid) {
          return rangeValidation;
        }
      }
    } else {
      return this.validateSingleValue(value);
    }

    return { valid: true };
  }

  /**
   * Validate a single value
   */
  validateSingleValue(value) {
    if (typeof value === 'string') {
      // Check for potential SQL injection
      if (this.containsSqlInjection(value)) {
        return {
          valid: false,
          message: 'Potential SQL injection detected in filter value'
        };
      }

      // Check for potential XSS
      if (this.containsXss(value)) {
        return {
          valid: false,
          message: 'Potential XSS detected in filter value'
        };
      }

      // Check length
      if (value.length > this.maxStringLength) {
        return {
          valid: false,
          message: `String value too long (max ${this.maxStringLength} characters)`
        };
      }
    } else if (typeof value === 'number') {
      if (!isFinite(value)) {
        return {
          valid: false,
          message: 'Invalid number value'
        };
      }
    } else if (typeof value === 'boolean') {
      // Booleans are fine
    } else if (value instanceof Date) {
      // Dates are fine
    } else {
      return {
        valid: false,
        message: `Invalid value type: ${typeof value}`
      };
    }

    return { valid: true };
  }

  /**
   * Validate aggregates object
   */
  validateAggregates(aggregates) {
    for (const [key, func] of Object.entries(aggregates)) {
      if (!this.allowedColumns.has(key)) {
        return {
          valid: false,
          message: `Invalid aggregate column: ${key}`
        };
      }

      if (!this.allowedAggregates.has(func.toUpperCase())) {
        return {
          valid: false,
          message: `Invalid aggregate function: ${func}. Allowed: ${Array.from(this.allowedAggregates).join(', ')}`
        };
      }
    }

    return { valid: true };
  }

  /**
   * Validate period parameter
   */
  validatePeriodParameter(periodType, periodParam) {
    if (!periodParam) {
      return {
        valid: false,
        message: 'Period parameter is required'
      };
    }

    switch (periodType.toLowerCase()) {
      case 'daily':
        const date = new Date(periodParam);
        if (isNaN(date.getTime())) {
          return {
            valid: false,
            message: 'Invalid date format for daily report'
          };
        }
        return { valid: true };

      case 'weekly':
        const weekDate = new Date(periodParam);
        if (isNaN(weekDate.getTime())) {
          return {
            valid: false,
            message: 'Invalid date format for weekly report'
          };
        }
        return { valid: true };

      case 'monthly':
        if (typeof periodParam === 'string') {
          const parts = periodParam.split('-');
          if (parts.length !== 2) {
            return {
              valid: false,
              message: 'Monthly period must be in format MM-YYYY'
            };
          }
          const month = parseInt(parts[0]);
          const year = parseInt(parts[1]);
          if (isNaN(month) || isNaN(year) || month < 1 || month > 12 || year < 1900 || year > 2100) {
            return {
              valid: false,
              message: 'Invalid month-year format for monthly report'
            };
          }
        } else {
          return {
            valid: false,
            message: 'Monthly period must be a string in format MM-YYYY'
          };
        }
        return { valid: true };

      case 'quarterly':
        if (typeof periodParam === 'string') {
          const parts = periodParam.split('-');
          if (parts.length !== 2) {
            return {
              valid: false,
              message: 'Quarterly period must be in format Q-YEAR (e.g., 1-2023)'
            };
          }
          const quarter = parseInt(parts[0]);
          const year = parseInt(parts[1]);
          if (isNaN(quarter) || isNaN(year) || quarter < 1 || quarter > 4 || year < 1900 || year > 2100) {
            return {
              valid: false,
              message: 'Invalid quarter-year format for quarterly report'
            };
          }
        } else {
          return {
            valid: false,
            message: 'Quarterly period must be a string in format Q-YEAR'
          };
        }
        return { valid: true };

      case 'annually':
        const year = parseInt(periodParam);
        if (isNaN(year) || year < 1900 || year > 2100) {
          return {
            valid: false,
            message: 'Invalid year for annual report'
          };
        }
        return { valid: true };

      default:
        return {
          valid: false,
          message: 'Invalid period type'
        };
    }
  }

  /**
   * Check if string contains potential SQL injection
   */
  containsSqlInjection(str) {
    if (typeof str !== 'string') return false;

    const sqlInjectionPatterns = [
      /(\b(ALTER|CREATE|DELETE|DROP|EXEC(UTE)?|INSERT|MERGE|SELECT|UPDATE|UNION( ALL)?)\b)/gi,
      /(;|\-\-|\#|\/\*|\*\/)/g,
      /('|")\s*(OR|AND)\s*('|").*('|")\s*=\s*('|")/gi,
      /exec\s*\(/gi,
      /sp_executesql/gi,
      /xp_cmdshell/gi
    ];

    return sqlInjectionPatterns.some(pattern => pattern.test(str));
  }

  /**
   * Check if string contains potential XSS
   */
  containsXss(str) {
    if (typeof str !== 'string') return false;

    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /vbscript:/gi,
      /data:/gi,
      /expression\(/gi,
      /eval\(/gi
    ];

    return xssPatterns.some(pattern => pattern.test(str));
  }

  /**
   * Sanitize request body
   */
  sanitizeRequestBody(body) {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sanitized = {};

    for (const [key, value] of Object.entries(body)) {
      sanitized[key] = this.sanitizeValue(value);
    }

    return sanitized;
  }

  /**
   * Sanitize a single value
   */
  sanitizeValue(value) {
    if (Array.isArray(value)) {
      return value.map(item => this.sanitizeValue(item));
    }

    if (value && typeof value === 'object' && !(value instanceof Date)) {
      const sanitized = {};
      for (const [key, val] of Object.entries(value)) {
        sanitized[key] = this.sanitizeValue(val);
      }
      return sanitized;
    }

    if (typeof value === 'string') {
      // Remove potential malicious content while preserving legitimate characters
      return validator.escape(value);
    }

    return value;
  }

  /**
   * Middleware to validate template save requests
   */
  validateTemplateSave = (req, res, next) => {
    try {
      const { name, description, config, isPublic } = req.body;

      // Validate required fields
      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'Template name is required'
        });
      }

      // Validate name
      if (typeof name !== 'string' || name.length < 1 || name.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Template name must be 1-100 characters'
        });
      }

      // Validate description
      if (description && typeof description !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Description must be a string'
        });
      }

      if (description && description.length > 500) {
        return res.status(400).json({
          success: false,
          message: 'Description must be less than 500 characters'
        });
      }

      // Validate config
      if (!config) {
        return res.status(400).json({
          success: false,
          message: 'Report configuration is required'
        });
      }

      // Validate config using standard validation
      const configValidationError = this.validateReportConfig(config);
      if (configValidationError) {
        return res.status(400).json({
          success: false,
          message: `Invalid report configuration: ${configValidationError}`
        });
      }

      // Validate isPublic
      if (isPublic !== undefined && typeof isPublic !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'isPublic must be a boolean'
        });
      }

      // Sanitize the request body
      req.body = this.sanitizeRequestBody(req.body);

      next();
    } catch (error) {
      console.error('Template save validation error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal validation error'
      });
    }
  };
}

module.exports = new ReportValidation();