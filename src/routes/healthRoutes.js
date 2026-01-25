const express = require('express');
const { healthCheck, performanceMetrics } = require('../controllers/healthController');
const router = express.Router();

// Health check endpoint
router.get('/health', healthCheck);

// Performance metrics endpoint
router.get('/metrics', performanceMetrics);

module.exports = router;