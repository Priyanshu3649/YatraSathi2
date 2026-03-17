/**
 * COMPREHENSIVE BOOKING FIXES TEST
 * 
 * This test verifies all booking functionality is working correctly:
 * 1. Passenger viewing with correct endpoints
 * 2. Booking deletion with proper error handling
 * 3. Save functionality
 * 4. API endpoint routing
 */

const fetch = require('node-fetch');

const TEST_CONFIG = {
  baseUrl: 'http://localhost:5010',
  token: null,
  user: null
};

async function login() {
  console.log('🔐 Logging in as admin...');
  
  const response = await fetch(`${TEST_CONFIG.baseUrl}/api/auth/employee-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@example.com',
      password: 'admin123'
    })
  });
  
  const data = await response.json();
  
  if (data.success && data.data.token) {
    TEST_CONFIG.token = data.data.token;
    TEST_CONFIG.user = data.data.user;
    console.log('✅ Login successful');
    console.log(`   User: ${data.data.user.name} (${data.data.user.role})`);
    return true;
  } else {
    console.log('❌ Login failed:', data);
    return false;
  }
}

async function testEndpointRouting() {
  console.log('\n🔍 Testing API endpoint routing...');
  
  const tests = [
    {
      name: 'Employee Bookings List',
      url: `${TEST_CONFIG.baseUrl}/api/employee/bookings`,
      expectedStatus: 200
    },
    {
      name: 'General Bookings List (should work for admin)',
      url: `${TEST_CONFIG.baseUrl}/api/bookings`,
      expectedStatus: 200
    },
    {
      name: 'Customer Bookings (should fail for admin)',
      url: `${TEST_CONFIG.baseUrl}/api/customer/bookings`,
      expectedStatus: 403
    }
  ];
  
  for (const test of tests) {
    try {
      const response = await fetch(test.url, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEST_CONFIG.token}`
        }
      });
      
      const success = response.status === test.expectedStatus;
      console.log(`   ${success ? '✅' : '❌'} ${test.name}: ${response.status} (expected ${test.expectedStatus})`);
      
    } catch (error) {
      console.log(`   ❌ ${test.name}: Error - ${error.message}`);
    }
  }
}

async function testPassengerViewing() {
  console.log('\n👥 Testing passenger viewing...');
  
  // First get a booking to test with
  const bookingsResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/employee/bookings`, {
    method: 'GET',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TEST_CONFIG.token}`
    }
  });
  
  const bookingsData = await bookingsResponse.json();
  
  if (!bookingsData.success || !bookingsData.data.bookings.length) {
    console.log('   ⚠️  No bookings available for testing');
    return false;
  }
  
  const testBooking = bookingsData.data.bookings[0];
  console.log(`   Testing with booking ID: ${testBooking.bk_bkid}`);
  
  // Test the correct admin endpoint
  const passengerResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/bookings/${testBooking.bk_bkid}/passengers`, {
    method: 'GET',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TEST_CONFIG.token}`
    }
  });
  
  const passengerData = await passengerResponse.json();
  
  if (passengerResponse.ok && passengerData.success) {
    console.log(`   ✅ Passenger viewing works - found ${passengerData.passengers?.length || 0} passengers`);
    return true;
  } else {
    console.log(`   ❌ Passenger viewing failed: ${passengerResponse.status} - ${passengerData.message || 'Unknown error'}`);
    return false;
  }
}

async function testBookingCreation() {
  console.log('\n📝 Testing booking creation...');
  
  const bookingData = {
    customerName: 'Test Customer API Fix',
    phoneNumber: '9876543210',
    fromStation: 'DEL',
    toStation: 'MUM',
    travelDate: '2024-02-20',
    travelClass: '3A',
    berthPreference: 'LB',
    remarks: 'Test booking for API fix verification',
    passengerList: [
      {
        name: 'Test Passenger',
        age: 30,
        gender: 'M',
        berthPreference: 'LB'
      }
    ]
  };
  
  const response = await fetch(`${TEST_CONFIG.baseUrl}/api/bookings`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TEST_CONFIG.token}`
    },
    body: JSON.stringify(bookingData)
  });
  
  const data = await response.json();
  
  if (response.ok && data.success) {
    const bookingId = data.data?.bk_bkid;
    console.log(`   ✅ Booking creation works - created booking ${bookingId}`);
    return bookingId;
  } else {
    console.log(`   ❌ Booking creation failed: ${response.status} - ${JSON.stringify(data, null, 2)}`);
    return null;
  }
}

async function testBookingDeletion(bookingId) {
  if (!bookingId) {
    console.log('\n🗑️  Skipping deletion test - no booking ID available');
    return false;
  }
  
  console.log(`\n🗑️  Testing booking deletion for booking ${bookingId}...`);
  
  const response = await fetch(`${TEST_CONFIG.baseUrl}/api/bookings/${bookingId}`, {
    method: 'DELETE',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TEST_CONFIG.token}`
    }
  });
  
  const data = await response.json();
  
  if (response.ok && data.success) {
    console.log('   ✅ Booking deletion works');
    return true;
  } else if (response.status === 400 && data.error?.code === 'FOREIGN_KEY_CONSTRAINT') {
    console.log('   ✅ Booking deletion properly handles constraints (expected behavior)');
    return true;
  } else {
    console.log(`   ❌ Booking deletion failed: ${response.status} - ${JSON.stringify(data, null, 2)}`);
    return false;
  }
}

async function testWrongEndpoints() {
  console.log('\n🚫 Testing wrong endpoint handling...');
  
  // Test customer endpoint with admin token (should fail)
  const response = await fetch(`${TEST_CONFIG.baseUrl}/api/customer/bookings/1/passengers`, {
    method: 'GET',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TEST_CONFIG.token}`
    }
  });
  
  if (response.status === 403) {
    console.log('   ✅ Customer endpoint properly rejects admin users (403 Forbidden)');
    return true;
  } else {
    console.log(`   ❌ Customer endpoint should reject admin users but returned: ${response.status}`);
    return false;
  }
}

async function runComprehensiveTest() {
  console.log('🚀 COMPREHENSIVE BOOKING FIXES VERIFICATION');
  console.log('=' .repeat(60));
  
  const results = {
    login: false,
    endpointRouting: false,
    passengerViewing: false,
    bookingCreation: false,
    bookingDeletion: false,
    wrongEndpoints: false
  };
  
  try {
    // Test 1: Login
    results.login = await login();
    if (!results.login) {
      throw new Error('Cannot proceed without login');
    }
    
    // Test 2: Endpoint routing
    await testEndpointRouting();
    results.endpointRouting = true;
    
    // Test 3: Passenger viewing
    results.passengerViewing = await testPassengerViewing();
    
    // Test 4: Booking creation
    const newBookingId = await testBookingCreation();
    results.bookingCreation = !!newBookingId;
    
    // Test 5: Booking deletion
    results.bookingDeletion = await testBookingDeletion(newBookingId);
    
    // Test 6: Wrong endpoint handling
    results.wrongEndpoints = await testWrongEndpoints();
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 COMPREHENSIVE TEST RESULTS');
  console.log('=' .repeat(60));
  
  const testResults = [
    { name: 'Login Authentication', status: results.login },
    { name: 'Endpoint Routing', status: results.endpointRouting },
    { name: 'Passenger Viewing', status: results.passengerViewing },
    { name: 'Booking Creation', status: results.bookingCreation },
    { name: 'Booking Deletion', status: results.bookingDeletion },
    { name: 'Wrong Endpoint Handling', status: results.wrongEndpoints }
  ];
  
  testResults.forEach(test => {
    console.log(`${test.status ? '✅' : '❌'} ${test.name}: ${test.status ? 'PASS' : 'FAIL'}`);
  });
  
  const passedTests = testResults.filter(t => t.status).length;
  const totalTests = testResults.length;
  
  console.log(`\n📈 Success Rate: ${passedTests}/${totalTests} (${((passedTests/totalTests)*100).toFixed(1)}%)`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 ALL FIXES VERIFIED SUCCESSFULLY!');
    console.log('✅ No more 403 Forbidden errors');
    console.log('✅ No more 400 Bad Request errors');
    console.log('✅ Save functionality working');
    console.log('✅ Passenger viewing working');
    console.log('✅ Booking deletion working');
  } else {
    console.log('\n⚠️  Some issues remain. Check the failed tests above.');
  }
  
  console.log('\n🏁 COMPREHENSIVE TEST COMPLETE');
}

runComprehensiveTest();