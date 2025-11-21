const jwt = require('jsonwebtoken');

// Test token
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IkFETTAwMSIsImlhdCI6MTc2MDIwMTA0MCwiZXhwIjoxNzYyNzkzMDQwfQ.ElJYa1n96Vch14ir9qOH6D7hafxBQC1YKJipdRVzN-o';

try {
  const decoded = jwt.verify(token, 'default_secret');
  console.log('Decoded token:', decoded);
} catch (error) {
  console.error('Token error:', error.message);
}