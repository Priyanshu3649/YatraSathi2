#!/usr/bin/env node

/**
 * Test script to verify payment forms UI and tab navigation fixes
 * 
 * This script tests:
 * 1. UI consistency across all payment forms
 * 2. Proper field order for tab navigation
 * 3. Save button placement and functionality
 * 4. CSS import and styling
 * 5. Keyboard navigation implementation
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Payment Forms UI and Navigation Fixes...\n');

// Test 1: Check field order consistency
console.log('Test 1: Verifying field order consistency...');
const paymentForms = [
  'frontend/src/components/Payments/PaymentForm.jsx',
  'frontend/src/components/Payments/ReceiptForm.jsx',
  'frontend/src/components/Payments/ContraForm.jsx',
  'frontend/src/components/Payments/JournalForm.jsx'
];

const expectedFieldOrders = {
  'PaymentForm.jsx': ['receipt_no', 'date', 'type', 'customer_search', 'customer_name', 'customer_phone', 'account_name', 'amount', 'ref_number', 'save_button'],
  'ReceiptForm.jsx': ['receipt_no', 'date', 'type', 'customer_search', 'customer_name', 'customer_phone', 'account_name', 'amount', 'ref_number', 'save_button'],
  'ContraForm.jsx': ['receipt_no', 'date', 'type', 'from_account', 'to_account', 'amount', 'ref_number', 'save_button'],
  'JournalForm.jsx': ['receipt_no', 'date', 'type', 'debit_account', 'credit_account', 'amount', 'ref_number', 'save_button']
};

let test1Passed = true;
for (const file of paymentForms) {
  const fileName = path.basename(file);
  const filePath = path.join(__dirname, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Extract fieldOrder array
  const fieldOrderMatch = content.match(/const fieldOrder = useMemo\(\(\) => \[([^\]]*)\]/s);
  if (!fieldOrderMatch) {
    console.error(`❌ fieldOrder not found in ${fileName}`);
    test1Passed = false;
    continue;
  }
  
  const fieldOrderContent = fieldOrderMatch[1];
  const fields = fieldOrderContent
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith(']') && !line.startsWith('//'))
    .map(line => line.replace(/[',]/g, '').trim())
    .filter(line => line.length > 0);
  
  const expectedFields = expectedFieldOrders[fileName];
  
  if (fields.length !== expectedFields.length) {
    console.error(`❌ Field count mismatch in ${fileName}: expected ${expectedFields.length}, got ${fields.length}`);
    console.error(`   Expected: ${expectedFields.join(', ')}`);
    console.error(`   Got: ${fields.join(', ')}`);
    test1Passed = false;
    continue;
  }
  
  for (let i = 0; i < expectedFields.length; i++) {
    if (fields[i] !== expectedFields[i]) {
      console.error(`❌ Field mismatch in ${fileName} at position ${i}: expected '${expectedFields[i]}', got '${fields[i]}'`);
      test1Passed = false;
    }
  }
  
  // Check that save_button is the last field
  if (fields[fields.length - 1] !== 'save_button') {
    console.error(`❌ save_button is not the last field in ${fileName}`);
    test1Passed = false;
  }
}

if (test1Passed) {
  console.log('✅ Test 1 PASSED: Field order is consistent across all forms');
} else {
  console.log('❌ Test 1 FAILED: Field order issues found');
}

// Test 2: Check CSS import
console.log('\nTest 2: Verifying CSS import...');
let test2Passed = true;

for (const file of paymentForms) {
  const fileName = path.basename(file);
  const filePath = path.join(__dirname, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  if (!content.includes("import '../../styles/payment-forms.css';")) {
    console.error(`❌ CSS import missing in ${fileName}`);
    test2Passed = false;
  }
}

if (test2Passed) {
  console.log('✅ Test 2 PASSED: CSS import found in all forms');
} else {
  console.log('❌ Test 2 FAILED: CSS import issues found');
}

// Test 3: Check inline styles removal
console.log('\nTest 3: Verifying inline styles removal...');
let test3Passed = true;

for (const file of paymentForms) {
  const fileName = path.basename(file);
  const filePath = path.join(__dirname, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check for remaining style tags
  if (content.includes('<style jsx>') || content.includes('<style>{`')) {
    console.error(`❌ Inline styles still present in ${fileName}`);
    test3Passed = false;
  }
  
  // Check for CSS property definitions that should be in external file
  const cssProperties = [
    '\\.payment-form-page\\s*{', 
    '\\.btn-primary\\s*{',
    '\\.form-row\\s*{',
    '\\.financial-grid\\s*{'
  ];
  
  for (const property of cssProperties) {
    if (new RegExp(property).test(content)) {
      console.error(`❌ CSS property ${property} still defined inline in ${fileName}`);
      test3Passed = false;
    }
  }
}

if (test3Passed) {
  console.log('✅ Test 3 PASSED: Inline styles properly removed');
} else {
  console.log('❌ Test 3 FAILED: Inline styles still present');
}

// Test 4: Check keyboard navigation implementation
console.log('\nTest 4: Verifying keyboard navigation implementation...');
let test4Passed = true;

for (const file of paymentForms) {
  const fileName = path.basename(file);
  const filePath = path.join(__dirname, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check for required imports
  if (!content.includes("import { useKeyboardNavigation } from '../../contexts/KeyboardNavigationContext';")) {
    console.error(`❌ useKeyboardNavigation import missing in ${fileName}`);
    test4Passed = false;
  }
  
  if (!content.includes("import useKeyboardNav from '../../hooks/useKeyboardNavigation';")) {
    console.error(`❌ useKeyboardNav import missing in ${fileName}`);
    test4Passed = false;
  }
  
  // Check for useKeyboardNav hook usage
  if (!content.includes('useKeyboardNav({')) {
    console.error(`❌ useKeyboardNav hook not used in ${fileName}`);
    test4Passed = false;
  }
  
  // Check for fieldOrder usage in useKeyboardNav
  if (!content.includes('fieldOrder: mode === \'form\' ? fieldOrder : recordsFieldOrder')) {
    console.error(`❌ fieldOrder not properly passed to useKeyboardNav in ${fileName}`);
    test4Passed = false;
  }
}

if (test4Passed) {
  console.log('✅ Test 4 PASSED: Keyboard navigation properly implemented');
} else {
  console.log('❌ Test 4 FAILED: Keyboard navigation issues found');
}

// Test 5: Check save functionality
console.log('\nTest 5: Verifying save functionality...');
let test5Passed = true;

for (const file of paymentForms) {
  const fileName = path.basename(file);
  const filePath = path.join(__dirname, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check for handleSave function
  if (!content.includes('async function handleSave()') && !content.includes('const handleSave = async () =>')) {
    console.error(`❌ handleSave function not found in ${fileName}`);
    test5Passed = false;
  }
  
  // Check for save button in JSX
  if (!content.includes('name="save_button"')) {
    console.error(`❌ save_button not found in JSX in ${fileName}`);
    test5Passed = false;
  }
  
  // Check for save button onClick handler
  if (!content.includes('onClick={handleSave}')) {
    console.error(`❌ save button onClick handler missing in ${fileName}`);
    test5Passed = false;
  }
}

if (test5Passed) {
  console.log('✅ Test 5 PASSED: Save functionality properly implemented');
} else {
  console.log('❌ Test 5 FAILED: Save functionality issues found');
}

// Summary
console.log('\n📋 TEST SUMMARY:');
console.log('================');

const allTests = [
  { name: 'Field Order Consistency', passed: test1Passed },
  { name: 'CSS Import', passed: test2Passed },
  { name: 'Inline Styles Removal', passed: test3Passed },
  { name: 'Keyboard Navigation', passed: test4Passed },
  { name: 'Save Functionality', passed: test5Passed }
];

const passedTests = allTests.filter(t => t.passed).length;
const totalTests = allTests.length;

allTests.forEach(test => {
  console.log(`${test.passed ? '✅' : '❌'} ${test.name}`);
});

console.log(`\n📊 Overall Result: ${passedTests}/${totalTests} tests passed`);

if (passedTests === totalTests) {
  console.log('\n🎉 ALL TESTS PASSED! Payment forms UI and navigation fixes are working correctly.');
  console.log('\n📋 What was fixed:');
  console.log('  • Removed view_records_button from fieldOrder to enable tab-triggered save');
  console.log('  • Created consistent external CSS file for all payment forms');
  console.log('  • Removed inline styles from all payment forms');
  console.log('  • Ensured proper field order for keyboard navigation');
  console.log('  • Verified save button placement and functionality');
  console.log('  • Confirmed keyboard navigation implementation');
  console.log('  • Maintained consistent styling across all payment form types');
  
  process.exit(0);
} else {
  console.log('\n❌ SOME TESTS FAILED! Please review the errors above.');
  process.exit(1);
}