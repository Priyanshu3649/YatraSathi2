const { sequelize } = require('../models/baseModel');
const { Op } = require('sequelize');
const QueryPerformance = require('./queryPerformance');

/**
 * Report Query Engine - Core service for dynamic report generation
 * Provides parameterized query execution with role-based filtering
 */
class ReportQueryEngine {
  constructor() {
    this.reportTypes = {
      BOOKING: 'booking',
      BILLING: 'billing',
      PAYMENT: 'payment',
      CUSTOMER: 'customer',
      EMPLOYEE: 'employee',
      CUSTOM: 'custom'
    };
    
    // Define base tables and their relationships
    this.tableDefinitions = {
      booking: {
        table: 'bkXbooking',
        alias: 'bkBooking',
        primaryKey: 'bk_bkid',
        joins: [
          {
            table: 'cuCustomer',
            alias: 'customer',
            type: 'LEFT',
            on: 'bkBooking.bk_usid = customer.cu_usid'
          },
          {
            table: 'usXuser',
            alias: 'user',
            type: 'LEFT',
            on: 'bkBooking.bk_usid = user.us_usid'
          },
          {
            table: 'emEmployee',
            alias: 'employee',
            type: 'LEFT',
            on: 'bkBooking.bk_agent = employee.em_usid'
          }
        ]
      },
      billing: {
        table: 'biXbill',
        alias: 'bill',
        primaryKey: 'bi_biid',
        joins: [
          {
            table: 'bkXbooking',
            alias: 'booking',
            type: 'LEFT',
            on: 'bill.bi_booking_id = booking.bk_bkid'
          }
        ]
      },
      payment: {
        table: 'ptXpayment',
        alias: 'payment',
        primaryKey: 'pt_ptid',
        joins: [
          {
            table: 'acAccount',
            alias: 'account',
            type: 'LEFT',
            on: 'payment.pt_acid = account.ac_acid'
          }
        ]
      },
      customer: {
        table: 'cuCustomer',
        alias: 'customer',
        primaryKey: 'cu_usid',
        joins: [
          {
            table: 'usXuser',
            alias: 'user',
            type: 'LEFT',
            on: 'customer.cu_usid = user.us_usid'
          }
        ]
      },
      employee: {
        table: 'emEmployee',
        alias: 'employee',
        primaryKey: 'em_usid',
        joins: [
          {
            table: 'usXuser',
            alias: 'user',
            type: 'LEFT',
            on: 'employee.em_usid = user.us_usid'
          }
        ]
      }
    };
  }

  /**
   * Execute a report query with proper parameterization and role-based filtering
   * @param {Object} queryConfig - Configuration for the query
   * @param {Object} userContext - User context with role and permissions
   * @returns {Object} Query results with data, metadata, and aggregates
   */
  async executeQuery(queryConfig, userContext) {
    try {
      const { reportType, columns, filters = {}, groupBy = [], aggregates = {}, limit = 1000, offset = 0 } = queryConfig;
      
      // Validate report type
      if (!this.tableDefinitions[reportType]) {
        throw new Error(`Unsupported report type: ${reportType}`);
      }
      
      // Generate cache key for this query
      const cacheKey = QueryPerformance.generateCacheKey(reportType, filters, columns, groupBy);
      
      // Try to get cached result first
      const cachedResult = await QueryPerformance.getCachedOrExecute(
        cacheKey,
        async () => {
          // Build the query
          const query = this.buildQuery(queryConfig, userContext);
          
          // Execute the query with optimized options
          const optimizedOptions = QueryPerformance.getOptimizedQueryOptions({
            replacements: query.params,
            type: sequelize.QueryTypes.SELECT
          });
          
          const [results, metadata] = await sequelize.query(query.sql, optimizedOptions);
          
          // Calculate aggregates if requested
          let aggregateResults = {};
          if (Object.keys(aggregates).length > 0) {
            aggregateResults = await this.calculateAggregates(queryConfig, userContext);
          }
          
          return {
            data: results,
            metadata: {
              totalCount: results.length,
              limit,
              offset,
              reportType
            },
            aggregates: aggregateResults
          };
        },
        600 // 10-minute TTL
      );
      
      return cachedResult;
      
    } catch (error) {
      console.error('Report query execution error:', error);
      throw new Error(`Failed to execute report query: ${error.message}`);
    }
  }

  /**
   * Build dynamic SQL query with proper parameterization
   * @param {Object} queryConfig - Query configuration
   * @param {Object} userContext - User context for role-based filtering
   * @returns {Object} SQL query and parameters
   */
  buildQuery(queryConfig, userContext) {
    const { reportType, columns, filters = {}, groupBy = [], orderBy = [], limit = 1000, offset = 0 } = queryConfig;
    const tableDef = this.tableDefinitions[reportType];
    
    if (!tableDef) {
      throw new Error(`Table definition not found for report type: ${reportType}`);
    }
    
    const params = [];
    let selectClause = '';
    let fromClause = '';
    let joinClause = '';
    let whereClause = '';
    let groupByClause = '';
    let orderByClause = '';
    let limitClause = '';

    // Build SELECT clause
    if (columns && columns.length > 0) {
      selectClause = columns.map(col => {
        // Handle aggregate functions
        if (col.includes('(') && col.includes(')')) {
          return col;
        }
        return `${tableDef.alias}.${col}`;
      }).join(', ');
    } else {
      // Select all columns from main table
      selectClause = `${tableDef.alias}.*`;
    }

    // Build FROM clause
    fromClause = `FROM ${tableDef.table} AS ${tableDef.alias}`;

    // Build JOIN clauses
    if (tableDef.joins && tableDef.joins.length > 0) {
      joinClause = tableDef.joins.map(join => {
        return `${join.type} JOIN ${join.table} AS ${join.alias} ON ${join.on}`;
      }).join(' ');
    }

    // Build WHERE clause with role-based filtering
    const whereConditions = this.buildWhereConditions(filters, userContext, tableDef, params);
    if (whereConditions.length > 0) {
      whereClause = `WHERE ${whereConditions.join(' AND ')}`;
    }

    // Build GROUP BY clause
    if (groupBy && groupBy.length > 0) {
      groupByClause = `GROUP BY ${groupBy.map(col => `${tableDef.alias}.${col}`).join(', ')}`;
    }

    // Build ORDER BY clause
    if (orderBy && orderBy.length > 0) {
      orderByClause = `ORDER BY ${orderBy.map(order => {
        const [column, direction] = order.split(' ');
        return `${tableDef.alias}.${column} ${direction || 'ASC'}`;
      }).join(', ')}`;
    }

    // Build LIMIT clause
    limitClause = `LIMIT ${limit} OFFSET ${offset}`;

    // Construct final query
    const sql = `
      SELECT ${selectClause}
      ${fromClause}
      ${joinClause}
      ${whereClause}
      ${groupByClause}
      ${orderByClause}
      ${limitClause}
    `.replace(/\s+/g, ' ').trim();

    return { sql, params };
  }

  /**
   * Build WHERE conditions with parameterization and role-based filtering
   * @param {Object} filters - Filter criteria
   * @param {Object} userContext - User context
   * @param {Object} tableDef - Table definition
   * @param {Array} params - Parameter array
   * @returns {Array} WHERE condition strings
   */
  buildWhereConditions(filters, userContext, tableDef, params) {
    const conditions = [];
    
    // Add role-based filtering
    const roleFilter = this.getRoleBasedFilter(userContext, tableDef);
    if (roleFilter) {
      conditions.push(roleFilter);
    }
    
    // Add user-provided filters
    Object.keys(filters).forEach(key => {
      const value = filters[key];
      if (value !== null && value !== undefined && value !== '') {
        // Handle date ranges
        if (key.endsWith('From') || key.endsWith('To')) {
          const fieldName = key.replace(/(From|To)$/, '');
          const operator = key.endsWith('From') ? '>=' : '<=';
          conditions.push(`${tableDef.alias}.${fieldName} ${operator} ?`);
          params.push(value);
        }
        // Handle exact matches
        else if (typeof value === 'string' && value.includes('%')) {
          conditions.push(`${tableDef.alias}.${key} LIKE ?`);
          params.push(value);
        }
        // Handle array values (IN clause)
        else if (Array.isArray(value)) {
          if (value.length > 0) {
            const placeholders = value.map(() => '?').join(', ');
            conditions.push(`${tableDef.alias}.${key} IN (${placeholders})`);
            params.push(...value);
          }
        }
        // Handle exact values
        else {
          conditions.push(`${tableDef.alias}.${key} = ?`);
          params.push(value);
        }
      }
    });
    
    return conditions;
  }

  /**
   * Get role-based filter condition
   * @param {Object} userContext - User context
   * @param {Object} tableDef - Table definition
   * @returns {string|null} Filter condition or null
   */
  getRoleBasedFilter(userContext, tableDef) {
    const { us_usertype, us_roid, us_usid } = userContext;
    
    // Admin and manager have full access
    if (us_usertype === 'admin' || ['ADM', 'MGT'].includes(us_roid)) {
      return null;
    }
    
    // Employees can only see their own data or data they're assigned to
    if (us_usertype === 'employee' || ['AGT', 'ACC', 'HR', 'CC', 'MKT'].includes(us_roid)) {
      switch (tableDef.alias) {
        case 'bkBooking':
          return `(bkBooking.bk_agent = ? OR bkBooking.bk_usid = ?)`;
        case 'bill':
          return `bill.bi_created_by = ?`;
        case 'payment':
          return `payment.pt_created_by = ?`;
        default:
          return null;
      }
    }
    
    // Customers can only see their own data
    if (us_usertype === 'customer' || us_roid === 'CUS') {
      switch (tableDef.alias) {
        case 'bkBooking':
          return `bkBooking.bk_usid = ?`;
        case 'bill':
          return `bill.bi_customer_id = ?`;
        case 'payment':
          return `payment.pt_customer_id = ?`;
        case 'customer':
          return `customer.cu_usid = ?`;
        default:
          return null;
      }
    }
    
    return null;
  }

  /**
   * Calculate aggregate values for the report
   * @param {Object} queryConfig - Query configuration
   * @param {Object} userContext - User context
   * @returns {Object} Aggregate results
   */
  async calculateAggregates(queryConfig, userContext) {
    const { reportType, aggregates, filters = {} } = queryConfig;
    const tableDef = this.tableDefinitions[reportType];
    
    if (!aggregates || Object.keys(aggregates).length === 0) {
      return {};
    }
    
    const aggregateFields = Object.keys(aggregates);
    const aggregateFunctions = aggregateFields.map(field => {
      const func = aggregates[field].toUpperCase();
      return `${func}(${tableDef.alias}.${field}) as ${field}_${func.toLowerCase()}`;
    }).join(', ');
    
    const params = [];
    const whereConditions = this.buildWhereConditions(filters, userContext, tableDef, params);
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    const sql = `
      SELECT ${aggregateFunctions}
      FROM ${tableDef.table} AS ${tableDef.alias}
      ${whereClause}
    `.replace(/\s+/g, ' ').trim();
    
    const [results] = await sequelize.query(sql, {
      replacements: params,
      type: sequelize.QueryTypes.SELECT
    });
    
    return results[0] || {};
  }

  /**
   * Clear cache for specific report type
   * @param {string} reportType - Report type to clear cache for
   */
  clearReportCache(reportType) {
    QueryPerformance.clearReportCache(reportType);
  }
  
  /**
   * Get performance metrics
   * @returns {Object} Performance metrics
   */
  getPerformanceMetrics() {
    return QueryPerformance.getMetrics();
  }
  
  /**
   * Get slow query analysis
   * @returns {Object} Slow query analysis
   */
  getSlowQueryAnalysis() {
    return QueryPerformance.getSlowQueryAnalysis();
  }
  
  /**
   * Get available columns for a report type
   * @param {string} reportType - Report type
   * @returns {Array} Available columns
   */
  getAvailableColumns(reportType) {
    const tableDef = this.tableDefinitions[reportType];
    if (!tableDef) {
      return [];
    }
    
    // This would typically query the database schema
    // For now, returning common columns for each table type
    const columnMaps = {
      booking: [
        'bk_bkid', 'bk_bkno', 'bk_usid', 'bk_fromst', 'bk_tost', 'bk_trvldt',
        'bk_class', 'bk_quota', 'bk_totalpass', 'bk_reqdt', 'bk_status',
        'bk_agent', 'bk_total_amount'
      ],
      billing: [
        'bi_biid', 'bi_customer_id', 'bi_booking_id', 'bi_bill_date',
        'bi_due_date', 'bi_gross_amount', 'bi_tax_amount', 'bi_net_amount',
        'bi_status'
      ],
      payment: [
        'pt_ptid', 'pt_acid', 'pt_bkid', 'pt_amount', 'pt_mode',
        'pt_date', 'pt_status', 'pt_ref'
      ],
      customer: [
        'cu_usid', 'cu_custno', 'cu_custtype', 'cu_company', 'cu_gst',
        'cu_creditlmt', 'cu_status'
      ],
      employee: [
        'em_usid', 'em_dept', 'em_desig', 'em_manager', 'em_status'
      ]
    };
    
    return columnMaps[reportType] || [];
  }

  /**
   * Validate report configuration
   * @param {Object} queryConfig - Query configuration to validate
   * @throws {Error} If validation fails
   */
  validateQueryConfig(queryConfig) {
    const { reportType, columns = [], filters = {} } = queryConfig;
    
    // Validate report type
    if (!this.reportTypes[reportType.toUpperCase()]) {
      throw new Error(`Invalid report type: ${reportType}`);
    }
    
    // Validate columns against available columns
    const availableColumns = this.getAvailableColumns(reportType);
    const invalidColumns = columns.filter(col => 
      !availableColumns.includes(col.replace(/.*\((.*)\).*/, '$1'))
    );
    
    if (invalidColumns.length > 0) {
      throw new Error(`Invalid columns: ${invalidColumns.join(', ')}`);
    }
    
    // Validate filters
    Object.keys(filters).forEach(key => {
      const value = filters[key];
      if (value !== null && value !== undefined) {
        // Add more specific validation as needed
        if (typeof value === 'string' && value.length > 255) {
          throw new Error(`Filter value too long for ${key}`);
        }
      }
    });
  }
}

module.exports = ReportQueryEngine;