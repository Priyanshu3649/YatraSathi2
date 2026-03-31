const { Op } = require('sequelize');

/**
 * Query Helper for Filtering, Sorting, and Pagination
 */
class QueryHelper {
  /**
   * Build Sequelize where clause based on query parameters
   * @param {Object} query - Express request query
   * @param {Object} filterMap - Mapping of query keys to DB columns
   * @returns {Object} Sequelize where clause
   */
  buildWhereClause(query, filterMap = {}) {
    const where = {};

    // 1. Date Range Filtering
    if (query.startDate && query.endDate && filterMap.dateColumn) {
      where[filterMap.dateColumn] = {
        [Op.between]: [new Date(query.startDate), new Date(query.endDate)]
      };
    } else if (query.startDate && filterMap.dateColumn) {
      where[filterMap.dateColumn] = { [Op.gte]: new Date(query.startDate) };
    } else if (query.endDate && filterMap.dateColumn) {
      where[filterMap.dateColumn] = { [Op.lte]: new Date(query.endDate) };
    }

    // 2. Amount Range Filtering
    if (query.minAmount && query.maxAmount && filterMap.amountColumn) {
      where[filterMap.amountColumn] = {
        [Op.between]: [parseFloat(query.minAmount), parseFloat(query.maxAmount)]
      };
    } else if (query.minAmount && filterMap.amountColumn) {
      where[filterMap.amountColumn] = { [Op.gte]: parseFloat(query.minAmount) };
    } else if (query.maxAmount && filterMap.amountColumn) {
      where[filterMap.amountColumn] = { [Op.lte]: parseFloat(query.maxAmount) };
    }

    // 3. Status Filtering
    if (query.status && filterMap.statusColumn) {
      where[filterMap.statusColumn] = query.status;
    }

    // 4. Search (Customer Name, Phone, Entry No)
    if (query.search && filterMap.searchColumns && filterMap.searchColumns.length > 0) {
      where[Op.or] = filterMap.searchColumns.map(col => ({
        [col]: { [Op.like]: `%${query.search}%` }
      }));
    }

    // 5. Additional custom filters from filterMap.customFilters
    const processedKeys = ['page', 'limit', 'sortBy', 'sortOrder', 'search', 'startDate', 'endDate', 'minAmount', 'maxAmount'];
    
    if (filterMap.customFilters) {
      Object.keys(filterMap.customFilters).forEach(key => {
        if (query[key] !== undefined && query[key] !== '') {
          where[filterMap.customFilters[key]] = query[key];
          processedKeys.push(key);
        }
      });
    }

    // 6. Dynamic processing of all remaining query parameters
    Object.keys(query).forEach(key => {
      // Ignore reserved keys and empty values
      if (!processedKeys.includes(key) && query[key] !== undefined && query[key] !== '') {
        const val = query[key];
        
        // Avoid mapping complex nested objects or arrays to prevent injection
        if (typeof val === 'string') {
          // If the value is strictly numeric or a boolean string, use exact match
          if (!isNaN(val) || val.toLowerCase() === 'true' || val.toLowerCase() === 'false' || val.includes('-')) {
            where[key] = val;
          } else {
            // For general strings, use LIKE for fuzzy matching (like frontend used to do)
            where[key] = { [Op.like]: `%${val}%` };
          }
        } else {
          where[key] = val;
        }
      }
    });

    return where;
  }

  /**
   * Get Pagination Options
   * @param {Object} query - Express request query
   * @returns {Object} limit and offset
   */
  getPaginationOptions(query) {
    const maxLimit = 100;
    const page = parseInt(query.page) || 1;
    const limit = Math.min(parseInt(query.limit) || 50, maxLimit);
    const offset = (page - 1) * limit;
    return { limit, offset, page };
  }

  /**
   * Get Sorting Options
   * @param {Object} query - Express request query
   * @param {String} defaultSortBy - Default column to sort by
   * @param {String} defaultSortOrder - Default order (ASC/DESC)
   * @returns {Array} Sequelize order array
   */
  getSortingOptions(query, defaultSortBy = 'edtm', defaultSortOrder = 'DESC') {
    const sortBy = query.sortBy || defaultSortBy;
    const sortOrder = (query.sortOrder || defaultSortOrder).toUpperCase();
    return [[sortBy, sortOrder]];
  }

  /**
   * Format Paginated Response
   * @param {Number} count - Total records count
   * @param {Array} rows - Records for current page
   * @param {Number} page - Current page
   * @param {Number} limit - Page size
   * @returns {Object} Formatted response
   */
  formatPaginatedResponse(count, rows, page, limit) {
    const totalPages = Math.ceil(count / limit);
    return {
      success: true,
      data: rows,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalRecords: count,
        pageSize: limit,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }

  /**
   * Export data to CSV string
   * @param {Array} data - Array of objects to export
   * @param {Array} columns - Array of { label, key } objects
   * @returns {String} CSV string
   */
  convertToCSV(data, columns) {
    if (!data || data.length === 0) return '';

    const header = columns.map(col => col.label).join(',');
    const rows = data.map(item => {
      return columns.map(col => {
        let val = item[col.key];
        if (val === null || val === undefined) val = '';
        if (typeof val === 'string' && val.includes(',')) {
          val = `"${val}"`;
        }
        return val;
      }).join(',');
    });

    return [header, ...rows].join('\n');
  }
  /**
   * Get Aggregation Results
   * @param {Model} model - Sequelize Model
   * @param {Object} where - Sequelize where clause
   * @param {Array} groupColumns - Columns to group by
   * @param {Array} sumColumns - Columns to sum
   * @param {Array} include - Sequelize model associations
   * @returns {Object} Aggregation results
   */
  async getAggregation(model, where, groupColumns = [], sumColumns = [], include = []) {
    const attributes = [...groupColumns];
    
    sumColumns.forEach(col => {
      attributes.push([require('sequelize').fn('SUM', require('sequelize').col(col)), `total_${col}`]);
    });
    
    attributes.push([require('sequelize').fn('COUNT', require('sequelize').col('*')), 'count']);

    return await model.findAll({
      attributes,
      where,
      include,
      group: groupColumns.length > 0 ? groupColumns : undefined,
      raw: true
    });
  }
}

module.exports = new QueryHelper();
