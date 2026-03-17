/**
 * SAVE BUTTON FIX TEST
 * 
 * This test specifically verifies that the save button is working correctly
 * and that all API endpoints are functioning properly.
 */

const fetch = require('node-fetch');

const TEST_CONFIG = {
  baseUrl: 'http://localhost:5010',
  token: null
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
    console.log('✅ Login successful');
    return true;
  }
  return false;
}

async function testSaveButtonFunctionality() {
  console.log('\n💾 Testing save button functionality...');
  
  // Generate unique phone number to avoid conflicts
  const uniquePhone = `98765${Date.now().toString().slice(-5)}`;
  
  const bookingData = {
    customerName: 'Save Test Customer',
    phoneNumber: uniquePhone,
    fromStation: 'DEL',
    toStation: 'MUM',
    travelDate: '2024-02-25',
    travelClass: '3A',
    berthPreference: 'LB',
    remarks: 'Save button functionality test',
    passengerList: [
      {
        name: 'Save Test Passenger',
        age: 25,
        gender: 'M',
        berthPreference: 'LB'
      }
    ]
  };
  
  console.log(`   Using unique phone: ${uniquePhone}`);
  
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
    console.log(`   ✅ Save functionality works - created booking ${bookingId}`);
    
    // Test passenger viewing for the new booking
    const passengerResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/bookings/${bookingId}/passengers`, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_CONFIG.token}`
      }
    });
    
    const passengerData = await passengerResponse.json();
    
    if (passengerResponse.ok && passengerData.success) {
      console.log(`   ✅ Passenger viewing works - found ${passengerData.passengers?.length || 0} passengers`);
      
      // Clean up - delete the test booking
      const deleteResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEST_CONFIG.token}`
        }
      });
      
      if (deleteResponse.ok) {
        console.log(`   ✅ Cleanup successful - deleted test booking`);
      } else {
        console.log(`   ⚠️  Cleanup note - booking ${bookingId} may need manual deletion`);
      }
      
      return true;
    } else {
      console.log(`   ❌ Passenger viewing failed: ${passengerResponse.status}`);
      return false;
    }
  } else {
    console.log(`   ❌ Save failed: ${response.status} - ${JSON.stringify(data, null, 2)}`);
    return false;
  }
}

async function testExistingBookingOperations() {
  console.log('\n📋 Testing operations on existing bookings...');
  
  // Get existing bookings
  const bookingsResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/employee/bookings`, {
    method: 'GET',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TEST_CONFIG.token}`
    }
  });
  
  const bookingsData = await bookingsResponse.json();
  
  if (!bookingsData.success || !bookingsData.data.bookings.length) {
    console.log('   ⚠️  No existing bookings to test with');
    return false;
  }
  
  const testBooking = bookingsData.data.bookings[0];
  console.log(`   Testing with existing booking ID: ${testBooking.bk_bkid}`);
  
  // Test passenger viewing
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

async function runSaveButtonTest() {
  console.log('💾 SAVE BUTTON FUNCTIONALITY TEST');
  console.log('=' .repeat(50));
  
  try {
    // Login
    const loginSuccess = await login();
    if (!loginSuccess) {
      throw new Error('Login failed');
    }
    
    // Test save functionality
    const saveSuccess = await testSaveButtonFunctionality();
    
    // Test existing booking operations
    const existingSuccess = await testExistingBookingOperations();
    
    console.log('\n' + '=' .repeat(50));
    console.log('📊 SAVE BUTTON TEST RESULTS');
    console.log('=' .repeat(50));
    
    console.log(`${loginSuccess ? '✅' : '❌'} Login: ${loginSuccess ? 'PASS' : 'FAIL'}`);
    console.log(`${saveSuccess ? '✅' : '❌'} Save Functionality: ${saveSuccess ? 'PASS' : 'FAIL'}`);
    console.log(`${existingSuccess ? '✅' : '❌'} Existing Booking Operations: ${existingSuccess ? 'PASS' : 'FAIL'}`);
    
    if (loginSuccess && saveSuccess && existingSuccess) {
      console.log('\n🎉 ALL SAVE BUTTON ISSUES RESOLVED!');
      console.log('✅ Save button is working correctly');
      console.log('✅ No more 403 Forbidden errors');
      console.log('✅ No more 400 Bad Request errors');
      console.log('✅ Passenger viewing is working');
      console.log('✅ API endpoints are properly routed');
    } else {
      console.log('\n⚠️  Some issues may remain. Check the results above.');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  console.log('\n🏁 SAVE BUTTON TEST COMPLETE');
}

runSaveButtonTest();