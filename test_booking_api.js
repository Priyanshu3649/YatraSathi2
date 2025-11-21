const axios = require('axios');

// Test booking API functionality
async function testBookingAPI() {
  try {
    // First, login as customer to get auth token
    console.log('Attempting customer login...');
    const loginResponse = await axios.post('http://localhost:5003/api/auth/login', {
      email: 'customer@example.com',
      password: 'customer123'
    });
    
    const token = loginResponse.data.token;
    console.log('Customer login successful');
    
    // Test creating a booking
    const bookingData = {
      fromStation: 'ST001',
      toStation: 'ST002',
      travelDate: '2023-12-25',
      travelClass: '3A',
      berthPreference: 'LB',
      totalPassengers: 2,
      remarks: 'Window seat preferred'
    };
    
    console.log('Creating booking...');
    const createBookingResponse = await axios.post('http://localhost:5003/api/bookings', bookingData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Booking created:', createBookingResponse.data);
    
    // Test getting customer bookings
    console.log('Fetching customer bookings...');
    const getBookingsResponse = await axios.get('http://localhost:5003/api/bookings/my-bookings', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Customer bookings:', getBookingsResponse.data.length, 'bookings found');
    
    // Login as admin to test admin functionality
    console.log('Attempting admin login...');
    const adminLoginResponse = await axios.post('http://localhost:5003/api/auth/login', {
      email: 'admin@example.com',
      password: 'admin123'
    });
    
    const adminToken = adminLoginResponse.data.token;
    console.log('Admin login successful');
    
    // Test getting all bookings
    console.log('Fetching all bookings...');
    const getAllBookingsResponse = await axios.get('http://localhost:5003/api/bookings', {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    console.log('Total bookings:', getAllBookingsResponse.data.length);
    
    // Test searching bookings
    console.log('Searching bookings...');
    const searchBookingsResponse = await axios.get('http://localhost:5003/api/bookings/search?status=PENDING', {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    console.log('Pending bookings:', searchBookingsResponse.data.bookings?.length || searchBookingsResponse.data.length);
    
    console.log('All tests completed successfully!');
    
  } catch (error) {
    console.error('Error testing booking API:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
      console.error('Request error:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
  }
}

testBookingAPI();