/**
 * Health Check Controller
 * Provides endpoints to check system health and performance metrics
 */

const { sequelize } = require('../../config/db');
const { BookingTVL } = require('../models');

// Health check endpoint
const healthCheck = async (req, res) => {
  const startTime = Date.now();
  const checks = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {}
  };

  try {
    // Check database connectivity
    console.time('HEALTH_DB_CONNECTIVITY');
    await sequelize.authenticate();
    console.timeEnd('HEALTH_DB_CONNECTIVITY');
    checks.checks.database = { status: 'ok', response_time: 'fast' };
  } catch (dbError) {
    checks.status = 'error';
    checks.checks.database = { status: 'error', error: dbError.message };
  }

  try {
    // Check basic query performance
    console.time('HEALTH_DB_QUERY_PERFORMANCE');
    const startQueryTime = Date.now();
    await BookingTVL.count();
    const queryTime = Date.now() - startQueryTime;
    console.timeEnd('HEALTH_DB_QUERY_PERFORMANCE');
    
    checks.checks.query_performance = {
      status: 'ok',
      response_time_ms: queryTime,
      threshold: queryTime < 100 ? 'good' : queryTime < 500 ? 'acceptable' : 'slow'
    };
  } catch (queryError) {
    checks.status = 'error';
    checks.checks.query_performance = { status: 'error', error: queryError.message };
  }

  // Memory usage
  const memoryUsage = process.memoryUsage();
  checks.checks.memory = {
    rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
    heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
    heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
    external: `${Math.round(memoryUsage.external / 1024 / 1024)} MB`
  };

  // Response time
  checks.response_time_ms = Date.now() - startTime;

  res.status(checks.status === 'ok' ? 200 : 503).json(checks);
};

// Performance metrics endpoint
const performanceMetrics = async (req, res) => {
  const metrics = {
    timestamp: new Date().toISOString(),
    eventLoopDelay: process.env.NODE_ENV === 'production' ? 'disabled' : process.hrtime(),
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    pid: process.pid,
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    loadAverage: process.env.NODE_ENV === 'production' ? [] : require('os').loadavg()
  };

  res.json(metrics);
};

module.exports = {
  healthCheck,
  performanceMetrics
};