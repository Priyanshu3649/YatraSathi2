const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5002,
  path: '/api/auth/test',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IkFETTAwMSIsImlhdCI6MTc2MDIwMTMxOCwiZXhwIjoxNzYyNzkzMzE4fQ.c5_9y2ldcwZws2waHrLCNTv3GYUzbjh-y3IS1qDDz3A'
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
  res.on('data', (chunk) => {
    console.log(`Body: ${chunk}`);
  });
  
  res.on('end', () => {
    console.log('No more data in response.');
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.end();