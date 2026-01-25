/**
 * Performance Diagnostic Script
 * Measures API response times and identifies bottlenecks
 */

const axios = require('axios');
require('dotenv').config();

const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5004/api';

async function measureAPICall(endpoint, method = 'GET', data = null) {
  const startTime = Date.now();
  const fullUrl = `${BASE_URL}${endpoint}`;
  
  try {
    console.log(`🧪 Testing ${method} ${endpoint}...`);
    console.log(`   URL: ${fullUrl}`);
    
    const config = {
      method,
      url: fullUrl,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 5000  // 5 second timeout
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`✅ ${method} ${endpoint}: ${duration}ms`);
    console.log(`   Status: ${response.status}`);
    console.log(`   Data size: ${JSON.stringify(response.data).length} chars\n`);
    
    return { duration, status: response.status, data: response.data };
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`❌ ${method} ${endpoint}: ${duration}ms`);
    if (error.code === 'ECONNREFUSED') {
      console.log(`   Error: Server not running at ${fullUrl}\n`);
    } else {
      console.log(`   Error: ${error.message || error}\n`);
    }
    
    return { duration, error: error.message || error };
  }
}

async function runDiagnostic() {
  console.log('🚀 Starting Performance Diagnostic...\n');
  
  // Test health endpoint first
  await measureAPICall('/health');
  
  // Test database connectivity and performance
  await measureAPICall('/health/metrics');
  
  // Test booking endpoints
  await measureAPICall('/bookings');
  
  // Test a sample booking creation simulation
  const sampleBooking = {
    customerName: 'Test Customer',
    phoneNumber: '9876543210',
    fromStation: 'MUMBAI',
    toStation: 'DELHI',
    travelDate: new Date().toISOString().split('T')[0],
    travelClass: 'SL',
    status: 'DRAFT',
    remarks: 'Test booking for performance measurement',
    passengerList: [
      { name: 'John Doe', age: 30, gender: 'M', berth: 'LB' }
    ]
  };
  
  console.log('📊 Diagnostic Summary:');
  console.log('- Check the console logs above for individual API response times');
  console.log('- Look for any endpoints with response times > 1000ms');
  console.log('- Monitor database connection pooling in server logs');
  console.log('- Review network latency between client and server');
  
  console.log('\n📋 Recommended Actions:');
  console.log('1. If database queries are slow, check MySQL server performance');
  console.log('2. If API calls are slow, review backend processing logic');
  console.log('3. If network is slow, consider server location closer to client');
  console.log('4. Monitor server resource usage (CPU, Memory, Disk I/O)');
}

// Run the diagnostic
runDiagnostic().catch(console.error);