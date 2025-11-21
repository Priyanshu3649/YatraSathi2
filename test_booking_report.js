const axios = require('axios');

// Test booking report functionality
async function testBookingReport() {
  try {
    // Login as admin to test report generation
    console.log('Attempting admin login...');
    const adminLoginResponse = await axios.post('http://localhost:5003/api/auth/login', {
      email: 'admin@example.com',
      password: 'admin123'
    });
    
    const adminToken = adminLoginResponse.data.token;
    console.log('Admin login successful');
    
    // Generate booking report
    console.log('Generating booking report...');
    const reportResponse = await axios.get('http://localhost:5003/api/reports/bookings', {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    console.log('Booking report generated successfully');
    console.log('Total bookings:', reportResponse.data.totalBookings);
    console.log('Report filters:', reportResponse.data.filters);
    
    // Test with filters
    console.log('Generating booking report with filters...');
    const filteredReportResponse = await axios.get('http://localhost:5003/api/reports/bookings?status=PENDING', {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    console.log('Filtered booking report generated successfully');
    console.log('Filtered bookings:', filteredReportResponse.data.totalBookings);
    
    console.log('All booking report tests completed successfully!');
    
  } catch (error) {
    console.error('Error testing booking report:');
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

testBookingReport();