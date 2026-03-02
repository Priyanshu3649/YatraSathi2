/**
 * Script to test actual data being fetched by the frontend
 */

const { BookingTVL, BillingMaster, PassengerTVL: Passenger } = require('./src/models');
const { sequelizeTVL } = require('./config/db');

async function testActualData() {
  console.log('🔍 Testing Actual Data Being Fetched by Frontend...\n');

  try {
    await sequelizeTVL.authenticate();
    console.log('✅ Database connection successful.\n');

    // Test 1: Get confirmed bookings
    console.log('📊 Testing CONFIRMED bookings...');
    const confirmedBookings = await BookingTVL.findAll({
      where: { bk_status: 'CONFIRMED' },
      limit: 5
    });
    console.log(`Found ${confirmedBookings.length} CONFIRMED bookings:`);
    confirmedBookings.forEach(booking => {
      console.log(`  - Booking ID: ${booking.bk_bkid}, Booking No: ${booking.bk_bkno}, Status: ${booking.bk_status}`);
    });

    // Test 2: Check if these confirmed bookings have corresponding bills
    console.log('\n📋 Testing booking-billing relationship...');
    for (const booking of confirmedBookings) {
      const bill = await BillingMaster.findOne({
        where: { bl_booking_id: booking.bk_bkid }
      });
      
      if (bill) {
        console.log(`  ✅ Booking ${booking.bk_bkid} has bill: ${bill.bl_bill_no}`);
      } else {
        console.log(`  ❌ Booking ${booking.bk_bkid} has NO bill!`);
      }
    }

    // Test 3: Check billing records
    console.log('\n📋 Testing billing records...');
    const bills = await BillingMaster.findAll({
      limit: 5
    });
    
    console.log(`Found ${bills.length} bills:`);
    bills.forEach(bill => {
      console.log(`  - Bill ID: ${bill.bl_id}, Bill No: ${bill.bl_bill_no}, Booking ID: ${bill.bl_booking_id}`);
    });

    // Test 4: Check passenger records by bill number if they exist
    console.log('\n🔍 Testing passenger records by bill number...');
    for (const bill of bills.slice(0, 3)) {
      if (bill.bl_bill_no) {
        try {
          const passengers = await Passenger.findAll({
            where: { bl_bill_no: bill.bl_bill_no }
          });
          console.log(`  Bill ${bill.bl_bill_no} has ${passengers.length} associated passengers`);
          
          if (passengers.length > 0) {
            console.log(`    Sample passenger: ${passengers[0].ps_name} (ID: ${passengers[0].ps_psid})`);
          }
        } catch (error) {
          console.log(`  ⚠️  Error querying passengers by bill number: ${error.message}`);
          console.log(`     Trying to query passengers by booking ID instead...`);
          
          // Try to get passengers by booking ID
          const passengersByBooking = await Passenger.findAll({
            where: { ps_bkid: bill.bl_booking_id }
          });
          console.log(`  Bill ${bill.bl_bill_no} has ${passengersByBooking.length} associated passengers (by booking ID)`);
        }
      }
    }

    // Test 5: Check for bookings that might have been confirmed without bills
    console.log('\n🔍 Checking for problematic bookings (CONFIRMED without bills)...');
    for (const booking of confirmedBookings) {
      const bill = await BillingMaster.findOne({
        where: { bl_booking_id: booking.bk_bkid }
      });
      
      if (!bill) {
        console.log(`  ❌ Confirmed booking ${booking.bk_bkid} has NO bill! Status: ${booking.bk_status}, Billed flag: ${booking.bk_billed}`);
      }
    }

    // Test 6: Check total counts
    const totalBookings = await BookingTVL.count();
    const totalConfirmedBookings = await BookingTVL.count({ where: { bk_status: 'CONFIRMED' }});
    const totalBills = await BillingMaster.count();
    
    console.log(`\n📈 TOTAL COUNTS:`);
    console.log(`  - Total bookings: ${totalBookings}`);
    console.log(`  - Confirmed bookings: ${totalConfirmedBookings}`);
    console.log(`  - Total bills: ${totalBills}`);
    console.log(`  - Ratio: ${totalConfirmedBookings > 0 ? (totalBills / totalConfirmedBookings * 100).toFixed(2) + '%' : 'N/A'} of confirmed bookings have bills`);

  } catch (error) {
    console.error('❌ Error testing actual data:', error.message);
    console.error(error.stack);
  } finally {
    await sequelizeTVL.close();
  }
}

// Run the test
testActualData();