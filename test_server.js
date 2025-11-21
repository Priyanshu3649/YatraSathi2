const express = require('express');
const app = express();
const port = 5003; // Changed from 5002 to 5003

app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});

app.get('/', (req, res) => {
  console.log('Root route called');
  res.send('Hello World!');
});

app.get('/test', (req, res) => {
  console.log('Test route called');
  res.json({ message: 'Test route working' });
});

app.listen(port, () => {
  console.log(`Test server running on port ${port}`);
});