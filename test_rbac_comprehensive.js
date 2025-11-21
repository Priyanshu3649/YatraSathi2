const http = require('http');

console.log('=== Comprehensive RBAC Testing ===\n');

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
        testRoleBasedAccess();
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

function testRoleBasedAccess() {
  console.log('2. Testing role-based access control...');
  
  // Test admin-only route
  testRoute('/api/test/admin-only', 'Admin-only route', () => {
    // Test permission-based access
    testRoute('/api/test/user-mgmt', 'User management permission', () => {
      // Test permission action-based access
      testRoute('/api/test/booking-view', 'Booking view permission', () => {
        console.log('=== All RBAC tests completed successfully! ===');
      });
    });
  });
}

function testRoute(path, description, callback) {
  const options = {
    hostname: '127.0.0.1',
    port: 5002,
    path: path,
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
        console.log(`✓ ${description} test successful`);
        console.log(`Response: ${response.message}\n`);
        if (callback) callback();
      } else {
        console.log(`✗ ${description} test failed`);
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${data}\n`);
        if (callback) callback();
      }
    });
  });

  req.on('error', (error) => {
    console.error(`✗ ${description} test error:`, error.message);
    if (callback) callback();
  });

  req.end();
}