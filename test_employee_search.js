const axios = require('axios');

// Test employee search functionality
async function testEmployeeSearch() {
  try {
    // First, login as admin to get auth token
    const loginResponse = await axios.post('http://localhost:5003/api/auth/login', {
      email: 'admin@example.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('Admin login successful');
    
    // Test employee search
    const searchResponse = await axios.get('http://localhost:5003/api/search/employees?query=jane', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Employee search results:', searchResponse.data);
    
    // Test with filters (this will return empty since no department is set)
    const filteredSearchResponse = await axios.get('http://localhost:5003/api/search/employees?query=jane&department=operations', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Filtered employee search results:', filteredSearchResponse.data);
    
  } catch (error) {
    console.error('Error testing employee search:', error.response?.data || error.message);
  }
}

testEmployeeSearch();