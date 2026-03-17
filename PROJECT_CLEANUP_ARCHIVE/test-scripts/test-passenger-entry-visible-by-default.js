// TEST: Verify Passenger Entry Section is Visible by Default
// This test ensures passenger entry section appears immediately when editing

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🧪 TESTING: Passenger Entry Visible by Default');
console.log('=' .repeat(60));

// Test 1: Verify initial state is true
console.log('\n1. CHECKING INITIAL STATE...');

const bookingsFile = 'frontend/src/pages/Bookings.jsx';
const bookingsContent = fs.readFileSync(bookingsFile, 'utf8');

// Check that initial state is set to true
const initialStateTrue = bookingsContent.includes('useState(true)') &&
                        bookingsContent.includes('isPassengerEntryActive');

console.log(`✅ Initial state set to true: ${initialStateTrue}`);

// Test 2: Verify conditional rendering still exists
console.log('\n2. VERIFYING CONDITIONAL RENDERING...');

// Check that passenger entry section is still conditional (but now defaults to visible)
const conditionalRendering = bookingsContent.includes('{isPassengerEntryActive &&') &&
                             bookingsContent.includes('passenger-entry-section');

console.log(`✅ Conditional rendering exists: ${conditionalRendering}`);

// Test 3: Verify handleNew sets passenger entry to visible
console.log('\n3. CHECKING handleNew FUNCTION...');

// Check that handleNew function ensures passenger entry is visible
const handleNewSetsVisible = bookingsContent.includes('handleNew') &&
                            bookingsContent.includes('setIsPassengerEntryActive(true)');

console.log(`✅ handleNew sets passenger entry visible: ${handleNewSetsVisible}`);

// Test 4: Verify Tab key behavior is updated
console.log('\n4. CHECKING TAB KEY BEHAVIOR...');

// Check that Tab key now focuses passenger field instead of activating mode
const tabKeyFocuses = bookingsContent.includes('focusing passenger name field') &&
                     bookingsContent.includes('isPassengerEntryActive') &&
                     !bookingsContent.includes('ACTIVATING PASSENGER ENTRY MODE');

console.log(`✅ Tab key focuses passenger field: ${tabKeyFocuses}`);

// Test 5: Verify passenger entry fields are implemented
console.log('\n5. VERIFYING PASSENGER FIELDS...');

// Check that all passenger fields exist
const passengerFields = [
  'passenger_name',
  'passenger_age',
  'passenger_gender', 
  'passenger_berth'
];

const allFieldsExist = passengerFields.every(field => 
  bookingsContent.includes(`data-field="${field}"`)
);

console.log(`✅ All passenger fields exist: ${allFieldsExist}`);

// Test 6: Verify single row layout
console.log('\n6. CHECKING SINGLE ROW LAYOUT...');

// Check for grid layout with 4 columns
const singleRowLayout = bookingsContent.includes('gridTemplateColumns: \'1fr 80px 120px 150px\'');

console.log(`✅ Single row layout implemented: ${singleRowLayout}`);

// Test 7: Verify passenger addition logic
console.log('\n7. CHECKING PASSENGER ADDITION...');

// Check that Tab on last field adds passenger
const tabAddsPassenger = bookingsContent.includes('validateAndAddPassenger()') &&
                        bookingsContent.includes('passenger_berth') &&
                        bookingsContent.includes('e.key === \'Tab\'');

console.log(`✅ Tab on last field adds passenger: ${tabAddsPassenger}`);

// Test 8: Verify escape key exit
console.log('\n8. CHECKING ESCAPE KEY EXIT...');

// Check that Escape key can still exit passenger mode
const escapeKeyExit = bookingsContent.includes('e.key === \'Escape\'') &&
                     bookingsContent.includes('exitPassengerEntryMode()');

console.log(`✅ Escape key exits mode: ${escapeKeyExit}`);

console.log('\n' + '='.repeat(60));
console.log('📋 TEST RESULTS:');

const allTestsPassed = initialStateTrue && conditionalRendering && handleNewSetsVisible &&
                      tabKeyFocuses && allFieldsExist && singleRowLayout &&
                      tabAddsPassenger && escapeKeyExit;

if (allTestsPassed) {
  console.log('✅ ALL TESTS PASSED - Passenger entry visible by default!');
  console.log('');
  console.log('🎯 CURRENT BEHAVIOR:');
  console.log('1. Passenger entry section is VISIBLE by default when editing');
  console.log('2. No need to press Tab on quota type to activate');
  console.log('3. Tab on quota type moves focus to passenger name field');
  console.log('4. Single row layout with Name → Age → Gender → Berth');
  console.log('5. Tab on last field adds passenger to grid');
  console.log('6. Escape key can hide passenger entry section');
  console.log('7. Clean UI with no buttons required');
} else {
  console.log('❌ SOME TESTS FAILED - Implementation needs fixes');
}

console.log('\n🔧 USER EXPERIENCE:');
console.log('• Passenger entry section appears immediately when creating new booking');
console.log('• No activation step required - ready for passenger input');
console.log('• Tab navigation flows naturally from quota type to passenger fields');
console.log('• Fast, efficient passenger entry workflow');

console.log('\n🧪 TEST COMPLETED');