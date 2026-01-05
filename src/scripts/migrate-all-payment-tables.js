/**
 * Complete Migration Script for Payment System
 * 
 * This script runs all payment-related migrations:
 * 1. Payment table (ptPayment)
 * 2. PaymentAlloc table (paPaymentAlloc)
 * 3. PNR table (pnPnr)
 * 
 * Run this script before starting the server:
 * node src/scripts/migrate-all-payment-tables.js
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function runMigrations() {
  try {
    console.log('🔄 Starting complete payment system migration...\n');

    // Run Payment table migration
    console.log('📋 Step 1/3: Migrating Payment table...');
    try {
      const { stdout, stderr } = await execAsync('node src/scripts/migrate-payment-table.js');
      console.log(stdout);
      if (stderr && !stderr.includes('already exists')) {
        console.error('Warning:', stderr);
      }
    } catch (error) {
      if (error.message.includes('already exists') || error.message.includes('Duplicate')) {
        console.log('✅ Payment table columns already exist');
      } else {
        throw error;
      }
    }

    // Run PaymentAlloc table migration
    console.log('\n📋 Step 2/3: Migrating PaymentAlloc table...');
    try {
      const { stdout, stderr } = await execAsync('node src/scripts/migrate-payment-alloc-table.js');
      console.log(stdout);
      if (stderr && !stderr.includes('already exists')) {
        console.error('Warning:', stderr);
      }
    } catch (error) {
      if (error.message.includes('already exists') || error.message.includes('Duplicate')) {
        console.log('✅ PaymentAlloc table columns already exist');
      } else {
        throw error;
      }
    }

    // Run PNR table migration
    console.log('\n📋 Step 3/3: Migrating PNR table...');
    try {
      const { stdout, stderr } = await execAsync('node src/scripts/migrate-pnr-table.js');
      console.log(stdout);
      if (stderr && !stderr.includes('already exists')) {
        console.error('Warning:', stderr);
      }
    } catch (error) {
      if (error.message.includes('already exists') || error.message.includes('Duplicate')) {
        console.log('✅ PNR table columns already exist');
      } else {
        throw error;
      }
    }

    console.log('\n✅ All payment system migrations completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Verify the migrations: Check database tables');
    console.log('   2. Restart the server: npm start');
    console.log('   3. Test payment recording functionality');

  } catch (error) {
    console.error('\n❌ Migration failed!');
    console.error('Error:', error.message);
    if (error.stdout) console.error('Output:', error.stdout);
    if (error.stderr) console.error('Error output:', error.stderr);
    process.exit(1);
  }
}

// Run migrations
runMigrations();

