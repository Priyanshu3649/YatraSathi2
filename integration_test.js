const express = require('express');
const http = require('http');

console.log('Starting integration test...');

// Create a simple server
const app = express();

app.get('/', (req, res) => {
  console.log('Server received request');
  res.send('Hello from test server!');
});

app.get('/test', (req, res) => {
  console.log('Test endpoint hit');
  res.json({ message: 'Test endpoint working', timestamp: new Date().toISOString() });
});

const server = app.listen(5006, '127.0.0.1', () => {
  console.log('Test server running on http://127.0.0.1:5006');
  
  // Give the server a moment to start
  setTimeout(() => {
    // Now make a request to the server
    console.log('Making request to test server...');
    
    const options = {
      hostname: '127.0.0.1',
      port: 5006,
      path: '/test',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      console.log(`Response Status Code: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('Response Body:', data);
        console.log('Integration test completed successfully!');
        server.close(() => {
          console.log('Server closed');
        });
      });
    });

    req.on('error', (error) => {
      console.error('Request Error:', error.message);
      server.close(() => {
        console.log('Server closed due to error');
      });
    });

    req.end();
  }, 1000);
});

server.on('error', (error) => {
  console.error('Server error:', error);
});