const http = require('http');

console.log('=== YatraSathi Comprehensive API Test ===\n');

// Test data
const testBooking = {
  origin: 'Delhi',
  destination: 'Mumbai',
  travelDate: '2025-12-25',
  class: 'AC3',
  berthPreference: 'LOWER',
  totalTickets: 2,
  passengers: [
    { name: 'John Doe', age: 30, gender: 'M' },
    { name: 'Jane Doe', age: 28, gender: 'F' }
  ]
};

// Store tokens and IDs for later tests
let adminToken = '';
let customerId = '';
let bookingId = '';

// Step 1: Login as admin
loginAsAdmin();

function loginAsAdmin() {
  console.log('Step 1: Logging in as admin...');
  
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
        console.log('✓ Admin login successful\n');
        testBookingEndpoints();
      } else {
        console.log('✗ Admin login failed\n');
      }
    });
  });

  req.on('error', (error) => {
    console.error('✗ Admin login error:', error.message);
  });

  const loginData = JSON.stringify({
    email: 'admin@example.com',
    password: 'admin123'
  });

  req.write(loginData);
  req.end();
}

function testBookingEndpoints() {
  console.log('Step 2: Testing booking endpoints...');
  
  // Create a booking
  createBooking();
}

function createBooking() {
  console.log('  Creating a new booking...');
  
  const options = {
    hostname: '127.0.0.1',
    port: 5002,
    path: '/api/bookings',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 201) {
        const response = JSON.parse(data);
        bookingId = response.bk_bkid;
        console.log('  ✓ Booking created successfully\n');
        testCustomerEndpoints();
      } else {
        console.log('  ✗ Booking creation failed\n');
      }
    });
  });

  req.on('error', (error) => {
    console.error('  ✗ Booking creation error:', error.message);
  });

  req.write(JSON.stringify(testBooking));
  req.end();
}

function testCustomerEndpoints() {
  console.log('Step 3: Testing customer endpoints...');
  
  // Get all customers
  getAllCustomers();
}

function getAllCustomers() {
  console.log('  Getting all customers...');
  
  const options = {
    hostname: '127.0.0.1',
    port: 5002,
    path: '/api/customers',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log('  ✓ Retrieved all customers\n');
        testEmployeeEndpoints();
      } else {
        console.log('  ✗ Failed to retrieve customers\n');
      }
    });
  });

  req.on('error', (error) => {
    console.error('  ✗ Customer retrieval error:', error.message);
  });

  req.end();
}

function testEmployeeEndpoints() {
  console.log('Step 4: Testing employee endpoints...');
  
  // Get all employees
  getAllEmployees();
}

function getAllEmployees() {
  console.log('  Getting all employees...');
  
  const options = {
    hostname: '127.0.0.1',
    port: 5002,
    path: '/api/employees',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log('  ✓ Retrieved all employees\n');
        testPaymentEndpoints();
      } else {
        console.log('  ✗ Failed to retrieve employees\n');
      }
    });
  });

  req.on('error', (error) => {
    console.error('  ✗ Employee retrieval error:', error.message);
  });

  req.end();
}

function testPaymentEndpoints() {
  console.log('Step 5: Testing payment endpoints...');
  
  // Get all payments
  getAllPayments();
}

function getAllPayments() {
  console.log('  Getting all payments...');
  
  const options = {
    hostname: '127.0.0.1',
    port: 5002,
    path: '/api/payments',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log('  ✓ Retrieved all payments\n');
        testTravelPlanEndpoints();
      } else {
        console.log('  ✗ Failed to retrieve payments\n');
      }
    });
  });

  req.on('error', (error) => {
    console.error('  ✗ Payment retrieval error:', error.message);
  });

  req.end();
}

function testTravelPlanEndpoints() {
  console.log('Step 6: Testing travel plan endpoints...');
  
  // Create a travel plan
  createTravelPlan();
}

function createTravelPlan() {
  console.log('  Creating a new travel plan...');
  
  const travelPlanData = {
    title: 'Summer Vacation',
    description: 'Family trip to Goa',
    startDate: '2025-06-01',
    endDate: '2025-06-10',
    destination: 'Goa',
    budget: 50000,
    activities: ['Beach', 'Sightseeing', 'Water Sports']
  };
  
  const options = {
    hostname: '127.0.0.1',
    port: 5002,
    path: '/api/travel-plans',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 201) {
        console.log('  ✓ Travel plan created successfully\n');
        console.log('=== All tests completed successfully! ===');
      } else {
        console.log('  ✗ Travel plan creation failed\n');
        console.log('=== Tests completed with some failures ===');
      }
    });
  });

  req.on('error', (error) => {
    console.error('  ✗ Travel plan creation error:', error.message);
  });

  req.write(JSON.stringify(travelPlanData));
  req.end();
}