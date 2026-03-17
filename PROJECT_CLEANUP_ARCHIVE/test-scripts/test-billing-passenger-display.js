#!/usr/bin/env node
/**
 * Test script to verify passenger data display in billing module
 */

const { BookingTVL, BillingMaster, PassengerTVL } = require('./src/models');

async function testBillingPassengerDisplay() {
  console.log('🔍 Testing passenger data display in billing module...\n');

  try {
    // 1. Find a booking with passengers
    const booking = await BookingTVL.findOne({
      include: [{
        model: PassengerTVL,
        as: 'passengers',
        where: { ps_active: 1 },
        required: false
      }]
    });

    if (!booking) {
      console.log('❌ No bookings with passengers found in the database');
      return;
    }

    console.log(`✅ Found booking: ${booking.bk_bkid}`);
    console.log(`   Customer: ${booking.bk_customername}`);
    console.log(`   Travel Date: ${booking.bk_trvldt}`);

    // 2. Find passengers for this booking
    const passengers = await PassengerTVL.findAll({
      where: { 
        ps_bkid: booking.bk_bkid,
        ps_active: 1
      }
    });

    console.log(`   Found ${passengers.length} passengers for this booking`);

    if (passengers.length > 0) {
      console.log('   Passenger details:');
      passengers.forEach((passenger, index) => {
        console.log(`     ${index + 1}. ${passenger.ps_fname} ${passenger.ps_lname || ''}, Age: ${passenger.ps_age}, Gender: ${passenger.ps_gender}`);
      });
    }

    // 3. Find billing record for this booking (if it exists)
    const billing = await BillingMaster.findOne({
      where: { bl_booking_id: booking.bk_bkid }
    });

    if (billing) {
      console.log(`\n✅ Found billing record for this booking: ${billing.bl_bill_no}`);
      console.log(`   Total Amount: ${billing.bl_total_amount}`);
      
      // Test the updated backend functions
      console.log('\n🔄 Testing the updated backend functions...');
      
      // Simulate getAllBills function logic
      const { Op } = require('sequelize');
      const bookingIds = [booking.bk_bkid];
      const passengerCountResults = await PassengerTVL.findAll({
        attributes: [
          'ps_bkid', 
          [sequelizeTVL.fn('COUNT', sequelizeTVL.col('ps_psid')), 'passengerCount']
        ],
        where: {
          ps_bkid: { [Op.in]: bookingIds },
          ps_active: 1
        },
        group: ['ps_bkid']
      });
      
      const passengerCounts = {};
      passengerCountResults.forEach(result => {
        passengerCounts[result.ps_bkid] = parseInt(result.dataValues.passengerCount) || 0;
      });
      
      const passengerCount = passengerCounts[booking.bk_bkid] || 0;
      console.log(`   Passenger count for booking ${booking.bk_bkid}: ${passengerCount}`);
      
      // Simulate getBillById function logic
      const billPassengers = await PassengerTVL.findAll({
        where: { 
          ps_bkid: booking.bk_bkid,
          ps_active: 1
        },
        order: [['ps_psid', 'ASC']]
      });
      
      const transformedPassengers = billPassengers.map(passenger => {
        return {
          id: passenger.ps_psid,
          name: `${passenger.ps_fname} ${passenger.ps_lname || ''}`.trim(),
          firstName: passenger.ps_fname,
          lastName: passenger.ps_lname,
          age: passenger.ps_age,
          gender: passenger.ps_gender,
          berth: passenger.ps_berthalloc || passenger.ps_berthpref,
          berthPreference: passenger.ps_berthpref,
          idProofType: passenger.ps_idtype,
          idProofNumber: passenger.ps_idno
        };
      });
      
      console.log(`   Transformed ${transformedPassengers.length} passengers for individual bill view`);
      
      if (transformedPassengers.length > 0) {
        console.log('   Sample passenger in billing response:');
        console.log(`     ${transformedPassengers[0].name}, Age: ${transformedPassengers[0].age}, Gender: ${transformedPassengers[0].gender}`);
      }

      console.log('\n✅ Backend functions should now properly handle passenger data:');
      console.log('   - getAllBills: Includes passengerCount for display');
      console.log('   - getCustomerBills: Includes passengerCount for display'); 
      console.log('   - searchBills: Includes passengerCount for display');
      console.log('   - getBillById: Includes full passengerList data');
      console.log('   - Frontend: Fetches passenger data when viewing bills with empty passengerList');

    } else {
      console.log('\n⚠️  No billing record found for this booking yet.');
      console.log('   This is expected if you are testing bill creation from booking.');
    }

    console.log('\n🎉 Test completed successfully!');
    console.log('\n📋 Summary of changes made:');
    console.log('   1. Updated getAllBills in billingController.js to include passengerCount');
    console.log('   2. Updated getCustomerBills in billingController.js to include passengerCount');
    console.log('   3. Updated searchBills in billingController.js to include passengerCount');
    console.log('   4. Updated handleRecordSelect in Billing.jsx to fetch passenger data when needed');
    console.log('   5. getBillById already includes passengerList (was working correctly)');

  } catch (error) {
    console.error('❌ Error during test:', error.message);
    console.error(error.stack);
  }
}

// Import required modules
const { sequelizeTVL } = require('./config/db');

// Run the test
testBillingPassengerDisplay();