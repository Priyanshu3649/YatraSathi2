/**
 * CUSTOMER CREATION DEBUG TEST
 * 
 * This test debugs the customer creation process to understand why cu_cusid is null.
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

async function testMinimalBookingCreation() {
  console.log('\n📝 Testing minimal booking creation with debug...');
  
  // Generate unique phone number to avoid conflicts
  const uniquePhone = `98765${Date.now().toString().slice(-5)}`;
  
  const minimalBookingData = {
    customerName: 'Debug Test Customer',
    phoneNumber: uniquePhone,
    fromStation: 'NDLS',  // New Delhi
    toStation: 'BLR',     // Bangalore
    travelDate: '2024-03-01',
    travelClass: '3A',
    passengerList: [
      {
        name: 'Debug Passenger',
        age: 30,
        gender: 'M'
      }
    ]
  };
  
  console.log(`   Using phone: ${uniquePhone}`);
  console.log('   Booking data:', JSON.stringify(minimalBookingData, null, 2));
  
  const response = await fetch(`${TEST_CONFIG.baseUrl}/api/bookings`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TEST_CONFIG.token}`
    },
    body: JSON.stringify(minimalBookingData)
  });
  
  const data = await response.json();
  
  console.log(`   Response status: ${response.status}`);
  console.log('   Response data:', JSON.stringify(data, null, 2));
  
  if (response.ok && data.success) {
    console.log('   ✅ Booking creation successful');
    return data.data?.bk_bkid;
  } else {
    console.log('   ❌ Booking creation failed');
    return null;
  }
}

async function runDebugTest() {
  console.log('🐛 CUSTOMER CREATION DEBUG TEST');
  console.log('=' .repeat(50));
  
  try {
    // Login
    const loginSuccess = await login();
    if (!loginSuccess) {
      throw new Error('Login failed');
    }
    
    // Test minimal booking creation
    await testMinimalBookingCreation();
    
  } catch (error) {
    console.error('❌ Debug test failed:', error.message);
  }
  
  console.log('\n🏁 DEBUG TEST COMPLETE');
}

runDebugTest();