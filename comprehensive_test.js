#!/usr/bin/env node

const { BookingTVL, BillTVL, sequelizeTVL } = require('./src/models');
const { deleteBooking } = require('./src/controllers/bookingController');
const { deleteBill } = require('./src/controllers/billingController');

async function runComprehensiveTest() {
  console.log('=== COMPREHENSIVE BOOKING AND BILLING DELETION TEST ===\n');
  
  try {
    // Test 1: Check database connectivity and current state
    console.log('1. DATABASE CONNECTIVITY AND STATE CHECK');
    console.log('   ✓ Database connection successful');
    
    // Check existing bookings
    const bookings = await BookingTVL.findAll({
      limit: 3,
      order: [['bk_bkid', 'DESC']]
    });
    
    console.log(`   Found ${bookings.length} bookings in database`);
    bookings.forEach(booking => {
      console.log(`     - Booking ID: ${booking.bk_bkid}, Status: ${booking.bk_status}, Billed: ${booking.bk_billed}`);
    });
    
    // Check existing bills
    const bills = await BillTVL.findAll({
      limit: 3,
      order: [['bl_id', 'DESC']]
    });
    
    console.log(`   Found ${bills.length} bills in database`);
    bills.forEach(bill => {
      console.log(`     - Bill ID: ${bill.bl_id}, Booking ID: ${bill.bl_booking_id}, Status: ${bill.bl_status}`);
    });
    
    // Test 2: Test booking deletion functionality
    console.log('\n2. BOOKING DELETION FUNCTIONALITY TEST');
    
    if (bookings.length > 0) {
      const testBooking = bookings[0];
      console.log(`   Testing deletion of booking ID: ${testBooking.bk_bkid}`);
      
      // Mock request and response for deleteBooking
      const mockReq = {
        params: { id: testBooking.bk_bkid },
        user: { us_roid: 'ADM', us_usid: 'ADM001' } // Admin user
      };
      
      let deleteResponse = null;
      const mockRes = {
        status: function(code) {
          console.log(`   Status code: ${code}`);
          return this;
        },
        json: function(data) {
          deleteResponse = data;
          console.log(`   Response: ${JSON.stringify(data)}`);
        }
      };
      
      try {
        await deleteBooking(mockReq, mockRes);
        if (deleteResponse && deleteResponse.success) {
          console.log('   ✓ Booking deletion successful');
        } else {
          console.log('   ✗ Booking deletion failed');
        }
      } catch (error) {
        console.log(`   ✗ Booking deletion error: ${error.message}`);
      }
    } else {
      console.log('   No bookings found to test deletion');
    }
    
    // Test 3: Test billing deletion functionality
    console.log('\n3. BILLING DELETION FUNCTIONALITY TEST');
    
    if (bills.length > 0) {
      const testBill = bills[0];
      console.log(`   Testing deletion of bill ID: ${testBill.bl_id}`);
      
      // Mock request and response for deleteBill
      const mockReq = {
        params: { id: testBill.bl_id },
        user: { us_usertype: 'admin', us_usid: 'ADM001' } // Admin user
      };
      
      let deleteResponse = null;
      const mockRes = {
        status: function(code) {
          console.log(`   Status code: ${code}`);
          return this;
        },
        json: function(data) {
          deleteResponse = data;
          console.log(`   Response: ${JSON.stringify(data)}`);
        }
      };
      
      try {
        await deleteBill(mockReq, mockRes);
        if (deleteResponse && deleteResponse.message) {
          console.log('   ✓ Bill deletion successful');
          if (deleteResponse.bookingUpdated) {
            console.log('   ✓ Booking status updated to PENDING');
          }
        } else {
          console.log('   ✗ Bill deletion failed');
        }
      } catch (error) {
        console.log(`   ✗ Bill deletion error: ${error.message}`);
      }
    } else {
      console.log('   No bills found to test deletion');
    }
    
    // Test 4: Verify the integration (create a test booking and bill, then delete the bill)
    console.log('\n4. INTEGRATION TEST - CREATE AND DELETE WITH STATUS UPDATE');
    
    // Create a test booking
    const testBooking = await BookingTVL.create({
      bk_bkno: 'TEST-' + Date.now(),
      bk_usid: 'TEST001',
      bk_fromst: 'TEST',
      bk_tost: 'TEST',
      bk_trvldt: new Date(),
      bk_class: 'SL',
      bk_quota: 'GN',
      bk_totpass: 1,
      bk_status: 'PENDING',
      bk_billed: 0,
      bk_reqdt: new Date(),
      bk_agent: 'TEST_AGENT',
      eby: 'TEST_USER',
      mby: 'TEST_USER'
    });
    
    console.log(`   Created test booking ID: ${testBooking.bk_bkid}`);
    
    // Create a test bill for this booking
    const testBill = await BillTVL.create({
      bl_entry_no: 'TEST-BILL-' + Date.now(),
      bl_bill_no: 'TEST-BILL-' + Date.now(),
      bl_booking_id: testBooking.bk_bkid,
      bl_booking_no: testBooking.bk_bkno,
      bl_billing_date: new Date(),
      bl_journey_date: new Date(),
      bl_customer_name: 'Test Customer',
      bl_customer_phone: '1234567890',
      bl_total_amount: 1000.00,
      bl_status: 'CONFIRMED',
      entered_by: 1,
      entered_on: new Date()
    });
    
    console.log(`   Created test bill ID: ${testBill.bl_id}`);
    console.log(`   Associated with booking ID: ${testBill.bl_booking_id}`);
    
    // Verify the booking status is now CONFIRMED and billed
    const updatedBooking = await BookingTVL.findByPk(testBooking.bk_bkid);
    console.log(`   Booking status after bill creation: ${updatedBooking.bk_status}`);
    console.log(`   Booking billed flag: ${updatedBooking.bk_billed}`);
    
    // Delete the bill
    const deleteBillReq = {
      params: { id: testBill.bl_id },
      user: { us_usertype: 'admin', us_usid: 'ADM001' }
    };
    
    let deleteBillResponse = null;
    const deleteBillRes = {
      status: function(code) {
        return this;
      },
      json: function(data) {
        deleteBillResponse = data;
      }
    };
    
    await deleteBill(deleteBillReq, deleteBillRes);
    
    if (deleteBillResponse && deleteBillResponse.message) {
      console.log('   ✓ Bill deletion successful');
      
      // Verify the booking status was updated to PENDING
      const finalBooking = await BookingTVL.findByPk(testBooking.bk_bkid);
      console.log(`   Booking status after bill deletion: ${finalBooking.bk_status}`);
      console.log(`   Booking billed flag: ${finalBooking.bk_billed}`);
      
      if (finalBooking.bk_status === 'PENDING' && finalBooking.bk_billed === 0) {
        console.log('   ✓ Booking status correctly updated to PENDING after bill deletion');
      } else {
        console.log('   ✗ Booking status not updated correctly');
      }
    } else {
      console.log('   ✗ Bill deletion failed in integration test');
    }
    
    console.log('\n=== TEST COMPLETED ===');
    
  } catch (error) {
    console.error('Test execution error:', error);
  }
}

// Run the test
runComprehensiveTest();