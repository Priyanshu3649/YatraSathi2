const http = require('http');

console.log('=== Testing Booking Assignment Functionality ===\n');

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
let bookingId = '';

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
        createBooking();
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

function createBooking() {
  console.log('3. Creating a new booking as customer...');
  
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
        const response = JSON.parse(data);
        bookingId = response.bk_bkid;
        console.log('✓ Booking created successfully');
        console.log(`Booking ID: ${bookingId}\n`);
        assignBooking();
      } else {
        console.log('✗ Failed to create booking');
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${data}\n`);
      }
    });
  });

  req.on('error', (error) => {
    console.error('✗ Create booking error:', error.message);
  });

  const requestData = JSON.stringify({
    fromStation: 'ST001',
    toStation: 'ST002',
    travelDate: '2023-12-25',
    travelClass: '3A',
    berthPreference: 'LOWER',
    totalPassengers: 2,
    remarks: 'Test booking for assignment'
  });

  req.write(requestData);
  req.end();
}

function assignBooking() {
  console.log('4. Assigning booking to employee as admin...');
  
  const options = {
    hostname: '127.0.0.1',
    port: 5002,
    path: '/api/bookings/assign',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
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
        console.log('✓ Booking assigned successfully');
        console.log(`Booking status: ${response.bk_status}`);
        console.log(`Assigned agent: ${response.bk_agent}\n`);
        verifyAssignment();
      } else {
        console.log('✗ Failed to assign booking');
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${data}\n`);
      }
    });
  });

  req.on('error', (error) => {
    console.error('✗ Assign booking error:', error.message);
  });

  const requestData = JSON.stringify({
    bookingId: bookingId,
    employeeId: 'EMP001'
  });

  req.write(requestData);
  req.end();
}

function verifyAssignment() {
  console.log('5. Verifying booking assignment...');
  
  const options = {
    hostname: '127.0.0.1',
    port: 5002,
    path: `/api/bookings/${bookingId}`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
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
        console.log('✓ Booking details retrieved successfully');
        console.log(`Booking status: ${response.bk_status}`);
        console.log(`Assigned agent: ${response.bk_agent}\n`);
        if (response.bk_status === 'APPROVED' && response.bk_agent === 'EMP001') {
          console.log('=== All booking assignment tests completed successfully! ===');
        } else {
          console.log('✗ Booking was not properly assigned');
        }
      } else {
        console.log('✗ Failed to get booking details');
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${data}\n`);
      }
    });
  });

  req.on('error', (error) => {
    console.error('✗ Verify assignment error:', error.message);
  });

  req.end();
}