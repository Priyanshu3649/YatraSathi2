// Simple test for accounting endpoints
const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:5004';

async function testBasicEndpoints() {
  try {
    console.log('🧪 Testing Basic Endpoints...\n');
    
    // Test 1: Check if server is responding
    console.log('1. Testing server health...');
    const healthResponse = await axios.get(`${BASE_URL}/`);
    console.log('✅ Server is responding');
    
    // Test 2: Try to access accounting endpoints without auth (should get 401)
    console.log('\n2. Testing accounting endpoints without auth...');
    try {
      await axios.get(`${BASE_URL}/api/accounting/accounts`);
      console.log('❌ Expected 401 but got success');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Got expected 401 Unauthorized');
      } else {
        console.log('❌ Got unexpected error:', error.response?.status, error.response?.data);
      }
    }
    
    // Test 3: Check if auth endpoint exists
    console.log('\n3. Testing auth endpoint...');
    try {
      await axios.post(`${BASE_URL}/api/auth/login`, {
        username: 'invalid',
        password: 'invalid'
      });
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 400) {
        console.log('✅ Auth endpoint is working (got expected error)');
      } else {
        console.log('❌ Auth endpoint error:', error.response?.status, error.response?.data);
      }
    }
    
    console.log('\n🎉 Basic endpoint tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testBasicEndpoints();