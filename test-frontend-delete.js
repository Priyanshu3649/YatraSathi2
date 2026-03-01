#!/usr/bin/env node

// Test the frontend delete functionality by simulating the API call
const fetch = require('node-fetch');

async function testFrontendDelete() {
  console.log('=== FRONTEND DELETE FUNCTIONALITY TEST ===\n');
  
  try {
    // First, let's login to get a token
    console.log('1. Logging in to get authentication token...');
    
    const loginResponse = await fetch('http://localhost:5010/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin@example.com',
        password: 'password123'
      })
    });
    
    if (!loginResponse.ok) {
      console.log('❌ Login failed');
      const errorData = await loginResponse.json();
      console.log('Login error:', errorData);
      return;
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login successful, got token');
    
    // Now let's get a list of bookings to find one to delete
    console.log('\n2. Getting list of bookings...');
    
    const bookingsResponse = await fetch('http://localhost:5010/api/bookings', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!bookingsResponse.ok) {
      console.log('❌ Failed to get bookings');
      const errorData = await bookingsResponse.json();
      console.log('Bookings error:', errorData);
      return;
    }
    
    const bookingsData = await bookingsResponse.json();
    const bookings = bookingsData.data || bookingsData.bookings || [];
    
    if (bookings.length === 0) {
      console.log('❌ No bookings found to test with');
      return;
    }
    
    console.log(`✅ Found ${bookings.length} bookings`);
    
    // Select the first booking to test deletion
    const bookingToDelete = bookings[0];
    console.log(`\n3. Testing deletion of booking ID: ${bookingToDelete.bk_bkid}`);
    console.log(`   Booking details: ${bookingToDelete.bk_bkno} - Status: ${bookingToDelete.bk_status}`);
    
    // Test the delete API call
    console.log('\n4. Making DELETE API call...');
    
    const deleteResponse = await fetch(`http://localhost:5010/api/bookings/${bookingToDelete.bk_bkid}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`   Response status: ${deleteResponse.status}`);
    console.log(`   Response status text: ${deleteResponse.statusText}`);
    
    const responseText = await deleteResponse.text();
    console.log(`   Response body: ${responseText}`);
    
    if (deleteResponse.ok) {
      console.log('✅ DELETE API call successful');
      
      // Verify the booking was actually deleted
      console.log('\n5. Verifying deletion...');
      
      const verifyResponse = await fetch(`http://localhost:5010/api/bookings/${bookingToDelete.bk_bkid}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (verifyResponse.status === 404) {
        console.log('✅ Booking successfully deleted (404 Not Found on verification)');
      } else {
        console.log(`❌ Booking still exists (status: ${verifyResponse.status})`);
        const verifyData = await verifyResponse.json();
        console.log('Verification data:', verifyData);
      }
    } else {
      console.log('❌ DELETE API call failed');
      try {
        const errorData = JSON.parse(responseText);
        console.log('Error details:', errorData);
      } catch (e) {
        console.log('Error text:', responseText);
      }
    }
    
    console.log('\n=== TEST COMPLETED ===');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Error stack:', error.stack);
  }
}

// Run the test
testFrontendDelete();