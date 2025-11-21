const axios = require('axios');

// Test customer search functionality
async function testCustomerSearch() {
  try {
    // First, login as admin to get auth token
    const loginResponse = await axios.post('http://localhost:5003/api/auth/login', {
      email: 'admin@example.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('Admin login successful');
    
    // Test customer search
    const searchResponse = await axios.get('http://localhost:5003/api/search/customers?query=john', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Customer search results:', searchResponse.data);
    
    // Test with filters
    const filteredSearchResponse = await axios.get('http://localhost:5003/api/search/customers?query=smith&status=active', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Filtered customer search results:', filteredSearchResponse.data);
    
  } catch (error) {
    console.error('Error testing customer search:', error.response?.data || error.message);
  }
}

testCustomerSearch();