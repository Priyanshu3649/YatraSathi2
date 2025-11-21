const http = require('http');

console.log('=== Comprehensive Authentication Test ===\n');

// Test data
const loginData = {
  email: 'admin@example.com',
  password: 'admin123'
};

let authToken = '';
let resetToken = '';

// Run all tests in sequence
loginUser();

function loginUser() {
  console.log('1. Testing user login...');
  
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
        getProfile();
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

function getProfile() {
  console.log('2. Testing profile retrieval...');
  
  const options = {
    hostname: '127.0.0.1',
    port: 5002,
    path: '/api/auth/profile',
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
        console.log('✓ Profile retrieval successful');
        console.log(`User: ${response.name} (${response.email})\n`);
        requestPasswordReset();
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

function requestPasswordReset() {
  console.log('3. Testing password reset request...');
  
  const options = {
    hostname: '127.0.0.1',
    port: 5002,
    path: '/api/auth/request-password-reset',
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
        resetToken = response.resetToken;
        console.log('✓ Password reset request successful');
        console.log(`Reset token: ${resetToken.substring(0, 20)}...\n`);
        // In a real application, we would receive this via email
        console.log('Note: In production, reset token would be sent via email\n');
        resetPassword();
      } else {
        console.log('✗ Password reset request failed');
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${data}\n`);
      }
    });
  });

  req.on('error', (error) => {
    console.error('✗ Password reset request error:', error.message);
  });

  const requestData = JSON.stringify({
    email: loginData.email
  });

  req.write(requestData);
  req.end();
}

function resetPassword() {
  console.log('4. Testing password reset...');
  
  const options = {
    hostname: '127.0.0.1',
    port: 5002,
    path: '/api/auth/reset-password',
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
        console.log('✓ Password reset successful');
        console.log(`Response: ${response.message}\n`);
        console.log('=== All authentication tests completed successfully! ===');
      } else {
        console.log('✗ Password reset failed');
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${data}\n`);
      }
    });
  });

  req.on('error', (error) => {
    console.error('✗ Password reset error:', error.message);
  });

  const requestData = JSON.stringify({
    token: resetToken,
    newPassword: 'newpassword123'
  });

  req.write(requestData);
  req.end();
}