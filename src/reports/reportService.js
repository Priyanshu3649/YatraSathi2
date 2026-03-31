const { 
  generateEmployeeReport, 
  generateCustomerReport, 
  generateBookingReport, 
  generateBillingReport 
} = require('./masterReport');
const { 
  generateGroupedEmployeeReport, 
  generateGroupedBookingReport, 
  generateGroupedBillingReport 
} = require('./groupedMasterReport');
const financialReportService = require('../services/financialReportService');
const { getDateRange } = require('../utils/dateRangeUtils');

/**
 * Main entrance for report generation
 */
const generateReport = async (reportType, filters) => {
  console.log('JESPR REPORT ENGINE:', { reportType, normalized: reportType?.toUpperCase() });
  const { periodType, startDate: fStart, endDate: fEnd } = filters || {};
  
  // Calculate date range based on period type if provided
  let startDate = fStart;
  let endDate = fEnd;
  
  if (periodType && periodType !== 'CUSTOM') {
    const range = getDateRange(periodType, fStart, fEnd);
    startDate = range.startDate;
    endDate = range.endDate;
  }
  
  const finalFilters = { ...filters, startDate, endDate };

  // Helper to map financialReportService results to rows/columns format
  const mapFinancialResult = (result) => {
    if (!result || !result.data) return result;
    const rows = result.data;
    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
    return {
      columns,
      rows,
      summary: result.aggregates || {},
      metadata: result.metadata || {}
    };
  };

  const normalizedType = (reportType || '').toUpperCase().trim();

  switch (normalizedType) {
    case 'BILLING':
    case 'BILLINGS':
      return await generateBillingReport(finalFilters);
    case 'JOURNAL':
      return mapFinancialResult(await financialReportService.generateJournalReport(finalFilters));
    case 'SALES':
      return mapFinancialResult(await financialReportService.generateSalesReport(finalFilters));
    case 'PURCHASE':
      return mapFinancialResult(await financialReportService.generatePurchaseReport(finalFilters));
    case 'RECEIPT':
      return mapFinancialResult(await financialReportService.generateReceiptReport(finalFilters));
    case 'PAYMENT':
      return mapFinancialResult(await financialReportService.generatePaymentReport(finalFilters));
    case 'OUTSTANDING':
    case 'OUTSTANDING_RECEIVABLES':
      return mapFinancialResult(await financialReportService.generateOutstandingReceivablesReport(finalFilters));
    case 'OUTSTANDING_PAYABLES':
      return mapFinancialResult(await financialReportService.generateOutstandingPayablesReport(finalFilters));
    case 'AGING':
    case 'AGING_ANALYSIS':
      return mapFinancialResult(await financialReportService.generateAgingAnalysisReport(finalFilters));
    
    // Master data reports
    case 'EMPLOYEES':
      return await generateEmployeeReport(finalFilters);
    case 'CUSTOMERS':
      return await generateCustomerReport(finalFilters);
    case 'BOOKINGS':
      return await generateBookingReport(finalFilters);

    // Grouped Reports
    case 'BOOKINGS_GROUPED':
      return await generateGroupedBookingReport(finalFilters);
    case 'BILLINGS_GROUPED':
    case 'BILLING_GROUPED':
      return await generateGroupedBillingReport(finalFilters);
    case 'EMPLOYEES_GROUPED_DEPT':
      return await generateGroupedEmployeeReport(finalFilters);
    
    // Additional report types can be added here
    case 'CANCELLATION':
    case 'TAX_SUMMARY':
    case 'PROFITABILITY':
    case 'AUDIT_TRAIL':
      return {
        columns: ["Message"],
        rows: [{ "Message": `Report type '${reportType}' is coming soon in the next update.` }],
        summary: { totalAmount: 0, totalCount: 0 }
      };
    
    default:
      console.error(`[JESPR] Unsupported report type: "${normalizedType}"`);
      throw new Error(`V2: Report type '${reportType}' is not supported.`);
  }
};

module.exports = { generateReport };
