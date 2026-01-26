#!/usr/bin/env node

/**
 * Test script to verify the BillTVL model works with the actual database
 */

console.log('🧪 Testing BillTVL model with actual database...');

const { BillTVL } = require('./src/models');

async function testModel() {
  try {
    console.log('Connecting to database...');
    await BillTVL.sequelize.authenticate();
    console.log('✅ Database connection successful\n');
    
    console.log('Testing basic query...');
    const count = await BillTVL.count();
    console.log(`✅ Found ${count} records in blXbilling table`);
    
    if (count > 0) {
      console.log('Testing find first record...');
      const firstRecord = await BillTVL.findOne();
      console.log('✅ Retrieved first record successfully');
      console.log('Sample record:', JSON.stringify(firstRecord.toJSON(), null, 2));
    }
    
    console.log('\n✅ BillTVL model is working correctly with the database!');
    
  } catch (error) {
    console.error('❌ Error occurred:', error.message);
    console.error('Full error:', error);
  } finally {
    await BillTVL.sequelize.close();
  }
}

testModel();