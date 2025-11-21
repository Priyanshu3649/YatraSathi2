const http = require('http');

console.log('=== Testing Booking Search Functionality ===\n');

// Test data
const adminLoginData = {
  email: 'admin@example.com',
  password: 'admin123'
};

const customerLoginData = {
  email: 'customer@example.com',
  password: 'customer123'
};

let adminToken = '';
let customerToken = '';

// Run tests in sequence
loginAsAdmin();

function loginAsAdmin() {
  console.log('1. Logging in as admin...');
  
  const options = {
    hostname: '127.0.0.1',
    port: 5002,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        const response = JSON.parse(data);
        adminToken = response.token;
        console.log('✓ Admin login successful');
        console.log(`Token: ${adminToken.substring(0, 20)}...\n`);
        loginAsCustomer();
      } else {
        console.log('✗ Admin login failed');
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${data}\n`);
      }
    });
  });

  req.on('error', (error) => {
    console.error('✗ Admin login error:', error.message);
  });

  const requestData = JSON.stringify(adminLoginData);
  req.write(requestData);
  req.end();
}

function loginAsCustomer() {
  console.log('2. Logging in as customer...');
  
  const options = {
    hostname: '127.0.0.1',
    port: 5002,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        const response = JSON.parse(data);
        customerToken = response.token;
        console.log('✓ Customer login successful');
        console.log(`Token: ${customerToken.substring(0, 20)}...\n`);
        createTestBookings();
      } else {
        console.log('✗ Customer login failed');
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${data}\n`);
      }
    });
  });

  req.on('error', (error) => {
    console.error('✗ Customer login error:', error.message);
  });

  const requestData = JSON.stringify(customerLoginData);
  req.write(requestData);
  req.end();
}

function createTestBookings() {
  console.log('3. Creating test bookings...');
  
  // Create multiple bookings with different attributes for testing search
  const bookings = [
    {
      fromStation: 'ST001',
      toStation: 'ST002',
      travelDate: '2023-12-25',
      travelClass: '3A',
      berthPreference: 'LOWER',
      totalPassengers: 2,
      remarks: 'Test booking 1'
    },
    {
      fromStation: 'ST003',
      toStation: 'ST004',
      travelDate: '2023-12-30',
      travelClass: '2S',
      berthPreference: 'MIDDLE',
      totalPassengers: 1,
      remarks: 'Test booking 2'
    },
    {
      fromStation: 'ST001',
      toStation: 'ST004',
      travelDate: '2024-01-05',
      travelClass: 'SL',
      berthPreference: 'UPPER',
      totalPassengers: 3,
      remarks: 'Test booking 3'
    }
  ];

  createBookingSequentially(bookings, 0);
}

function createBookingSequentially(bookings, index) {
  if (index >= bookings.length) {
    console.log('✓ All test bookings created\n');
    testSearchFunctionality();
    return;
  }

  const booking = bookings[index];
  
  const options = {
    hostname: '127.0.0.1',
    port: 5002,
    path: '/api/bookings',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${customerToken}`,
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 201) {
        console.log(`✓ Booking ${index + 1} created successfully`);
        createBookingSequentially(bookings, index + 1);
      } else {
        console.log(`✗ Failed to create booking ${index + 1}`);
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${data}\n`);
        createBookingSequentially(bookings, index + 1);
      }
    });
  });

  req.on('error', (error) => {
    console.error(`✗ Create booking ${index + 1} error:`, error.message);
    createBookingSequentially(bookings, index + 1);
  });

  const requestData = JSON.stringify(booking);
  req.write(requestData);
  req.end();
}

function testSearchFunctionality() {
  console.log('4. Testing search functionality...\n');
  
  // Test 1: Search by status
  testSearch('Status search (PENDING)', '/api/bookings/search?status=PENDING', adminToken);
  
  // Test 2: Search by date range
  setTimeout(() => {
    testSearch('Date range search', '/api/bookings/search?fromDate=2023-12-20&toDate=2023-12-26', adminToken);
  }, 1000);
  
  // Test 3: Search by station
  setTimeout(() => {
    testSearch('From station search', '/api/bookings/search?fromStation=ST001', adminToken);
  }, 2000);
  
  // Test 4: Search by passenger count
  setTimeout(() => {
    testSearch('Passenger count search', '/api/bookings/search?minPassengers=2&maxPassengers=3', adminToken);
  }, 3000);
  
  // Test 5: Customer search (should only see their own bookings)
  setTimeout(() => {
    testSearch('Customer search', '/api/bookings/search', customerToken);
  }, 4000);
  
  // Test 6: Pagination
  setTimeout(() => {
    testSearch('Pagination test', '/api/bookings/search?page=1&limit=2', adminToken);
  }, 5000);
}

function testSearch(testName, path, token) {
  console.log(`Testing: ${testName}`);
  
  const options = {
    hostname: '127.0.0.1',
    port: 5002,
    path: path,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        const response = JSON.parse(data);
        console.log(`✓ ${testName} successful`);
        console.log(`  Found ${response.totalBookings} bookings\n`);
      } else {
        console.log(`✗ ${testName} failed`);
        console.log(`  Status: ${res.statusCode}`);
        console.log(`  Response: ${data}\n`);
      }
    });
  });

  req.on('error', (error) => {
    console.error(`✗ ${testName} error:`, error.message);
  });

  req.end();
}