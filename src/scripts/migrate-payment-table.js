/**
 * Migration Script: Add new columns to ptPayment table
 * 
 * This script adds the new columns required for the redesigned payment system:
 * - pt_usid: Customer User ID (direct reference)
 * - pt_unallocated_amt: Unallocated advance amount
 * - pt_acct_period: Accounting period (YYYY-MM)
 * - pt_rcvby: Received By (User ID who recorded the payment)
 * 
 * Run this script before starting the server:
 * node src/scripts/migrate-payment-table.js
 */

const { sequelize } = require('../../config/db');
const { QueryTypes } = require('sequelize');

async function migratePaymentTable() {
  try {
    console.log('🔄 Starting Payment table migration...\n');

    // Check if pt_usid column exists
    const [columns] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'ptPayment'
      AND COLUMN_NAME = 'pt_usid'
    `, { type: QueryTypes.SELECT });

    if (columns && columns.length > 0) {
      console.log('✅ Column pt_usid already exists');
    } else {
      console.log('➕ Adding pt_usid column...');
      await sequelize.query(`
        ALTER TABLE ptPayment 
        ADD COLUMN pt_usid VARCHAR(15) NULL 
        COMMENT 'Customer User ID (who made the payment)'
        AFTER pt_ptid
      `);
      console.log('✅ Added pt_usid column');
    }

    // Check if pt_unallocated_amt column exists
    const [unallocatedCols] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'ptPayment'
      AND COLUMN_NAME = 'pt_unallocated_amt'
    `, { type: QueryTypes.SELECT });

    if (unallocatedCols && unallocatedCols.length > 0) {
      console.log('✅ Column pt_unallocated_amt already exists');
    } else {
      console.log('➕ Adding pt_unallocated_amt column...');
      await sequelize.query(`
        ALTER TABLE ptPayment 
        ADD COLUMN pt_unallocated_amt DECIMAL(15,2) DEFAULT 0 
        COMMENT 'Unallocated Amount (advance payment)'
        AFTER pt_amount
      `);
      console.log('✅ Added pt_unallocated_amt column');
    }

    // Check if pt_acct_period column exists
    const [periodCols] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'ptPayment'
      AND COLUMN_NAME = 'pt_acct_period'
    `, { type: QueryTypes.SELECT });

    if (periodCols && periodCols.length > 0) {
      console.log('✅ Column pt_acct_period already exists');
    } else {
      console.log('➕ Adding pt_acct_period column...');
      await sequelize.query(`
        ALTER TABLE ptPayment 
        ADD COLUMN pt_acct_period VARCHAR(7) NULL 
        COMMENT 'Accounting Period (YYYY-MM format)'
        AFTER pt_status
      `);
      console.log('✅ Added pt_acct_period column');
    }

    // Update existing records: populate pt_usid from Account table if pt_acid exists
    console.log('\n🔄 Updating existing records...');
    const [updateResult] = await sequelize.query(`
      UPDATE ptPayment p
      INNER JOIN acAccount a ON p.pt_acid = a.ac_acid
      SET p.pt_usid = a.ac_usid
      WHERE p.pt_usid IS NULL AND p.pt_acid IS NOT NULL
    `);
    console.log(`✅ Updated ${updateResult.affectedRows || 0} existing payment records with customer IDs`);

    // Set pt_usid to NOT NULL after populating data
    console.log('\n🔒 Making pt_usid NOT NULL...');
    try {
      await sequelize.query(`
        ALTER TABLE ptPayment 
        MODIFY COLUMN pt_usid VARCHAR(15) NOT NULL 
        COMMENT 'Customer User ID (who made the payment)'
      `);
      console.log('✅ pt_usid is now NOT NULL');
    } catch (err) {
      if (err.message.includes('cannot be null')) {
        console.log('⚠️  Warning: Some records have NULL pt_usid. Please update them manually.');
        console.log('   You can set pt_usid for records where pt_acid is NULL:');
        console.log('   UPDATE ptPayment SET pt_usid = \'CUSTOMER_ID\' WHERE pt_usid IS NULL;');
      } else {
        throw err;
      }
    }

    // Check if pt_rcvby column exists
    const [rcvbyCols] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'ptPayment'
      AND COLUMN_NAME = 'pt_rcvby'
    `, { type: QueryTypes.SELECT });

    if (rcvbyCols && rcvbyCols.length > 0) {
      console.log('✅ Column pt_rcvby already exists');
    } else {
      console.log('➕ Adding pt_rcvby column...');
      await sequelize.query(`
        ALTER TABLE ptPayment 
        ADD COLUMN pt_rcvby VARCHAR(15) NULL 
        COMMENT 'Received By (User ID who recorded the payment)'
        AFTER pt_paydt
      `);
      console.log('✅ Added pt_rcvby column');
    }

    // Add index on pt_usid if it doesn't exist
    console.log('\n📊 Adding index on pt_usid...');
    try {
      await sequelize.query(`
        CREATE INDEX idx_pt_usid ON ptPayment(pt_usid)
      `);
      console.log('✅ Index created on pt_usid');
    } catch (err) {
      if (err.message.includes('Duplicate key name')) {
        console.log('✅ Index on pt_usid already exists');
      } else {
        throw err;
      }
    }

    console.log('\n✅ Payment table migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Verify the migration: SELECT * FROM ptPayment LIMIT 5;');
    console.log('   2. Check that all records have pt_usid populated');
    console.log('   3. Restart the server: npm start');

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
migratePaymentTable();

