/**
 * Migration Script: Update pnPnr table for payment tracking
 * 
 * This script adds new columns required for payment status tracking:
 * - pn_paidamt: Paid Amount
 * - pn_pendingamt: Pending Amount
 * - pn_payment_status: Payment Status (UNPAID | PARTIAL | PAID)
 * - pn_closed_flag: Closed Flag (Y/N)
 * - pn_fyear: Financial Year
 * 
 * Run this script before starting the server:
 * node src/scripts/migrate-pnr-table.js
 */

const { sequelize } = require('../../config/db');
const { QueryTypes } = require('sequelize');

async function migratePnrTable() {
  try {
    console.log('🔄 Starting PNR table migration...\n');

    // Check if pn_paidamt column exists
    const [paidCols] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'pnPnr'
      AND COLUMN_NAME = 'pn_paidamt'
    `, { type: QueryTypes.SELECT });

    if (paidCols && paidCols.length > 0) {
      console.log('✅ Column pn_paidamt already exists');
    } else {
      console.log('➕ Adding pn_paidamt column...');
      await sequelize.query(`
        ALTER TABLE pnPnr 
        ADD COLUMN pn_paidamt DECIMAL(12,2) DEFAULT 0 
        COMMENT 'Paid Amount'
        AFTER pn_totamt
      `);
      console.log('✅ Added pn_paidamt column');
    }

    // Check if pn_pendingamt column exists
    const [pendingCols] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'pnPnr'
      AND COLUMN_NAME = 'pn_pendingamt'
    `, { type: QueryTypes.SELECT });

    if (pendingCols && pendingCols.length > 0) {
      console.log('✅ Column pn_pendingamt already exists');
    } else {
      console.log('➕ Adding pn_pendingamt column...');
      await sequelize.query(`
        ALTER TABLE pnPnr 
        ADD COLUMN pn_pendingamt DECIMAL(12,2) DEFAULT 0 
        COMMENT 'Pending Amount'
        AFTER pn_paidamt
      `);
      console.log('✅ Added pn_pendingamt column');
    }

    // Check if pn_payment_status column exists
    const [statusCols] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'pnPnr'
      AND COLUMN_NAME = 'pn_payment_status'
    `, { type: QueryTypes.SELECT });

    if (statusCols && statusCols.length > 0) {
      console.log('✅ Column pn_payment_status already exists');
    } else {
      console.log('➕ Adding pn_payment_status column...');
      await sequelize.query(`
        ALTER TABLE pnPnr 
        ADD COLUMN pn_payment_status VARCHAR(15) DEFAULT 'UNPAID' 
        COMMENT 'Payment Status (UNPAID | PARTIAL | PAID)'
        AFTER pn_pendingamt
      `);
      console.log('✅ Added pn_payment_status column');
    }

    // Check if pn_closed_flag column exists
    const [closedCols] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'pnPnr'
      AND COLUMN_NAME = 'pn_closed_flag'
    `, { type: QueryTypes.SELECT });

    if (closedCols && closedCols.length > 0) {
      console.log('✅ Column pn_closed_flag already exists');
    } else {
      console.log('➕ Adding pn_closed_flag column...');
      await sequelize.query(`
        ALTER TABLE pnPnr 
        ADD COLUMN pn_closed_flag VARCHAR(1) DEFAULT 'N' 
        COMMENT 'Closed Flag (Y/N)'
        AFTER pn_payment_status
      `);
      console.log('✅ Added pn_closed_flag column');
    }

    // Check if pn_fyear column exists
    const [fyearCols] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'pnPnr'
      AND COLUMN_NAME = 'pn_fyear'
    `, { type: QueryTypes.SELECT });

    if (fyearCols && fyearCols.length > 0) {
      console.log('✅ Column pn_fyear already exists');
    } else {
      console.log('➕ Adding pn_fyear column...');
      await sequelize.query(`
        ALTER TABLE pnPnr 
        ADD COLUMN pn_fyear VARCHAR(10) NULL 
        COMMENT 'Financial Year'
        AFTER pn_closed_flag
      `);
      console.log('✅ Added pn_fyear column');
    }

    // Initialize existing records: Calculate paid amount from allocations
    console.log('\n🔄 Initializing existing PNR records...');
    const [initResult] = await sequelize.query(`
      UPDATE pnPnr p
      LEFT JOIN (
        SELECT pa_pnid, SUM(pa_amount) as total_paid
        FROM paPaymentAlloc
        GROUP BY pa_pnid
      ) alloc ON p.pn_pnid = alloc.pa_pnid
      SET 
        p.pn_paidamt = COALESCE(alloc.total_paid, 0),
        p.pn_pendingamt = GREATEST(0, p.pn_totamt - COALESCE(alloc.total_paid, 0)),
        p.pn_payment_status = CASE
          WHEN COALESCE(alloc.total_paid, 0) = 0 THEN 'UNPAID'
          WHEN COALESCE(alloc.total_paid, 0) >= p.pn_totamt THEN 'PAID'
          ELSE 'PARTIAL'
        END
      WHERE p.pn_payment_status IS NULL OR p.pn_payment_status = ''
    `);
    console.log(`✅ Initialized ${initResult.affectedRows || 0} existing PNR records with payment status`);

    console.log('\n✅ PNR table migration completed successfully!');

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
migratePnrTable();

