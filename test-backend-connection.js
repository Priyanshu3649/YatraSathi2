const http = require('http');

console.log('Testing backend connection...');

// Test if backend server is running on port 5010
const options = {
  hostname: 'localhost',
  port: 5010,
  path: '/api/health',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
  res.on('data', (chunk) => {
    console.log(`Body: ${chunk}`);
  });
  
  res.on('end', () => {
    console.log('Request completed');
  });
});

req.on('error', (error) => {
  console.error('Error connecting to backend:', error.message);
});

req.on('timeout', () => {
  console.error('Request timeout');
  req.destroy();
});

req.end();