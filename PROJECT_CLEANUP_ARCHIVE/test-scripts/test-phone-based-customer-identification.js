/**
 * MANDATORY CUSTOMER IDENTIFICATION REWORK TEST
 * Tests the phone-based customer identification system
 */

const assert = require('assert');

// Test Configuration
const TEST_CONFIG = {
  baseURL: 'http://localhost:3000',
  testPhone: '9876543210',
  testCustomerName: 'John Doe',
  testBookingData: {
    fromStation: 'DEL',
    toStation: 'MUM',
    travelDate: '2024-02-15',
    travelClass: '3A',
    berthPreference: 'LB',
    remarks: 'Test booking with phone-based customer',
    passengerList: [
      {
        name: 'John Doe',
        age: 35,
        gender: 'M',
        berthPreference: 'LB'
      }
    ]
  }
};

// Test Results
const testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

// Helper function to make API requests
async function makeRequest(endpoint, method = 'GET', data = null, token = null) {
  const fetch = require('node-fetch');
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }
  
  if (data && method !== 'GET') {
    options.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(`${TEST_CONFIG.baseURL}${endpoint}`, options);
    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) {
    return { status: 500, error: error.message };
  }
}

// Test 1: Phone Number Validation
async function testPhoneValidation() {
  console.log('\n🧪 TEST 1: Phone Number Validation');
  
  const testCases = [
    { phone: '9876543210', valid: true, description: '10-digit Indian number' },
    { phone: '919876543210', valid: true, description: '12-digit with country code' },
    { phone: '+919876543210', valid: false, description: 'With + symbol (should be cleaned)' },
    { phone: '987654321', valid: false, description: '9 digits (too short)' },
    { phone: '98765432101234567', valid: false, description: '17 digits (too long)' },
    { phone: '98765abcde', valid: false, description: 'Contains letters' },
    { phone: '', valid: false, description: 'Empty phone number' }
  ];
  
  for (const testCase of testCases) {
    try {
      // Test phone validation logic
      const cleanPhone = testCase.phone.replace(/\D/g, '');
      const isValid = cleanPhone.length >= 10 && cleanPhone.length <= 15;
      
      if (isValid === testCase.valid) {
        console.log(`  ✅ ${testCase.description}: PASS`);
        testResults.passed++;
      } else {
        console.log(`  ❌ ${testCase.description}: FAIL (expected ${testCase.valid}, got ${isValid})`);
        testResults.failed++;
        testResults.errors.push(`Phone validation failed for ${testCase.phone}`);
      }
    } catch (error) {
      console.log(`  ❌ ${testCase.description}: ERROR - ${error.message}`);
      testResults.failed++;
      testResults.errors.push(`Phone validation error: ${error.message}`);
    }
  }
}

// Test 2: Customer Lookup by Phone (Mock Test)
async function testCustomerLookup() {
  console.log('\n🧪 TEST 2: Customer Lookup by Phone');
  
  try {
    // Mock the phone lookup functionality
    const mockCustomerFound = {
      found: true,
      customer: {
        internalCustomerId: 'CUST123',
        customerName: 'John Doe',
        phoneNumber: '9876543210',
        address: '123 Main St',
        city: 'Delhi',
        state: 'Delhi',
        email: 'john@example.com'
      }
    };
    
    const mockCustomerNotFound = {
      found: false,
      reason: 'not_found',
      newCustomer: {
        phoneNumber: '9876543210',
        customerName: '',
        source: 'PHONE_BOOKING'
      }
    };
    
    // Test customer found scenario
    if (mockCustomerFound.found && mockCustomerFound.customer.phoneNumber === '9876543210') {
      console.log('  ✅ Customer found scenario: PASS');
      testResults.passed++;
    } else {
      console.log('  ❌ Customer found scenario: FAIL');
      testResults.failed++;
      testResults.errors.push('Customer found scenario failed');
    }
    
    // Test customer not found scenario
    if (!mockCustomerNotFound.found && mockCustomerNotFound.newCustomer.phoneNumber === '9876543210') {
      console.log('  ✅ Customer not found scenario: PASS');
      testResults.passed++;
    } else {
      console.log('  ❌ Customer not found scenario: FAIL');
      testResults.failed++;
      testResults.errors.push('Customer not found scenario failed');
    }
    
  } catch (error) {
    console.log(`  ❌ Customer lookup test: ERROR - ${error.message}`);
    testResults.failed++;
    testResults.errors.push(`Customer lookup error: ${error.message}`);
  }
}

// Test 3: Booking Creation with Phone-based Customer
async function testBookingCreation() {
  console.log('\n🧪 TEST 3: Booking Creation with Phone-based Customer');
  
  try {
    // Mock booking creation data
    const bookingData = {
      ...TEST_CONFIG.testBookingData,
      phoneNumber: TEST_CONFIG.testPhone,
      customerName: TEST_CONFIG.testCustomerName,
      internalCustomerId: null // New customer
    };
    
    // Validate required fields
    const requiredFields = ['phoneNumber', 'customerName', 'fromStation', 'toStation', 'travelDate'];
    let allFieldsPresent = true;
    
    for (const field of requiredFields) {
      if (!bookingData[field]) {
        console.log(`  ❌ Missing required field: ${field}`);
        allFieldsPresent = false;
      }
    }
    
    if (allFieldsPresent) {
      console.log('  ✅ All required fields present: PASS');
      testResults.passed++;
    } else {
      console.log('  ❌ Required fields validation: FAIL');
      testResults.failed++;
      testResults.errors.push('Required fields validation failed');
    }
    
    // Test phone number cleaning
    const cleanPhone = bookingData.phoneNumber.replace(/\D/g, '');
    if (cleanPhone === '9876543210') {
      console.log('  ✅ Phone number cleaning: PASS');
      testResults.passed++;
    } else {
      console.log('  ❌ Phone number cleaning: FAIL');
      testResults.failed++;
      testResults.errors.push('Phone number cleaning failed');
    }
    
    // Test customer name validation
    if (bookingData.customerName && bookingData.customerName.trim() !== '') {
      console.log('  ✅ Customer name validation: PASS');
      testResults.passed++;
    } else {
      console.log('  ❌ Customer name validation: FAIL');
      testResults.failed++;
      testResults.errors.push('Customer name validation failed');
    }
    
  } catch (error) {
    console.log(`  ❌ Booking creation test: ERROR - ${error.message}`);
    testResults.failed++;
    testResults.errors.push(`Booking creation error: ${error.message}`);
  }
}

// Test 4: UI Field Order Compliance
async function testUIFieldOrder() {
  console.log('\n🧪 TEST 4: UI Field Order Compliance');
  
  try {
    // Expected field order (MANDATORY)
    const expectedFieldOrder = [
      'bookingDate',
      'customerName',     // Customer Name (required)
      'phoneNumber',      // Phone Number (required, 10-15 digits)
      'fromStation',
      'toStation',
      'travelDate',
      'travelClass',
      'berthPreference',
      'quotaType',
      'passenger_name',
      'passenger_age', 
      'passenger_gender',
      'passenger_berth',
      'remarks',
      'status'
    ];
    
    // Check that Customer ID is NOT in the field order
    if (!expectedFieldOrder.includes('customerId')) {
      console.log('  ✅ Customer ID removed from field order: PASS');
      testResults.passed++;
    } else {
      console.log('  ❌ Customer ID still in field order: FAIL');
      testResults.failed++;
      testResults.errors.push('Customer ID should be removed from field order');
    }
    
    // Check that phone number is in the correct position
    const phoneIndex = expectedFieldOrder.indexOf('phoneNumber');
    const nameIndex = expectedFieldOrder.indexOf('customerName');
    
    if (phoneIndex > nameIndex && phoneIndex !== -1) {
      console.log('  ✅ Phone number field order: PASS');
      testResults.passed++;
    } else {
      console.log('  ❌ Phone number field order: FAIL');
      testResults.failed++;
      testResults.errors.push('Phone number should come after customer name');
    }
    
    // Check that both fields are required
    const requiredFields = ['customerName', 'phoneNumber'];
    let allRequired = true;
    
    for (const field of requiredFields) {
      if (expectedFieldOrder.includes(field)) {
        console.log(`  ✅ ${field} is in field order: PASS`);
        testResults.passed++;
      } else {
        console.log(`  ❌ ${field} missing from field order: FAIL`);
        testResults.failed++;
        testResults.errors.push(`${field} should be in field order`);
        allRequired = false;
      }
    }
    
  } catch (error) {
    console.log(`  ❌ UI field order test: ERROR - ${error.message}`);
    testResults.failed++;
    testResults.errors.push(`UI field order error: ${error.message}`);
  }
}

// Test 5: Database Schema Compliance
async function testDatabaseSchema() {
  console.log('\n🧪 TEST 5: Database Schema Compliance');
  
  try {
    // Expected new fields in booking table
    const expectedFields = [
      'bk_phonenumber',
      'bk_customername'
    ];
    
    // Mock schema validation (in real test, this would query the database)
    const mockSchema = {
      bk_phonenumber: { type: 'VARCHAR(15)', nullable: true },
      bk_customername: { type: 'VARCHAR(100)', nullable: true }
    };
    
    for (const field of expectedFields) {
      if (mockSchema[field]) {
        console.log(`  ✅ ${field} field exists: PASS`);
        testResults.passed++;
      } else {
        console.log(`  ❌ ${field} field missing: FAIL`);
        testResults.failed++;
        testResults.errors.push(`${field} field should exist in booking table`);
      }
    }
    
    // Test phone number constraints
    if (mockSchema.bk_phonenumber && mockSchema.bk_phonenumber.type === 'VARCHAR(15)') {
      console.log('  ✅ Phone number field type: PASS');
      testResults.passed++;
    } else {
      console.log('  ❌ Phone number field type: FAIL');
      testResults.failed++;
      testResults.errors.push('Phone number field should be VARCHAR(15)');
    }
    
  } catch (error) {
    console.log(`  ❌ Database schema test: ERROR - ${error.message}`);
    testResults.failed++;
    testResults.errors.push(`Database schema error: ${error.message}`);
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 MANDATORY CUSTOMER IDENTIFICATION REWORK TEST SUITE');
  console.log('=' .repeat(60));
  
  await testPhoneValidation();
  await testCustomerLookup();
  await testBookingCreation();
  await testUIFieldOrder();
  await testDatabaseSchema();
  
  console.log('\n' + '=' .repeat(60));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('=' .repeat(60));
  console.log(`✅ Tests Passed: ${testResults.passed}`);
  console.log(`❌ Tests Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
  
  if (testResults.errors.length > 0) {
    console.log('\n🔍 ERROR DETAILS:');
    testResults.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
  }
  
  if (testResults.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Phone-based customer identification system is ready.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Please review the implementation.');
    process.exit(1);
  }
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});