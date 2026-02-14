#!/usr/bin/env node

/**
 * Quick test to verify user context import fix
 * 
 * This script tests:
 * 1. AuthContext is properly imported in PaymentForm.jsx
 * 2. useAuth hook is called correctly
 * 3. user variable is available for audit data
 * 4. Same fixes applied to ReceiptForm.jsx
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing User Context Import Fix...\n');

// Test 1: Check if AuthContext is imported
console.log('Test 1: Verifying AuthContext import...');
const paymentForms = [
  'frontend/src/components/Payments/PaymentForm.jsx',
  'frontend/src/components/Payments/ReceiptForm.jsx'
];

let test1Passed = true;
for (const file of paymentForms) {
  const filePath = path.join(__dirname, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check if useAuth is imported
  if (!content.includes("import { useAuth } from '../../contexts/AuthContext';")) {
    console.error(`❌ useAuth not imported in ${file}`);
    test1Passed = false;
  }
  
  // Check if useAuth hook is called
  if (!content.includes('const { user } = useAuth();')) {
    console.error(`❌ useAuth hook not called in ${file}`);
    test1Passed = false;
  }
  
  // Check if user is used in auditData
  if (!content.includes('user?.us_usid || \'ADMIN\'')) {
    console.error(`❌ user variable not used in auditData in ${file}`);
    test1Passed = false;
  }
}

if (test1Passed) {
  console.log('✅ Test 1 PASSED: AuthContext properly imported and used');
} else {
  console.log('❌ Test 1 FAILED: AuthContext import issues found');
}

// Test 2: Verify no more "user is not defined" errors
console.log('\nTest 2: Verifying user variable availability...');
let test2Passed = true;

for (const file of paymentForms) {
  const filePath = path.join(__dirname, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check that user is defined before being used
  const lines = content.split('\n');
  let useAuthLine = -1;
  let auditDataLine = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('const { user } = useAuth();')) {
      useAuthLine = i;
    }
    if (lines[i].includes('enteredBy: user?.us_usid || \'ADMIN\'')) {
      auditDataLine = i;
    }
  }
  
  if (useAuthLine === -1) {
    console.error(`❌ useAuth hook not found in ${file}`);
    test2Passed = false;
  }
  
  if (auditDataLine === -1) {
    console.error(`❌ auditData with user reference not found in ${file}`);
    test2Passed = false;
  }
  
  // Ensure useAuth is defined before auditData uses user
  if (useAuthLine > auditDataLine && auditDataLine !== -1) {
    console.error(`❌ useAuth defined after user usage in ${file}`);
    test2Passed = false;
  }
}

if (test2Passed) {
  console.log('✅ Test 2 PASSED: User variable properly defined before usage');
} else {
  console.log('❌ Test 2 FAILED: User variable definition issues found');
}

// Summary
console.log('\n📋 TEST SUMMARY:');
console.log('================');

const allTests = [
  { name: 'AuthContext Import', passed: test1Passed },
  { name: 'User Variable Availability', passed: test2Passed }
];

const passedTests = allTests.filter(t => t.passed).length;
const totalTests = allTests.length;

allTests.forEach(test => {
  console.log(`${test.passed ? '✅' : '❌'} ${test.name}`);
});

console.log(`\n📊 Overall Result: ${passedTests}/${totalTests} tests passed`);

if (passedTests === totalTests) {
  console.log('\n🎉 ALL TESTS PASSED! User context import fix is working correctly.');
  console.log('\n📋 What was fixed:');
  console.log('  • Added AuthContext import to PaymentForm.jsx and ReceiptForm.jsx');
  console.log('  • Added useAuth hook to get user data');
  console.log('  • User variable now available for audit data initialization');
  console.log('  • No more "user is not defined" runtime errors');
  
  process.exit(0);
} else {
  console.log('\n❌ SOME TESTS FAILED! Please review the errors above.');
  process.exit(1);
}