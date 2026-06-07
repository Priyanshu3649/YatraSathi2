// Error handling middleware
const fs = require('fs');
const path = require('path');

// ── File error logger ─────────────────────────────────────
const LOG_DIR = process.env.LOG_DIR || path.resolve(__dirname, '../../logs');
if (!fs.existsSync(LOG_DIR)) {
  try { fs.mkdirSync(LOG_DIR, { recursive: true }); } catch (_) { /* ignore */ }
}
const LOG_FILE = path.join(LOG_DIR, 'error.log');
const MAX_LOG_SIZE = 10 * 1024 * 1024; // 10 MB rotation threshold

function rotateLogIfNeeded() {
  try {
    if (fs.existsSync(LOG_FILE) && fs.statSync(LOG_FILE).size > MAX_LOG_SIZE) {
      const rotated = `${LOG_FILE}.${Date.now()}.bak`;
      fs.renameSync(LOG_FILE, rotated);
    }
  } catch (_) { /* ignore */ }
}

function logToFile(entry) {
  try {
    rotateLogIfNeeded();
    fs.appendFileSync(LOG_FILE, entry + '\n');
  } catch (_) { /* non-fatal */ }
}
// ──────────────────────────────────────────────────────────

const errorHandler = (err, req, res, next) => {
  // Log error
  console.error('Error:', err);
  
  // Write to error log file
  const logEntry = JSON.stringify({
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    user: req.user?.us_usid || 'unauthenticated',
    ip: req.ip || req.connection?.remoteAddress,
    status: err.statusCode || 500,
    message: err.message,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
  });
  logToFile(logEntry);
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Invalid input data',
      details: errors
    });
  }
  
  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    return res.status(400).json({
      success: false,
      error: 'Duplicate Entry',
      message: `${field} '${value}' already exists`
    });
  }
  
  // Mongoose cast error (invalid ID)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: 'Invalid ID',
      message: 'Invalid resource ID format'
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid Token',
      message: 'Token is invalid'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token Expired',
      message: 'Token has expired'
    });
  }
  
  // Custom application errors
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.error || 'Application Error',
      message: err.message
    });
  }
  
  // Default error
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: 'An unexpected error occurred'
  });
};

// Async error wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// 404 handler
const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  });
};

module.exports = {
  errorHandler,
  asyncHandler,
  notFound
};