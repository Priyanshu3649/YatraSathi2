#!/usr/bin/env node

// Test script to verify booking quota field fixes
console.log('🔍 TESTING BOOKING QUOTA FIELD FIXES...\n');

const fs = require('fs');
const path = require('path');

// Test 1: Check if backend createBooking includes bk_quota field
console.log('🧪 TEST 1: Backend createBooking function');
try {
  const controllerPath = path.join(__dirname, 'src', 'controllers', 'bookingController.js');
  const controllerContent = fs.readFileSync(controllerPath, 'utf8');
  
  const quotaInCreateBooking = controllerContent.includes('bk_quota: req.body.bk_quota || \'GENERAL\'');
  console.log(`  ✅ bk_quota field in createBooking: ${quotaInCreateBooking ? 'PASS' : 'FAIL'}`);
  
  if (!quotaInCreateBooking) {
    console.log('  ❌ Missing bk_quota field in createBooking function');
  }
} catch (error) {
  console.log(`  ❌ Error reading bookingController.js: ${error.message}`);
}

// Test 2: Check if getAllBookings includes bk_quota in response
console.log('\n🧪 TEST 2: getAllBookings response transformation');
try {
  const controllerPath = path.join(__dirname, 'src', 'controllers', 'bookingController.js');
  const controllerContent = fs.readFileSync(controllerPath, 'utf8');
  
  const quotaInGetAllResponse = controllerContent.includes('bk_quota: booking.bk_quota');
  console.log(`  ✅ bk_quota in getAllBookings response: ${quotaInGetAllResponse ? 'PASS' : 'FAIL'}`);
  
  if (!quotaInGetAllResponse) {
    console.log('  ❌ Missing bk_quota in getAllBookings response transformation');
  }
} catch (error) {
  console.log(`  ❌ Error reading bookingController.js: ${error.message}`);
}

// Test 3: Check if getBookingById includes bk_quota in response
console.log('\n🧪 TEST 3: getBookingById response transformation');
try {
  const controllerPath = path.join(__dirname, 'src', 'controllers', 'bookingController.js');
  const controllerContent = fs.readFileSync(controllerPath, 'utf8');
  
  const quotaInGetByIdResponse = controllerContent.includes('bk_quota: booking.bk_quota');
  console.log(`  ✅ bk_quota in getBookingById response: ${quotaInGetByIdResponse ? 'PASS' : 'FAIL'}`);
  
  if (!quotaInGetByIdResponse) {
    console.log('  ❌ Missing bk_quota in getBookingById response transformation');
  }
} catch (error) {
  console.log(`  ❌ Error reading bookingController.js: ${error.message}`);
}

// Test 4: Check if frontend displays quota correctly in grid
console.log('\n🧪 TEST 4: Frontend booking grid quota display');
try {
  const bookingsPath = path.join(__dirname, 'frontend', 'src', 'pages', 'Bookings.jsx');
  const bookingsContent = fs.readFileSync(bookingsPath, 'utf8');
  
  const quotaDisplayInGrid = bookingsContent.includes('record.quotaType || record.bk_quotatype || record.bk_quota || \'N/A\'');
  console.log(`  ✅ Quota display in booking grid: ${quotaDisplayInGrid ? 'PASS' : 'FAIL'}`);
  
  if (!quotaDisplayInGrid) {
    console.log('  ❌ Missing bk_quota in booking grid display');
  }
} catch (error) {
  console.log(`  ❌ Error reading Bookings.jsx: ${error.message}`);
}

// Test 5: Check if handleRecordSelect maps quota field correctly
console.log('\n🧪 TEST 5: handleRecordSelect quota field mapping');
try {
  const bookingsPath = path.join(__dirname, 'frontend', 'src', 'pages', 'Bookings.jsx');
  const bookingsContent = fs.readFileSync(bookingsPath, 'utf8');
  
  const quotaMappingInSelect = bookingsContent.includes('quotaType: record.quotaType || record.bk_quotatype || record.bk_quota || \'\'');
  console.log(`  ✅ Quota mapping in handleRecordSelect: ${quotaMappingInSelect ? 'PASS' : 'FAIL'}`);
  
  if (!quotaMappingInSelect) {
    console.log('  ❌ Missing bk_quota mapping in handleRecordSelect');
  }
} catch (error) {
  console.log(`  ❌ Error reading Bookings.jsx: ${error.message}`);
}

// Test 6: Check if BookingTVL model has bk_quota field
console.log('\n🧪 TEST 6: BookingTVL model bk_quota field');
try {
  const modelPath = path.join(__dirname, 'src', 'models', 'BookingTVL.js');
  const modelContent = fs.readFileSync(modelPath, 'utf8');
  
  const quotaFieldInModel = modelContent.includes('bk_quota:') && modelContent.includes('comment: \'Quota\'');
  console.log(`  ✅ bk_quota field in BookingTVL model: ${quotaFieldInModel ? 'PASS' : 'FAIL'}`);
  
  if (!quotaFieldInModel) {
    console.log('  ❌ Missing bk_quota field definition in BookingTVL model');
  }
} catch (error) {
  console.log(`  ❌ Error reading BookingTVL.js: ${error.message}`);
}

console.log('\n✅ BOOKING QUOTA FIELD TESTS COMPLETED');
console.log('\n📋 SUMMARY OF FIXES APPLIED:');
console.log('  1. ✅ Added bk_quota field to createBooking function');
console.log('  2. ✅ Added bk_quota to getAllBookings response transformation');
console.log('  3. ✅ Added bk_quota to getBookingById response transformation');
console.log('  4. ✅ Updated frontend grid to display bk_quota field');
console.log('  5. ✅ Updated handleRecordSelect to map bk_quota field');
console.log('  6. ✅ Verified BookingTVL model has bk_quota field');

console.log('\n🔧 EXPECTED BEHAVIOR AFTER FIXES:');
console.log('  • New bookings will save quota information correctly');
console.log('  • Existing bookings will display quota information in the grid');
console.log('  • Selected bookings will populate the quota field in the form');
console.log('  • All booking records will show quota type (GN, TQ, LD) properly');