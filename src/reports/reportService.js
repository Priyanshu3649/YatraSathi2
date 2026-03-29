const { getDateRange } = require('../utils/dateRangeUtils');
const { generateSalesReport } = require('./salesReport');
const { generatePaymentReport } = require('./paymentReport');
const { generateReceiptReport } = require('./receiptReport');

/**
 * Main entrance for report generation
 * @param {string} reportType - Type of report to generate
 * @param {Object} filters - { periodType, startDate, endDate, branch, customerId, status }
 */
const generateReport = async (reportType, filters) => {
  const { periodType, startDate: fStart, endDate: fEnd } = filters;
  
  // Calculate date range based on period type if provided
  const { startDate, endDate } = getDateRange(periodType, fStart, fEnd);
  const finalFilters = { ...filters, startDate, endDate };

  switch (reportType.toUpperCase()) {
    case 'SALES':
      return await generateSalesReport(finalFilters);
    case 'PAYMENT':
      return await generatePaymentReport(finalFilters);
    case 'RECEIPT':
      return await generateReceiptReport(finalFilters);
    
    // Additional report types can be added here
    case 'CANCELLATION':
    case 'JOURNAL':
    case 'PURCHASE':
    case 'OUTSTANDING':
    case 'AGING':
    case 'PROFITABILITY':
      return {
        columns: ["Message"],
        rows: [{ "Message": `Report type '${reportType}' is coming soon in the next update.` }],
        summary: { totalAmount: 0, totalCount: 0 }
      };
    
    default:
      throw new Error(`Report type '${reportType}' is not supported.`);
  }
};

module.exports = { generateReport };
