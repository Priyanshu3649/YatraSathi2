/**
 * Test script to diagnose booking creation 500 error
 * Run with: node test-booking-creation-error.js
 */

const { BookingTVL, UserTVL, CustomerTVL, PassengerTVL } = require('./src/models');
const { Sequelize } = require('sequelize');
const { sequelize } = require('./src/models/baseModel');

async function testBookingCreation() {
  console.log('🧪 Testing Booking Creation Process...\n');
  
  try {
    // Test 1: Check database connection
    console.log('1️⃣ Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connected\n');
    
    // Test 2: Check if models are loaded
    console.log('2️⃣ Checking if models are loaded...');
    console.log('   BookingTVL:', BookingTVL ? '✅' : '❌');
    console.log('   UserTVL:', UserTVL ? '✅' : '❌');
    console.log('   CustomerTVL:', CustomerTVL ? '✅' : '❌');
    console.log('   PassengerTVL:', PassengerTVL ? '✅' : '❌');
    console.log('');
    
    // Test 3: Check if sequelize.transaction works
    console.log('3️⃣ Testing transaction creation...');
    const transaction = await sequelize.transaction();
    console.log('✅ Transaction created successfully');
    await transaction.rollback();
    console.log('✅ Transaction rollback successful\n');
    
    // Test 4: Try to create a test booking
    console.log('4️⃣ Testing booking creation with mock data...');
    
    // First, get a valid user ID
    const testUser = await UserTVL.findOne({ where: { us_usertype: 'employee' } });
    if (!testUser) {
      console.log('❌ No employee user found in database');
      console.log('   Please ensure you have run the seed script');
      process.exit(1);
    }
    console.log(`✅ Found test user: ${testUser.us_usid}`);
    
    // Create test booking data
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const testBookingNumber = `BK-${year}${month}${day}-${random}`;
    
    const testBookingData = {
      bk_bkno: testBookingNumber,
      bk_usid: testUser.us_usid,
      bk_customername: 'Test Customer',
      bk_phonenumber: '9876543210',
      bk_fromst: 'PLACEHOLDER', // Will be replaced with valid station
      bk_tost: 'PLACEHOLDER', // Will be replaced with valid station
      bk_trvldt: new Date(),
      bk_class: '3A',
      bk_quota: 'GENERAL',
      bk_berthpref: 'LOWER',
      bk_totalpass: 1,
      bk_status: 'DRAFT',
      eby: testUser.us_usid,
      mby: testUser.us_usid
    };
    
    console.log('   Creating test booking...');
    
    // Get valid station codes from database
    const { StationTVL } = require('./src/models');
    const stations = await StationTVL.findAll({ limit: 2 });
    
    if (stations.length < 2) {
      console.log('❌ Not enough stations in database');
      console.log('   Please ensure you have at least 2 stations in the stxstation table');
      process.exit(1);
    }
    
    const fromStation = stations[0].st_stid;
    const toStation = stations[1].st_stid;
    console.log(`   Using stations: ${fromStation} -> ${toStation}`);
    
    testBookingData.bk_fromst = fromStation;
    testBookingData.bk_tost = toStation;
    
    const testBooking = await BookingTVL.create(testBookingData);
    console.log(`✅ Test booking created: ${testBooking.bk_bkid}`);
    
    // Clean up test booking
    console.log('   Cleaning up test booking...');
    await testBooking.destroy();
    console.log('✅ Test booking deleted\n');
    
    // Test 5: Test customer creation
    console.log('5️⃣ Testing customer creation...');
    const testCustomerData = {
      cu_cusid: `TEST_CU_${Date.now()}`,
      cu_usid: testUser.us_usid,
      cu_custno: `CUST_TEST_${Date.now()}`,
      cu_custtype: 'WALK_IN',
      cu_active: 1,
      eby: testUser.us_usid,
      mby: testUser.us_usid
    };
    
    const testCustomer = await CustomerTVL.create(testCustomerData);
    console.log(`✅ Test customer created: ${testCustomer.cu_cusid}`);
    
    // Clean up
    await testCustomer.destroy();
    console.log('✅ Test customer deleted\n');
    
    console.log('✅ All tests passed! Booking creation should work.');
    console.log('\n📋 If you\'re still getting 500 errors, check:');
    console.log('   1. Server console for actual error messages');
    console.log('   2. Database foreign key constraints');
    console.log('   3. Required fields in the request body');
    console.log('   4. User authentication token');
    
  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error('   Error name:', error.name);
    console.error('   Error message:', error.message);
    
    if (error.sql) {
      console.error('   SQL:', error.sql);
    }
    
    if (error.parent) {
      console.error('   Parent error:', error.parent.message);
    }
    
    console.error('\n   Full error:', error);
    
    console.log('\n💡 Common issues:');
    console.log('   - Missing required fields in model');
    console.log('   - Foreign key constraint violations');
    console.log('   - Invalid data types');
    console.log('   - Database connection issues');
    
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run the test
testBookingCreation();
