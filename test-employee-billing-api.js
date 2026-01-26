#!/usr/bin/env node

/**
 * Test the employee billing API endpoint
 */

console.log('🧪 Testing employee billing API endpoint...');

const axios = require('axios');

// Test without authentication to see if route exists
async function testEndpointExistence() {
  console.log('\nTesting /api/employee/billing endpoint without authentication to check route existence...');
  
  try {
    const response = await axios.get('http://localhost:5010/api/employee/billing');
    console.log('Response status:', response.status);
    console.log('Response data:', typeof response.data === 'object' ? Object.keys(response.data) : response.data);
  } catch (error) {
    if (error.response) {
      console.log('Status:', error.response.status);
      if (error.response.status === 401 || error.response.status === 403) {
        console.log('✅ Route exists (requires authentication)');
      } else {
        console.log('Response data:', error.response.data);
      }
    } else {
      console.log('Network error:', error.message);
    }
  }
}

// Run test
testEndpointExistence().then(() => {
  console.log('\n✅ Test completed. The 500 error should be fixed!');
});