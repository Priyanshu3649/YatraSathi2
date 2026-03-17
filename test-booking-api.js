// Test booking creation API directly
const fetch = require('node-fetch');

async function testBookingCreation() {
  try {
    console.log('📝 Testing booking creation...\n');
    
    // First, login to get a token
    console.log('1️⃣ Logging in...');
    const loginResponse = await fetch('http://localhost:5010/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123'
      })
    });
    
    const loginData = await loginResponse.json();
    
    if (!loginResponse.ok) {
      console.error('❌ Login failed:', loginData);
      return;
    }
    
    console.log('✅ Login successful!');
    console.log('Token:', loginData.token.substring(0, 50) + '...\n');
    
    const token = loginData.token;
    
    // Now create a booking
    console.log('2️⃣ Creating booking...');
    const bookingData = {
      phoneNumber: '9876543210',
      customerName: 'Test Customer',
      fromStation: 'NDLS',
      toStation: 'BCT',
      travelDate: '2026-04-15',
      travelClass: 'SL',
      berthPreference: 'LOWER',
      totalPassengers: 2,
      passengerList: [
        {
          name: 'John Doe',
          age: 30,
          gender: 'M'
        },
        {
          name: 'Jane Doe',
          age: 28,
          gender: 'F'
        }
      ],
      status: 'DRAFT'
    };
    
    const bookingResponse = await fetch('http://localhost:5010/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(bookingData)
    });
    
    const bookingResult = await bookingResponse.json();
    
    if (!bookingResponse.ok) {
      console.error('\n❌ Booking creation FAILED!');
      console.error('Status:', bookingResponse.status);
      console.error('Response:', JSON.stringify(bookingResult, null, 2));
      return;
    }
    
    console.log('\n✅ Booking created SUCCESSFULLY!');
    console.log('Booking ID:', bookingResult.data?.bk_bkid);
    console.log('Booking Number:', bookingResult.data?.bk_bkno);
    console.log('Customer Name:', bookingResult.data?.bk_customername);
    console.log('Phone:', bookingResult.data?.bk_phonenumber);
    console.log('Route:', bookingResult.data?.bk_fromst, '→', bookingResult.data?.bk_tost);
    console.log('Travel Date:', bookingResult.data?.bk_trvldt);
    console.log('Status:', bookingResult.data?.bk_status);
    console.log('\nFull response:', JSON.stringify(bookingResult, null, 2));
    
  } catch (error) {
    console.error('\n💥 ERROR:', error.message);
    console.error('Stack:', error.stack);
  }
}

testBookingCreation();
