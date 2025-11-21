const express = require('express');
const app = express();

app.get('/', (req, res) => {
  console.log('Root endpoint hit');
  res.send('Hello World!');
});

app.get('/test', (req, res) => {
  console.log('Test endpoint hit');
  res.json({ message: 'Test endpoint working' });
});

// Listen on specific host and port
const server = app.listen(5005, '127.0.0.1', () => {
  console.log('Debug server running on http://127.0.0.1:5005');
});

server.on('listening', () => {
  const address = server.address();
  console.log('Server is listening on:', address);
});

server.on('error', (error) => {
  console.error('Server error:', error);
});