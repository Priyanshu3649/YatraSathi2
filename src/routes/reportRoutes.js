const express = require('express');
const router = express.Router();
const { 
  generateReport, 
  generateGenericReport 
} = require('../controllers/reportController');
const { exportToExcel, exportToPDF } = require('../services/exportService');

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
 * @desc Export report to Excel or PDF
 */
router.post('/export', async (req, res) => {
  try {
    const { reportType, format, filters, columns } = req.body;
    
    // First generate the data
    const data = await generateReport(reportType, filters);
    
    // Override columns if provided by user (e.g. for specific grid views)
    if (columns) {
      data.columns = columns;
    }
    
    let buffer;
    let contentType;
    let fileName = `${reportType}_Report_${new Date().toISOString().split('T')[0]}`;

    if (format === 'EXCEL') {
      buffer = await exportToExcel(reportType, data);
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      fileName += '.xlsx';
    } else if (format === 'PDF') {
      buffer = await exportToPDF(reportType, data);
      contentType = 'application/pdf';
      fileName += '.pdf';
    } else {
      return res.status(400).json({ success: false, message: 'Invalid format' });
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    res.send(buffer);

  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;