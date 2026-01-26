#!/usr/bin/env node

/**
 * Script to check the actual database table structure for billing
 */

console.log('🔍 Checking actual billing table structure...');
const { sequelizeTVL } = require('./config/db');

async function checkTableStructure() {
  try {
    await sequelizeTVL.authenticate();
    console.log('✅ Database connection successful\n');
    
    // Get table structure
    console.log('Fetching blXbilling table structure...');
    const [results] = await sequelizeTVL.query("DESCRIBE blXbilling;");
    
    console.log('blXbilling table structure:');
    console.table(results);
    
    console.log('\nAlternative: Show columns from blXbilling:');
    const [columns] = await sequelizeTVL.query("SHOW COLUMNS FROM blXbilling;");
    console.table(columns);
    
  } catch (error) {
    console.error('❌ Error checking table structure:', error.message);
  } finally {
    await sequelizeTVL.close();
  }
}

checkTableStructure();