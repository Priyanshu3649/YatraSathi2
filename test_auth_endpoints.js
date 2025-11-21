const http = require('http');

// Test the auth test endpoint first
const testOptions = {
  hostname: '127.0.0.1',
  port: 5002,
  path: '/api/auth/test',
  method: 'GET'
};

console.log('Testing auth test endpoint...');

const testReq = http.request(testOptions, (res) => {
  console.log(`Test endpoint Status Code: ${res.statusCode}`);
  
  let testData = '';
  res.on('data', (chunk) => {
    testData += chunk;
  });
  
  res.on('end', () => {
    console.log(`Test endpoint Response: ${testData}`);
    
    // Now test the login endpoint
    testLogin();
  });
});

testReq.on('error', (error) => {
  console.error('Test endpoint Error:', error.message);
});

testReq.end();

function testLogin() {
  const loginOptions = {
    hostname: '127.0.0.1',
    port: 5002,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  console.log('Testing login endpoint...');

  const loginReq = http.request(loginOptions, (res) => {
    console.log(`Login Status Code: ${res.statusCode}`);
    
    let loginData = '';
    res.on('data', (chunk) => {
      loginData += chunk;
    });
    
    res.on('end', () => {
      console.log(`Login Response: ${loginData}`);
    });
  });

  loginReq.on('error', (error) => {
    console.error('Login Error:', error.message);
  });

  // Send login data
  const loginData = JSON.stringify({
    email: 'admin@example.com',
    password: 'admin123'
  });

  loginReq.write(loginData);
  loginReq.end();
}