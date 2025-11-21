const http = require('http');

console.log('=== Testing Profile Functionality ===\n');

// First, login to get a token
const loginData = {
  email: 'admin@example.com',
  password: 'admin123'
};

loginUser();

function loginUser() {
  console.log('Step 1: Logging in to get token...');
  
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
        console.log('✓ Login successful');
        console.log(`Token: ${response.token.substring(0, 20)}...\n`);
        // Now test the profile endpoint
        getProfile(response.token);
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

function getProfile(token) {
  console.log('Step 2: Getting user profile...');
  
  const options = {
    hostname: '127.0.0.1',
    port: 5002,
    path: '/api/auth/profile',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
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
        console.log('✓ Profile retrieval successful');
        console.log(`Response: ${JSON.stringify(response)}\n`);
        console.log('=== Profile test completed successfully! ===');
      } else {
        console.log('✗ Profile retrieval failed');
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${data}\n`);
      }
    });
  });

  req.on('error', (error) => {
    console.error('✗ Profile retrieval error:', error.message);
  });

  req.end();
}