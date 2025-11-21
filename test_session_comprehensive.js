const http = require('http');

console.log('=== Comprehensive Session Management Test ===\n');

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
        // Login again to create another session
        loginUserAgain();
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

function loginUserAgain() {
  console.log('3. Logging in again to create second session...');
  
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
        console.log('✓ Second login successful');
        console.log(`Token: ${response.token.substring(0, 20)}...`);
        console.log(`Session ID: ${response.sessionId.substring(0, 20)}...\n`);
        getUserSessionsAgain();
      } else {
        console.log('✗ Second login failed');
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${data}\n`);
      }
    });
  });

  req.on('error', (error) => {
    console.error('✗ Second login error:', error.message);
  });

  const requestData = JSON.stringify(loginData);

  req.write(requestData);
  req.end();
}

function getUserSessionsAgain() {
  console.log('4. Getting user sessions again (should have 2 now)...');
  
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
        logoutAllDevices();
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

function logoutAllDevices() {
  console.log('5. Logging out from all devices...');
  
  const options = {
    hostname: '127.0.0.1',
    port: 5002,
    path: '/api/auth/logout-all',
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
        console.log('✓ Logged out from all devices successfully');
        console.log(`Response: ${response.message}\n`);
        verifyNoActiveSessions();
      } else {
        console.log('✗ Failed to logout from all devices');
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${data}\n`);
      }
    });
  });

  req.on('error', (error) => {
    console.error('✗ Logout all devices error:', error.message);
  });

  req.end();
}

function verifyNoActiveSessions() {
  console.log('6. Verifying no active sessions remain...');
  
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
        if (response.sessions.length === 0) {
          console.log('=== All session management tests completed successfully! ===');
        } else {
          console.log('✗ Expected 0 active sessions, but found:', response.sessions.length);
        }
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