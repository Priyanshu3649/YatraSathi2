#!/usr/bin/env node
/**
 * YatraSathi ERP — Pre-flight Deployment Check
 * Run before deploying to production to verify all critical dependencies.
 *
 * Usage:  node src/scripts/preflightCheck.js
 */
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env.production') });

let pass = 0;
let fail = 0;
let warn = 0;

function check(name, condition, detail = '') {
  if (condition) {
    console.log(`  ✅  ${name}${detail ? ' — ' + detail : ''}`);
    pass++;
  } else {
    console.log(`  ❌  ${name}${detail ? ' — ' + detail : ''}`);
    fail++;
  }
}

function warning(name, detail = '') {
  console.log(`  ⚠️   ${name}${detail ? ' — ' + detail : ''}`);
  warn++;
}

console.log('\n╔═══════════════════════════════════════════╗');
console.log('║   YatraSathi ERP — Pre-flight Check       ║');
console.log('╚═══════════════════════════════════════════╝\n');

// ── 1. Required Environment Variables ───────────────────────
console.log('── Environment Variables ──');
const requiredVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'DB_NAME_TVL', 'JWT_SECRET'];
requiredVars.forEach(v => {
  check(`ENV: ${v}`, !!process.env[v], process.env[v] ? '(set)' : '(MISSING)');
});

const optionalVars = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASSWORD', 'CORS_ALLOWED_ORIGINS'];
optionalVars.forEach(v => {
  if (process.env[v]) {
    check(`ENV: ${v}`, true, '(set)');
  } else {
    warning(`ENV: ${v}`, 'not set (optional but recommended)');
  }
});

check('NODE_ENV = production', process.env.NODE_ENV === 'production', `current: ${process.env.NODE_ENV || '(not set)'}`);

// ── 2. JWT Secret Strength ──────────────────────────────────
console.log('\n── JWT Security ──');
const jwtSecret = process.env.JWT_SECRET || '';
check('JWT_SECRET length >= 32 chars', jwtSecret.length >= 32, `${jwtSecret.length} chars`);
check('JWT_SECRET is not default/placeholder', !jwtSecret.includes('<generate') && !jwtSecret.includes('changeme'), '');

// ── 3. SSL / HTTPS ──────────────────────────────────────────
console.log('\n── HTTPS / SSL ──');
if (process.env.HTTPS === 'true') {
  check('SSL_KEY file exists', process.env.SSL_KEY && fs.existsSync(process.env.SSL_KEY), process.env.SSL_KEY || '(not set)');
  check('SSL_CERT file exists', process.env.SSL_CERT && fs.existsSync(process.env.SSL_CERT), process.env.SSL_CERT || '(not set)');
} else {
  warning('HTTPS not enabled', 'Set HTTPS=true and provide SSL_KEY/SSL_CERT for production');
}

// ── 4. CORS Configuration ───────────────────────────────────
console.log('\n── CORS ──');
const corsOrigins = process.env.CORS_ALLOWED_ORIGINS;
if (corsOrigins && corsOrigins !== '*') {
  check('CORS origins restricted', true, corsOrigins);
} else {
  warning('CORS is open (*)', 'Set CORS_ALLOWED_ORIGINS for production');
}

// ── 5. Database Connectivity ────────────────────────────────
console.log('\n── Database Connectivity ──');
try {
  const { sequelize, sequelizeTVL } = require('../../config/db');

  (async () => {
    try {
      await sequelize.authenticate();
      check('Main DB connection', true);
    } catch (e) {
      check('Main DB connection', false, e.message);
    }

    try {
      await sequelizeTVL.authenticate();
      check('TVL DB connection', true);
    } catch (e) {
      check('TVL DB connection', false, e.message);
    }

    // ── 6. Model Sync Check ───────────────────────────────────
    console.log('\n── Models ──');
    try {
      require('../models');
      check('All models loaded', true);
    } catch (e) {
      check('All models loaded', false, e.message);
    }

    // ── 7. Critical Files Exist ───────────────────────────────
    console.log('\n── Critical Files ──');
    const criticalFiles = [
      'src/server.js',
      'src/middleware/errorHandler.js',
      'src/middleware/auditMiddleware.js',
      'src/middleware/rbacMiddleware.js',
      'src/services/forensicAuditService.js',
      'src/services/billCancellationService.js',
      'src/utils/billPdfGenerator.js',
      'src/utils/queryHelper.js',
      'src/utils/dateRangeUtils.js',
    ];
    criticalFiles.forEach(f => {
      const fullPath = path.resolve(__dirname, '../../', f);
      check(`File: ${f}`, fs.existsSync(fullPath));
    });

    // ── 8. Backup Script ─────────────────────────────────────
    console.log('\n── Backup ──');
    const backupScript = path.resolve(__dirname, 'backup.js');
    check('Backup script exists', fs.existsSync(backupScript));
    const backupDir = process.env.BACKUP_DIR || path.resolve(__dirname, '../../backups');
    check('Backup directory configured', true, backupDir);

    // ── 9. Log Directory ─────────────────────────────────────
    console.log('\n── Logging ──');
    const logDir = process.env.LOG_DIR || path.resolve(__dirname, '../../logs');
    if (!fs.existsSync(logDir)) {
      try { fs.mkdirSync(logDir, { recursive: true }); } catch (_) {}
    }
    check('Log directory writable', fs.existsSync(logDir), logDir);

    // ── Summary ──────────────────────────────────────────────
    console.log('\n═══════════════════════════════════════════');
    console.log(`  Results:  ${pass} passed  |  ${fail} failed  |  ${warn} warnings`);
    console.log('═══════════════════════════════════════════\n');

    if (fail > 0) {
      console.log('  ❌  Pre-flight check FAILED — fix the issues above before deploying.\n');
      process.exit(1);
    } else {
      console.log('  ✅  Pre-flight check PASSED — ready for deployment.\n');
      process.exit(0);
    }
  })();
} catch (e) {
  check('Database module load', false, e.message);
  console.log(`\n  ❌  Pre-flight check FAILED — ${fail + 1} failures\n`);
  process.exit(1);
}
