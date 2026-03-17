# Project Cleanup Plan - YatraSathi

## Backup Information
- **Backup Location**: `../YatraSathi_Backup_20260304_111934/`
- **Backup Date**: March 4, 2026 11:19:34
- **Backup Status**: ✅ Complete

## File Classification Criteria

### ESSENTIAL FILES (KEEP)
1. **Source Code**
   - All files in `src/` directory
   - All files in `frontend/src/` directory
   - All files in `config/` directory

2. **Configuration Files**
   - package.json, package-lock.json
   - .env, .env.example
   - .gitignore
   - vite.config.js, jsconfig.json
   - Any config files in root

3. **Documentation (Keep Core)**
   - README.md
   - LICENSE (if exists)

4. **Dependencies**
   - node_modules/ (managed by npm)
   - frontend/node_modules/ (managed by npm)

5. **Build Output (Keep for deployment)**
   - frontend/dist/ (if exists)
   - build/ (if exists)

6. **Version Control**
   - .git/ directory
   - .gitignore

7. **Database Schema (Keep Latest)**
   - Core schema files needed for setup

### NON-ESSENTIAL FILES (REMOVE)

1. **Test Scripts (Root Level)**
   - All `test-*.js` files in root directory
   - These are development/debugging scripts, not part of the application

2. **Migration SQL Files (Consolidate)**
   - Multiple incremental migration files
   - Keep only essential schema files
   - Archive old migrations

3. **Documentation Markdown Files (Consolidate)**
   - Multiple fix/completion markdown files
   - These are development logs, not user documentation
   - Keep only essential documentation

4. **Temporary/Debug Files**
   - Any .log files
   - Any .tmp files
   - Any backup files with ~ suffix

5. **OS-Specific Files**
   - .DS_Store files (macOS)
   - Thumbs.db (Windows)

## Files to Remove

### Test Scripts (111 files)
All test-*.js files in root directory - these are development debugging scripts

### Documentation Files (Consolidate to archive)
- Multiple *_COMPLETE.md files
- Multiple *_FIX.md files
- Multiple *_IMPLEMENTATION.md files

### SQL Migration Files (Consolidate)
- Multiple incremental migration files
- Keep only: create-*.sql files for initial setup

## Cleanup Strategy

1. **Phase 1**: Create detailed inventory
2. **Phase 2**: Move non-essential files to archive folder
3. **Phase 3**: Verify application still builds and runs
4. **Phase 4**: If verified, permanently delete archived files
5. **Phase 5**: Document cleanup results

## Safety Measures

1. ✅ Full backup created before any deletion
2. ✅ Two-phase deletion (archive first, then delete)
3. ✅ Build verification after cleanup
4. ✅ Detailed logging of all operations
5. ✅ Ability to restore from backup if needed
