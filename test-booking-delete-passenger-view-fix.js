/**
 * BOOKING DELETE AND PASSENGER VIEW FIX VERIFICATION
 * 
 * This test verifies that the booking delete and passenger viewing functionality
 * is working correctly after the fixes applied.
 * 
 * FIXES APPLIED:
 * 1. Fixed getBookingPassengers function to use correct Passenger model
 * 2. Enhanced deleteBooking function with proper transaction handling
 * 3. Fixed Passenger model database connection issues
 * 4. Updated API endpoints for proper error handling
 * 
 * TESTS:
 * 1. Test passenger viewing functionality
 * 2. Test booking deletion functionality
 * 3. Test error handling for non-existent bookings
 * 4. Test permission checks for admin-only operations
 */

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:5010',
  adminToken: null, // Will be set after login
  testBookingId: null // Will be set after creating test booking
};

// Mock admin user for testing
const ADMIN_CREDENTIALS = {
  email: 'admin@example.com',
  password: 'admin123'
};

// Test utilities
const testUtils = {
  async login() {
    console.log('🔐 Logging in as admin...');
    
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/auth/employee-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ADMIN_CREDENTIALS)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`Login failed: ${data.message || 'Unknown error'}`);
    }
    
    TEST_CONFIG.adminToken = data.token;
    
    // Set token in localStorage for API calls
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    console.log('✅ Admin login successful');
    return data;
  },

  async createTestBooking() {
    console.log('📝 Creating test booking...');
    
    const bookingData = {
      customerName: 'Test Customer',
      phoneNumber: '9876543210',
      fromStation: 'DEL',
      toStation: 'MUM',
      travelDate: '2024-02-15',
      travelClass: '3A',
      berthPreference: 'LB',
      remarks: 'Test booking for delete/passenger view testing',
      passengerList: [
        {
          name: 'John Doe',
          age: 30,
          gender: 'M',
          berthPreference: 'LB'
        },
        {
          name: 'Jane Doe',
          age: 28,
          gender: 'F',
          berthPreference: 'UB'
        }
      ]
    };
    
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_CONFIG.adminToken}`
      },
      body: JSON.stringify(bookingData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`Booking creation failed: ${data.message || 'Unknown error'}`);
    }
    
    TEST_CONFIG.testBookingId = data.data.bk_bkid;
    console.log(`✅ Test booking created with ID: ${TEST_CONFIG.testBookingId}`);
    
    return data;
  },

  async makeAuthenticatedRequest(url, options = {}) {
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_CONFIG.adminToken}`,
        ...options.headers
      }
    };
    
    return fetch(url, { ...options, ...defaultOptions });
  }
};

// Test functions
const tests = {
  async testPassengerViewing() {
    console.log('\n🔍 Testing passenger viewing functionality...');
    
    try {
      const response = await testUtils.makeAuthenticatedRequest(
        `${TEST_CONFIG.baseUrl}/api/bookings/${TEST_CONFIG.testBookingId}/passengers`
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Passenger viewing failed: ${data.message || 'Unknown error'}`);
      }
      
      console.log('✅ Passenger viewing response:', {
        success: data.success,
        bookingId: data.bookingId,
        passengerCount: data.passengers ? data.passengers.length : 0
      });
      
      if (data.success && data.passengers && data.passengers.length > 0) {
        console.log('✅ Passengers retrieved successfully:');
        data.passengers.forEach((passenger, index) => {
          console.log(`   ${index + 1}. ${passenger.firstName} ${passenger.lastName || ''} (Age: ${passenger.age}, Gender: ${passenger.gender})`);
        });
        return true;
      } else {
        console.log('⚠️  No passengers found or invalid response structure');
        return false;
      }
    } catch (error) {
      console.error('❌ Passenger viewing test failed:', error.message);
      return false;
    }
  },

  async testBookingDeletion() {
    console.log('\n🗑️  Testing booking deletion functionality...');
    
    try {
      const response = await testUtils.makeAuthenticatedRequest(
        `${TEST_CONFIG.baseUrl}/api/bookings/${TEST_CONFIG.testBookingId}`,
        { method: 'DELETE' }
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Booking deletion failed: ${data.message || 'Unknown error'}`);
      }
      
      console.log('✅ Booking deletion response:', {
        success: data.success,
        message: data.data ? data.data.message : 'No message'
      });
      
      if (data.success) {
        console.log('✅ Booking deleted successfully');
        return true;
      } else {
        console.log('❌ Booking deletion failed');
        return false;
      }
    } catch (error) {
      console.error('❌ Booking deletion test failed:', error.message);
      return false;
    }
  },

  async testNonExistentBooking() {
    console.log('\n🔍 Testing error handling for non-existent booking...');
    
    try {
      const nonExistentId = 999999;
      const response = await testUtils.makeAuthenticatedRequest(
        `${TEST_CONFIG.baseUrl}/api/bookings/${nonExistentId}/passengers`
      );
      
      const data = await response.json();
      
      if (response.status === 404 && !data.success) {
        console.log('✅ Proper 404 error handling for non-existent booking');
        return true;
      } else {
        console.log('❌ Expected 404 error but got:', response.status, data);
        return false;
      }
    } catch (error) {
      console.error('❌ Non-existent booking test failed:', error.message);
      return false;
    }
  },

  async testPermissionChecks() {
    console.log('\n🔒 Testing permission checks...');
    
    try {
      // Test without authentication
      const response = await fetch(`${TEST_CONFIG.baseUrl}/api/bookings/1/passengers`);
      const data = await response.json();
      
      if (response.status === 401) {
        console.log('✅ Proper authentication check - 401 Unauthorized');
        return true;
      } else {
        console.log('❌ Expected 401 error but got:', response.status, data);
        return false;
      }
    } catch (error) {
      console.error('❌ Permission check test failed:', error.message);
      return false;
    }
  }
};

// Main test runner
async function runTests() {
  console.log('🚀 BOOKING DELETE AND PASSENGER VIEW FIX VERIFICATION');
  console.log('=' .repeat(60));
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0
  };
  
  try {
    // Setup
    await testUtils.login();
    await testUtils.createTestBooking();
    
    // Run tests
    const testCases = [
      { name: 'Passenger Viewing', test: tests.testPassengerViewing },
      { name: 'Non-Existent Booking Error Handling', test: tests.testNonExistentBooking },
      { name: 'Permission Checks', test: tests.testPermissionChecks },
      { name: 'Booking Deletion', test: tests.testBookingDeletion }
    ];
    
    for (const testCase of testCases) {
      results.total++;
      console.log(`\n📋 Running test: ${testCase.name}`);
      
      try {
        const success = await testCase.test();
        if (success) {
          results.passed++;
          console.log(`✅ ${testCase.name}: PASSED`);
        } else {
          results.failed++;
          console.log(`❌ ${testCase.name}: FAILED`);
        }
      } catch (error) {
        results.failed++;
        console.log(`❌ ${testCase.name}: ERROR - ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Test setup failed:', error.message);
    process.exit(1);
  }
  
  // Results summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('=' .repeat(60));
  console.log(`Total Tests: ${results.total}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  
  if (results.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Booking delete and passenger view fixes are working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the issues above.');
  }
  
  console.log('\n✅ VERIFICATION COMPLETE');
}

// Run the tests
if (require.main === module) {
  runTests().catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = { runTests, tests, testUtils };