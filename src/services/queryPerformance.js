const NodeCache = require('node-cache');
const { sequelize } = require('../../config/db');

/**
 * Query Performance Optimization Service
 * 
 * Implements:
 * 1. Database indexing recommendations
 * 2. Query result caching
 * 3. Connection pooling optimization
 * 4. Query execution monitoring
 * 5. Performance metrics collection
 */

class QueryPerformanceService {
  constructor() {
    // Initialize in-memory cache with 10-minute TTL
    this.cache = new NodeCache({ 
      stdTTL: 600,  // 10 minutes default TTL
      checkperiod: 120  // Check for expired keys every 2 minutes
    });
    
    // Performance metrics tracking
    this.metrics = {
      queryCount: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageQueryTime: 0,
      slowQueries: []
    };
    
    // Table name mapping (model name to actual table name)
    this.tableNameMapping = {
      'bkBooking': 'bkXbooking',
      'blBill': 'blXbilling',
      'pyPayment': 'pyXpayment',
      'usUser': 'usXuser',
      'lgLedger': 'lgXledger',
      'rtReportTemplate': 'rtXreporttemplate'
    };
    
    // Recommended indexes for reporting queries
    this.recommendedIndexes = {
      // Booking table indexes
      bkXbooking: [
        { name: 'idx_bk_trvldt', columns: ['bk_trvldt'] },
        { name: 'idx_bk_usid', columns: ['bk_usid'] },
        { name: 'idx_bk_status', columns: ['bk_status'] },
        { name: 'idx_bk_fromst_tost', columns: ['bk_fromst', 'bk_tost'] },
        { name: 'idx_bk_agent', columns: ['bk_agent'] },
        { name: 'idx_bk_reqdt', columns: ['bk_reqdt'] }
      ],
      
      // Bill table indexes - Only valid columns
      blXbilling: [
        { name: 'idx_bl_status', columns: ['bl_status'] },
        { name: 'idx_bl_booking_id', columns: ['bl_booking_id'] },
        { name: 'idx_bl_billing_date', columns: ['bl_billing_date'] }
      ],
      
      // Payment table indexes - Only valid columns  
      pyXpayment: [
        { name: 'idx_py_status', columns: ['py_status'] },
        { name: 'idx_py_customer_id', columns: ['py_customer_id'] },
        { name: 'idx_py_payment_date', columns: ['py_payment_date'] }
      ],
      
      // Customer/User indexes
      usXuser: [
        { name: 'idx_us_usertype', columns: ['us_usertype'] },
        { name: 'idx_us_city', columns: ['us_city'] },
        { name: 'idx_us_state', columns: ['us_state'] }
      ],
      
      // Ledger indexes
      lgXledger: [
        { name: 'idx_lg_usid', columns: ['lg_usid'] },
        { name: 'idx_lg_entry_type', columns: ['lg_entry_type'] },
        { name: 'idx_lg_entry_ref', columns: ['lg_entry_ref'] },
        { name: 'idx_lg_edtm', columns: ['edtm'] }
      ],
      
      // Report templates indexes
      rtXreporttemplate: [
        { name: 'idx_rt_type', columns: ['rt_type'] },
        { name: 'idx_rt_created_by', columns: ['rt_created_by'] },
        { name: 'idx_rt_role_access', columns: ['rt_role_access'] }
      ]
    };
  }

  /**
   * Apply recommended database indexes
   */
  async applyRecommendedIndexes() {
    try {
      // Check if auto-indexing is enabled via environment variable
      const enableAutoIndex = process.env.ENABLE_AUTO_INDEX === 'true';
      
      // Skip index creation if disabled or in production
      if (!enableAutoIndex || process.env.NODE_ENV === 'production') {
        if (!enableAutoIndex) {
          console.log('ℹ️  Automatic index creation disabled (ENABLE_AUTO_INDEX=false)');
        } else {
          console.log('ℹ️  Skipping automatic index creation (production environment)');
        }
        return;
      }
      
      console.log('🔍 Applying recommended database indexes...');
      
      let createdCount = 0;
      let existingCount = 0;
      let failedCount = 0;
      
      for (const [modelName, indexes] of Object.entries(this.recommendedIndexes)) {
        const tableName = this.tableNameMapping[modelName] || modelName;
        for (const index of indexes) {
          try {
            const indexExists = await this.checkIndexExists(tableName, index.name);
            if (!indexExists) {
              await this.createIndex(tableName, index.name, index.columns);
              console.log(`✅ Created index ${index.name} on ${modelName} (${tableName})`);
              createdCount++;
            } else {
              existingCount++;
            }
          } catch (error) {
            failedCount++;
            // Only log first few failures to avoid spam
            if (failedCount <= 3) {
              console.warn(`⚠️  Failed to create index ${index.name} on ${modelName} (${tableName}):`, error.message);
            }
          }
        }
      }
      
      console.log(`✅ Database indexing completed: ${existingCount} existing, ${createdCount} created, ${failedCount} failed`);
    } catch (error) {
      console.error('❌ Error applying database indexes:', error);
      throw error;
    }
  }

  /**
   * Check if an index already exists
   */
  async checkIndexExists(tableName, indexName) {
    try {
      const [results] = await sequelize.query(
        `SHOW INDEX FROM ${tableName} WHERE Key_name = ?`,
        { replacements: [indexName] }
      );
      return results.length > 0;
    } catch (error) {
      console.error(`Error checking index ${indexName}:`, error);
      return false;
    }
  }

  /**
   * Create a database index
   */
  async createIndex(tableName, indexName, columns) {
    const columnList = columns.join(', ');
    const query = `CREATE INDEX ${indexName} ON ${tableName} (${columnList})`;
    
    await sequelize.query(query);
  }

  /**
   * Get cached result or execute query
   * @param {string} cacheKey - Unique cache key
   * @param {Function} queryFunction - Function that returns promise with query result
   * @param {number} ttl - Time to live in seconds (optional)
   * @returns {Promise} Query result
   */
  async getCachedOrExecute(cacheKey, queryFunction, ttl = 600) {
    try {
      // Check cache first
      const cachedResult = this.cache.get(cacheKey);
      
      if (cachedResult !== undefined) {
        this.metrics.cacheHits++;
        console.log(`🎯 Cache HIT for key: ${cacheKey}`);
        return cachedResult;
      }
      
      this.metrics.cacheMisses++;
      console.log(`🔄 Cache MISS for key: ${cacheKey}`);
      
      // Execute query and cache result
      const startTime = Date.now();
      const result = await queryFunction();
      const executionTime = Date.now() - startTime;
      
      // Track performance metrics
      this.trackQueryPerformance(executionTime, cacheKey);
      
      // Cache the result
      this.cache.set(cacheKey, result, ttl);
      
      console.log(`✅ Query executed and cached: ${cacheKey} (${executionTime}ms)`);
      return result;
      
    } catch (error) {
      console.error(`❌ Error in getCachedOrExecute for ${cacheKey}:`, error);
      throw error;
    }
  }

  /**
   * Track query performance metrics
   */
  trackQueryPerformance(executionTime, queryKey) {
    this.metrics.queryCount++;
    
    // Update average query time
    const totalQueryTime = this.metrics.averageQueryTime * (this.metrics.queryCount - 1) + executionTime;
    this.metrics.averageQueryTime = totalQueryTime / this.metrics.queryCount;
    
    // Track slow queries (>2 seconds)
    if (executionTime > 2000) {
      this.metrics.slowQueries.push({
        queryKey,
        executionTime,
        timestamp: new Date().toISOString()
      });
      
      // Keep only last 50 slow queries
      if (this.metrics.slowQueries.length > 50) {
        this.metrics.slowQueries.shift();
      }
    }
  }

  /**
   * Generate cache key for report queries
   */
  generateCacheKey(reportType, filters, columns, groupBy) {
    const keyData = {
      reportType,
      filters: this.normalizeFilters(filters),
      columns: columns?.sort() || [],
      groupBy: groupBy?.sort() || []
    };
    
    return `report:${reportType}:${this.hashObject(keyData)}`;
  }

  /**
   * Normalize filters for consistent caching
   */
  normalizeFilters(filters) {
    if (!filters) return {};
    
    const normalized = {};
    const filterKeys = Object.keys(filters).sort();
    
    for (const key of filterKeys) {
      const value = filters[key];
      if (value !== null && value !== undefined && value !== '') {
        // Convert dates to ISO string for consistency
        if (value instanceof Date) {
          normalized[key] = value.toISOString();
        } else if (typeof value === 'object') {
          normalized[key] = JSON.stringify(value);
        } else {
          normalized[key] = String(value);
        }
      }
    }
    
    return normalized;
  }

  /**
   * Simple object hashing for cache keys
   */
  hashObject(obj) {
    const str = JSON.stringify(obj);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Clear cache for specific report type
   */
  clearReportCache(reportType) {
    const keys = this.cache.keys();
    const reportKeys = keys.filter(key => key.startsWith(`report:${reportType}:`));
    
    reportKeys.forEach(key => this.cache.del(key));
    console.log(`🧹 Cleared cache for report type: ${reportType} (${reportKeys.length} entries)`);
  }

  /**
   * Clear all cache
   */
  clearAllCache() {
    this.cache.flushAll();
    console.log('🧹 Cleared all cache');
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      cacheStats: this.cache.getStats(),
      hitRate: this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) || 0
    };
  }

  /**
   * Optimize Sequelize query options for reporting
   */
  getOptimizedQueryOptions(options = {}) {
    return {
      // Disable logging for better performance
      logging: false,
      
      // Use raw queries when possible for better performance
      raw: options.raw !== false,
      
      // Limit result set size to prevent memory issues
      limit: options.limit || 10000,
      
      // Enable connection pooling
      pool: {
        max: 20,
        min: 5,
        acquire: 60000,
        idle: 30000
      },
      
      // Optimize for read operations
      ...options
    };
  }

  /**
   * Monitor slow queries and suggest optimizations
   */
  getSlowQueryAnalysis() {
    const analysis = {
      totalSlowQueries: this.metrics.slowQueries.length,
      averageSlowQueryTime: 0,
      commonPatterns: {},
      recommendations: []
    };
    
    if (this.metrics.slowQueries.length > 0) {
      const totalTime = this.metrics.slowQueries.reduce((sum, q) => sum + q.executionTime, 0);
      analysis.averageSlowQueryTime = totalTime / this.metrics.slowQueries.length;
      
      // Analyze common patterns
      const patternCounts = {};
      this.metrics.slowQueries.forEach(query => {
        const pattern = query.queryKey.split(':')[1]; // Extract report type
        patternCounts[pattern] = (patternCounts[pattern] || 0) + 1;
      });
      
      analysis.commonPatterns = patternCounts;
      
      // Generate recommendations
      if (analysis.averageSlowQueryTime > 5000) {
        analysis.recommendations.push('Consider implementing pagination for large result sets');
      }
      
      if (Object.keys(patternCounts).some(type => patternCounts[type] > 10)) {
        analysis.recommendations.push('Frequently slow report types may benefit from materialized views');
      }
      
      analysis.recommendations.push('Review and optimize database indexes for frequently queried columns');
    }
    
    return analysis;
  }

  /**
   * Initialize performance optimizations
   */
  async initialize() {
    try {
      console.log('🚀 Initializing Query Performance Optimizations...');
      
      // Apply database indexes
      await this.applyRecommendedIndexes();
      
      // Test cache functionality
      await this.testCache();
      
      console.log('✅ Query Performance Optimizations initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize Query Performance Optimizations:', error);
      throw error;
    }
  }

  /**
   * Test cache functionality
   */
  async testCache() {
    try {
      const testKey = 'test:performance';
      const testValue = { message: 'Cache test successful', timestamp: Date.now() };
      
      // Test set and get
      this.cache.set(testKey, testValue, 10);
      const retrieved = this.cache.get(testKey);
      
      if (JSON.stringify(retrieved) !== JSON.stringify(testValue)) {
        throw new Error('Cache test failed - values do not match');
      }
      
      // Test TTL
      await new Promise(resolve => setTimeout(resolve, 11000)); // Wait for TTL
      const expired = this.cache.get(testKey);
      
      if (expired !== undefined) {
        throw new Error('Cache TTL test failed - value should have expired');
      }
      
      console.log('✅ Cache functionality test passed');
      
    } catch (error) {
      console.error('❌ Cache test failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new QueryPerformanceService();