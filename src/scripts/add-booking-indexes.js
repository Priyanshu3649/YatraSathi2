/**
 * Script to add required database indexes for booking performance optimization
 */

const { sequelize } = require('../models/baseModel');

async function addIndexes() {
  try {
    console.log('Adding required database indexes for booking performance...');
    
    // Add indexes to bookings table
    await addIndexIfNotExists('bkXbooking', 'idx_booking_customer', 'bk_usid');
    await addIndexIfNotExists('bkXbooking', 'idx_booking_date', 'bk_reqdt');
    await addIndexIfNotExists('bkXbooking', 'idx_booking_status', 'bk_status');
    await addIndexIfNotExists('bkXbooking', 'idx_booking_agent', 'bk_agent');
    
    // Add indexes to passenger table
    await addIndexIfNotExists('psXpassenger', 'idx_passenger_booking', 'ps_bkid');
    await addIndexIfNotExists('psXpassenger', 'idx_passenger_active', 'ps_active');
    
    // Add indexes to user table
    await addIndexIfNotExists('usXuser', 'idx_user_phone', 'us_phone');
    
    console.log('All required indexes have been added successfully!');
  } catch (error) {
    console.error('Error adding indexes:', error);
  } finally {
    await sequelize.close();
  }
}

async function addIndexIfNotExists(tableName, indexName, columnName) {
  try {
    // Check if index already exists
    const [results] = await sequelize.query(`
      SELECT INDEX_NAME 
      FROM INFORMATION_SCHEMA.STATISTICS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = ? 
      AND INDEX_NAME = ?
    `, {
      replacements: [tableName, indexName]
    });
    
    if (results.length === 0) {
      console.log(`Creating index ${indexName} on ${tableName}(${columnName})`);
      await sequelize.query(`CREATE INDEX ${indexName} ON ${tableName} (${columnName})`);
    } else {
      console.log(`Index ${indexName} already exists on ${tableName}`);
    }
  } catch (error) {
    console.error(`Error creating index ${indexName} on ${tableName}:`, error);
  }
}

if (require.main === module) {
  addIndexes();
}

module.exports = { addIndexes, addIndexIfNotExists };