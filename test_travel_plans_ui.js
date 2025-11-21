// Test script for Travel Plans UI functionality
const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5003/api';
const TEST_USER = {
  email: 'admin@example.com',
  password: 'admin123'
};

let authToken = '';
let createdPlanId = '';

async function runTests() {
  try {
    console.log('Starting Travel Plans UI Tests...\n');
    
    // 1. Login to get auth token
    await testLogin();
    
    // 2. Create a travel plan
    await testCreateTravelPlan();
    
    // 3. Get all travel plans
    await testGetTravelPlans();
    
    // 4. Get specific travel plan
    await testGetSpecificPlan();
    
    // 5. Update travel plan
    await testUpdateTravelPlan();
    
    // 6. Share travel plan
    await testShareTravelPlan();
    
    // 7. Get shared users
    await testGetSharedUsers();
    
    // 8. Delete travel plan
    await testDeleteTravelPlan();
    
    console.log('\n✅ All Travel Plans UI tests passed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

async function testLogin() {
  try {
    console.log('1. Testing user login...');
    const response = await axios.post(`${BASE_URL}/auth/login`, TEST_USER);
    authToken = response.data.token;
    console.log('   ✅ Login successful');
    console.log('   🎫 Token received:', authToken.substring(0, 20) + '...');
  } catch (error) {
    throw new Error(`Login failed: ${error.response?.data?.message || error.message}`);
  }
}

async function testCreateTravelPlan() {
  console.log('2. Testing travel plan creation...');
  
  const planData = {
    title: 'Test Trip to Goa',
    description: 'A wonderful beach vacation in Goa',
    startDate: '2023-12-01',
    endDate: '2023-12-10',
    destination: 'Goa, India',
    budget: 50000,
    activities: ['Beach', 'Sightseeing', 'Water Sports']
  };
  
  try {
    const response = await axios.post(`${BASE_URL}/travel-plans`, planData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    createdPlanId = response.data.tp_tpid;
    console.log('   ✅ Travel plan created successfully');
    console.log('   🆔 Plan ID:', createdPlanId);
  } catch (error) {
    throw new Error(`Failed to create travel plan: ${error.response?.data?.message || error.message}`);
  }
}

async function testGetTravelPlans() {
  console.log('3. Testing get all travel plans...');
  
  try {
    const response = await axios.get(`${BASE_URL}/travel-plans`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('   ✅ Retrieved travel plans successfully');
    console.log('   📊 Found', response.data.length, 'travel plans');
  } catch (error) {
    throw new Error(`Failed to get travel plans: ${error.response?.data?.message || error.message}`);
  }
}

async function testGetSpecificPlan() {
  console.log('4. Testing get specific travel plan...');
  
  try {
    const response = await axios.get(`${BASE_URL}/travel-plans/${createdPlanId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('   ✅ Retrieved specific travel plan successfully');
    console.log('   📋 Plan title:', response.data.tp_title);
  } catch (error) {
    throw new Error(`Failed to get specific travel plan: ${error.response?.data?.message || error.message}`);
  }
}

async function testUpdateTravelPlan() {
  console.log('5. Testing travel plan update...');
  
  const updateData = {
    title: 'Updated Test Trip to Goa',
    description: 'An amazing beach vacation in Goa with family',
    budget: 55000
  };
  
  try {
    const response = await axios.put(`${BASE_URL}/travel-plans/${createdPlanId}`, updateData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('   ✅ Travel plan updated successfully');
    console.log('   🔄 Updated title:', response.data.tp_title);
  } catch (error) {
    throw new Error(`Failed to update travel plan: ${error.response?.data?.message || error.message}`);
  }
}

async function testShareTravelPlan() {
  console.log('6. Testing travel plan sharing...');
  
  const shareData = {
    isPublic: true
  };
  
  try {
    const response = await axios.post(`${BASE_URL}/travel-plans/${createdPlanId}/share`, shareData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('   ✅ Travel plan sharing updated successfully');
    console.log('   🔓 Public status:', response.data.travelPlan.tp_ispublic === 1 ? 'Yes' : 'No');
  } catch (error) {
    throw new Error(`Failed to share travel plan: ${error.response?.data?.message || error.message}`);
  }
}

async function testGetSharedUsers() {
  console.log('7. Testing get shared users...');
  
  try {
    const response = await axios.get(`${BASE_URL}/travel-plans/${createdPlanId}/shared-users`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('   ✅ Retrieved shared users successfully');
    console.log('   👥 Shared with:', response.data.sharedWith?.length || 0, 'users');
  } catch (error) {
    throw new Error(`Failed to get shared users: ${error.response?.data?.message || error.message}`);
  }
}

async function testDeleteTravelPlan() {
  console.log('8. Testing travel plan deletion...');
  
  try {
    await axios.delete(`${BASE_URL}/travel-plans/${createdPlanId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('   ✅ Travel plan deleted successfully');
  } catch (error) {
    throw new Error(`Failed to delete travel plan: ${error.response?.data?.message || error.message}`);
  }
}

// Run the tests
if (require.main === module) {
  runTests();
}

module.exports = { runTests };