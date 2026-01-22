
const { EnhancedFocusManager } = require('./frontend/src/utils/focusManager.js');

// Mock browser environment
global.document = {
  querySelector: () => ({ focus: () => {}, dataset: {} }),
  activeElement: null
};
global.performance = { now: () => Date.now() };

// Mock console to keep output clean but visible
const originalConsoleLog = console.log;
const logs = [];
console.log = (...args) => {
  logs.push(args.join(' '));
  // originalConsoleLog(...args); // Uncomment to see logs in real-time
};
console.warn = (...args) => logs.push('WARN: ' + args.join(' '));

function runTest() {
  console.log('Running Focus Manager Tests...');
  const manager = new EnhancedFocusManager();
  const fieldOrder = ['bookingDate', 'travelClass', 'berthPreference', 'quotaType', 'remarks'];
  manager.initializeFieldOrder(fieldOrder);

  // Test 1: Initial State
  if (manager.currentFieldIndex !== 0) throw new Error('Initial index should be 0');
  console.log('Test 1 Passed: Initial State');

  // Test 2: Manual Focus on Main Field
  manager.trackManualFocus('travelClass');
  if (manager.currentFieldIndex !== 1) throw new Error(`Expected index 1, got ${manager.currentFieldIndex}`);
  if (!manager.manualFocusOverride) throw new Error('manualFocusOverride should be true');
  console.log('Test 2 Passed: Manual Focus Main Field');

  // Test 3: Tab Navigation (Forward)
  // travelClass (1) -> berthPreference (2)
  manager.handleTabNavigation('forward');
  if (manager.currentFieldIndex !== 2) throw new Error(`Expected index 2 (berthPreference), got ${manager.currentFieldIndex}`);
  console.log('Test 3 Passed: Tab Navigation');

  // Test 4: Manual Focus on Passenger Field
  manager.trackManualFocus('passenger_age');
  if (!manager.passengerEntryContext.isActive) throw new Error('Should be in passenger mode');
  if (manager.passengerEntryContext.passengerFieldIndex !== 1) throw new Error(`Expected passenger index 1, got ${manager.passengerEntryContext.passengerFieldIndex}`);
  console.log('Test 4 Passed: Manual Focus Passenger Field');

  // Test 5: Tab in Passenger Mode
  // passenger_age (1) -> passenger_gender (2)
  const nextField = manager.getNextField();
  if (nextField !== 'passenger_gender') throw new Error(`Expected passenger_gender, got ${nextField}`);
  
  // Actually move focus
  manager.handleTabNavigation('forward');
  if (manager.passengerEntryContext.passengerFieldIndex !== 2) throw new Error('Passenger index should increment');
  console.log('Test 5 Passed: Tab in Passenger Mode');

  // Test 6: Exit Passenger Mode via Manual Focus on Main Field
  manager.trackManualFocus('quotaType');
  if (manager.passengerEntryContext.isActive) throw new Error('Should have exited passenger mode');
  if (manager.currentFieldIndex !== 3) throw new Error('Should be at quotaType index (3)');
  console.log('Test 6 Passed: Exit Passenger Mode');

  // Test 7: Re-enter Passenger Mode via Tab (simulating entering from previous field)
  // This logic is usually in the component (Tab from quotaType -> passenger_name), 
  // but let's check if trackManualFocus works for passenger_name
  manager.trackManualFocus('passenger_name');
  if (!manager.passengerEntryContext.isActive) throw new Error('Should re-enter passenger mode');
  if (manager.passengerEntryContext.passengerFieldIndex !== 0) throw new Error('Should be at index 0');
  console.log('Test 7 Passed: Re-enter Passenger Mode');
  
  // Test 8: Passenger Loop End
  // Move to last field
  manager.trackManualFocus('passenger_berth'); // Index 3
  const loopField = manager.getNextField();
  if (loopField !== 'passenger_name') throw new Error(`Expected loop to passenger_name, got ${loopField}`);
  console.log('Test 8 Passed: Passenger Loop');

  console.log('ALL TESTS PASSED');
  return true;
}

try {
  runTest();
} catch (error) {
  console.error('TEST FAILED:', error.message);
  console.error('Logs:', logs);
  process.exit(1);
}
