const http = require('http');

console.log('=== Testing Password Reset Functionality ===\n');

// Test data
const testEmail = 'admin@example.com';
let resetToken = '';

// Step 1: Request password reset
requestPasswordReset();

function requestPasswordReset() {
  console.log('Step 1: Requesting password reset...');
  
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
        console.log(`✓ Reset token received: ${resetToken.substring(0, 10)}...\n`);
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
    email: testEmail
  });

  req.write(requestData);
  req.end();
}

function resetPassword() {
  console.log('Step 2: Resetting password...');
  
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
        console.log('=== All tests completed successfully! ===');
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