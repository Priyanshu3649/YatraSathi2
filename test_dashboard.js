const axios = require('axios');

// Test dashboard functionality
async function testDashboard() {
  try {
    // First, login as admin to get auth token
    const loginResponse = await axios.post('http://localhost:5003/api/auth/login', {
      email: 'admin@example.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('Admin login successful');
    
    // Test admin dashboard
    const adminDashboardResponse = await axios.get('http://localhost:5003/api/dashboard/admin', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Admin dashboard data:', adminDashboardResponse.data);
    
    // Test employee login
    const employeeLoginResponse = await axios.post('http://localhost:5003/api/auth/login', {
      email: 'employee@example.com',
      password: 'employee123'
    });
    
    const employeeToken = employeeLoginResponse.data.token;
    console.log('Employee login successful');
    
    // Test employee dashboard
    const employeeDashboardResponse = await axios.get('http://localhost:5003/api/dashboard/employee', {
      headers: {
        'Authorization': `Bearer ${employeeToken}`
      }
    });
    
    console.log('Employee dashboard data:', employeeDashboardResponse.data);
    
    // Test customer login
    const customerLoginResponse = await axios.post('http://localhost:5003/api/auth/login', {
      email: 'customer@example.com',
      password: 'customer123'
    });
    
    const customerToken = customerLoginResponse.data.token;
    console.log('Customer login successful');
    
    // Test customer dashboard
    const customerDashboardResponse = await axios.get('http://localhost:5003/api/dashboard/customer', {
      headers: {
        'Authorization': `Bearer ${customerToken}`
      }
    });
    
    console.log('Customer dashboard data:', customerDashboardResponse.data);
    
  } catch (error) {
    console.error('Error testing dashboard:', error.response?.data || error.message);
  }
}

testDashboard();