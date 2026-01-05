/**
 * Migration Script: Update paPaymentAlloc table
 * 
 * This script adds new columns required for the redesigned payment allocation system:
 * - pa_pnr: PNR Number (for quick reference)
 * - pa_alloctn_date: Allocation Date
 * - pa_alloctn_type: Allocation Type (AUTO | MANUAL)
 * - pa_remarks: Allocation Remarks
 * 
 * Run this script before starting the server:
 * node src/scripts/migrate-payment-alloc-table.js
 */

const { sequelize } = require('../../config/db');
const { QueryTypes } = require('sequelize');

async function migratePaymentAllocTable() {
  try {
    console.log('🔄 Starting PaymentAlloc table migration...\n');

    // Check if pa_pnr column exists
    const [pnrCols] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'paPaymentAlloc'
      AND COLUMN_NAME = 'pa_pnr'
    `, { type: QueryTypes.SELECT });

    if (pnrCols && pnrCols.length > 0) {
      console.log('✅ Column pa_pnr already exists');
    } else {
      console.log('➕ Adding pa_pnr column...');
      await sequelize.query(`
        ALTER TABLE paPaymentAlloc 
        ADD COLUMN pa_pnr VARCHAR(15) NULL 
        COMMENT 'PNR Number (for quick reference and validation)'
        AFTER pa_pnid
      `);
      console.log('✅ Added pa_pnr column');
    }

    // Check if pa_alloctn_date column exists
    const [dateCols] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'paPaymentAlloc'
      AND COLUMN_NAME = 'pa_alloctn_date'
    `, { type: QueryTypes.SELECT });

    if (dateCols && dateCols.length > 0) {
      console.log('✅ Column pa_alloctn_date already exists');
    } else {
      console.log('➕ Adding pa_alloctn_date column...');
      await sequelize.query(`
        ALTER TABLE paPaymentAlloc 
        ADD COLUMN pa_alloctn_date DATETIME DEFAULT CURRENT_TIMESTAMP 
        COMMENT 'Allocation Date'
        AFTER pa_amount
      `);
      console.log('✅ Added pa_alloctn_date column');
    }

    // Check if pa_alloctn_type column exists
    const [typeCols] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'paPaymentAlloc'
      AND COLUMN_NAME = 'pa_alloctn_type'
    `, { type: QueryTypes.SELECT });

    if (typeCols && typeCols.length > 0) {
      console.log('✅ Column pa_alloctn_type already exists');
    } else {
      console.log('➕ Adding pa_alloctn_type column...');
      await sequelize.query(`
        ALTER TABLE paPaymentAlloc 
        ADD COLUMN pa_alloctn_type VARCHAR(10) DEFAULT 'MANUAL' 
        COMMENT 'Allocation Type: AUTO (FIFO) | MANUAL (user selected)'
        AFTER pa_alloctn_date
      `);
      console.log('✅ Added pa_alloctn_type column');
    }

    // Check if pa_remarks column exists
    const [remarksCols] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'paPaymentAlloc'
      AND COLUMN_NAME = 'pa_remarks'
    `, { type: QueryTypes.SELECT });

    if (remarksCols && remarksCols.length > 0) {
      console.log('✅ Column pa_remarks already exists');
    } else {
      console.log('➕ Adding pa_remarks column...');
      await sequelize.query(`
        ALTER TABLE paPaymentAlloc 
        ADD COLUMN pa_remarks TEXT NULL 
        COMMENT 'Allocation Remarks'
        AFTER pa_alloctn_type
      `);
      console.log('✅ Added pa_remarks column');
    }

    // Update existing records: populate pa_pnr from PNR table
    console.log('\n🔄 Updating existing records...');
    const [updateResult] = await sequelize.query(`
      UPDATE paPaymentAlloc pa
      INNER JOIN pnPnr p ON pa.pa_pnid = p.pn_pnid
      SET pa.pa_pnr = p.pn_pnr
      WHERE pa.pa_pnr IS NULL AND p.pn_pnr IS NOT NULL
    `);
    console.log(`✅ Updated ${updateResult.affectedRows || 0} existing allocation records with PNR numbers`);

    // Update pa_alloctn_date for existing records
    const [dateUpdateResult] = await sequelize.query(`
      UPDATE paPaymentAlloc 
      SET pa_alloctn_date = edtm 
      WHERE pa_alloctn_date IS NULL
    `);
    console.log(`✅ Updated ${dateUpdateResult.affectedRows || 0} existing allocation records with allocation dates`);

    // Add index on pa_pnr if it doesn't exist
    console.log('\n📊 Adding index on pa_pnr...');
    try {
      await sequelize.query(`
        CREATE INDEX idx_pa_pnr ON paPaymentAlloc(pa_pnr)
      `);
      console.log('✅ Index created on pa_pnr');
    } catch (err) {
      if (err.message.includes('Duplicate key name')) {
        console.log('✅ Index on pa_pnr already exists');
      } else {
        throw err;
      }
    }

    console.log('\n✅ PaymentAlloc table migration completed successfully!');

  } catch (error) {
    console.error('\n❌ Migration failed!');
    console.error('Error:', error.message);
    console.error('\nStack:', error.stack);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run migration
migratePaymentAllocTable();

