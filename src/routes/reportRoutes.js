const express = require('express');
const genericReportController = require('../controllers/genericReportController');
const authMiddleware = require('../middleware/authMiddleware');
const rbacMiddleware = require('../middleware/rbacMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');
const reportValidation = require('../middleware/reportValidation');

const router = express.Router();

// Apply authentication middleware to all report routes
router.use(authMiddleware);

// Generic report execution endpoint
// POST /api/reports/run
router.post('/run', 
  requirePermission('reports.access'),
  reportValidation.validateReportRequest,
  genericReportController.runReport
);

// Get report schema and available options
// GET /api/reports/schema
router.get('/schema',
  requirePermission('reports.access'),
  genericReportController.getReportSchema
);

// Report template management
// POST /api/reports/templates
router.post('/templates',
  requirePermission('reports.templates.create'),
  reportValidation.validateTemplateSave,
  genericReportController.saveTemplate
);

// GET /api/reports/templates
router.get('/templates',
  requirePermission('reports.templates.view'),
  genericReportController.getTemplates
);

// DELETE /api/reports/templates/:id
router.delete('/templates/:id',
  requirePermission('reports.templates.delete'),
  genericReportController.deleteTemplate
);

// Report execution history
// GET /api/reports/history
router.get('/history',
  requirePermission('reports.history.view'),
  genericReportController.getReportHistory
);

// Performance monitoring routes
// GET /api/reports/performance
router.get('/performance',
  requirePermission('admin'),
  genericReportController.getPerformanceMetrics
);

// DELETE /api/reports/cache
router.delete('/cache',
  requirePermission('admin'),
  genericReportController.clearReportCache
);

// Time period report routes
// POST /api/reports/time-period
router.post('/time-period',
  requirePermission('reports.access'),
  reportValidation.validateTimePeriodReportRequest,
  genericReportController.generateTimePeriodReport
);

// POST /api/reports/comparative
router.post('/comparative',
  requirePermission('reports.access'),
  genericReportController.generateComparativeReport
);

// POST /api/reports/trend-analysis
router.post('/trend-analysis',
  requirePermission('reports.access'),
  genericReportController.generateTrendAnalysis
);

// Financial report routes
// POST /api/reports/financial
router.post('/financial',
  requirePermission('reports.access'),
  reportValidation.validateFinancialReportRequest,
  genericReportController.generateFinancialReport
);

// Export routes
// POST /api/reports/export
router.post('/export',
  requirePermission('reports.access'),
  reportValidation.validateExportRequest,
  genericReportController.exportReport
);

// GET /api/reports/:id/export/:format
router.get('/:id/export',
  requirePermission('reports.access'),
  genericReportController.exportReportById
);

// Export the router
module.exports = router;