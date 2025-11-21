const http = require('http');

console.log('=== Testing Travel Plan Functionality ===\n');

// Test data
const customerLoginData = {
  email: 'customer@example.com',
  password: 'customer123'
};

let customerToken = '';
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
        createTravelPlan();
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

function createTravelPlan() {
  console.log('2. Creating a new travel plan...');
  
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
        getTravelPlans();
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

function getTravelPlans() {
  console.log('3. Getting all travel plans...');
  
  const options = {
    hostname: '127.0.0.1',
    port: 5002,
    path: '/api/travel-plans',
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
        console.log('✓ Retrieved travel plans successfully');
        console.log(`Found ${response.length} travel plans\n`);
        getTravelPlanById();
      } else {
        console.log('✗ Failed to get travel plans');
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${data}\n`);
      }
    });
  });

  req.on('error', (error) => {
    console.error('✗ Get travel plans error:', error.message);
  });

  req.end();
}

function getTravelPlanById() {
  console.log('4. Getting travel plan by ID...');
  
  const options = {
    hostname: '127.0.0.1',
    port: 5002,
    path: `/api/travel-plans/${travelPlanId}`,
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
        console.log('✓ Retrieved travel plan by ID successfully');
        console.log(`Title: ${response.tp_title}\n`);
        updateTravelPlan();
      } else {
        console.log('✗ Failed to get travel plan by ID');
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${data}\n`);
      }
    });
  });

  req.on('error', (error) => {
    console.error('✗ Get travel plan by ID error:', error.message);
  });

  req.end();
}

function updateTravelPlan() {
  console.log('5. Updating travel plan...');
  
  const options = {
    hostname: '127.0.0.1',
    port: 5002,
    path: `/api/travel-plans/${travelPlanId}`,
    method: 'PUT',
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
        console.log('✓ Travel plan updated successfully');
        console.log(`Updated title: ${response.tp_title}\n`);
        deleteTravelPlan();
      } else {
        console.log('✗ Failed to update travel plan');
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${data}\n`);
      }
    });
  });

  req.on('error', (error) => {
    console.error('✗ Update travel plan error:', error.message);
  });

  const requestData = JSON.stringify({
    title: 'Amazing Summer Vacation',
    budget: 55000
  });

  req.write(requestData);
  req.end();
}

function deleteTravelPlan() {
  console.log('6. Deleting travel plan...');
  
  const options = {
    hostname: '127.0.0.1',
    port: 5002,
    path: `/api/travel-plans/${travelPlanId}`,
    method: 'DELETE',
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
        console.log('✓ Travel plan deleted successfully');
        console.log(`${response.message}\n`);
        console.log('=== All travel plan tests completed successfully! ===');
      } else {
        console.log('✗ Failed to delete travel plan');
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${data}\n`);
      }
    });
  });

  req.on('error', (error) => {
    console.error('✗ Delete travel plan error:', error.message);
  });

  req.end();
}