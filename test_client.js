const http = require('http');

const options = {
  hostname: '127.0.0.1',
  port: 5005,
  path: '/',
  method: 'GET'
};

console.log('Making request to http://127.0.0.1:5005/');

const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  
  res.on('data', (chunk) => {
    console.log(`Response Body: ${chunk}`);
  });
  
  res.on('end', () => {
    console.log('Request completed');
  });
});

req.on('error', (error) => {
  console.error('Error:', error.message);
});

req.end();