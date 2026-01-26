/**
 * Migration Script: Add PNR field to Booking table
 * 
 * This script adds the missing bk_pnr column to the booking table.
 * 
 * Run this script before starting the server:
 * node src/scripts/add-pnr-to-booking.js
 */

const { sequelizeTVL } = require('../../config/db');
const { QueryTypes } = require('sequelize');

async function addPnrToBooking() {
  try {
    console.log('🔄 Starting PNR field addition to booking table...\n');

    // Check if bk_pnr column exists
    const [pnrCols] = await sequelizeTVL.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'bkXbooking'
      AND COLUMN_NAME = 'bk_pnr'
    `, { type: QueryTypes.SELECT });

    if (pnrCols && pnrCols.length > 0) {
      console.log('✅ Column bk_pnr already exists');
    } else {
      console.log('➕ Adding bk_pnr column...');
      await sequelizeTVL.query(`
        ALTER TABLE bkXbooking 
        ADD COLUMN bk_pnr VARCHAR(15) NULL 
        COMMENT 'PNR Number'
        AFTER bk_remarks
      `);
      console.log('✅ Added bk_pnr column');
    }

    console.log('\n✅ PNR field addition completed successfully!');

  } catch (error) {
    console.error('\n❌ Migration failed!');
    console.error('Error:', error.message);
    console.error('\nStack:', error.stack);
    process.exit(1);
  } finally {
    await sequelizeTVL.close();
  }
}

// Run migration
addPnrToBooking();