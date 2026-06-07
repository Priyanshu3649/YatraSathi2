const express = require('express');
const router = express.Router();
const { 
  generateReport, 
  generateGenericReport 
} = require('../controllers/reportController');
const { exportToExcel, exportToPDF } = require('../services/exportService');
const catalog = require('../controllers/reportCatalogController');

const ReportEngineService = require('../services/reportEngineService');

/**
 * @route GET /api/reports
 * @desc Generate report data (Legacy)
 */
router.get('/', async (req, res) => {
  try {
    const { reportType, periodType, startDate, endDate, customerId } = req.query;
    if (!reportType) return res.status(400).json({ success: false, message: 'reportType is required' });

    const data = await generateReport(reportType, { 
      periodType, 
      startDate, 
      endDate, 
      customerId: parseInt(customerId) || null 
    });

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * @route POST /api/reports/generate
 * @desc Generate generic report data (New Engine)
 */
router.post('/generate', generateGenericReport);

/**
 * @route POST /api/reports/export
 * @desc Export report to Excel or PDF (Engine Aware)
 */
router.post('/export', async (req, res) => {
  try {
    const { reportType, module, format, filters, groupBy, metrics, columns } = req.body;
    
    // Support both 'reportType' (legacy) and 'module' (new engine)
    const targetModule = module || reportType;

    // Generate data using the new JESPR Engine
    const data = await ReportEngineService.generateReport({
      module: targetModule,
      filters: filters || {},
      groupBy: groupBy || [],
      metrics: metrics || []
    });
    
    // Override columns if provided by user
    if (columns) {
      data.columns = columns;
    }
    
    let buffer;
    let contentType;
    let fileName = `${targetModule}_Report_${new Date().toISOString().split('T')[0]}`;

    if (format === 'EXCEL') {
      buffer = await exportToExcel(targetModule, data);
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      fileName += '.xlsx';
    } else if (format === 'PDF') {
      buffer = await exportToPDF(targetModule, data);
      contentType = 'application/pdf';
      fileName += '.pdf';
    } else {
      return res.status(400).json({ success: false, message: 'Invalid format' });
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    res.send(buffer);

  } catch (err) {
    console.error('Export error:', err.stack || err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

/**
 * ── Report Catalog Routes ─────────────────────────────────
 * GET /api/reports/catalog             – returns the full catalog (for sidebar)
 * GET /api/reports/catalog/<reportId>  – runs the specific report
 */
router.get('/catalog', catalog.getReportCatalog);
router.get('/catalog/customer-master', catalog.customerMasterReport);
router.get('/catalog/employee-master', catalog.employeeMasterReport);
router.get('/catalog/user-master', catalog.userMasterReport);
router.get('/catalog/service-charges', catalog.serviceChargeReport);
router.get('/catalog/booking-register', catalog.bookingRegister);
router.get('/catalog/customer-booking-history', catalog.customerBookingHistory);
router.get('/catalog/booking-status', catalog.bookingStatusReport);
router.get('/catalog/billing-register', catalog.billingRegister);
router.get('/catalog/cancelled-bills', catalog.cancelledBillsReport);
router.get('/catalog/gst-summary', catalog.gstSummaryReport);
router.get('/catalog/customer-billing', catalog.customerBillingReport);
router.get('/catalog/payment-register', catalog.paymentRegister);
router.get('/catalog/receipt-register', catalog.receiptRegister);
router.get('/catalog/contra-register', catalog.contraRegister);
router.get('/catalog/journal-register', catalog.journalRegister);
router.get('/catalog/ledger', catalog.ledgerReport);
router.get('/catalog/trial-balance', catalog.trialBalance);
router.get('/catalog/profit-loss', catalog.profitAndLoss);
router.get('/catalog/balance-sheet', catalog.balanceSheet);
router.get('/catalog/outstanding', catalog.outstandingReport);
router.get('/catalog/activity-log', catalog.activityLogReport);
router.get('/catalog/change-history', catalog.changeHistoryReport);
router.get('/catalog/user-activity', catalog.userActivityReport);
router.get('/catalog/cancellation-audit', catalog.cancellationAuditReport);
router.get('/catalog/top-customers', catalog.topCustomersReport);
router.get('/catalog/revenue-analysis', catalog.revenueAnalysis);
router.get('/catalog/employee-performance', catalog.employeePerformance);
router.get('/catalog/monthly-summary', catalog.monthlyBusinessSummary);
