const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');

// Generate a proper test token
const token = jwt.sign({ id: 'ADM001' }, 'default_secret', { expiresIn: '1h' });

console.log('Generated token:', token);

// Test the employee API
const testEmployeeAPI = async () => {
  try {
    const response = await fetch('http://localhost:5003/api/security/employees', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.raw());
    
    const data = await response.text();
    console.log('Response body:', data);
    
    if (response.ok) {
      const jsonData = JSON.parse(data);
      console.log('Parsed JSON:', jsonData);
    }
  } catch (error) {
    console.error('Error testing API:', error);
  }
};

testEmployeeAPI();
