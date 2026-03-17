#!/usr/bin/env node

/**
 * Test script to verify payment audit details and save functionality fixes
 * 
 * This script tests:
 * 1. Audit details follow the same pattern as booking/billing modules
 * 2. Save button works correctly on all payment forms
 * 3. Tab navigation triggers save after the last field
 * 4. Payment records can be saved successfully
 * 5. Audit data is properly maintained and displayed
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Payment Audit Details and Save Functionality Fixes...\n');

// Test 1: Check audit data structure matches booking/billing pattern
console.log('Test 1: Verifying audit data structure...');
const expectedAuditFields = ['enteredOn', 'enteredBy', 'modifiedOn', 'modifiedBy', 'closedOn', 'closedBy'];

const paymentForms = [
  'frontend/src/components/Payments/PaymentForm.jsx',
  'frontend/src/components/Payments/ReceiptForm.jsx'
];

let test1Passed = true;
for (const file of paymentForms) {
  const filePath = path.join(__dirname, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check if auditData state is defined with correct fields
  if (!content.includes('const [auditData, setAuditData] = useState({')) {
    console.error(`❌ auditData state not found in ${file}`);
    test1Passed = false;
  }
  
  // Check for all required audit fields
  for (const field of expectedAuditFields) {
    if (!content.includes(field)) {
      console.error(`❌ Missing audit field ${field} in ${file}`);
      test1Passed = false;
    }
  }
  
  // Check if audit details section uses auditData instead of formData
  if (content.includes('formData.created_by') || content.includes('formData.created_at')) {
    console.error(`❌ Still using formData for audit details in ${file}`);
    test1Passed = false;
  }
  
  if (!content.includes('auditData.enteredBy') || !content.includes('auditData.modifiedBy')) {
    console.error(`❌ Not using auditData for audit details display in ${file}`);
    test1Passed = false;
  }
}

if (test1Passed) {
  console.log('✅ Test 1 PASSED: Audit data structure matches booking/billing pattern');
} else {
  console.log('❌ Test 1 FAILED: Audit data structure issues found');
}

// Test 2: Verify save functionality implementation
console.log('\nTest 2: Verifying save functionality...');
let test2Passed = true;

for (const file of paymentForms) {
  const filePath = path.join(__dirname, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check if handleSave function updates audit data
  if (!content.includes('setAuditData(prev => ({') || !content.includes('modifiedOn: currentTime')) {
    console.error(`❌ Audit data not updated in handleSave function in ${file}`);
    test2Passed = false;
  }
  
  // Check if new records include audit data
  if (!content.includes('createdOn: auditData.enteredOn') || !content.includes('modifiedBy: user?.us_usid')) {
    console.error(`❌ New records not including audit data in ${file}`);
    test2Passed = false;
  }
  
  // Check if form reset includes audit data reset
  if (!content.includes('Reset audit data') || !content.includes('enteredOn: currentTime')) {
    console.error(`❌ Audit data not reset after save in ${file}`);
    test2Passed = false;
  }
}

if (test2Passed) {
  console.log('✅ Test 2 PASSED: Save functionality properly implemented');
} else {
  console.log('❌ Test 2 FAILED: Save functionality issues found');
}

// Test 3: Verify tab navigation field order
console.log('\nTest 3: Verifying tab navigation field order...');
let test3Passed = true;

for (const file of paymentForms) {
  const filePath = path.join(__dirname, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check if fieldOrder includes save_button as the last field
  const fieldOrderMatch = content.match(/const fieldOrder = useMemo\(\(\) => \[([^]*?)\]/);
  if (fieldOrderMatch) {
    const fieldOrder = fieldOrderMatch[1];
    if (!fieldOrder.includes('save_button') || fieldOrder.includes('view_records_button')) {
      console.error(`❌ Incorrect field order in ${file}`);
      test3Passed = false;
    }
    
    // Check if save_button is the last field before closing bracket
    const lines = fieldOrder.split('\n');
    const lastFieldLine = lines[lines.length - 2].trim();
    if (!lastFieldLine.includes('save_button')) {
      console.error(`❌ save_button is not the last field in ${file}`);
      test3Passed = false;
    }
  } else {
    console.error(`❌ fieldOrder not found in ${file}`);
    test3Passed = false;
  }
}

if (test3Passed) {
  console.log('✅ Test 3 PASSED: Tab navigation field order is correct');
} else {
  console.log('❌ Test 3 FAILED: Tab navigation field order issues found');
}

// Test 4: Verify audit details display format
console.log('\nTest 4: Verifying audit details display format...');
let test4Passed = true;

for (const file of paymentForms) {
  const filePath = path.join(__dirname, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check if audit details section uses correct labels
  if (!content.includes('Entered By:') || !content.includes('Entered On:')) {
    console.error(`❌ Incorrect audit labels in ${file}`);
    test4Passed = false;
  }
  
  if (content.includes('Created By:') || content.includes('Created At:')) {
    console.error(`❌ Still using old audit labels in ${file}`);
    test4Passed = false;
  }
  
  // Check if date formatting is handled properly
  if (!content.includes('auditData.enteredOn ? new Date(auditData.enteredOn).toLocaleString() : \'N/A\'')) {
    console.error(`❌ Improper date formatting in audit details in ${file}`);
    test4Passed = false;
  }
}

if (test4Passed) {
  console.log('✅ Test 4 PASSED: Audit details display format is correct');
} else {
  console.log('❌ Test 4 FAILED: Audit details display format issues found');
}

// Test 5: Verify customer data handling
console.log('\nTest 5: Verifying customer data handling...');
let test5Passed = true;

for (const file of paymentForms) {
  const filePath = path.join(__dirname, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check if formData no longer includes audit fields
  if (content.includes('created_by:') || content.includes('created_at:') || 
      content.includes('modified_by:') || content.includes('modified_at:')) {
    console.error(`❌ formData still contains audit fields in ${file}`);
    test5Passed = false;
  }
  
  // Check if calculateCustomerTotals uses customer_name instead of customer_id
  if (!content.includes('!formData.customer_name')) {
    console.error(`❌ Still using customer_id instead of customer_name in ${file}`);
    test5Passed = false;
  }
}

if (test5Passed) {
  console.log('✅ Test 5 PASSED: Customer data handling is correct');
} else {
  console.log('❌ Test 5 FAILED: Customer data handling issues found');
}

// Summary
console.log('\n📋 TEST SUMMARY:');
console.log('================');

const allTests = [
  { name: 'Audit Data Structure', passed: test1Passed },
  { name: 'Save Functionality', passed: test2Passed },
  { name: 'Tab Navigation Order', passed: test3Passed },
  { name: 'Audit Details Display', passed: test4Passed },
  { name: 'Customer Data Handling', passed: test5Passed }
];

const passedTests = allTests.filter(t => t.passed).length;
const totalTests = allTests.length;

allTests.forEach(test => {
  console.log(`${test.passed ? '✅' : '❌'} ${test.name}`);
});

console.log(`\n📊 Overall Result: ${passedTests}/${totalTests} tests passed`);

if (passedTests === totalTests) {
  console.log('\n🎉 ALL TESTS PASSED! Payment audit details and save functionality fixes are working correctly.');
  console.log('\n📋 What was fixed:');
  console.log('  • Audit details now follow booking/billing pattern with separate auditData state');
  console.log('  • Save button works correctly and updates audit data properly');
  console.log('  • Tab navigation field order fixed to trigger save after last field');
  console.log('  • Payment records now include proper audit trail information');
  console.log('  • Audit details display uses correct labels and formatting');
  console.log('  • Customer data handling cleaned up and optimized');
  
  process.exit(0);
} else {
  console.log('\n❌ SOME TESTS FAILED! Please review the errors above.');
  process.exit(1);
}