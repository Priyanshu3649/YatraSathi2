// Simple test to check if frontend pages are accessible
const axios = require('axios');

async function testFrontendPages() {
  try {
    console.log('Testing frontend accessibility...\n');
    
    // Test home page
    console.log('1. Testing home page...');
    const homeResponse = await axios.get('http://localhost:3002/');
    console.log('   ✅ Home page accessible');
    
    // Test travel plans page
    console.log('2. Testing travel plans page...');
    const travelPlansResponse = await axios.get('http://localhost:3002/travel-plans');
    console.log('   ✅ Travel plans page accessible');
    
    console.log('\n✅ All frontend pages are accessible!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  testFrontendPages();
}