const http = require('http');

console.log('=== Testing Permission Action RBAC ===\n');

// Test data
const adminLoginData = {
  email: 'admin@example.com',
  password: 'admin123'
};

let adminToken = '';

// Run tests in sequence
loginAsAdmin();

function loginAsAdmin() {
  console.log('1. Logging in as admin...');
  
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
        adminToken = response.token;
        console.log('✓ Admin login successful');
        console.log(`Token: ${adminToken.substring(0, 20)}...\n`);
        testBookingViewPermission();
      } else {
        console.log('✗ Admin login failed');
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${data}\n`);
      }
    });
  });

  req.on('error', (error) => {
    console.error('✗ Admin login error:', error.message);
  });

  const requestData = JSON.stringify(adminLoginData);

  req.write(requestData);
  req.end();
}

function testBookingViewPermission() {
  console.log('2. Testing booking view permission...');
  
  const options = {
    hostname: '127.0.0.1',
    port: 5002,
    path: '/api/test/booking-view',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
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
        console.log('✓ Booking view permission test successful');
        console.log(`Response: ${JSON.stringify(response)}\n`);
        console.log('=== Permission action test completed successfully! ===');
      } else {
        console.log('✗ Booking view permission test failed');
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${data}\n`);
      }
    });
  });

  req.on('error', (error) => {
    console.error('✗ Booking view permission test error:', error.message);
  });

  req.end();
}