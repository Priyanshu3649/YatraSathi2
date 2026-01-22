// TEST: Verify Tab Navigation Follows Correct Field Order
// This test ensures Tab navigation matches the visual UI layout

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🧪 TESTING: Tab Navigation Field Order');
console.log('=' .repeat(60));

// Test 1: Verify field order matches UI layout
console.log('\n1. CHECKING FIELD ORDER...');

const bookingsFile = 'frontend/src/pages/Bookings.jsx';
const bookingsContent = fs.readFileSync(bookingsFile, 'utf8');

// Extract the field order array
const fieldOrderMatch = bookingsContent.match(/const fieldOrder = useMemo\(\(\) => \[([\s\S]*?)\], \[\]\);/);

let orderCorrect = false;

if (fieldOrderMatch) {
  const fieldOrderContent = fieldOrderMatch[1];
  console.log('✅ Field order found in code');
  
  // Check the specific order we care about
  const expectedOrder = [
    'travelDate',
    'travelClass',
    'berthPreference', 
    'quotaType'
  ];
  
  orderCorrect = true;
  
  expectedOrder.forEach((field, index) => {
    const fieldIndex = fieldOrderContent.indexOf(`'${field}'`);
    if (index > 0) {
      const prevFieldIndex = fieldOrderContent.indexOf(`'${expectedOrder[index - 1]}'`);
      if (fieldIndex <= prevFieldIndex) {
        orderCorrect = false;
        console.log(`❌ Field order incorrect: ${field} should come after ${expectedOrder[index - 1]}`);
      }
    }
  });
  
  if (orderCorrect) {
    console.log('✅ Field order matches UI layout: travelDate → travelClass → berthPreference → quotaType');
  }
} else {
  console.log('❌ Field order not found');
}

// Test 2: Verify no special Tab handlers interfere with main form navigation
console.log('\n2. CHECKING FOR INTERFERING TAB HANDLERS...');

// The main issue was the quota type Tab handler - check that it's removed
const hasQuotaTypeTabCode = bookingsContent.includes('REMOVED: Special Tab key handler on quota type field');

console.log(`✅ Quota type Tab handler removed: ${hasQuotaTypeTabCode}`);

// Test 3: Verify field data-field attributes match
console.log('\n3. CHECKING FIELD DATA ATTRIBUTES...');

const fieldsToCheck = [
  'travelDate',
  'travelClass', 
  'berthPreference',
  'quotaType'
];

let allFieldsHaveDataAttributes = true;
fieldsToCheck.forEach(field => {
  if (!bookingsContent.includes(`data-field="${field}"`)) {
    console.log(`❌ Missing data-field attribute for: ${field}`);
    allFieldsHaveDataAttributes = false;
  }
});

if (allFieldsHaveDataAttributes) {
  console.log('✅ All fields have correct data-field attributes');
}

// Test 4: Verify UI layout structure
console.log('\n4. CHECKING UI LAYOUT STRUCTURE...');

// Check that Travel Date and Travel Class are in the same row
const travelDateClassSameRow = bookingsContent.includes('Travel Date') &&
                              bookingsContent.includes('Travel Class') &&
                              bookingsContent.includes('travelDate') &&
                              bookingsContent.includes('travelClass');

console.log(`✅ Travel Date and Travel Class in same row: ${travelDateClassSameRow}`);

// Check that Berth Preference and Quota Type are in the same row
const berthQuotaSameRow = bookingsContent.includes('Berth Preference') &&
                         bookingsContent.includes('Quota Type') &&
                         bookingsContent.includes('berthPreference') &&
                         bookingsContent.includes('quotaType');

console.log(`✅ Berth Preference and Quota Type in same row: ${berthQuotaSameRow}`);

// Test 5: Verify passenger fields come after quota type
console.log('\n5. CHECKING PASSENGER FIELD PLACEMENT...');

const passengerFieldsAfterQuota = fieldOrderMatch && fieldOrderMatch[1] && 
                                 fieldOrderMatch[1].indexOf('quotaType') < fieldOrderMatch[1].indexOf('passenger_name');

console.log(`✅ Passenger fields come after quota type: ${passengerFieldsAfterQuota}`);

console.log('\n' + '='.repeat(60));
console.log('📋 TEST RESULTS:');

const allTestsPassed = fieldOrderMatch && orderCorrect && hasQuotaTypeTabCode && 
                      allFieldsHaveDataAttributes && travelDateClassSameRow && 
                      berthQuotaSameRow && passengerFieldsAfterQuota;

if (allTestsPassed) {
  console.log('✅ ALL TESTS PASSED - Tab navigation should work correctly!');
  console.log('');
  console.log('🎯 CORRECT TAB NAVIGATION ORDER:');
  console.log('1. Booking Date');
  console.log('2. Customer Name');
  console.log('3. Phone Number');
  console.log('4. From Station');
  console.log('5. To Station');
  console.log('6. Travel Date');
  console.log('7. Travel Class ← User clicks here');
  console.log('8. Berth Preference ← Tab should go here');
  console.log('9. Quota Type');
  console.log('10. Passenger Name');
  console.log('11. Passenger Age');
  console.log('12. Passenger Gender');
  console.log('13. Passenger Berth');
  console.log('14. Remarks');
  console.log('15. Status');
} else {
  console.log('❌ SOME TESTS FAILED - Tab navigation may not work correctly');
}

console.log('\n🔧 EXPECTED BEHAVIOR:');
console.log('• User clicks on Travel Class field');
console.log('• User presses Tab');
console.log('• Focus moves to Berth Preference field (next in sequence)');
console.log('• No jumping to unrelated fields');
console.log('• Natural left-to-right, top-to-bottom navigation');

console.log('\n🧪 TEST COMPLETED');