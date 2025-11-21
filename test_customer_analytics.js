const axios = require('axios');

// Test customer analytics report
async function testCustomerAnalytics() {
  try {
    // Login as admin to get token
    const loginResponse = await axios.post('http://localhost:5003/api/auth/login', {
      email: 'admin@example.com',
      password: 'admin123'
    });

    const token = loginResponse.data.token;
    console.log('Admin login successful');

    // Test customer analytics report
    const analyticsResponse = await axios.get('http://localhost:5003/api/reports/customer-analytics', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Customer Analytics Report:');
    console.log(JSON.stringify(analyticsResponse.data, null, 2));
  } catch (error) {
    console.error('Error testing customer analytics:', error.response ? error.response.data : error.message);
  }
}

testCustomerAnalytics();