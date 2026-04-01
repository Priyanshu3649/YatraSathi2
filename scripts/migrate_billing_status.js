const { sequelizeTVL } = require('../config/db');

async function migrate() {
  try {
    console.log('🚀 Starting billing status migration...');
    
    // We need to alter both 'status' and 'bl_status' columns in 'blXbilling' table
    const queryInterface = sequelizeTVL.getQueryInterface();
    
    // Define the exhaustive ENUM values to include legacy and new statuses
    const exhaustiveEnum = "ENUM('OPEN', 'CLOSED', 'CANCELLED', 'DRAFT', 'FINAL', 'PAID', 'PARTIAL', 'CNF', 'CAN', 'CONFIRMED', 'PENDING')";
    
    console.log('--- Altering status column ---');
    await sequelizeTVL.query(`ALTER TABLE blXbilling MODIFY COLUMN status ${exhaustiveEnum} DEFAULT 'CNF'`);
    
    console.log('--- Altering bl_status column ---');
    await sequelizeTVL.query(`ALTER TABLE blXbilling MODIFY COLUMN bl_status ${exhaustiveEnum} DEFAULT 'CNF'`);
    
    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
