/**
 * TEST DELETE EXISTING BOOKING
 * 
 * This test attempts to delete an existing booking to verify the delete functionality.
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

async function getBookings() {
  console.log('\n📋 Getting existing bookings...');
  
  const response = await fetch(`${TEST_CONFIG.baseUrl}/api/employee/bookings`, {
    method: 'GET',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TEST_CONFIG.token}`
    }
  });
  
  const data = await response.json();
  
  if (response.ok && data.success) {
    const bookings = data.data?.bookings || [];
    console.log(`✅ Found ${bookings.length} bookings`);
    
    // Show first few bookings
    bookings.slice(0, 3).forEach((booking, index) => {
      console.log(`  ${index + 1}. ID: ${booking.bk_bkid}, Customer: ${booking.bk_customername || 'N/A'}, Status: ${booking.bk_status}`);
    });
    
    return bookings;
  } else {
    console.log('❌ Failed to get bookings:', data);
    return [];
  }
}

async function testPassengerViewing(bookingId) {
  console.log(`\n👥 Testing passenger viewing for booking ${bookingId}...`);
  
  const response = await fetch(`${TEST_CONFIG.baseUrl}/api/bookings/${bookingId}/passengers`, {
    method: 'GET',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TEST_CONFIG.token}`
    }
  });
  
  const data = await response.json();
  console.log(`Passenger viewing status: ${response.status}`);
  
  if (response.ok && data.success) {
    console.log(`✅ Passenger viewing works - found ${data.passengers?.length || 0} passengers`);
    if (data.passengers && data.passengers.length > 0) {
      data.passengers.forEach((passenger, index) => {
        console.log(`  ${index + 1}. ${passenger.firstName} ${passenger.lastName || ''} (Age: ${passenger.age})`);
      });
    }
    return true;
  } else {
    console.log('❌ Passenger viewing failed:', data);
    return false;
  }
}

async function testBookingDeletion(bookingId) {
  console.log(`\n🗑️  Testing deletion of booking ${bookingId}...`);
  
  const response = await fetch(`${TEST_CONFIG.baseUrl}/api/bookings/${bookingId}`, {
    method: 'DELETE',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TEST_CONFIG.token}`
    }
  });
  
  const data = await response.json();
  console.log(`Delete status: ${response.status}`);
  console.log('Delete response:', JSON.stringify(data, null, 2));
  
  if (response.ok && data.success) {
    console.log('✅ Booking deletion successful');
    return true;
  } else {
    console.log('❌ Booking deletion failed');
    return false;
  }
}

async function runDeleteTest() {
  console.log('🚀 BOOKING DELETE FUNCTIONALITY TEST');
  console.log('=' .repeat(50));
  
  try {
    // Step 1: Login
    const loginSuccess = await login();
    if (!loginSuccess) {
      console.log('❌ Cannot proceed without login');
      return;
    }
    
    // Step 2: Get existing bookings
    const bookings = await getBookings();
    
    if (bookings.length === 0) {
      console.log('❌ No bookings found to test with');
      return;
    }
    
    // Step 3: Test passenger viewing with first booking
    const firstBooking = bookings[0];
    await testPassengerViewing(firstBooking.bk_bkid);
    
    // Step 4: Find a booking to delete (prefer Draft status)
    const bookingToDelete = bookings.find(b => b.bk_status === 'Draft' || b.bk_status === 'DRAFT') || bookings[bookings.length - 1];
    
    console.log(`\n🎯 Selected booking ${bookingToDelete.bk_bkid} for deletion (Status: ${bookingToDelete.bk_status})`);
    
    // Step 5: Test deletion
    await testBookingDeletion(bookingToDelete.bk_bkid);
    
    console.log('\n✅ DELETE TEST COMPLETED');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

runDeleteTest();