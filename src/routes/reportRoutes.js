const express = require('express');
const router = express.Router();
const { generateReport } = require('../reports/reportService');
const { exportToExcel, exportToPDF } = require('../services/exportService');

/**
 * @route GET /api/reports
 * @desc Generate report data
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
 * @route POST /api/reports/export
 * @desc Export report to Excel or PDF
 */
router.post('/export', async (req, res) => {
  try {
    const { reportType, format, filters } = req.body;
    
    // First generate the data
    const data = await generateReport(reportType, filters);
    
    let buffer;
    let contentType;
    let fileName = `${reportType}_Report_${Date.now()}`;

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
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;