/**
 * AUTHENTICATED BOOKING DELETE AND PASSENGER VIEW FIX TEST
 * 
 * This test uses proper authentication to verify the fixes are working.
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
  } else {
    console.log('❌ Login failed:', data);
    return false;
  }
}

async function testGetBookings() {
  console.log('\n📋 Testing get all bookings...');
  
  const response = await fetch(`${TEST_CONFIG.baseUrl}/api/employee/bookings`, {
    method: 'GET',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TEST_CONFIG.token}`
    }
  });
  
  const data = await response.json();
  console.log('Get bookings status:', response.status);
  
  if (response.ok && data.success) {
    const bookings = data.data?.bookings || [];
    console.log(`✅ Retrieved ${bookings.length} bookings`);
    
    if (bookings.length > 0) {
      const firstBooking = bookings[0];
      console.log('First booking ID:', firstBooking.bk_bkid);
      return firstBooking.bk_bkid;
    }
  } else {
    console.log('❌ Failed to get bookings:', data);
  }
  
  return null;
}

async function testGetPassengers(bookingId) {
  if (!bookingId) {
    console.log('\n👥 Skipping passenger test - no booking ID available');
    return false;
  }
  
  console.log(`\n👥 Testing get passengers for booking ${bookingId}...`);
  
  const response = await fetch(`${TEST_CONFIG.baseUrl}/api/bookings/${bookingId}/passengers`, {
    method: 'GET',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TEST_CONFIG.token}`
    }
  });
  
  const data = await response.json();
  console.log('Get passengers status:', response.status);
  console.log('Get passengers response:', JSON.stringify(data, null, 2));
  
  if (response.ok && data.success) {
    console.log(`✅ Passenger endpoint working - found ${data.passengers?.length || 0} passengers`);
    return true;
  } else {
    console.log('❌ Passenger endpoint failed:', data);
    return false;
  }
}

async function testCreateBooking() {
  console.log('\n📝 Testing create booking...');
  
  const bookingData = {
    customerName: 'Test Customer Fix',
    phoneNumber: '9876543210',
    fromStation: 'DEL',
    toStation: 'MUM',
    travelDate: '2024-02-15',
    travelClass: '3A',
    berthPreference: 'LB',
    remarks: 'Test booking for fix verification',
    passengerList: [
      {
        name: 'John Test',
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
  console.log('Create booking status:', response.status);
  
  if (response.ok && data.success) {
    const bookingId = data.data?.bk_bkid;
    console.log(`✅ Booking created successfully with ID: ${bookingId}`);
    return bookingId;
  } else {
    console.log('❌ Booking creation failed:', JSON.stringify(data, null, 2));
    return null;
  }
}

async function testDeleteBooking(bookingId) {
  if (!bookingId) {
    console.log('\n🗑️  Skipping delete test - no booking ID available');
    return false;
  }
  
  console.log(`\n🗑️  Testing delete booking ${bookingId}...`);
  
  const response = await fetch(`${TEST_CONFIG.baseUrl}/api/bookings/${bookingId}`, {
    method: 'DELETE',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TEST_CONFIG.token}`
    }
  });
  
  const data = await response.json();
  console.log('Delete booking status:', response.status);
  console.log('Delete booking response:', JSON.stringify(data, null, 2));
  
  if (response.ok && data.success) {
    console.log('✅ Booking deleted successfully');
    return true;
  } else {
    console.log('❌ Booking deletion failed:', data);
    return false;
  }
}

async function runAuthenticatedTests() {
  console.log('🚀 AUTHENTICATED BOOKING FIX VERIFICATION');
  console.log('=' .repeat(50));
  
  try {
    // Step 1: Login
    const loginSuccess = await login();
    if (!loginSuccess) {
      console.log('❌ Cannot proceed without login');
      return;
    }
    
    // Step 2: Get existing bookings
    const existingBookingId = await testGetBookings();
    
    // Step 3: Test passenger viewing with existing booking
    if (existingBookingId) {
      await testGetPassengers(existingBookingId);
    }
    
    // Step 4: Create a new booking
    const newBookingId = await testCreateBooking();
    
    // Step 5: Test passenger viewing with new booking
    if (newBookingId) {
      await testGetPassengers(newBookingId);
      
      // Step 6: Test booking deletion
      await testDeleteBooking(newBookingId);
    }
    
    console.log('\n✅ ALL TESTS COMPLETED');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

runAuthenticatedTests();