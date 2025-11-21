const http = require('http');

console.log('=== Testing Role-Based Access Control ===\n');

// Test data
const adminLoginData = {
  email: 'admin@example.com',
  password: 'admin123'
};

let adminToken = '';
let adminRole = '';

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
        adminRole = response.userType;
        console.log('✓ Admin login successful');
        console.log(`Token: ${adminToken.substring(0, 20)}...\n`);
        testAdminAccess();
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

function testAdminAccess() {
  console.log('2. Testing admin access to protected route...');
  
  const options = {
    hostname: '127.0.0.1',
    port: 5002,
    path: '/api/test/admin-only',
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
        console.log('✓ Admin access test successful');
        console.log(`Response: ${response.message}\n`);
        console.log('=== RBAC tests completed successfully! ===');
      } else {
        console.log('✗ Admin access test failed');
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${data}\n`);
      }
    });
  });

  req.on('error', (error) => {
    console.error('✗ Admin access test error:', error.message);
  });

  req.end();
}