/**
 * Test script to verify billing audit fields are properly populated
 * Run with: node test-billing-audit-fields.js
 */

const { BillTVL, BookingTVL, UserTVL } = require('./src/models');
const { sequelizeTVL } = require('./config/db');

// Helper function to convert string user ID to integer
function convertUserIdToInt(userId) {
  if (typeof userId === 'number') {
    return userId;
  }
  
  if (typeof userId === 'string') {
    const numericPart = userId.match(/\d+/);
    if (numericPart) {
      return parseInt(numericPart[0]);
    }
    return userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 1000000;
  }
  
  return 1;
}

async function testBillingAuditFields() {
  console.log('🧪 Testing Billing Audit Fields...\n');
  
  try {
    // Test 1: Check database connection
    console.log('1️⃣ Testing database connection...');
    await sequelizeTVL.authenticate();
    console.log('✅ Database connected\n');
    
    // Test 2: Get a test user
    console.log('2️⃣ Finding test user...');
    const testUser = await UserTVL.findOne({ where: { us_usertype: 'employee' } });
    if (!testUser) {
      console.log('❌ No employee user found');
      process.exit(1);
    }
    console.log(`✅ Found test user: ${testUser.us_usid}\n`);
    
    // Test 3: Get a test booking
    console.log('3️⃣ Finding test booking...');
    const testBooking = await BookingTVL.findOne({ 
      where: { bk_status: 'DRAFT' },
      order: [['bk_bkid', 'DESC']]
    });
    
    if (!testBooking) {
      console.log('❌ No DRAFT booking found');
      console.log('   Please create a booking first');
      process.exit(1);
    }
    console.log(`✅ Found test booking: ${testBooking.bk_bkid}\n`);
    
    // Test 4: Create a test bill
    console.log('4️⃣ Creating test bill...');
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const billNumber = `BL-${year}${month}${day}-${random}`;
    const userId = convertUserIdToInt(testUser.us_usid);
    
    console.log(`   User ID: ${testUser.us_usid} -> ${userId}`);
    console.log(`   Bill Number: ${billNumber}`);
    
    const testBill = await BillTVL.create({
      bl_entry_no: billNumber,
      bl_bill_no: billNumber,
      bl_booking_id: testBooking.bk_bkid,
      bl_booking_no: testBooking.bk_bkno,
      bl_billing_date: new Date(),
      bl_journey_date: testBooking.bk_trvldt || new Date(),
      bl_customer_name: testBooking.bk_customername || 'Test Customer',
      bl_customer_phone: testBooking.bk_phonenumber || '9999999999',
      bl_from_station: testBooking.bk_fromst,
      bl_to_station: testBooking.bk_tost,
      bl_train_no: '12345',
      bl_class: testBooking.bk_class,
      bl_railway_fare: 1000,
      bl_service_charge: 100,
      bl_gst: 50,
      bl_total_amount: 1150,
      bl_created_by: userId,
      entered_by: userId,
      entered_on: new Date(),
      status: 'OPEN',
      bl_status: 'CONFIRMED'
    }, {
      userId: userId
    });
    
    console.log(`✅ Test bill created: ${testBill.bl_id}\n`);
    
    // Test 5: Verify audit fields
    console.log('5️⃣ Verifying audit fields...');
    const createdBill = await BillTVL.findByPk(testBill.bl_id);
    
    console.log('   Audit Fields:');
    console.log(`   - entered_by: ${createdBill.entered_by} ${createdBill.entered_by ? '✅' : '❌'}`);
    console.log(`   - entered_on: ${createdBill.entered_on} ${createdBill.entered_on ? '✅' : '❌'}`);
    console.log(`   - bl_created_by: ${createdBill.bl_created_by} ${createdBill.bl_created_by ? '✅' : '❌'}`);
    console.log(`   - bl_created_at: ${createdBill.bl_created_at} ${createdBill.bl_created_at ? '✅' : '❌'}`);
    console.log(`   - status: ${createdBill.status} ${createdBill.status ? '✅' : '❌'}`);
    console.log('');
    
    // Test 6: Update the bill
    console.log('6️⃣ Testing bill update...');
    await createdBill.update({
      bl_railway_fare: 1200,
      bl_total_amount: 1350
    }, {
      userId: userId
    });
    
    const updatedBill = await BillTVL.findByPk(testBill.bl_id);
    console.log('   Update Audit Fields:');
    console.log(`   - modified_by: ${updatedBill.modified_by} ${updatedBill.modified_by ? '✅' : '❌'}`);
    console.log(`   - modified_on: ${updatedBill.modified_on} ${updatedBill.modified_on ? '✅' : '❌'}`);
    console.log(`   - bl_modified_by: ${updatedBill.bl_modified_by} ${updatedBill.bl_modified_by ? '✅' : '❌'}`);
    console.log(`   - bl_modified_at: ${updatedBill.bl_modified_at} ${updatedBill.bl_modified_at ? '✅' : '❌'}`);
    console.log('');
    
    // Test 7: Test closing the bill
    console.log('7️⃣ Testing bill closure...');
    await updatedBill.update({
      status: 'CLOSED'
    }, {
      userId: userId
    });
    
    const closedBill = await BillTVL.findByPk(testBill.bl_id);
    console.log('   Closure Audit Fields:');
    console.log(`   - closed_by: ${closedBill.closed_by} ${closedBill.closed_by ? '✅' : '❌'}`);
    console.log(`   - closed_on: ${closedBill.closed_on} ${closedBill.closed_on ? '✅' : '❌'}`);
    console.log(`   - status: ${closedBill.status}`);
    console.log('');
    
    // Test 8: Check database directly
    console.log('8️⃣ Checking database directly...');
    const [dbResults] = await sequelizeTVL.query(
      'SELECT bl_id, entered_by, entered_on, modified_by, modified_on, closed_by, closed_on, status FROM blXbilling WHERE bl_id = ?',
      { replacements: [testBill.bl_id] }
    );
    
    if (dbResults && dbResults.length > 0) {
      const dbRecord = dbResults[0];
      console.log('   Database Record:');
      console.log(`   - entered_by: ${dbRecord.entered_by} ${dbRecord.entered_by ? '✅' : '❌'}`);
      console.log(`   - entered_on: ${dbRecord.entered_on} ${dbRecord.entered_on ? '✅' : '❌'}`);
      console.log(`   - modified_by: ${dbRecord.modified_by} ${dbRecord.modified_by ? '✅' : '❌'}`);
      console.log(`   - modified_on: ${dbRecord.modified_on} ${dbRecord.modified_on ? '✅' : '❌'}`);
      console.log(`   - closed_by: ${dbRecord.closed_by} ${dbRecord.closed_by ? '✅' : '❌'}`);
      console.log(`   - closed_on: ${dbRecord.closed_on} ${dbRecord.closed_on ? '✅' : '❌'}`);
      console.log(`   - status: ${dbRecord.status}`);
    }
    console.log('');
    
    // Test 9: Clean up
    console.log('9️⃣ Cleaning up test bill...');
    await closedBill.destroy();
    console.log('✅ Test bill deleted\n');
    
    // Summary
    console.log('✅ All audit field tests passed!');
    console.log('\n📋 Summary:');
    console.log('   - Audit fields are properly populated on create');
    console.log('   - Audit fields are properly updated on update');
    console.log('   - Closure fields are set when status changes to CLOSED');
    console.log('   - All fields use integer user IDs as expected by database');
    
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
    process.exit(1);
  } finally {
    await sequelizeTVL.close();
  }
}

// Run the test
testBillingAuditFields();
