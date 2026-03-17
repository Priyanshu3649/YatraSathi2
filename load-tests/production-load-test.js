/**
 * YatraSathi Production Load Testing Script
 * Using k6 - Modern Load Testing Tool
 * 
 * Install k6:
 * - macOS: brew install k6
 * - Windows: winget install k6
 * - Linux: sudo apt-get install k6
 * 
 * Usage:
 *   k6 run load-tests/production-load-test.js
 *   k6 run --vus 50 --duration 10m load-tests/production-load-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const bookingTime = new Trend('booking_creation_time');
const searchTime = new Trend('search_time');

// Test configuration
export const options = {
  // Phase 1: Warm-up (2 minutes)
  stages: [
    { duration: '2m', target: 10 },   // Ramp up to 10 users
    { duration: '3m', target: 10 },   // Stay at 10 users
    { duration: '2m', target: 30 },   // Ramp up to 30 users
    { duration: '5m', target: 30 },   // Stay at 30 users
    { duration: '2m', target: 50 },   // Ramp up to 50 users (peak)
    { duration: '10m', target: 50 },  // Stay at peak for 10 minutes
    { duration: '2m', target: 100 },  // Spike test to 100 users
    { duration: '3m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 0 },    // Ramp down to 0
  ],
  
  // Thresholds for pass/fail criteria
  thresholds: {
    http_req_duration: ['p(50)<500', 'p(95)<1000', 'p(99)<2000'], // 50% of requests < 500ms, 95% < 1s, 99% < 2s
    http_req_failed: ['rate<0.01'], // Error rate < 1%
    errors: ['rate<0.01'],          // Custom error rate < 1%
    booking_creation_time: ['p(95)<1000'], // Booking creation < 1s
    search_time: ['p(95)<800'],     // Search operations < 800ms
  },
  
  // Additional settings
  maxRedirects: 3,
  insecureSkipTLSVerify: true,
};

// Test data
const BASE_URL = 'http://localhost:5010';
const TEST_CREDENTIALS = {
  phone: '9876543210',
  password: 'testpassword123'
};

// Helper functions
function getRandomStation() {
  const stations = ['NDLS', 'BCT', 'HWH', 'MAS', 'CST', 'BANGALORE', 'CHENNAI', 'MUMBAI'];
  return stations[Math.floor(Math.random() * stations.length)];
}

function getRandomDate(daysAhead = 7) {
  const date = new Date();
  date.setDate(date.getDate() + Math.floor(Math.random() * daysAhead) + 1);
  return date.toISOString().split('T')[0];
}

function generateRandomPhone() {
  return '9' + Math.floor(Math.random() * 1e9).toString().padStart(9, '0');
}

// Test scenarios
export default function () {
  const scenario = Math.random();
  
  if (scenario < 0.3) {
    // 30% - View bookings (read operation)
    viewBookings();
  } else if (scenario < 0.6) {
    // 30% - Search bookings (read operation)
    searchBookings();
  } else if (scenario < 0.8) {
    // 20% - Create booking (write operation)
    createBooking();
  } else {
    // 20% - Health check & other operations
    healthCheck();
  }
  
  sleep(1); // Wait 1 second between actions
}

// Scenario 1: View all bookings
function viewBookings() {
  const params = {
    headers: {
      'Authorization': `Bearer ${getTestToken()}`,
      'Content-Type': 'application/json',
    },
  };
  
  const startTime = Date.now();
  const res = http.get(`${BASE_URL}/api/employee/bookings`, params);
  const duration = Date.now() - startTime;
  
  searchTime.add(duration);
  
  const success = check(res, {
    'view bookings status is 200': (r) => r.status === 200,
    'view bookings returns data': (r) => JSON.parse(r.body).success === true,
    'view bookings response time < 1s': (r) => r.timings.duration < 1000,
  });
  
  errorRate.add(!success);
}

// Scenario 2: Search bookings by status
function searchBookings() {
  const statuses = ['DRAFT', 'CONFIRMED', 'CANCELLED'];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  
  const params = {
    headers: {
      'Authorization': `Bearer ${getTestToken()}`,
      'Content-Type': 'application/json',
    },
  };
  
  const startTime = Date.now();
  const res = http.get(`${BASE_URL}/api/bookings/status/${status}`, params);
  const duration = Date.now() - startTime;
  
  searchTime.add(duration);
  
  const success = check(res, {
    'search bookings status is 200': (r) => r.status === 200,
    'search returns array': (r) => {
      const body = JSON.parse(r.body);
      return Array.isArray(body) || (body && body.data);
    },
  });
  
  errorRate.add(!success);
}

// Scenario 3: Create new booking
function createBooking() {
  const phone = generateRandomPhone();
  const bookingData = {
    phoneNumber: phone,
    customerName: `Test Customer ${Math.floor(Math.random() * 1000)}`,
    fromStation: getRandomStation(),
    toStation: getRandomStation(),
    travelDate: getRandomDate(),
    travelClass: 'SL',
    berthPreference: 'LOWER',
    totalPassengers: Math.floor(Math.random() * 4) + 1,
    passengerList: [],
    status: 'DRAFT'
  };
  
  // Generate passenger list
  const passengerCount = bookingData.totalPassengers;
  for (let i = 0; i < passengerCount; i++) {
    bookingData.passengerList.push({
      name: `Passenger ${i + 1}`,
      age: Math.floor(Math.random() * 60) + 1,
      gender: Math.random() > 0.5 ? 'M' : 'F'
    });
  }
  
  const params = {
    headers: {
      'Authorization': `Bearer ${getTestToken()}`,
      'Content-Type': 'application/json',
    },
  };
  
  const startTime = Date.now();
  const res = http.post(`${BASE_URL}/api/bookings`, JSON.stringify(bookingData), params);
  const duration = Date.now() - startTime;
  
  bookingTime.add(duration);
  
  const success = check(res, {
    'create booking status is 201': (r) => r.status === 201,
    'create booking returns success': (r) => JSON.parse(r.body).success === true,
    'create booking has booking ID': (r) => {
      const data = JSON.parse(r.body).data;
      return data && (data.bk_bkid || data.bookingId);
    },
    'create booking response time < 2s': (r) => r.timings.duration < 2000,
  });
  
  errorRate.add(!success);
}

// Scenario 4: Health check
function healthCheck() {
  const res = http.get(`${BASE_URL}/health`);
  
  check(res, {
    'health check status is 200': (r) => r.status === 200,
    'health check database connected': (r) => {
      const body = JSON.parse(r.body);
      return body.database === 'connected';
    },
  });
}

// Mock token - Replace with actual token generation
function getTestToken() {
  // In production, you should generate this properly
  // For now, using a placeholder
  return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IkFETTAwMSIsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2xlIjoiQURNIiwiaWF0IjoxNjE2MTYxNjE2fQ.test_token_for_load_testing';
}

// Setup - runs once before all VUs start
export function setup() {
  console.log('Starting YatraSathi Load Test...');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Test Duration: ${options.stages.reduce((acc, stage) => acc + parseInt(stage.duration), 0)} minutes`);
  console.log(`Max VUs: ${Math.max(...options.stages.map(s => s.target))}`);
  
  // Verify server is running
  const healthRes = http.get(`${BASE_URL}/health`);
  if (healthRes.status !== 200) {
    throw new Error(`Server not responding! Status: ${healthRes.status}`);
  }
  
  console.log('✅ Server is healthy, starting load test...\n');
  
  return { startTime: Date.now() };
}

// Teardown - runs once after all VUs finish
export function teardown(data) {
  const totalTime = (Date.now() - data.startTime) / 1000;
  console.log('\n===========================================');
  console.log('Load Test Completed!');
  console.log(`Total Duration: ${Math.round(totalTime)} seconds`);
  console.log('===========================================\n');
}

/**
 * ALTERNATIVE: Simple Constant Load Test
 * Run with: k6 run --vus 50 --duration 10m production-load-test-simple.js
 */
export const simpleOptions = {
  vus: 50,
  duration: '10m',
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.01'],
  },
};

/**
 * STRESS TEST - Find breaking point
 * Run with: k6 run --vus 200 --duration 5m production-load-test-stress.js
 */
export const stressOptions = {
  stages: [
    { duration: '1m', target: 50 },
    { duration: '1m', target: 100 },
    { duration: '1m', target: 150 },
    { duration: '1m', target: 200 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'], // Allow 5% error rate in stress test
  },
};

/**
 * SOAK TEST - Check for memory leaks
 * Run with: k6 run --vus 20 --duration 2h production-load-test-soak.js
 */
export const soakOptions = {
  vus: 20,
  duration: '2h',
  thresholds: {
    http_req_duration: ['p(95)<1500'], // More lenient for long test
    http_req_failed: ['rate<0.01'],
  },
};
