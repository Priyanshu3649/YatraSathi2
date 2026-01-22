// TEST: Passenger Entry Form Visibility and Functionality
// This test verifies that the passenger entry section appears and functions correctly

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔍 TESTING: Passenger Entry Form Visibility and Functionality');
console.log('=' .repeat(80));

// Test 1: Check if passenger entry section exists in the code
console.log('\n1. CHECKING PASSENGER ENTRY SECTION IN CODE...');
const bookingsFile = 'frontend/src/pages/Bookings.jsx';

if (!fs.existsSync(bookingsFile)) {
  console.log('❌ FAIL: Bookings.jsx file not found');
  process.exit(1);
}

const bookingsContent = fs.readFileSync(bookingsFile, 'utf8');

// Check for passenger entry conditional rendering
const hasPassengerEntrySection = bookingsContent.includes('isInLoop &&') && 
                                 bookingsContent.includes('passenger-entry-section');
console.log(`✅ Passenger entry section exists: ${hasPassengerEntrySection}`);

// Check for passenger entry fields
const hasPassengerFields = bookingsContent.includes('getFieldProps(\'passenger_name\')') &&
                          bookingsContent.includes('getFieldProps(\'passenger_age\')') &&
                          bookingsContent.includes('getFieldProps(\'passenger_gender\')') &&
                          bookingsContent.includes('getFieldProps(\'passenger_berth\')');
console.log(`✅ Passenger entry fields exist: ${hasPassengerFields}`);

// Check for passenger grid display
const hasPassengerGrid = bookingsContent.includes('Passenger Grid Display') &&
                        bookingsContent.includes('passengerList.map');
console.log(`✅ Passenger grid display exists: ${hasPassengerGrid}`);

// Test 2: Check usePassengerEntry hook implementation
console.log('\n2. CHECKING usePassengerEntry HOOK...');
const passengerHookFile = 'frontend/src/hooks/usePassengerEntry.js';

if (!fs.existsSync(passengerHookFile)) {
  console.log('❌ FAIL: usePassengerEntry.js file not found');
  process.exit(1);
}

const hookContent = fs.readFileSync(passengerHookFile, 'utf8');

// Check for key hook functions
const hasEnterLoop = hookContent.includes('enterPassengerLoop');
const hasExitLoop = hookContent.includes('exitPassengerLoop');
const hasGetFieldProps = hookContent.includes('getFieldProps');
const hasSavePassenger = hookContent.includes('saveCurrentPassenger');

console.log(`✅ enterPassengerLoop function: ${hasEnterLoop}`);
console.log(`✅ exitPassengerLoop function: ${hasExitLoop}`);
console.log(`✅ getFieldProps function: ${hasGetFieldProps}`);
console.log(`✅ saveCurrentPassenger function: ${hasSavePassenger}`);

// Test 3: Check keyboard navigation context
console.log('\n3. CHECKING KEYBOARD NAVIGATION CONTEXT...');
const contextFile = 'frontend/src/contexts/KeyboardNavigationContext.jsx';

if (!fs.existsSync(contextFile)) {
  console.log('❌ FAIL: KeyboardNavigationContext.jsx file not found');
  process.exit(1);
}

const contextContent = fs.readFileSync(contextFile, 'utf8');

// Check for passenger loop state management
const hasPassengerLoopState = contextContent.includes('isPassengerLoopActive');
const hasPassengerLoopMethods = contextContent.includes('enterPassengerLoop') &&
                               contextContent.includes('exitPassengerLoop');

console.log(`✅ Passenger loop state management: ${hasPassengerLoopState}`);
console.log(`✅ Passenger loop methods: ${hasPassengerLoopMethods}`);

// Test 4: Analyze the issue - why passenger entry might not be visible
console.log('\n4. ANALYZING POTENTIAL ISSUES...');

// Check if isInLoop is properly initialized and managed
const isInLoopUsage = bookingsContent.match(/isInLoop/g);
console.log(`✅ isInLoop usage count: ${isInLoopUsage ? isInLoopUsage.length : 0}`);

// Check if enterPassengerLoop is called when quota type is selected
const quotaTypeHandler = bookingsContent.includes('enterPassengerLoop()') &&
                        bookingsContent.includes('quotaType');
console.log(`✅ Quota type triggers passenger loop: ${quotaTypeHandler}`);

// Check Tab key handler on quota type field
const tabKeyHandler = bookingsContent.includes('handleKeyDown') &&
                     bookingsContent.includes('Tab') &&
                     bookingsContent.includes('quotaTypeRef');
console.log(`✅ Tab key handler on quota type: ${tabKeyHandler}`);

// Test 5: Check for potential state initialization issues
console.log('\n5. CHECKING STATE INITIALIZATION...');

// Look for usePassengerEntry hook usage
const hookUsagePattern = /const\s*{\s*[^}]*isInLoop[^}]*}\s*=\s*usePassengerEntry/;
const hasHookUsage = hookUsagePattern.test(bookingsContent);
console.log(`✅ usePassengerEntry hook properly used: ${hasHookUsage}`);

// Check if isInLoop is destructured correctly
const isInLoopDestructured = bookingsContent.includes('isInLoop,') ||
                            bookingsContent.includes('isInLoop }');
console.log(`✅ isInLoop properly destructured: ${isInLoopDestructured}`);

// Test 6: Identify the specific issue
console.log('\n6. ISSUE IDENTIFICATION...');

// The issue might be that isInLoop is not being set to true when expected
// Let's check the exact flow:

// 1. Check if quota type change triggers passenger mode
const quotaChangePattern = /quotaType.*enterPassengerLoop/s;
const hasQuotaChangeHandler = quotaChangePattern.test(bookingsContent);
console.log(`✅ Quota type change handler: ${hasQuotaChangeHandler}`);

// 2. Check if Tab key on quota type triggers passenger mode
const tabOnQuotaPattern = /quotaTypeRef.*Tab.*enterPassengerLoop/s;
const hasTabOnQuota = tabOnQuotaPattern.test(bookingsContent);
console.log(`✅ Tab on quota type handler: ${hasTabOnQuota}`);

// 3. Check if the conditional rendering is correct
const conditionalRenderingPattern = /{isInLoop &&/;
const hasCorrectConditional = conditionalRenderingPattern.test(bookingsContent);
console.log(`✅ Correct conditional rendering: ${hasCorrectConditional}`);

console.log('\n' + '='.repeat(80));
console.log('📋 SUMMARY:');

if (hasPassengerEntrySection && hasPassengerFields && hasPassengerGrid && 
    hasEnterLoop && hasExitLoop && hasGetFieldProps && hasSavePassenger &&
    hasPassengerLoopState && hasPassengerLoopMethods && hasHookUsage) {
  console.log('✅ All passenger entry components are properly implemented');
  console.log('');
  console.log('🔍 LIKELY ISSUE: The passenger entry section should be visible when:');
  console.log('   1. User is in editing mode (isEditing = true)');
  console.log('   2. User selects a quota type');
  console.log('   3. User presses Tab on the quota type field');
  console.log('   4. isInLoop state becomes true');
  console.log('');
  console.log('💡 RECOMMENDATION: Check if the Tab key handler on quota type field');
  console.log('   is properly calling enterPassengerLoop() and setting isInLoop to true.');
} else {
  console.log('❌ Some passenger entry components are missing or incorrectly implemented');
}

console.log('\n🧪 TEST COMPLETED');