const http = require('http');
const cookie = require('cookie');

console.log('=== Testing Session Management ===\n');

// Test data
const loginData = {
  email: 'admin@example.com',
  password: 'admin123'
};

let authToken = '';
let sessionId = '';

// Run tests in sequence
loginUser();

function loginUser() {
  console.log('1. Logging in to create session...');
  
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
        sessionId = response.sessionId;
        console.log('✓ Login successful');
        console.log(`Token: ${authToken.substring(0, 20)}...`);
        console.log(`Session ID: ${sessionId.substring(0, 20)}...\n`);
        getUserSessions();
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

function getUserSessions() {
  console.log('2. Getting user sessions...');
  
  const options = {
    hostname: '127.0.0.1',
    port: 5002,
    path: '/api/auth/sessions',
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
        console.log('✓ User sessions retrieved successfully');
        console.log(`Active sessions: ${response.sessions.length}\n`);
        logoutUser();
      } else {
        console.log('✗ Failed to get user sessions');
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${data}\n`);
      }
    });
  });

  req.on('error', (error) => {
    console.error('✗ Get sessions error:', error.message);
  });

  req.end();
}

function logoutUser() {
  console.log('3. Logging out user...');
  
  const options = {
    hostname: '127.0.0.1',
    port: 5002,
    path: '/api/auth/logout',
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
        console.log('✓ User logged out successfully');
        console.log(`Response: ${response.message}\n`);
        console.log('=== Session management tests completed successfully! ===');
      } else {
        console.log('✗ Failed to logout user');
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${data}\n`);
      }
    });
  });

  req.on('error', (error) => {
    console.error('✗ Logout error:', error.message);
  });

  const requestData = JSON.stringify({
    sessionId: sessionId
  });

  req.write(requestData);
  req.end();
}