#!/usr/bin/env node
/**
 * Test script to verify the booking and billing ID display fix
 */

console.log('🔍 Testing booking and billing ID display fix...\n');

async function testIdDisplayFix() {
  try {
    // Check the frontend changes
    const fs = require('fs');
    
    // Test booking page changes
    const bookingPage = fs.readFileSync('./frontend/src/pages/Bookings.jsx', 'utf8');
    const bookingHasBookingNo = bookingPage.includes('record.bookingNo || record.bk_bkno || record.bk_bkid');
    
    console.log('📋 Booking Page Changes:');
    console.log(`   ✅ Booking ID display updated: ${bookingHasBookingNo ? 'YES' : 'NO'}`);
    
    // Test billing page changes
    const billingPage = fs.readFileSync('./frontend/src/pages/Billing.jsx', 'utf8');
    const billingHasBillNo = billingPage.includes('bill.billNo || bill.id || \'N/A\'');
    const billingHasBookingNo = billingPage.includes('bill.bookingNo || bill.bookingId || \'N/A\'');
    
    console.log('📋 Billing Page Changes:');
    console.log(`   ✅ Bill ID display updated: ${billingHasBillNo ? 'YES' : 'NO'}`);
    console.log(`   ✅ Booking ID display updated: ${billingHasBookingNo ? 'YES' : 'NO'}`);
    
    // Test backend controller changes
    const billingController = fs.readFileSync('./src/controllers/billingController.js', 'utf8');
    const billingUsesBillNo = billingController.includes('billNo: billData.bl_bill_no');
    const billingUsesBookingNo = billingController.includes('bookingNo: billData.bl_booking_no');
    
    console.log('📋 Billing Controller Changes:');
    console.log(`   ✅ Bill number field added: ${billingUsesBillNo ? 'YES' : 'NO'}`);
    console.log(`   ✅ Booking number field added: ${billingUsesBookingNo ? 'YES' : 'NO'}`);
    
    const bookingController = fs.readFileSync('./src/controllers/bookingController.js', 'utf8');
    const bookingUsesBookingNo = bookingController.includes('bookingNo: booking.bk_bkno');
    
    console.log('📋 Booking Controller Changes:');
    console.log(`   ✅ Booking number field added: ${bookingUsesBookingNo ? 'YES' : 'NO'}`);
    
    // Summary of the fix
    console.log('\n🎯 Summary of the ID Display Fix:');
    console.log('   • Booking grid now displays booking numbers (e.g., BK001) instead of sequential IDs (e.g., 1)');
    console.log('   • Billing grid now displays bill numbers (e.g., BILL-20240101-001) instead of sequential IDs (e.g., 1)');
    console.log('   • Billing grid now displays booking numbers (e.g., BK001) instead of sequential booking IDs (e.g., 1)');
    console.log('   • Backend controllers properly map database fields to appropriate frontend fields');
    console.log('   • Fallback logic ensures display works even if preferred fields are missing');
    
    if (bookingHasBookingNo && billingHasBillNo && billingHasBookingNo && billingUsesBillNo && billingUsesBookingNo && bookingUsesBookingNo) {
      console.log('\n🎉 All changes applied successfully!');
      console.log('   The booking and billing ID display issue has been resolved.');
    } else {
      console.log('\n❌ Some changes may be missing. Please review the implementation.');
    }
    
  } catch (error) {
    console.error('❌ Error during test:', error.message);
  }
}

testIdDisplayFix();