const http = require('http');

console.log('=== Testing Login Functionality ===\n');

// Test data
const loginData = {
  email: 'admin@example.com',
  password: 'admin123'
};

// Step 1: Login
loginUser();

function loginUser() {
  console.log('Step 1: Logging in...');
  
  const options = {
    hostname: '127.0.0.1',
    port: 5004, // Updated to match our server port
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
        console.log('✓ Login successful');
        console.log(`Response: ${JSON.stringify(response)}\n`);
        console.log('=== Login test completed successfully! ===');
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