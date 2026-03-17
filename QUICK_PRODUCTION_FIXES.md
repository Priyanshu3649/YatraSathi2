# Quick Production Fixes - Implementation Guide
## Priority 1: Critical Fixes for 10K Daily Requests

This guide provides copy-paste ready code for the most critical improvements.

---

## 1. Database Index Creation Script

**File:** `scripts/create-production-indexes.sql`

```sql
-- ================================================
-- PRODUCTION DATABASE INDEX CREATION SCRIPT
-- Run this BEFORE deploying to production
-- ================================================

USE TVL_001;

-- ============================================
-- BOOKING TABLE INDEXES (bkXbooking)
-- ============================================
-- Customer lookup optimization
CREATE INDEX IF NOT EXISTS idx_bk_usid ON bkXbooking(bk_usid);

-- Status filtering (most common query)
CREATE INDEX IF NOT EXISTS idx_bk_status ON bkXbooking(bk_status);

-- Travel date range queries
CREATE INDEX IF NOT EXISTS idx_bk_trvldt ON bkXbooking(bk_trvldt);

-- Agent assignment lookups
CREATE INDEX IF NOT EXISTS idx_bk_agent ON bkXbooking(bk_agent);

-- Sorting by request date (DESC order)
CREATE INDEX IF NOT EXISTS idx_bk_reqdt ON bkXbooking(bk_reqdt DESC);

-- Phone number searches
CREATE INDEX IF NOT EXISTS idx_bk_phonenumber ON bkXbooking(bk_phonenumber);

-- Route-based searches (composite index)
CREATE INDEX IF NOT EXISTS idx_bk_fromst_tost ON bkXbooking(bk_fromst, bk_tost);

-- Status + Date composite (common filter combination)
CREATE INDEX IF NOT EXISTS idx_bk_status_trvldt ON bkXbooking(bk_status, bk_trvldt);

-- ============================================
-- BILLING TABLE INDEXES (billingMaster)
-- ============================================
-- Booking to billing join
CREATE INDEX IF NOT EXISTS idx_bl_booking_id ON billingMaster(bl_booking_id);

-- Customer phone lookups
CREATE INDEX IF NOT EXISTS idx_bl_customer_phone ON billingMaster(bl_customer_phone);

-- Billing date reports
CREATE INDEX IF NOT EXISTS idx_bl_billing_date ON billingMaster(bl_billing_date);

-- Journey date queries
CREATE INDEX IF NOT EXISTS idx_bl_journey_date ON billingMaster(bl_journey_date);

-- Customer name searches
CREATE INDEX IF NOT EXISTS idx_bl_customer_name ON billingMaster(bl_customer_name);

-- ============================================
-- PASSENGER TABLE INDEXES (psXpassenger)
-- ============================================
-- Booking to passenger join
CREATE INDEX IF NOT EXISTS idx_ps_bkid ON psXpassenger(ps_bkid);

-- Age and gender filtering (for reports)
CREATE INDEX IF NOT EXISTS idx_ps_age_gender ON psXpassenger(ps_age, ps_gender);

-- ============================================
-- USER/CUSTOMER TABLE INDEXES (usXuser)
-- ============================================
-- Phone number authentication
CREATE INDEX IF NOT EXISTS idx_us_phone ON usXuser(us_phone);

-- User type filtering
CREATE INDEX IF NOT EXISTS idx_us_usertype ON usXuser(us_usertype);

-- Role-based access
CREATE INDEX IF NOT EXISTS idx_us_roid ON usXuser(us_roid);

-- Email authentication
CREATE INDEX IF NOT EXISTS idx_us_email ON usXuser(us_email);

-- ============================================
-- STATION TABLE INDEXES (stXstation)
-- ============================================
-- Station code lookups
CREATE INDEX IF NOT EXISTS idx_st_stcode ON stXstation(st_stcode);

-- Station name searches
CREATE INDEX IF NOT EXISTS idx_st_stname ON stXstation(st_stname);

-- City-based searches
CREATE INDEX IF NOT EXISTS idx_st_city ON stXstation(st_city);

-- ============================================
-- PAYMENT TABLE INDEXES (pyXpayment)
-- ============================================
-- Customer payment history
CREATE INDEX IF NOT EXISTS idx_py_customer_id ON pyXpayment(py_customer_id);

-- Payment status filtering
CREATE INDEX IF NOT EXISTS idx_py_status ON pyXpayment(py_status);

-- Payment date reports
CREATE INDEX IF NOT EXISTS idx_py_payment_date ON pyXpayment(py_payment_date);

-- ============================================
-- LEDGER TABLE INDEXES (lgXledger)
-- ============================================
-- User ledger entries
CREATE INDEX IF NOT EXISTS idx_lg_usid ON lgXledger(lg_usid);

-- Entry type filtering
CREATE INDEX IF NOT EXISTS idx_lg_entry_type ON lgXledger(lg_entry_type);

-- Entry reference lookups
CREATE INDEX IF NOT EXISTS idx_lg_entry_ref ON lgXledger(lg_entry_ref);

-- Date-based queries
CREATE INDEX IF NOT EXISTS idx_lg_edtm ON lgXledger(edtm DESC);

-- ============================================
-- VERIFY INDEXES CREATED
-- ============================================
SELECT 
    TABLE_NAME, 
    INDEX_NAME, 
    GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) as COLUMNS
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_SCHEMA = 'TVL_001'
GROUP BY TABLE_NAME, INDEX_NAME
ORDER BY TABLE_NAME, INDEX_NAME;
```

**How to Run:**
```bash
mysql -u root -p < scripts/create-production-indexes.sql
```

---

## 2. Rate Limiting Implementation

**Step 1: Install Dependencies**
```bash
npm install express-rate-limit helmet
```

**Step 2: Update `src/server.js`**

Add after line 18 (`app.use(express.urlencoded({ extended: true }));`):

```javascript
// ============================================
// SECURITY & PERFORMANCE MIDDLEWARE
// ============================================
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // Disable if you need inline scripts
  crossOriginEmbedderPolicy: false
}));

// General API rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply to all API routes
app.use('/api/', apiLimiter);

// Stricter limits for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Only 5 login attempts
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many login attempts. Please try again after 15 minutes.'
    }
  },
  skipSuccessfulRequests: false // Count failed attempts too
});

app.use('/api/auth/login', authLimiter);

// Booking creation limiter (prevent spam)
const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Max 20 bookings per hour per IP
  message: {
    success: false,
    error: {
      code: 'BOOKING_RATE_LIMIT_EXCEEDED',
      message: 'Too many booking attempts. Please contact support for bulk bookings.'
    }
  }
});

app.use('/api/bookings', bookingLimiter);

// Payment endpoint limiter (high security)
const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Max 10 payment attempts per hour
  message: {
    success: false,
    error: {
      code: 'PAYMENT_RATE_LIMIT_EXCEEDED',
      message: 'Too many payment attempts. Please contact support.'
    }
  }
});

app.use('/api/payments', paymentLimiter);
```

---

## 3. Compression Middleware

**Step 1: Install**
```bash
npm install compression
```

**Step 2: Update `src/server.js`**

Add after line 18:

```javascript
const compression = require('compression');

// Enable gzip compression for all responses
app.use(compression({
  level: 6, // Compression level (1-9), 6 is good balance
  threshold: 1024, // Only compress responses > 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));
```

---

## 4. Enhanced Connection Pool Configuration

**Update `config/db.js`** - Replace lines 35-54:

```javascript
// Optimized connection pool for production
const sequelize = new Sequelize(
  process.env.DB_NAME_TVL || 'TVL_001',
  process.env.DB_USER,
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 50,        // Increased for higher concurrency
      min: 10,        // Maintain more idle connections
      acquire: 30000, // Reduced timeout to 30s
      idle: 20000,    // Reduced idle time
      evict: 10000    // Evict idle connections after 10s
    },
    define: {
      timestamps: false,
      freezeTableName: true
    },
    // Additional production optimizations
    timezone: '+00:00',
    supportBigNumbers: true,
    bigNumberStrings: true,
    connectTimeout: 60000
  }
);
```

Also update `sequelizeTVL` similarly (lines 57-76).

---

## 5. Request Timeout & Graceful Shutdown

**Update `src/server.js`** - Add after line 154:

```javascript
const server = app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Process ID: ${process.pid}`);
});

// Set request timeout
server.timeout = 30000; // 30 seconds
server.headersTimeout = 31000; // Slightly higher than timeout

// Graceful shutdown handler
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  server.close(() => {
    console.log('HTTP server closed.');
    
    // Close database connections
    sequelize.close().then(() => {
      console.log('Database connections closed.');
      sequelizeTVL.close().then(() => {
        console.log('All database connections closed.');
        process.exit(0);
      });
    }).catch((err) => {
      console.error('Error closing database:', err);
      process.exit(1);
    });
  });
  
  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error('Forced shutdown due to timeout');
    process.exit(1);
  }, 30000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
```

---

## 6. Cluster Mode with PM2

**Step 1: Install PM2**
```bash
npm install pm2 --save
npm install -g pm2
```

**Step 2: Create `ecosystem.config.js`** in project root:

```javascript
module.exports = {
  apps: [
    {
      name: 'yatrasathi',
      script: 'src/server.js',
      instances: 4, // Adjust based on CPU cores (use 'max' for auto)
      exec_mode: 'cluster',
      
      // Environment variables
      env: {
        NODE_ENV: 'development',
        PORT: 5010
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5010
      },
      
      // Error handling
      error_file: './logs/pm2/error.log',
      out_file: './logs/pm2/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Auto restart settings
      autorestart: true,
      watch: false, // Disable watch in production
      max_memory_restart: '1G', // Restart if memory exceeds 1GB
      
      // Health check
      max_restarts: 10,
      min_uptime: '10s',
      
      // Resource limits
      max_connections: 200
    }
  ]
};
```

**Step 3: Create `.env.production`** in project root:

```bash
NODE_ENV=production
PORT=5010
DB_HOST=localhost
DB_USER=yatrasathi_prod
DB_PASSWORD=YOUR_STRONG_PASSWORD_HERE
DB_NAME=TVL_001
DB_NAME_TVL=TVL_001
JWT_SECRET=GENERATE_A_VERY_LONG_AND_SECURE_SECRET_KEY_HERE_MIN_32_CHARS
BCRYPT_ROUNDS=12
ENABLE_AUTO_INDEX=false
POOL_MAX=50
POOL_MIN=10
LOG_LEVEL=info
```

**Step 4: PM2 Commands**

```bash
# Start in production mode
pm2 start ecosystem.config.js --env production

# Save PM2 process list
pm2 save

# Setup PM2 to start on system boot
pm2 startup

# Monitor application
pm2 monit

# View logs
pm2 logs yatrasathi

# Restart application
pm2 restart yatrasathi

# Stop application
pm2 stop yatrasathi

# Check status
pm2 status
```

---

## 7. Enhanced Logging with Winston

**Step 1: Install**
```bash
npm install winston morgan
```

**Step 2: Create `src/utils/logger.js`**

```javascript
const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for logs
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'yatrasathi-api' },
  transports: [
    // Error logs
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Warning logs
    new winston.transports.File({
      filename: path.join(logsDir, 'warn.log'),
      level: 'warn',
      maxsize: 5242880,
      maxFiles: 5,
    }),
    // Info logs
    new winston.transports.File({
      filename: path.join(logsDir, 'info.log'),
      level: 'info',
      maxsize: 5242880,
      maxFiles: 5,
    }),
    // Combined logs
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880,
      maxFiles: 5,
    })
  ],
  // Also log to console in development
  ...(process.env.NODE_ENV === 'development' && {
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      })
    ]
  })
});

// Create HTTP request logger stream for Morgan
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

module.exports = logger;
```

**Step 3: Update `src/server.js`**

Add after line 7:

```javascript
const logger = require('./utils/logger');
const morgan = require('morgan');
```

Replace the development logging middleware (lines 20-26) with:

```javascript
// HTTP request logging with Morgan
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined', { stream: logger.stream }));
} else {
  app.use(morgan('dev', { stream: logger.stream }));
}

// Log server startup
logger.info('Starting YatraSathi API server...');
logger.info(`Environment: ${process.env.NODE_ENV}`);
logger.info(`Port: ${PORT}`);
```

Replace all `console.log` statements in your code with:
- `logger.info()` for general info
- `logger.warn()` for warnings
- `logger.error()` for errors
- `logger.debug()` for debug info (only in development)

---

## 8. Input Validation with Express Validator

**Step 1: Install**
```bash
npm install express-validator
```

**Step 2: Create `src/middleware/validateRequest.js`**

```javascript
const { validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: errors.array().map(err => ({
          field: err.param,
          message: err.msg
        }))
      }
    });
  }
  
  next();
};

module.exports = validateRequest;
```

**Step 3: Update `src/controllers/bookingController.js`**

Add validation rules before `createBooking` function:

```javascript
const { body } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');

// Validation rules for booking creation
const createBookingValidation = [
  body('phoneNumber')
    .notEmpty().withMessage('Phone number is required')
    .matches(/^[0-9]{10,15}$/).withMessage('Phone number must be 10-15 digits'),
  
  body('customerName')
    .notEmpty().withMessage('Customer name is required')
    .trim()
    .escape()
    .isLength({ min: 2, max: 100 }).withMessage('Customer name must be 2-100 characters'),
  
  body('fromStation')
    .notEmpty().withMessage('From station is required')
    .isLength({ max: 10 }),
  
  body('toStation')
    .notEmpty().withMessage('To station is required')
    .isLength({ max: 10 }),
  
  body('travelDate')
    .notEmpty().withMessage('Travel date is required')
    .isISO8601().withMessage('Invalid date format'),
  
  body('travelClass')
    .optional()
    .isIn(['SL', '3A', '2A', '1A', 'CC', '2S']).withMessage('Invalid travel class'),
  
  body('berthPreference')
    .optional()
    .isIn(['LOWER', 'MIDDLE', 'UPPER', 'SIDE_LOWER', 'SIDE_UPPER', 'NO_PREF']),
  
  body('totalPassengers')
    .optional()
    .isInt({ min: 1, max: 10 }).withMessage('Passengers must be between 1 and 10'),
  
  body('passengerList')
    .optional()
    .isArray({ max: 10 }),
  
  validateRequest
];

// Then apply to route: router.post('/', createBookingValidation, createBooking);
```

---

## 9. Health Check Endpoint

**Add to `src/server.js`** after line 37:

```javascript
// Health check endpoint
app.get('/health', async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Check database connection
    await sequelize.authenticate();
    const dbStatus = 'connected';
  } catch (error) {
    const dbStatus = 'disconnected';
  }
  
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    database: dbStatus,
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
    },
    responseTime: Date.now() - startTime + 'ms'
  };
  
  if (dbStatus === 'disconnected') {
    res.status(503).json({ ...health, status: 'unhealthy' });
  } else {
    res.json(health);
  }
});

// Simple ping endpoint for uptime monitoring
app.get('/ping', (req, res) => {
  res.json({ pong: true, timestamp: new Date().toISOString() });
});
```

---

## 10. CORS Configuration for Production

**Update `src/server.js`** - Replace line 16:

```javascript
// Configure CORS for production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yatrasathi.com', 'https://www.yatrasathi.com'] 
    : true, // Allow all in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));
```

---

## Testing Your Fixes

### 1. Verify Indexes Created
```sql
SHOW INDEX FROM bkXbooking;
SHOW INDEX FROM billingMaster;
```

### 2. Test Rate Limiting
```bash
# Should succeed (under limit)
for i in {1..5}; do curl http://localhost:5010/api/auth/login; done

# Should fail (over limit)
curl http://localhost:5010/api/auth/login
# Expected: 429 Too Many Requests
```

### 3. Test Compression
```bash
curl -H "Accept-Encoding: gzip" http://localhost:5010/api/employee/bookings -o response.gz
gunzip -l response.gz  # Should show compression ratio
```

### 4. Test Health Check
```bash
curl http://localhost:5010/health
```

### 5. Load Test with Apache Bench
```bash
# Install: sudo apt-get install apache2-utils

# Test with 10 concurrent users, 100 total requests
ab -n 100 -c 10 http://localhost:5010/api/employee/bookings

# Look for:
# - Requests per second (should be > 50)
# - Time per request (should be < 200ms)
# - Failed requests (should be 0)
```

---

## Deployment Checklist

Before going live:

- [ ] All indexes created successfully
- [ ] Rate limiting tested and working
- [ ] Compression enabled (check response headers)
- [ ] PM2 cluster mode running (`pm2 status`)
- [ ] Logs being written to `/logs` directory
- [ ] Health check returns 200 OK
- [ ] Database connection pool stable
- [ ] No memory leaks (monitor with `pm2 monit`)
- [ ] Load test passed (100 concurrent users, 0 errors)
- [ ] Backup strategy implemented
- [ ] SSL certificate installed
- [ ] Firewall configured (only ports 80, 443, 22 open)
- [ ] Monitoring alerts configured

---

## Next Steps After Deployment

1. **Monitor First Week:**
   - Check `pm2 monit` daily
   - Review error logs: `tail -f logs/error.log`
   - Monitor database slow query log

2. **Performance Tuning:**
   - Adjust pool size based on actual usage
   - Fine-tune rate limits if needed
   - Add Redis caching for frequently accessed data

3. **Scaling:**
   - Add more PM2 instances if CPU < 70% utilization
   - Implement database read replicas
   - Set up CDN for static assets

Good luck with your production deployment! 🚀
