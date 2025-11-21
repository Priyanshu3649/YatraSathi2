const http = require('http');

// First login to get the token
const loginOptions = {
  hostname: '127.0.0.1',
  port: 5002,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

console.log('Logging in to get authentication token...');

const loginReq = http.request(loginOptions, (res) => {
  let loginData = '';
  res.on('data', (chunk) => {
    loginData += chunk;
  });
  
  res.on('end', () => {
    const loginResponse = JSON.parse(loginData);
    console.log('Login successful, token received:', loginResponse.token);
    
    // Now test the profile endpoint with the token
    testProfile(loginResponse.token);
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

function testProfile(token) {
  const profileOptions = {
    hostname: '127.0.0.1',
    port: 5002,
    path: '/api/auth/profile',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };

  console.log('Testing profile endpoint with authentication token...');

  const profileReq = http.request(profileOptions, (res) => {
    console.log(`Profile Status Code: ${res.statusCode}`);
    
    let profileData = '';
    res.on('data', (chunk) => {
      profileData += chunk;
    });
    
    res.on('end', () => {
      console.log(`Profile Response: ${profileData}`);
    });
  });

  profileReq.on('error', (error) => {
    console.error('Profile Error:', error.message);
  });

  profileReq.end();
}