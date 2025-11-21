const http = require('http');

console.log('=== Testing Booking Cancellation Functionality ===\n');

// Test data
const loginData = {
  email: 'customer@example.com',
  password: 'customer123'
};

let authToken = '';
let bookingId = '';

// Run tests in sequence
loginUser();

function loginUser() {
  console.log('1. Logging in as customer...');
  
  const options = {
    hostname: '127.0.0.1',
    port: 5002,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
      }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        const response = JSON.parse(data);
        authToken = response.token;
        console.log('✓ Login successful');
        console.log(`Token: ${authToken.substring(0, 20)}...\n`);
        createBooking();
      } else {
        console.log('✗ Login failed');
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${data}\n`);
      }
    });
  });

  req.on('error', (error) => {
    console.error('✗ Login error:', error.message);
  });

  const requestData = JSON.stringify(loginData);

  req.write(requestData);
  req.end();
}

function createBooking() {
  console.log('2. Creating a new booking...');
  
  const options = {
    hostname: '127.0.0.1',
    port: 5002,
    path: '/api/bookings',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 201) {
        const response = JSON.parse(data);
        bookingId = response.bk_bkid;
        console.log('✓ Booking created successfully');
        console.log(`Booking ID: ${bookingId}\n`);
        getBooking();
      } else {
        console.log('✗ Failed to create booking');
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${data}\n`);
      }
    });
  });

  req.on('error', (error) => {
    console.error('✗ Create booking error:', error.message);
  });

  const requestData = JSON.stringify({
    fromStation: 'ST001', // Using seeded station ID
    toStation: 'ST002',   // Using seeded station ID
    travelDate: '2023-12-25',
    travelClass: '3A',
    berthPreference: 'LOWER',
    totalPassengers: 2,
    remarks: 'Test booking for cancellation'
  });

  req.write(requestData);
  req.end();
}

function getBooking() {
  console.log('3. Getting booking details...');
  
  const options = {
    hostname: '127.0.0.1',
    port: 5002,
    path: `/api/bookings/${bookingId}`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        const response = JSON.parse(data);
        console.log('✓ Booking details retrieved successfully');
        console.log(`Booking status: ${response.bk_status}\n`);
        cancelBooking();
      } else {
        console.log('✗ Failed to get booking details');
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${data}\n`);
      }
    });
  });

  req.on('error', (error) => {
    console.error('✗ Get booking error:', error.message);
  });

  req.end();
}

function cancelBooking() {
  console.log('4. Cancelling the booking...');
  
  const options = {
    hostname: '127.0.0.1',
    port: 5002,
    path: `/api/bookings/${bookingId}/cancel`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        const response = JSON.parse(data);
        console.log('✓ Booking cancelled successfully');
        console.log(`Response: ${response.message}\n`);
        verifyCancellation();
      } else {
        console.log('✗ Failed to cancel booking');
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${data}\n`);
      }
    });
  });

  req.on('error', (error) => {
    console.error('✗ Cancel booking error:', error.message);
  });

  req.end();
}

function verifyCancellation() {
  console.log('5. Verifying booking cancellation...');
  
  const options = {
    hostname: '127.0.0.1',
    port: 5002,
    path: `/api/bookings/${bookingId}`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        const response = JSON.parse(data);
        console.log('✓ Booking details retrieved successfully');
        console.log(`Booking status: ${response.bk_status}\n`);
        if (response.bk_status === 'CANCELLED') {
          console.log('=== All booking cancellation tests completed successfully! ===');
        } else {
          console.log('✗ Booking was not properly cancelled');
        }
      } else {
        console.log('✗ Failed to get booking details');
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${data}\n`);
      }
    });
  });

  req.on('error', (error) => {
    console.error('✗ Verify cancellation error:', error.message);
  });

  req.end();
}