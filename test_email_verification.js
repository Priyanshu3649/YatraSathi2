const http = require('http');

console.log('=== Testing Email Verification Functionality ===\n');

// Test data with unique values
const testUserData = {
  name: 'Test User',
  email: 'testuser3@example.com', // Using a different email to avoid conflicts
  password: 'password123',
  phone: '9876543210' // Using a different phone number to avoid conflicts
};

// For testing purposes, we'll simulate the verification token
// In a real application, this would be sent via email
const verificationToken = 'sample-token-for-testing';

// Step 1: Register a new user
registerUser();

function registerUser() {
  console.log('Step 1: Registering new user...');
  
  const options = {
    hostname: '127.0.0.1',
    port: 5002,
    path: '/api/auth/register',
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
      if (res.statusCode === 201) {
        const response = JSON.parse(data);
        console.log('✓ User registration successful');
        console.log(`Response: ${JSON.stringify(response)}\n`);
        // In a real scenario, we would receive the verification token via email
        // For testing, we'll use a placeholder token
        verifyEmail(verificationToken);
      } else {
        console.log('✗ User registration failed');
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${data}\n`);
      }
    });
  });

  req.on('error', (error) => {
    console.error('✗ User registration error:', error.message);
  });

  const requestData = JSON.stringify(testUserData);

  req.write(requestData);
  req.end();
}

function verifyEmail(token) {
  console.log('Step 2: Verifying email...');
  
  const options = {
    hostname: '127.0.0.1',
    port: 5002,
    path: `/api/auth/verify-email/${token}`,
    method: 'GET',
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
        console.log('✓ Email verification successful');
        console.log(`Response: ${JSON.stringify(response)}\n`);
        console.log('=== All tests completed successfully! ===');
      } else {
        console.log('✗ Email verification failed');
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${data}\n`);
      }
    });
  });

  req.on('error', (error) => {
    console.error('✗ Email verification error:', error.message);
  });

  req.end();
}