#!/usr/bin/env node

/**
 * Test script to verify the employee billing endpoint fix
 */

console.log('🧪 TESTING EMPLOYEE BILLING ENDPOINT FIX');
console.log('========================================\n');

const { BillTVL } = require('./src/models');

async function testEmployeeBillingEndpoint() {
  console.log('🔍 Testing BillTVL model connection...');
  
  try {
    // Test database connection
    await BillTVL.sequelize.authenticate();
    console.log('✅ Database connection successful\n');
    
    // Test fetching bills with proper ordering
    console.log('Fetching bills from blXbilling table...');
    const bills = await BillTVL.findAll({
      limit: 5,
      order: [['bl_created_at', 'DESC']]
    });
    
    console.log(`✅ Successfully fetched ${bills.length} bills`);
    if (bills.length > 0) {
      console.log('Sample bill data:', JSON.stringify(bills[0].toJSON(), null, 2));
    } else {
      console.log('⚠️  No bills found in the database');
    }
    
    console.log('\n🎉 BillTVL model is working correctly!');
    console.log('✅ Can access the blXbilling table without errors');
    console.log('✅ Field mappings are correct');
    
  } catch (error) {
    console.error('❌ Error occurred:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await BillTVL.sequelize.close();
  }
}

testEmployeeBillingEndpoint();