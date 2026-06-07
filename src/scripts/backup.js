#!/usr/bin/env node
/**
 * YatraSathi ERP — Database Backup Script
 * Creates date-stamped MySQL dumps with configurable retention.
 *
 * Usage:  node src/scripts/backup.js
 * Cron:   0 2 * * * cd /opt/yatrasathi && node src/scripts/backup.js >> /var/log/yatrasathi/backup.log 2>&1
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env.production') });

const BACKUP_DIR = process.env.BACKUP_DIR || path.resolve(__dirname, '../../backups');
const RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS, 10) || 30;
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'yatrasathi';
const DB_NAME_TVL = process.env.DB_NAME_TVL || 'TVL_001';

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function dumpDatabase(dbName, outFile) {
  const passwordArg = DB_PASSWORD ? `-p"${DB_PASSWORD}"` : '';
  const cmd = `mysqldump -h ${DB_HOST} -u ${DB_USER} ${passwordArg} --single-transaction --routines --triggers "${dbName}" > "${outFile}"`;
  console.log(`[${new Date().toISOString()}] Dumping ${dbName} → ${outFile}`);
  try {
    execSync(cmd, { stdio: 'pipe', timeout: 300000 }); // 5 min timeout
    const size = (fs.statSync(outFile).size / (1024 * 1024)).toFixed(2);
    console.log(`[${new Date().toISOString()}] ✓ ${dbName} backed up (${size} MB)`);
    return true;
  } catch (err) {
    console.error(`[${new Date().toISOString()}] ✗ Failed to dump ${dbName}: ${err.message}`);
    return false;
  }
}

function compressFile(inFile) {
  const gzFile = `${inFile}.gz`;
  try {
    execSync(`gzip -f "${inFile}"`, { stdio: 'pipe', timeout: 60000 });
    console.log(`[${new Date().toISOString()}] Compressed → ${gzFile}`);
    return gzFile;
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Compression failed: ${err.message}`);
    return inFile;
  }
}

function pruneOldBackups(dir) {
  const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const files = fs.readdirSync(dir).filter(f => f.startsWith('yatrasathi_') || f.startsWith('tvl_'));
  let removed = 0;
  files.forEach(f => {
    const filePath = path.join(dir, f);
    const stat = fs.statSync(filePath);
    if (stat.mtimeMs < cutoff) {
      fs.unlinkSync(filePath);
      console.log(`[${new Date().toISOString()}] Pruned old backup: ${f}`);
      removed++;
    }
  });
  console.log(`[${new Date().toISOString()}] Pruned ${removed} old backup(s)`);
}

// ── Main ────────────────────────────────────────────────────
console.log(`\n[${new Date().toISOString()}] === YatraSathi Backup Start ===`);
ensureDir(BACKUP_DIR);

const mainOut = path.join(BACKUP_DIR, `yatrasathi_${timestamp}.sql`);
const tvlOut = path.join(BACKUP_DIR, `tvl_${timestamp}.sql`);

const ok1 = dumpDatabase(DB_NAME, mainOut);
const ok2 = dumpDatabase(DB_NAME_TVL, tvlOut);

if (ok1) compressFile(mainOut);
if (ok2) compressFile(tvlOut);

pruneOldBackups(BACKUP_DIR);

console.log(`[${new Date().toISOString()}] === YatraSathi Backup Complete ===\n`);
process.exit(ok1 && ok2 ? 0 : 1);
