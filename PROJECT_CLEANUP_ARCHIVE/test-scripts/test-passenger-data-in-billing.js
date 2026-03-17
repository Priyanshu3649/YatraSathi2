/**
 * Test script to verify passenger data is fetched correctly in billing
 */

const { BillingMaster, BookingTVL, Passenger } = require('./src/models');
const { sequelizeTVL } = require('./config/db');

async function testPassengerDataInBilling() {
  console.log('🔍 Testing Passenger Data in Billing System...\n');

  try {
    await sequelizeTVL.authenticate();
    console.log('✅ Database connection successful.\n');

    // Test 1: Get a bill with booking ID
    console.log('📋 Test 1: Fetching bills with booking IDs...');
    const bills = await BillingMaster.findAll({
      limit: 5
    });

    if (bills.length === 0) {
      console.log('❌ No bills found in database.');
      return;
    }

    console.log(`Found ${bills.length} bills\n`);

    // Test 2: Check passenger data for each bill
    for (const bill of bills) {
      console.log(`\n--- Bill: ${bill.bl_bill_no} ---`);
      console.log(`Booking ID: ${bill.bl_booking_id}`);
      
      // Try fetching passengers by billing number
      if (bill.bl_bill_no) {
        console.log(`\nTrying by billing number: ${bill.bl_bill_no}`);
        const passengersByBill = await Passenger.getByBillingNumber(bill.bl_bill_no);
        
        if (passengersByBill.success && passengersByBill.passengers.length > 0) {
          console.log(`✅ Found ${passengersByBill.passengers.length} passengers by billing number:`);
          passengersByBill.passengers.slice(0, 3).forEach(p => {
            console.log(`   - ${p.ps_fname} ${p.ps_lname || ''}, Age: ${p.ps_age}, Gender: ${p.ps_gender}`);
          });
        } else {
          console.log('⚠️  No passengers found by billing number');
        }
      }

      // Try fetching passengers by booking ID
      if (bill.bl_booking_id) {
        console.log(`\nTrying by booking ID: ${bill.bl_booking_id}`);
        const passengersByBooking = await Passenger.getByBookingId(bill.bl_booking_id);
        
        if (passengersByBooking.success && passengersByBooking.passengers.length > 0) {
          console.log(`✅ Found ${passengersByBooking.passengers.length} passengers by booking ID:`);
          passengersByBooking.passengers.slice(0, 3).forEach(p => {
            console.log(`   - ${p.ps_fname} ${p.ps_lname || ''}, Age: ${p.ps_age}, Gender: ${p.ps_gender}`);
          });
        } else {
          console.log('⚠️  No passengers found by booking ID');
        }
      }
    }

    // Test 3: Verify bl_bill_no column exists in passenger table
    console.log('\n\n📊 Test 3: Verifying passenger table schema...');
    const [columns] = await sequelizeTVL.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'psXpassenger' 
      AND COLUMN_NAME = 'bl_bill_no'
    `);

    if (columns.length > 0) {
      console.log('✅ Column bl_bill_no exists in psXpassenger table');
    } else {
      console.log('❌ Column bl_bill_no DOES NOT exist in psXpassenger table');
    }

    // Test 4: Sample passenger data check
    console.log('\n\n📊 Test 4: Checking sample passenger records...');
    const [samplePassengers] = await sequelizeTVL.query(`
      SELECT ps_psid, ps_bkid, ps_fname, ps_lname, bl_bill_no 
      FROM psXpassenger 
      WHERE bl_bill_no IS NOT NULL 
      LIMIT 5
    `);

    if (samplePassengers.length > 0) {
      console.log(`✅ Found ${samplePassengers.length} passengers with billing numbers:`);
      samplePassengers.forEach(p => {
        console.log(`   - Passenger: ${p.ps_fname} ${p.ps_lname || ''}, Billing No: ${p.bl_bill_no}`);
      });
    } else {
      console.log('⚠️  No passengers found with billing numbers linked');
    }

    console.log('\n✅ All tests completed!\n');

  } catch (error) {
    console.error('❌ Error testing passenger data:', error.message);
    console.error(error.stack);
  } finally {
    await sequelizeTVL.close();
  }
}

// Run the test
testPassengerDataInBilling();