/**
 * Test script to verify the employee billing endpoint is working properly
 */

const axios = require('axios');

async function testEmployeeBillingEndpoint() {
  console.log('🧪 Testing employee billing endpoint...\n');
  
  // Use a valid JWT token for an authenticated employee user
  // You'll need to replace this with a valid token from your system
  const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c191c2lkIjoiQURNSlYwMDEiLCJ1c191c2VybmFtZSI6ImFkbWluIiwidXNfZm5hbWUiOiJBZG1pbiIsInVzX2xuYW1lIjoiVXNlciIsInVzX2VtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJ1c19yb2lkIjoiQURNIiwidXNfdXNlcnR5cGUiOiJhZG1pbiIsImlhdCI6MTcxNjI3MjkzMCwiZXhwIjoxNzE2ODc3NzMwfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'; // Example token - replace with actual
  
  try {
    console.log('1. Testing /api/employee/billing endpoint with authentication...');
    
    const response = await axios.get('http://localhost:5010/api/employee/billing', {
      headers: {
        'Authorization': `Bearer ${validToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Response Status:', response.status);
    console.log('✅ Response Data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success === true) {
      console.log('✅ Success flag is present and true');
      if (response.data.data && response.data.data.bills) {
        console.log('✅ Response has correct structure: { success: true, data: { bills: [...] }}');
        console.log('✅ Number of bills returned:', response.data.data.bills.length);
      } else {
        console.log('❌ Response structure may be incorrect - missing data.bills');
      }
    } else {
      console.log('❌ Success flag is not true');
    }
    
  } catch (error) {
    if (error.response) {
      console.log('❌ API Error Response:');
      console.log('   Status:', error.response.status);
      console.log('   Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.log('❌ Network Error - No response received');
      console.log('   Request:', error.request);
    } else {
      console.log('❌ General Error:', error.message);
    }
  }
  
  console.log('\n2. Testing regular /api/billing endpoint with authentication...');
  
  try {
    const response = await axios.get('http://localhost:5010/api/billing', {
      headers: {
        'Authorization': `Bearer ${validToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Response Status:', response.status);
    console.log('✅ Response Data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    if (error.response) {
      console.log('❌ API Error Response:');
      console.log('   Status:', error.response.status);
      console.log('   Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.log('❌ Network Error - No response received');
      console.log('   Request:', error.request);
    } else {
      console.log('❌ General Error:', error.message);
    }
  }
}

testEmployeeBillingEndpoint();