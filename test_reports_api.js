const axios = require('axios');

// Test reports API functionality
async function testReportsAPI() {
  try {
    // Login as admin to test all reports
    console.log('Attempting admin login...');
    const adminLoginResponse = await axios.post('http://localhost:5003/api/auth/login', {
      email: 'admin@example.com',
      password: 'admin123'
    });
    
    const adminToken = adminLoginResponse.data.token;
    console.log('Admin login successful');
    
    // Test booking report
    console.log('Testing booking report...');
    const bookingReport = await axios.get('http://localhost:5003/api/reports/bookings', {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    console.log('Booking report retrieved successfully. Total bookings:', bookingReport.data.totalBookings);
    
    // Test employee performance report
    console.log('Testing employee performance report...');
    const employeeReport = await axios.get('http://localhost:5003/api/reports/employee-performance', {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    console.log('Employee performance report retrieved successfully. Total employees:', employeeReport.data.data.length);
    
    // Test financial report
    console.log('Testing financial report...');
    const financialReport = await axios.get('http://localhost:5003/api/reports/financial', {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    console.log('Financial report retrieved successfully. Total bookings value:', financialReport.data.summary.totalBookings);
    
    // Test corporate customers report
    console.log('Testing corporate customers report...');
    const corporateReport = await axios.get('http://localhost:5003/api/reports/corporate-customers', {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    console.log('Corporate customers report retrieved successfully. Total customers:', corporateReport.data.data.length);
    
    // Test with filters
    console.log('Testing booking report with filters...');
    const filteredReport = await axios.get('http://localhost:5003/api/reports/bookings?status=PENDING', {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    console.log('Filtered booking report retrieved successfully. Filtered bookings:', filteredReport.data.totalBookings);
    
    console.log('All reports tests completed successfully!');
    
  } catch (error) {
    console.error('Error testing reports API:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
      console.error('Request error:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
  }
}

testReportsAPI();