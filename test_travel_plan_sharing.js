const http = require('http');

console.log('=== Testing Travel Plan Sharing Functionality ===\n');

// Test data
const customerLoginData = {
  email: 'customer@example.com',
  password: 'customer123'
};

const adminLoginData = {
  email: 'admin@example.com',
  password: 'admin123'
};

let customerToken = '';
let adminToken = '';
let travelPlanId = '';

// Run tests in sequence
loginAsCustomer();

function loginAsCustomer() {
  console.log('1. Logging in as customer...');
  
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
        loginAsAdmin();
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

function loginAsAdmin() {
  console.log('2. Logging in as admin...');
  
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
        createTravelPlan();
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

function createTravelPlan() {
  console.log('3. Creating a new travel plan...');
  
  const options = {
    hostname: '127.0.0.1',
    port: 5002,
    path: '/api/travel-plans',
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
        travelPlanId = response.tp_tpid;
        console.log('✓ Travel plan created successfully');
        console.log(`Travel Plan ID: ${travelPlanId}\n`);
        shareTravelPlan();
      } else {
        console.log('✗ Failed to create travel plan');
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${data}\n`);
      }
    });
  });

  req.on('error', (error) => {
    console.error('✗ Create travel plan error:', error.message);
  });

  const requestData = JSON.stringify({
    title: 'Summer Vacation',
    description: 'A wonderful summer vacation plan',
    startDate: '2024-06-01',
    endDate: '2024-06-15',
    destination: 'Goa',
    budget: 50000,
    activities: ['Beach', 'Sightseeing', 'Water Sports']
  });

  req.write(requestData);
  req.end();
}

function shareTravelPlan() {
  console.log('4. Sharing travel plan with admin...');
  
  const options = {
    hostname: '127.0.0.1',
    port: 5002,
    path: `/api/travel-plans/${travelPlanId}/share`,
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
      if (res.statusCode === 200) {
        const response = JSON.parse(data);
        console.log('✓ Travel plan shared successfully');
        console.log(`${response.message}\n`);
        getSharedUsers();
      } else {
        console.log('✗ Failed to share travel plan');
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${data}\n`);
      }
    });
  });

  req.on('error', (error) => {
    console.error('✗ Share travel plan error:', error.message);
  });

  const requestData = JSON.stringify({
    userIDs: ['ADM001'], // Share with admin
    isPublic: false
  });

  req.write(requestData);
  req.end();
}

function getSharedUsers() {
  console.log('5. Getting shared users for travel plan...');
  
  const options = {
    hostname: '127.0.0.1',
    port: 5002,
    path: `/api/travel-plans/${travelPlanId}/shared-users`,
    method: 'GET',
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
      if (res.statusCode === 200) {
        const response = JSON.parse(data);
        console.log('✓ Retrieved shared users successfully');
        console.log(`Is public: ${response.isPublic}`);
        console.log(`Shared with ${response.sharedWith.length} users\n`);
        accessSharedPlanAsAdmin();
      } else {
        console.log('✗ Failed to get shared users');
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${data}\n`);
      }
    });
  });

  req.on('error', (error) => {
    console.error('✗ Get shared users error:', error.message);
  });

  req.end();
}

function accessSharedPlanAsAdmin() {
  console.log('6. Accessing shared travel plan as admin...');
  
  const options = {
    hostname: '127.0.0.1',
    port: 5002,
    path: `/api/travel-plans/${travelPlanId}`,
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
        console.log('✓ Admin can access shared travel plan');
        console.log(`Title: ${response.tp_title}\n`);
        console.log('=== All travel plan sharing tests completed successfully! ===');
      } else {
        console.log('✗ Admin cannot access shared travel plan');
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${data}\n`);
      }
    });
  });

  req.on('error', (error) => {
    console.error('✗ Access shared plan error:', error.message);
  });

  req.end();
}