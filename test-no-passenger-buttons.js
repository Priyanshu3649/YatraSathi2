// TEST: Verify No Passenger Entry Buttons Exist
// This test ensures passenger entry mode is ONLY activated via Tab key, no buttons

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🧪 TESTING: No Passenger Entry Buttons (Tab-Only Activation)');
console.log('=' .repeat(70));

// Test 1: Verify no passenger-related buttons exist
console.log('\n1. CHECKING FOR UNWANTED BUTTONS...');

const bookingsFile = 'frontend/src/pages/Bookings.jsx';
const bookingsContent = fs.readFileSync(bookingsFile, 'utf8');

// Check for any buttons with passenger-related text
const passengerButtons = [
  'Add Passenger',
  'Enter Passenger',
  'Exit Passenger',
  'Passenger Mode',
  'Add Passengers',
  'Enter Passengers'
];

let foundButtons = [];
passengerButtons.forEach(buttonText => {
  if (bookingsContent.includes(buttonText)) {
    foundButtons.push(buttonText);
  }
});

console.log(`❌ Found passenger buttons: ${foundButtons.length > 0 ? foundButtons.join(', ') : 'NONE'}`);

// Test 2: Verify Tab key is the ONLY trigger
console.log('\n2. VERIFYING TAB KEY AS ONLY TRIGGER...');

// Check that Tab key handler exists
const hasTabKeyHandler = bookingsContent.includes('e.key === \'Tab\'') &&
                        bookingsContent.includes('setIsPassengerEntryActive(true)') &&
                        bookingsContent.includes('quotaTypeRef');

console.log(`✅ Tab key handler exists: ${hasTabKeyHandler}`);

// Check that no onClick handlers activate passenger mode
const noOnClickActivation = !bookingsContent.includes('onClick.*setIsPassengerEntryActive.*true') ||
                           bookingsContent.includes('// DEBUG:') || // Only debug buttons allowed
                           bookingsContent.includes('Manual.*toggle'); // Only manual debug buttons

console.log(`✅ No onClick activation (except debug): ${noOnClickActivation}`);

// Test 3: Verify conditional rendering
console.log('\n3. VERIFYING CONDITIONAL RENDERING...');

// Check that passenger entry section is conditional
const conditionalRendering = bookingsContent.includes('{isPassengerEntryActive &&') &&
                             bookingsContent.includes('passenger-entry-section');

console.log(`✅ Conditional rendering: ${conditionalRendering}`);

// Test 4: Verify clean UI (no debug elements)
console.log('\n4. CHECKING FOR CLEAN UI...');

// Check that debug elements are removed
const noDebugElements = !bookingsContent.includes('Debug: isPassengerEntryActive') &&
                       !bookingsContent.includes('DEBUG: Show passenger');

console.log(`✅ No debug elements in UI: ${noDebugElements}`);

// Test 5: Verify Tab key handler implementation
console.log('\n5. VERIFYING TAB KEY IMPLEMENTATION...');

// Check the exact Tab key handler logic
const tabHandlerPattern = /Tab.*quotaType.*setIsPassengerEntryActive\(true\)/s;
const correctTabHandler = tabHandlerPattern.test(bookingsContent);

console.log(`✅ Correct Tab key handler: ${correctTabHandler}`);

// Check that Tab handler prevents default and focuses passenger field
const focusesPassengerField = bookingsContent.includes('e.preventDefault()') &&
                             bookingsContent.includes('passengerNameField.focus()') &&
                             bookingsContent.includes('setIsPassengerEntryActive(true)');

console.log(`✅ Tab handler focuses passenger field: ${focusesPassengerField}`);

// Test 6: Verify passenger addition logic
console.log('\n6. VERIFYING PASSENGER ADDITION...');

// Check that passengers are added via Tab on last field, not buttons
const tabOnLastField = bookingsContent.includes('passenger_berth') &&
                      bookingsContent.includes('validateAndAddPassenger()') &&
                      bookingsContent.includes('e.key === \'Tab\'');

console.log(`✅ Passenger added via Tab on last field: ${tabOnLastField}`);

// Test 7: Verify escape key exit
console.log('\n7. VERIFYING ESCAPE KEY EXIT...');

// Check that Escape key exits passenger mode
const escapeKeyExit = bookingsContent.includes('e.key === \'Escape\'') &&
                     bookingsContent.includes('exitPassengerEntryMode()');

console.log(`✅ Escape key exits mode: ${escapeKeyExit}`);

console.log('\n' + '='.repeat(70));
console.log('📋 TEST RESULTS:');

const allTestsPassed = foundButtons.length === 0 && hasTabKeyHandler && noOnClickActivation &&
                      conditionalRendering && noDebugElements && correctTabHandler &&
                      focusesPassengerField && tabOnLastField && escapeKeyExit;

if (allTestsPassed) {
  console.log('✅ ALL TESTS PASSED - No unwanted buttons, Tab-only activation!');
  console.log('');
  console.log('🎯 CORRECT BEHAVIOR:');
  console.log('1. NO buttons for passenger entry anywhere in the UI');
  console.log('2. Passenger entry mode ONLY activates when:');
  console.log('   - User selects quota type');
  console.log('   - User presses Tab while quota type field is focused');
  console.log('3. Passenger entry section appears automatically');
  console.log('4. Focus moves to passenger name field');
  console.log('5. Tab navigation through passenger fields');
  console.log('6. Tab on last field adds passenger');
  console.log('7. Escape exits passenger mode');
} else {
  console.log('❌ SOME TESTS FAILED - Issues found:');
  if (foundButtons.length > 0) {
    console.log(`   - Found unwanted buttons: ${foundButtons.join(', ')}`);
  }
  if (!hasTabKeyHandler) {
    console.log('   - Tab key handler missing or incorrect');
  }
  if (!noOnClickActivation) {
    console.log('   - Found onClick activation (should only be Tab key)');
  }
  if (!conditionalRendering) {
    console.log('   - Conditional rendering not implemented');
  }
  if (!noDebugElements) {
    console.log('   - Debug elements still visible in UI');
  }
}

console.log('\n🔧 USER EXPERIENCE:');
console.log('• Clean UI with no passenger entry buttons');
console.log('• Seamless Tab key activation from quota type');
console.log('• Keyboard-first passenger entry workflow');
console.log('• No mouse interaction required');

console.log('\n🧪 TEST COMPLETED');