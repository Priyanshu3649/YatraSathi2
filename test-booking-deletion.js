#!/usr/bin/env node

const axios = require('axios');

async function testBookingDeletion() {
  try {
    // Assuming you have admin credentials
    // You'll need to get an authentication token first
    console.log('Attempting to delete booking via API...');
    
    // First, try to login to get a token (you may need to adjust this based on your auth system)
    const loginResponse = await axios.post('http://localhost:5010/api/auth/login', {
      username: 'admin@example.com',  // Adjust based on your admin user
      password: 'password123'         // Adjust based on your admin password
    });
    
    const token = loginResponse.data.token;
    console.log('Login successful, got token');
    
    // Now try to delete the booking
    const deleteResponse = await axios.delete('http://localhost:5010/api/bookings/131', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Booking deletion successful!');
    console.log('Response:', deleteResponse.data);
    
  } catch (error) {
    if (error.response) {
      console.log('❌ Booking deletion failed with status:', error.response.status);
      console.log('Error data:', error.response.data);
      console.log('Error message:', error.message);
    } else {
      console.log('❌ Network error:', error.message);
    }
  }
}

// Alternative approach - if you already have a token or the system uses session-based auth
async function testBookingDeletionNoAuth() {
  try {
    console.log('Attempting to delete booking via API without explicit auth (assuming session)...');
    
    // Try to delete the booking without authentication (for testing purposes)
    const deleteResponse = await axios({
      method: 'delete',
      url: 'http://localhost:5010/api/bookings/131',
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    });
    
    console.log('✅ Booking deletion successful!');
    console.log('Response:', deleteResponse.data);
    
  } catch (error) {
    if (error.response) {
      console.log('❌ Booking deletion failed with status:', error.response.status);
      console.log('Status text:', error.response.statusText);
      if (error.response.data) {
        console.log('Error data:', error.response.data);
      }
      if (error.response.status === 500) {
        console.log('Internal Server Error - this indicates the fix may not be complete');
      } else if (error.response.status === 400) {
        console.log('Bad Request - this might be expected if booking has related records');
      } else if (error.response.status === 403) {
        console.log('Forbidden - authentication required');
      } else if (error.response.status === 404) {
        console.log('Not Found - booking may not exist');
      }
    } else {
      console.log('❌ Network error or timeout:', error.message);
    }
  }
}

// Run the test
console.log('Testing booking deletion...');
testBookingDeletionNoAuth();