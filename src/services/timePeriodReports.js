const { sequelize } = require('../models/baseModel');
const ReportQueryEngine = require('./reportQueryEngine');

/**
 * Time Period Reports Engine
 * 
 * Generates reports for specific time periods:
 * - Daily reports
 * - Weekly reports  
 * - Monthly reports
 * - Quarterly reports
 * - Annual reports
 * 
 * Provides aggregated views of business data by time period
 */
class TimePeriodReports {
  constructor() {
    this.queryEngine = new ReportQueryEngine();
    this.timePeriods = {
      DAILY: 'daily',
      WEEKLY: 'weekly', 
      MONTHLY: 'monthly',
      QUARTERLY: 'quarterly',
      ANNUALLY: 'annually'
    };
  }

  /**
   * Generate daily report for a specific date
   * @param {Date|string} date - The date for the report
   * @param {Object} filters - Additional filters to apply
   * @param {string} reportType - Type of report (booking, billing, payment, etc.)
   * @returns {Object} Daily report data
   */
  async generateDailyReport(date, filters = {}, reportType = 'booking') {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      const startOfDay = new Date(dateObj);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(dateObj);
      endOfDay.setHours(23, 59, 59, 999);
      
      const dateFilters = {
        ...filters,
        dateFrom: startOfDay,
        dateTo: endOfDay
      };

      const queryConfig = {
        reportType,
        columns: this.getDefaultColumns(reportType),
        filters: dateFilters,
        groupBy: [],
        aggregates: this.getDefaultAggregates(reportType),
        limit: 10000
      };

      const results = await this.queryEngine.executeQuery(queryConfig, { 
        us_usid: 'system', 
        us_usertype: 'admin',
        us_roid: 'ADM'
      });

      return {
        period: this.timePeriods.DAILY,
        date: dateObj.toISOString().split('T')[0],
        data: results.data,
        metadata: {
          ...results.metadata,
          periodStart: startOfDay,
          periodEnd: endOfDay,
          reportType
        },
        aggregates: results.aggregates
      };
    } catch (error) {
      console.error('Daily report generation error:', error);
      throw new Error(`Failed to generate daily report: ${error.message}`);
    }
  }

  /**
   * Generate weekly report for a specific week
   * @param {Date|string} date - Date within the week
   * @param {Object} filters - Additional filters to apply
   * @param {string} reportType - Type of report
   * @returns {Object} Weekly report data
   */
  async generateWeeklyReport(date, filters = {}, reportType = 'booking') {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      
      // Get Monday of the week (assuming Monday is first day of week)
      const dayOfWeek = dateObj.getDay();
      const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust Sunday (0) to be -6 days back
      
      const startOfWeek = new Date(dateObj);
      startOfWeek.setDate(dateObj.getDate() + daysToMonday);
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      
      const dateFilters = {
        ...filters,
        dateFrom: startOfWeek,
        dateTo: endOfWeek
      };

      const queryConfig = {
        reportType,
        columns: this.getDefaultColumns(reportType),
        filters: dateFilters,
        groupBy: ['day'], // Group by day within the week
        aggregates: this.getDefaultAggregates(reportType),
        limit: 10000
      };

      const results = await this.queryEngine.executeQuery(queryConfig, { 
        us_usid: 'system', 
        us_usertype: 'admin',
        us_roid: 'ADM'
      });

      return {
        period: this.timePeriods.WEEKLY,
        weekStart: startOfWeek.toISOString().split('T')[0],
        weekEnd: endOfWeek.toISOString().split('T')[0],
        data: results.data,
        metadata: {
          ...results.metadata,
          periodStart: startOfWeek,
          periodEnd: endOfWeek,
          reportType
        },
        aggregates: results.aggregates
      };
    } catch (error) {
      console.error('Weekly report generation error:', error);
      throw new Error(`Failed to generate weekly report: ${error.message}`);
    }
  }

  /**
   * Generate monthly report for a specific month/year
   * @param {number} month - Month (1-12)
   * @param {number} year - Year
   * @param {Object} filters - Additional filters to apply
   * @param {string} reportType - Type of report
   * @returns {Object} Monthly report data
   */
  async generateMonthlyReport(month, year, filters = {}, reportType = 'booking') {
    try {
      const startDate = new Date(year, month - 1, 1); // Month is 0-indexed in JS
      const endDate = new Date(year, month, 0); // Last day of the month
      endDate.setHours(23, 59, 59, 999);
      
      const dateFilters = {
        ...filters,
        dateFrom: startDate,
        dateTo: endDate
      };

      const queryConfig = {
        reportType,
        columns: this.getDefaultColumns(reportType),
        filters: dateFilters,
        groupBy: ['day'], // Group by day within the month
        aggregates: this.getDefaultAggregates(reportType),
        limit: 10000
      };

      const results = await this.queryEngine.executeQuery(queryConfig, { 
        us_usid: 'system', 
        us_usertype: 'admin',
        us_roid: 'ADM'
      });

      return {
        period: this.timePeriods.MONTHLY,
        month: month,
        year: year,
        data: results.data,
        metadata: {
          ...results.metadata,
          periodStart: startDate,
          periodEnd: endDate,
          reportType
        },
        aggregates: results.aggregates
      };
    } catch (error) {
      console.error('Monthly report generation error:', error);
      throw new Error(`Failed to generate monthly report: ${error.message}`);
    }
  }

  /**
   * Generate quarterly report for a specific quarter/year
   * @param {number} quarter - Quarter (1-4)
   * @param {number} year - Year
   * @param {Object} filters - Additional filters to apply
   * @param {string} reportType - Type of report
   * @returns {Object} Quarterly report data
   */
  async generateQuarterlyReport(quarter, year, filters = {}, reportType = 'booking') {
    try {
      let startDate, endDate;
      
      switch (quarter) {
        case 1: // Jan-Mar
          startDate = new Date(year, 0, 1); // January
          endDate = new Date(year, 2, 31); // March
          break;
        case 2: // Apr-Jun
          startDate = new Date(year, 3, 1); // April
          endDate = new Date(year, 5, 30); // June
          break;
        case 3: // Jul-Sep
          startDate = new Date(year, 6, 1); // July
          endDate = new Date(year, 8, 30); // September
          break;
        case 4: // Oct-Dec
          startDate = new Date(year, 9, 1); // October
          endDate = new Date(year, 11, 31); // December
          break;
        default:
          throw new Error('Invalid quarter. Must be 1-4.');
      }
      
      endDate.setHours(23, 59, 59, 999);
      
      const dateFilters = {
        ...filters,
        dateFrom: startDate,
        dateTo: endDate
      };

      const queryConfig = {
        reportType,
        columns: this.getDefaultColumns(reportType),
        filters: dateFilters,
        groupBy: ['month'], // Group by month within the quarter
        aggregates: this.getDefaultAggregates(reportType),
        limit: 10000
      };

      const results = await this.queryEngine.executeQuery(queryConfig, { 
        us_usid: 'system', 
        us_usertype: 'admin',
        us_roid: 'ADM'
      });

      return {
        period: this.timePeriods.QUARTERLY,
        quarter: quarter,
        year: year,
        data: results.data,
        metadata: {
          ...results.metadata,
          periodStart: startDate,
          periodEnd: endDate,
          reportType
        },
        aggregates: results.aggregates
      };
    } catch (error) {
      console.error('Quarterly report generation error:', error);
      throw new Error(`Failed to generate quarterly report: ${error.message}`);
    }
  }

  /**
   * Generate annual report for a specific year
   * @param {number} year - Year
   * @param {Object} filters - Additional filters to apply
   * @param {string} reportType - Type of report
   * @returns {Object} Annual report data
   */
  async generateAnnualReport(year, filters = {}, reportType = 'booking') {
    try {
      const startDate = new Date(year, 0, 1); // January 1st
      const endDate = new Date(year, 11, 31); // December 31st
      endDate.setHours(23, 59, 59, 999);
      
      const dateFilters = {
        ...filters,
        dateFrom: startDate,
        dateTo: endDate
      };

      const queryConfig = {
        reportType,
        columns: this.getDefaultColumns(reportType),
        filters: dateFilters,
        groupBy: ['month'], // Group by month within the year
        aggregates: this.getDefaultAggregates(reportType),
        limit: 10000
      };

      const results = await this.queryEngine.executeQuery(queryConfig, { 
        us_usid: 'system', 
        us_usertype: 'admin',
        us_roid: 'ADM'
      });

      return {
        period: this.timePeriods.ANNUALLY,
        year: year,
        data: results.data,
        metadata: {
          ...results.metadata,
          periodStart: startDate,
          periodEnd: endDate,
          reportType
        },
        aggregates: results.aggregates
      };
    } catch (error) {
      console.error('Annual report generation error:', error);
      throw new Error(`Failed to generate annual report: ${error.message}`);
    }
  }

  /**
   * Generate comparative report comparing two time periods
   * @param {string} period1 - First period type (daily, weekly, monthly, etc.)
   * @param {any} period1Param - Parameter for first period
   * @param {string} period2 - Second period type
   * @param {any} period2Param - Parameter for second period
   * @param {string} reportType - Type of report
   * @returns {Object} Comparative report data
   */
  async generateComparativeReport(period1, period1Param, period2, period2Param, reportType = 'booking') {
    try {
      let report1, report2;
      
      // Generate first report
      if (period1 === 'daily') {
        report1 = await this.generateDailyReport(period1Param, {}, reportType);
      } else if (period1 === 'weekly') {
        report1 = await this.generateWeeklyReport(period1Param, {}, reportType);
      } else if (period1 === 'monthly') {
        const [month1, year1] = period1Param.split('-').map(Number);
        report1 = await this.generateMonthlyReport(month1, year1, {}, reportType);
      } else if (period1 === 'quarterly') {
        const [quarter1, year1] = period1Param.split('-').map(Number);
        report1 = await this.generateQuarterlyReport(quarter1, year1, {}, reportType);
      } else if (period1 === 'annually') {
        report1 = await this.generateAnnualReport(period1Param, {}, reportType);
      } else {
        throw new Error(`Invalid period type: ${period1}`);
      }
      
      // Generate second report
      if (period2 === 'daily') {
        report2 = await this.generateDailyReport(period2Param, {}, reportType);
      } else if (period2 === 'weekly') {
        report2 = await this.generateWeeklyReport(period2Param, {}, reportType);
      } else if (period2 === 'monthly') {
        const [month2, year2] = period2Param.split('-').map(Number);
        report2 = await this.generateMonthlyReport(month2, year2, {}, reportType);
      } else if (period2 === 'quarterly') {
        const [quarter2, year2] = period2Param.split('-').map(Number);
        report2 = await this.generateQuarterlyReport(quarter2, year2, {}, reportType);
      } else if (period2 === 'annually') {
        report2 = await this.generateAnnualReport(period2Param, {}, reportType);
      } else {
        throw new Error(`Invalid period type: ${period2}`);
      }
      
      // Calculate comparison metrics
      const comparison = this.calculateComparison(report1, report2);
      
      return {
        period1: report1,
        period2: report2,
        comparison: comparison,
        metadata: {
          comparisonType: `${period1} vs ${period2}`,
          reportType
        }
      };
    } catch (error) {
      console.error('Comparative report generation error:', error);
      throw new Error(`Failed to generate comparative report: ${error.message}`);
    }
  }

  /**
   * Get trend analysis for a specific time period type
   * @param {string} periodType - Type of period (daily, weekly, monthly)
   * @param {number} count - Number of periods to analyze
   * @param {string} reportType - Type of report
   * @param {Object} filters - Additional filters
   * @returns {Object} Trend analysis data
   */
  async generateTrendAnalysis(periodType, count, reportType = 'booking', filters = {}) {
    try {
      const trends = [];
      
      for (let i = count - 1; i >= 0; i--) {
        let date, month, year, quarter;
        
        const currentDate = new Date();
        
        switch (periodType) {
          case 'daily':
            date = new Date(currentDate);
            date.setDate(currentDate.getDate() - i);
            const dailyReport = await this.generateDailyReport(date, filters, reportType);
            trends.push(dailyReport);
            break;
            
          case 'weekly':
            date = new Date(currentDate);
            date.setDate(currentDate.getDate() - (i * 7));
            const weeklyReport = await this.generateWeeklyReport(date, filters, reportType);
            trends.push(weeklyReport);
            break;
            
          case 'monthly':
            month = currentDate.getMonth() - i + 1;
            year = currentDate.getFullYear();
            if (month <= 0) {
              month = 12 + month;
              year = year - 1;
            }
            const monthlyReport = await this.generateMonthlyReport(month, year, filters, reportType);
            trends.push(monthlyReport);
            break;
            
          case 'quarterly':
            const currentQuarter = Math.floor(currentDate.getMonth() / 3) + 1;
            const quartersBack = i;
            quarter = currentQuarter - quartersBack;
            year = currentDate.getFullYear();
            
            if (quarter <= 0) {
              quarter = 4 + quarter;
              year = year - 1;
            }
            
            const quarterlyReport = await this.generateQuarterlyReport(quarter, year, filters, reportType);
            trends.push(quarterlyReport);
            break;
            
          case 'annually':
            year = currentDate.getFullYear() - i;
            const annualReport = await this.generateAnnualReport(year, filters, reportType);
            trends.push(annualReport);
            break;
            
          default:
            throw new Error(`Invalid period type: ${periodType}`);
        }
      }
      
      return {
        periodType,
        count,
        trends,
        analysis: this.analyzeTrends(trends),
        metadata: {
          reportType,
          filters
        }
      };
    } catch (error) {
      console.error('Trend analysis generation error:', error);
      throw new Error(`Failed to generate trend analysis: ${error.message}`);
    }
  }

  /**
   * Calculate comparison between two reports
   */
  calculateComparison(report1, report2) {
    const comparison = {};
    
    // Compare aggregates if available
    if (report1.aggregates && report2.aggregates) {
      Object.keys(report1.aggregates).forEach(key => {
        const val1 = parseFloat(report1.aggregates[key]) || 0;
        const val2 = parseFloat(report2.aggregates[key]) || 0;
        const change = val2 - val1;
        const percentChange = val1 !== 0 ? ((change / val1) * 100) : 0;
        
        comparison[key] = {
          value1: val1,
          value2: val2,
          change: change,
          percentChange: percentChange.toFixed(2)
        };
      });
    }
    
    // Compare record counts
    comparison.recordCount = {
      value1: report1.data?.length || 0,
      value2: report2.data?.length || 0,
      change: (report2.data?.length || 0) - (report1.data?.length || 0),
      percentChange: (report1.data?.length || 0) !== 0 ? 
        (((report2.data?.length || 0) - (report1.data?.length || 0)) / (report1.data?.length || 0) * 100).toFixed(2) : 0
    };
    
    return comparison;
  }

  /**
   * Analyze trends in the data
   */
  analyzeTrends(trends) {
    if (trends.length < 2) {
      return { message: 'Insufficient data for trend analysis' };
    }
    
    const analysis = {
      overallTrend: 'stable', // positive, negative, stable
      growthRate: 0,
      volatility: 0,
      peakPeriod: null,
      lowestPeriod: null,
      recommendations: []
    };
    
    // Calculate growth rate and other metrics
    if (trends[0]?.aggregates && trends[trends.length - 1]?.aggregates) {
      const firstValue = Object.values(trends[0].aggregates)[0] || 0;
      const lastValue = Object.values(trends[trends.length - 1].aggregates)[0] || 0;
      
      if (firstValue !== 0) {
        analysis.growthRate = ((lastValue - firstValue) / firstValue) * 100;
      }
      
      // Determine trend direction
      if (analysis.growthRate > 5) {
        analysis.overallTrend = 'positive';
      } else if (analysis.growthRate < -5) {
        analysis.overallTrend = 'negative';
      }
    }
    
    // Calculate volatility (standard deviation of values)
    const values = trends.map(trend => {
      const aggregateValues = Object.values(trend.aggregates || {});
      return aggregateValues.length > 0 ? aggregateValues[0] : trend.data?.length || 0;
    }).filter(val => val !== null && val !== undefined);
    
    if (values.length > 1) {
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
      const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
      analysis.volatility = Math.sqrt(variance);
    }
    
    // Find peak and lowest periods
    if (values.length > 0) {
      const maxValue = Math.max(...values);
      const minValue = Math.min(...values);
      const peakIndex = values.indexOf(maxValue);
      const lowestIndex = values.indexOf(minValue);
      
      analysis.peakPeriod = trends[peakIndex];
      analysis.lowestPeriod = trends[lowestIndex];
    }
    
    // Generate recommendations based on analysis
    if (analysis.overallTrend === 'negative') {
      analysis.recommendations.push('Trend shows declining performance. Consider reviewing business strategies.');
    } else if (analysis.overallTrend === 'positive') {
      analysis.recommendations.push('Positive trend observed. Consider scaling successful initiatives.');
    }
    
    if (analysis.volatility > (analysis.growthRate * 0.5)) {
      analysis.recommendations.push('High volatility detected. Consider implementing more consistent business practices.');
    }
    
    return analysis;
  }

  /**
   * Get default columns for a report type
   */
  getDefaultColumns(reportType) {
    const columnMappings = {
      booking: [
        'bk_bkid', 'bk_bkno', 'bk_usid', 'bk_fromst', 'bk_tost', 
        'bk_trvldt', 'bk_class', 'bk_totalpass', 'bk_status', 'bk_agent'
      ],
      billing: [
        'bi_biid', 'bi_customer_id', 'bi_booking_id', 'bi_bill_date',
        'bi_gross_amount', 'bi_tax_amount', 'bi_net_amount', 'bi_status'
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
    
    return columnMappings[reportType] || ['*'];
  }

  /**
   * Get default aggregates for a report type
   */
  getDefaultAggregates(reportType) {
    const aggregateMappings = {
      booking: {
        count: 'COUNT',
        total_passengers: 'SUM'
      },
      billing: {
        count: 'COUNT',
        total_amount: 'SUM'
      },
      payment: {
        count: 'COUNT',
        total_amount: 'SUM'
      },
      customer: {
        count: 'COUNT'
      },
      employee: {
        count: 'COUNT'
      }
    };
    
    return aggregateMappings[reportType] || {};
  }
}

module.exports = TimePeriodReports;