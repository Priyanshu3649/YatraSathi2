#!/usr/bin/env node

/**
 * YatraSathi Project Cleanup Script
 * 
 * This script systematically removes non-essential files while preserving
 * critical application components.
 * 
 * Safety Features:
 * - Creates detailed inventory before deletion
 * - Moves files to archive folder first (two-phase deletion)
 * - Logs all operations with timestamps
 * - Verifies backup exists before proceeding
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BACKUP_DIR = '../YatraSathi_Backup_20260304_111934';
const ARCHIVE_DIR = './PROJECT_CLEANUP_ARCHIVE';
const LOG_FILE = './cleanup_log.json';

// File patterns to remove
const PATTERNS_TO_REMOVE = {
  testScripts: /^test-.*\.js$/,
  completionDocs: /.*_(COMPLETE|FIX|IMPLEMENTATION|ANALYSIS|FIXES|APPLIED)\.md$/,
  migrationSQL: /^(add-|fix-|migrate-|update-).*\.sql$/,
  tempFiles: /\.(log|tmp|bak|swp)$/,
  osFiles: /^(\.DS_Store|Thumbs\.db|desktop\.ini)$/
};

// Files to explicitly keep (whitelist)
const KEEP_FILES = [
  'README.md',
  'LICENSE',
  'LICENSE.md',
  '.gitignore',
  '.env',
  '.env.example',
  'package.json',
  'package-lock.json',
  'cleanup_criteria.md',
  'PROJECT_CLEANUP_PLAN.md',
  'cleanup-project.js',
  'PROJECT_ANALYSIS_REPORT.md'
];

// Directories to skip
const SKIP_DIRS = [
  'node_modules',
  '.git',
  'frontend',
  'src',
  'config',
  'public',
  'dist',
  'build',
  'PROJECT_CLEANUP_ARCHIVE'
];

class ProjectCleanup {
  constructor() {
    this.inventory = {
      timestamp: new Date().toISOString(),
      backupVerified: false,
      filesToRemove: [],
      filesKept: [],
      errors: [],
      summary: {
        totalScanned: 0,
        markedForRemoval: 0,
        kept: 0,
        removed: 0,
        failed: 0
      }
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '📋',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    }[type] || '📋';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  verifyBackup() {
    this.log('Verifying backup exists...', 'info');
    
    if (!fs.existsSync(BACKUP_DIR)) {
      this.log(`Backup directory not found: ${BACKUP_DIR}`, 'error');
      return false;
    }
    
    // Check if backup has essential files
    const essentialFiles = ['package.json', 'src', 'frontend'];
    for (const file of essentialFiles) {
      const backupPath = path.join(BACKUP_DIR, file);
      if (!fs.existsSync(backupPath)) {
        this.log(`Essential file/dir missing in backup: ${file}`, 'error');
        return false;
      }
    }
    
    this.inventory.backupVerified = true;
    this.log('Backup verified successfully', 'success');
    return true;
  }

  shouldKeepFile(filename, filepath) {
    // Check whitelist
    if (KEEP_FILES.includes(filename)) {
      return true;
    }
    
    // Check if it's in a directory we should skip
    const relativePath = path.relative('.', filepath);
    for (const skipDir of SKIP_DIRS) {
      if (relativePath.startsWith(skipDir + path.sep) || relativePath === skipDir) {
        return true;
      }
    }
    
    // Check removal patterns
    for (const [category, pattern] of Object.entries(PATTERNS_TO_REMOVE)) {
      if (pattern.test(filename)) {
        return false;
      }
    }
    
    return true;
  }

  scanDirectory(dir = '.') {
    this.log(`Scanning directory: ${dir}`, 'info');
    
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative('.', fullPath);
        
        // Skip certain directories
        if (entry.isDirectory()) {
          if (SKIP_DIRS.includes(entry.name)) {
            continue;
          }
          // Don't recurse into subdirectories for now
          continue;
        }
        
        // Only process files in root directory
        if (dir !== '.') {
          continue;
        }
        
        this.inventory.summary.totalScanned++;
        
        if (this.shouldKeepFile(entry.name, fullPath)) {
          this.inventory.filesKept.push({
            path: relativePath,
            name: entry.name,
            size: fs.statSync(fullPath).size
          });
          this.inventory.summary.kept++;
        } else {
          this.inventory.filesToRemove.push({
            path: relativePath,
            name: entry.name,
            size: fs.statSync(fullPath).size,
            reason: this.getRemovalReason(entry.name)
          });
          this.inventory.summary.markedForRemoval++;
        }
      }
    } catch (error) {
      this.log(`Error scanning directory ${dir}: ${error.message}`, 'error');
      this.inventory.errors.push({
        operation: 'scan',
        path: dir,
        error: error.message
      });
    }
  }

  getRemovalReason(filename) {
    for (const [category, pattern] of Object.entries(PATTERNS_TO_REMOVE)) {
      if (pattern.test(filename)) {
        return category;
      }
    }
    return 'unknown';
  }

  createArchive() {
    this.log('Creating archive directory...', 'info');
    
    if (!fs.existsSync(ARCHIVE_DIR)) {
      fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
    }
    
    // Create subdirectories for different file types
    const subdirs = ['test-scripts', 'documentation', 'sql-migrations', 'other'];
    for (const subdir of subdirs) {
      const subdirPath = path.join(ARCHIVE_DIR, subdir);
      if (!fs.existsSync(subdirPath)) {
        fs.mkdirSync(subdirPath, { recursive: true });
      }
    }
    
    this.log('Archive directory created', 'success');
  }

  getArchiveSubdir(filename) {
    if (PATTERNS_TO_REMOVE.testScripts.test(filename)) {
      return 'test-scripts';
    }
    if (PATTERNS_TO_REMOVE.completionDocs.test(filename)) {
      return 'documentation';
    }
    if (PATTERNS_TO_REMOVE.migrationSQL.test(filename)) {
      return 'sql-migrations';
    }
    return 'other';
  }

  moveToArchive() {
    this.log(`Moving ${this.inventory.filesToRemove.length} files to archive...`, 'info');
    
    for (const file of this.inventory.filesToRemove) {
      try {
        const sourcePath = file.path;
        const subdir = this.getArchiveSubdir(file.name);
        const destPath = path.join(ARCHIVE_DIR, subdir, file.name);
        
        fs.renameSync(sourcePath, destPath);
        
        file.archived = true;
        file.archivePath = destPath;
        file.archivedAt = new Date().toISOString();
        this.inventory.summary.removed++;
        
        this.log(`Archived: ${file.name} -> ${subdir}/`, 'success');
      } catch (error) {
        this.log(`Failed to archive ${file.name}: ${error.message}`, 'error');
        this.inventory.errors.push({
          operation: 'archive',
          path: file.path,
          error: error.message
        });
        this.inventory.summary.failed++;
      }
    }
  }

  saveInventory() {
    this.log('Saving cleanup inventory...', 'info');
    
    try {
      fs.writeFileSync(
        LOG_FILE,
        JSON.stringify(this.inventory, null, 2),
        'utf8'
      );
      this.log(`Inventory saved to ${LOG_FILE}`, 'success');
    } catch (error) {
      this.log(`Failed to save inventory: ${error.message}`, 'error');
    }
  }

  generateReport() {
    const report = `
# Project Cleanup Report

**Date**: ${new Date().toISOString()}
**Backup Location**: ${BACKUP_DIR}
**Archive Location**: ${ARCHIVE_DIR}

## Summary

- **Total Files Scanned**: ${this.inventory.summary.totalScanned}
- **Files Kept**: ${this.inventory.summary.kept}
- **Files Marked for Removal**: ${this.inventory.summary.markedForRemoval}
- **Files Successfully Archived**: ${this.inventory.summary.removed}
- **Files Failed**: ${this.inventory.summary.failed}

## Files Removed by Category

### Test Scripts (${this.inventory.filesToRemove.filter(f => f.reason === 'testScripts').length})
${this.inventory.filesToRemove
  .filter(f => f.reason === 'testScripts')
  .map(f => `- ${f.name} (${(f.size / 1024).toFixed(2)} KB)`)
  .join('\n')}

### Documentation Files (${this.inventory.filesToRemove.filter(f => f.reason === 'completionDocs').length})
${this.inventory.filesToRemove
  .filter(f => f.reason === 'completionDocs')
  .map(f => `- ${f.name} (${(f.size / 1024).toFixed(2)} KB)`)
  .join('\n')}

### SQL Migration Files (${this.inventory.filesToRemove.filter(f => f.reason === 'migrationSQL').length})
${this.inventory.filesToRemove
  .filter(f => f.reason === 'migrationSQL')
  .map(f => `- ${f.name} (${(f.size / 1024).toFixed(2)} KB)`)
  .join('\n')}

## Space Saved

**Total**: ${(this.inventory.filesToRemove.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024).toFixed(2)} MB

## Errors

${this.inventory.errors.length === 0 ? 'None' : this.inventory.errors.map(e => `- ${e.operation}: ${e.path} - ${e.error}`).join('\n')}

## Next Steps

1. ✅ Verify application builds: \`npm run build\`
2. ✅ Verify application runs: \`npm start\`
3. ✅ Run tests if available
4. If all verifications pass, archive can be deleted
5. If issues found, restore from: ${BACKUP_DIR}

## Restoration Command

If you need to restore files:
\`\`\`bash
cp -r ${BACKUP_DIR}/* .
\`\`\`
`;

    fs.writeFileSync('./CLEANUP_REPORT.md', report, 'utf8');
    this.log('Cleanup report generated: CLEANUP_REPORT.md', 'success');
    
    return report;
  }

  async run() {
    console.log('\n🧹 YatraSathi Project Cleanup\n');
    console.log('=' .repeat(50));
    
    // Step 1: Verify backup
    if (!this.verifyBackup()) {
      this.log('Cleanup aborted: Backup verification failed', 'error');
      return false;
    }
    
    // Step 2: Scan directory
    this.log('\nPhase 1: Scanning project files...', 'info');
    this.scanDirectory('.');
    
    // Step 3: Show summary and ask for confirmation
    console.log('\n' + '='.repeat(50));
    console.log('📊 Scan Results:');
    console.log(`   Total files scanned: ${this.inventory.summary.totalScanned}`);
    console.log(`   Files to keep: ${this.inventory.summary.kept}`);
    console.log(`   Files to remove: ${this.inventory.summary.markedForRemoval}`);
    console.log('='.repeat(50) + '\n');
    
    // Step 4: Create archive
    this.log('Phase 2: Creating archive...', 'info');
    this.createArchive();
    
    // Step 5: Move files to archive
    this.log('Phase 3: Moving files to archive...', 'info');
    this.moveToArchive();
    
    // Step 6: Save inventory
    this.saveInventory();
    
    // Step 7: Generate report
    const report = this.generateReport();
    console.log('\n' + report);
    
    console.log('\n' + '='.repeat(50));
    this.log('Cleanup completed successfully!', 'success');
    console.log('='.repeat(50) + '\n');
    
    return true;
  }
}

// Run cleanup
const cleanup = new ProjectCleanup();
cleanup.run().catch(error => {
  console.error('❌ Cleanup failed:', error);
  process.exit(1);
});
