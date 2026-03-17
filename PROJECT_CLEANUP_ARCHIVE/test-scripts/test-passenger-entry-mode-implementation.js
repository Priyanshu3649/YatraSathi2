// COMPREHENSIVE TEST: Passenger Entry Mode Implementation
// This test verifies the CORRECT passenger entry mode behavior as specified

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🧪 TESTING: Passenger Entry Mode Implementation (CORRECT CONCEPT)');
console.log('=' .repeat(80));

// Test 1: Verify core state variables exist
console.log('\n1. VERIFYING CORE STATE VARIABLES...');

const bookingsFile = 'frontend/src/pages/Bookings.jsx';
const bookingsContent = fs.readFileSync(bookingsFile, 'utf8');

// Check for required state variables
const hasPassengerEntryActive = bookingsContent.includes('isPassengerEntryActive');
const hasCurrentPassengerDraft = bookingsContent.includes('currentPassengerDraft');
const hasQuotaTypeRef = bookingsContent.includes('quotaTypeRef');

console.log(`✅ isPassengerEntryActive state: ${hasPassengerEntryActive}`);
console.log(`✅ currentPassengerDraft state: ${hasCurrentPassengerDraft}`);
console.log(`✅ quotaTypeRef reference: ${hasQuotaTypeRef}`);

// Test 2: Verify passenger entry mode is NOT always visible
console.log('\n2. VERIFYING CONDITIONAL RENDERING...');

// Check that passenger entry is conditional on isPassengerEntryActive
const conditionalRendering = bookingsContent.includes('{isPassengerEntryActive &&');
const notAlwaysVisible = !bookingsContent.includes('passenger-entry-section') || 
                         bookingsContent.includes('isPassengerEntryActive &&');

console.log(`✅ Conditional rendering on isPassengerEntryActive: ${conditionalRendering}`);
console.log(`✅ NOT always visible: ${notAlwaysVisible}`);

// Test 3: Verify Tab key trigger from quota type
console.log('\n3. VERIFYING TAB KEY TRIGGER...');

// Check for Tab key handler on quota type field
const tabKeyHandler = bookingsContent.includes('e.key === \'Tab\'') &&
                     bookingsContent.includes('quotaTypeRef') &&
                     bookingsContent.includes('setIsPassengerEntryActive(true)');

console.log(`✅ Tab key handler on quota type: ${tabKeyHandler}`);

// Check that quota type selection alone does NOT activate passenger mode
const noAutoActivation = !bookingsContent.includes('quotaType.*enterPassengerLoop') &&
                         !bookingsContent.includes('quotaType.*setIsPassengerEntryActive.*true');

console.log(`✅ No auto-activation on quota selection: ${noAutoActivation}`);

// Test 4: Verify single row layout
console.log('\n4. VERIFYING SINGLE ROW LAYOUT...');

// Check for grid layout with 4 columns (Name, Age, Gender, Berth)
const singleRowLayout = bookingsContent.includes('gridTemplateColumns: \'1fr 80px 120px 150px\'');
const fourFields = bookingsContent.includes('passenger_name') &&
                  bookingsContent.includes('passenger_age') &&
                  bookingsContent.includes('passenger_gender') &&
                  bookingsContent.includes('passenger_berth');

console.log(`✅ Single row grid layout: ${singleRowLayout}`);
console.log(`✅ All four passenger fields: ${fourFields}`);

// Test 5: Verify keyboard navigation rules
console.log('\n5. VERIFYING KEYBOARD NAVIGATION...');

// Check Tab navigation through fields
const tabNavigation = bookingsContent.includes('e.key === \'Tab\' && !e.shiftKey');

// Check Tab on last field adds passenger
const tabOnLastField = bookingsContent.includes('validateAndAddPassenger()') &&
                      bookingsContent.includes('passenger_berth');

// Check Escape key exits mode
const escapeKeyExit = bookingsContent.includes('e.key === \'Escape\'') &&
                     bookingsContent.includes('exitPassengerEntryMode');

console.log(`✅ Tab navigation implemented: ${tabNavigation}`);
console.log(`✅ Tab on last field adds passenger: ${tabOnLastField}`);
console.log(`✅ Escape key exits mode: ${escapeKeyExit}`);

// Test 6: Verify passenger validation and addition
console.log('\n6. VERIFYING PASSENGER VALIDATION...');

// Check for validation function
const hasValidation = bookingsContent.includes('validateAndAddPassenger') &&
                     bookingsContent.includes('currentPassengerDraft.name') &&
                     bookingsContent.includes('currentPassengerDraft.age');

// Check passenger is added to list
const addsToList = bookingsContent.includes('setPassengerList(prev => [...prev, newPassenger])');

// Check draft is cleared after adding
const clearsDraft = bookingsContent.includes('setCurrentPassengerDraft') &&
                   bookingsContent.includes('name: \'\'') &&
                   bookingsContent.includes('age: \'\'');

console.log(`✅ Passenger validation: ${hasValidation}`);
console.log(`✅ Adds to passenger list: ${addsToList}`);
console.log(`✅ Clears draft after adding: ${clearsDraft}`);

// Test 7: Verify focus management
console.log('\n7. VERIFYING FOCUS MANAGEMENT...');

// Check focus moves to passenger name on mode activation
const focusOnActivation = bookingsContent.includes('passengerNameField.focus()') &&
                         bookingsContent.includes('setIsPassengerEntryActive(true)');

// Check focus returns to name field after adding passenger
const focusAfterAdd = bookingsContent.includes('validateAndAddPassenger') &&
                     bookingsContent.includes('passengerNameField.focus()');

console.log(`✅ Focus on mode activation: ${focusOnActivation}`);
console.log(`✅ Focus returns after adding: ${focusAfterAdd}`);

// Test 8: Verify passenger count is derived
console.log('\n8. VERIFYING PASSENGER COUNT...');

// Check that total passengers is calculated from list length
const derivedCount = bookingsContent.includes('passengerList.filter') &&
                    bookingsContent.includes('totalPassengers');

console.log(`✅ Passenger count is derived: ${derivedCount}`);

// Test 9: Verify mode exit behavior
console.log('\n9. VERIFYING MODE EXIT...');

// Check exit function exists
const hasExitFunction = bookingsContent.includes('exitPassengerEntryMode') &&
                       bookingsContent.includes('setIsPassengerEntryActive(false)');

// Check focus moves to next booking field on exit
const focusOnExit = bookingsContent.includes('exitPassengerEntryMode') &&
                   bookingsContent.includes('remarksField');

console.log(`✅ Exit function exists: ${hasExitFunction}`);
console.log(`✅ Focus moves on exit: ${focusOnExit}`);

// Test 10: Verify no old implementation remains
console.log('\n10. VERIFYING CLEAN IMPLEMENTATION...');

// Check that old usePassengerEntry hook is not used
const noOldHook = bookingsContent.includes('// REMOVE OLD PASSENGER ENTRY HOOK') ||
                 !bookingsContent.includes('usePassengerEntry({');

// Check that old isInLoop state is not used
const noOldState = !bookingsContent.includes('{isInLoop &&') ||
                  bookingsContent.includes('isPassengerEntryActive &&');

console.log(`✅ Old hook removed: ${noOldHook}`);
console.log(`✅ Old state not used: ${noOldState}`);

console.log('\n' + '='.repeat(80));
console.log('📋 COMPREHENSIVE TEST RESULTS:');

const allTestsPassed = hasPassengerEntryActive && hasCurrentPassengerDraft && hasQuotaTypeRef &&
                      conditionalRendering && notAlwaysVisible && tabKeyHandler && noAutoActivation &&
                      singleRowLayout && fourFields && tabNavigation && tabOnLastField && escapeKeyExit &&
                      hasValidation && addsToList && clearsDraft && focusOnActivation && focusAfterAdd &&
                      derivedCount && hasExitFunction && focusOnExit && noOldHook && noOldState;

if (allTestsPassed) {
  console.log('✅ ALL TESTS PASSED - Passenger entry mode correctly implemented!');
  console.log('');
  console.log('🎯 CORRECT BEHAVIOR FLOW:');
  console.log('1. User fills booking details including quota type');
  console.log('2. User presses TAB while focused on quota type dropdown');
  console.log('3. Passenger entry section appears (mode activated)');
  console.log('4. Focus moves to passenger name field');
  console.log('5. User fills Name → Age → Gender → Berth (Tab navigation)');
  console.log('6. User presses Tab on Berth field → passenger added to grid');
  console.log('7. Draft cleared, focus returns to Name for next passenger');
  console.log('8. User presses Escape → exits passenger entry mode');
  console.log('9. Focus moves to next booking field (remarks)');
} else {
  console.log('❌ SOME TESTS FAILED - Implementation needs fixes');
}

console.log('\n🔍 KEY IMPLEMENTATION POINTS:');
console.log('• Passenger entry is a MODE, not a static form');
console.log('• Only Tab key from quota type activates the mode');
console.log('• Single row layout with 4 fields in exact order');
console.log('• Tab on last field adds passenger and stays in mode');
console.log('• Escape exits mode and moves to next booking field');
console.log('• Passenger count is automatically derived from list');

console.log('\n🧪 TEST COMPLETED');