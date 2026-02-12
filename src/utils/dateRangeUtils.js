/**
 * Date Range Utility Functions for JESPR Reporting Engine
 * Handles Indian Financial Year (Apr-Mar) calculations
 */

/**
 * Get Indian Financial Year from a date
 * @param {Date} date - Input date
 * @returns {string} Financial year in format 'YYYY-YY' (e.g., '2025-26')
 */
const getFinancialYear = (date = new Date()) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 0-indexed
  
  if (month >= 4) {
    // Apr-Dec: Current year to next year
    return `${year}-${String(year + 1).slice(-2)}`;
  } else {
    // Jan-Mar: Previous year to current year
    return `${year - 1}-${String(year).slice(-2)}`;
  }
};

/**
 * Get quarter from a date (Indian Financial Year)
 * Q1: Apr-Jun, Q2: Jul-Sep, Q3: Oct-Dec, Q4: Jan-Mar
 * @param {Date} date - Input date
 * @returns {string} Quarter ('Q1', 'Q2', 'Q3', 'Q4')
 */
const getQuarter = (date = new Date()) => {
  const month = date.getMonth() + 1; // 0-indexed
  
  if (month >= 4 && month <= 6) return 'Q1';
  if (month >= 7 && month <= 9) return 'Q2';
  if (month >= 10 && month <= 12) return 'Q3';
  return 'Q4'; // Jan-Mar
};

/**
 * Get date range for a specific period type
 * @param {string} periodType - 'DAILY', 'MONTHLY', 'QUARTERLY', 'ANNUAL', 'CUSTOM'
 * @param {Date} referenceDate - Reference date for calculation
 * @param {Object} customRange - For CUSTOM type: { startDate, endDate }
 * @returns {Object} { startDate, endDate }
 */
const getDateRange = (periodType, referenceDate = new Date(), customRange = null) => {
  const date = new Date(referenceDate);
  let startDate, endDate;
  
  switch (periodType) {
    case 'DAILY':
      startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
      endDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
      break;
      
    case 'MONTHLY':
      startDate = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0);
      endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
      break;
      
    case 'QUARTERLY':
      const quarter = getQuarter(date);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      
      if (quarter === 'Q1') {
        startDate = new Date(year, 3, 1, 0, 0, 0); // Apr 1
        endDate = new Date(year, 6, 0, 23, 59, 59); // Jun 30
      } else if (quarter === 'Q2') {
        startDate = new Date(year, 6, 1, 0, 0, 0); // Jul 1
        endDate = new Date(year, 9, 0, 23, 59, 59); // Sep 30
      } else if (quarter === 'Q3') {
        startDate = new Date(year, 9, 1, 0, 0, 0); // Oct 1
        endDate = new Date(year, 12, 0, 23, 59, 59); // Dec 31
      } else { // Q4
        const fyYear = month >= 4 ? year : year - 1;
        startDate = new Date(fyYear + 1, 0, 1, 0, 0, 0); // Jan 1
        endDate = new Date(fyYear + 1, 3, 0, 23, 59, 59); // Mar 31
      }
      break;
      
    case 'ANNUAL':
      const fyYear = date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;
      startDate = new Date(fyYear, 3, 1, 0, 0, 0); // Apr 1
      endDate = new Date(fyYear + 1, 3, 0, 23, 59, 59); // Mar 31
      break;
      
    case 'CUSTOM':
      if (!customRange || !customRange.startDate || !customRange.endDate) {
        throw new Error('Custom range requires startDate and endDate');
      }
      startDate = new Date(customRange.startDate);
      endDate = new Date(customRange.endDate);
      endDate.setHours(23, 59, 59, 999);
      break;
      
    default:
      throw new Error(`Invalid period type: ${periodType}`);
  }
  
  return { startDate, endDate };
};

/**
 * Get all quarters for a financial year
 * @param {string} financialYear - Format 'YYYY-YY'
 * @returns {Array} Array of quarter objects with startDate and endDate
 */
const getQuartersForFY = (financialYear) => {
  const startYear = parseInt(financialYear.split('-')[0]);
  
  return [
    {
      quarter: 'Q1',
      startDate: new Date(startYear, 3, 1), // Apr 1
      endDate: new Date(startYear, 6, 0, 23, 59, 59) // Jun 30
    },
    {
      quarter: 'Q2',
      startDate: new Date(startYear, 6, 1), // Jul 1
      endDate: new Date(startYear, 9, 0, 23, 59, 59) // Sep 30
    },
    {
      quarter: 'Q3',
      startDate: new Date(startYear, 9, 1), // Oct 1
      endDate: new Date(startYear, 12, 0, 23, 59, 59) // Dec 31
    },
    {
      quarter: 'Q4',
      startDate: new Date(startYear + 1, 0, 1), // Jan 1
      endDate: new Date(startYear + 1, 3, 0, 23, 59, 59) // Mar 31
    }
  ];
};

/**
 * Get all months for a financial year
 * @param {string} financialYear - Format 'YYYY-YY'
 * @returns {Array} Array of month objects with startDate and endDate
 */
const getMonthsForFY = (financialYear) => {
  const startYear = parseInt(financialYear.split('-')[0]);
  const months = [];
  
  // Apr-Dec of start year
  for (let month = 3; month < 12; month++) {
    months.push({
      month: new Date(startYear, month, 1).toLocaleString('default', { month: 'short' }),
      startDate: new Date(startYear, month, 1),
      endDate: new Date(startYear, month + 1, 0, 23, 59, 59)
    });
  }
  
  // Jan-Mar of next year
  for (let month = 0; month < 3; month++) {
    months.push({
      month: new Date(startYear + 1, month, 1).toLocaleString('default', { month: 'short' }),
      startDate: new Date(startYear + 1, month, 1),
      endDate: new Date(startYear + 1, month + 1, 0, 23, 59, 59)
    });
  }
  
  return months;
};

/**
 * Format date for SQL query
 * @param {Date} date - Input date
 * @returns {string} Date in 'YYYY-MM-DD' format
 */
const formatDateForSQL = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get aging buckets for receivables/payables
 * @param {Date} asOfDate - Date to calculate aging from
 * @returns {Array} Array of bucket definitions
 */
const getAgingBuckets = (asOfDate = new Date()) => {
  return [
    { name: '0-30 Days', min: 0, max: 30 },
    { name: '31-60 Days', min: 31, max: 60 },
    { name: '61-90 Days', min: 61, max: 90 },
    { name: '90+ Days', min: 91, max: null }
  ];
};

module.exports = {
  getFinancialYear,
  getQuarter,
  getDateRange,
  getQuartersForFY,
  getMonthsForFY,
  formatDateForSQL,
  getAgingBuckets
};
