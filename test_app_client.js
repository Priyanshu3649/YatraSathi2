const http = require('http');

const options = {
  hostname: '127.0.0.1',
  port: 5002,
  path: '/',
  method: 'GET'
};

console.log('Making request to http://127.0.0.1:5002/');

const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(`Response Body: ${data}`);
    console.log('Request completed successfully!');
  });
});

req.on('error', (error) => {
  console.error('Error:', error.message);
});

req.end();