/**
 * Script to fix the passenger table schema by adding the missing bl_bill_no column
 */

const { mysqlPool } = require('./config/db');

async function fixPassengerSchema() {
  console.log('🔧 Fixing passenger table schema...\n');

  try {
    // Check if bl_bill_no column exists
    const [columns] = await mysqlPool.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'TVL_001' 
      AND TABLE_NAME = 'psXpassenger' 
      AND COLUMN_NAME = 'bl_bill_no'
    `);

    if (columns.length > 0) {
      console.log('✅ Column bl_bill_no already exists in psXpassenger table');
    } else {
      console.log('❌ Column bl_bill_no does not exist in psXpassenger table. Adding it...');
      
      // Add the bl_bill_no column
      await mysqlPool.execute(`
        ALTER TABLE psXpassenger 
        ADD COLUMN bl_bill_no VARCHAR(30) NULL DEFAULT NULL COMMENT 'Billing number associated with this passenger'
      `);
      
      console.log('✅ Column bl_bill_no added to psXpassenger table');
    }

    // Also check if the column exists in the TVL database
    const [columnsTVL] = await mysqlPool.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'psXpassenger' 
      AND COLUMN_NAME = 'bl_bill_no'
    `);

    if (columnsTVL.length === 0) {
      console.log('⚠️  Column bl_bill_no may not exist in current database. Attempting to add it...');
      try {
        await mysqlPool.execute(`
          ALTER TABLE psXpassenger 
          ADD COLUMN bl_bill_no VARCHAR(30) NULL DEFAULT NULL COMMENT 'Billing number associated with this passenger'
        `);
        console.log('✅ Column bl_bill_no added to psXpassenger table in current database');
      } catch (addError) {
        console.log(`⚠️  Could not add column: ${addError.message}`);
      }
    }

    console.log('\n✅ Passenger table schema fix completed!');

  } catch (error) {
    console.error('❌ Error fixing passenger table schema:', error.message);
    console.error(error.stack);
  } finally {
    await mysqlPool.end();
  }
}

// Run the fix
fixPassengerSchema();