const fetch = require('node-fetch');

async function testAPIEndpoints() {
  const baseURL = 'http://localhost:5003';
  
  // First, let's try to login to get a token
  console.log('1. Testing login...');
  try {
    const loginResponse = await fetch(`${baseURL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123'
      })
    });
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login successful');
      const token = loginData.token;
      
      // Test security endpoints
      const endpoints = [
        '/api/security/applications',
        '/api/security/modules',
        '/api/permissions',
        '/api/permissions/roles',
        '/api/security/users',
        '/api/security/role-permissions',
        '/api/security/user-permissions'
      ];
      
      console.log('\n2. Testing security endpoints...\n');
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`${baseURL}${endpoint}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (response.ok) {
            const data = await response.json();
            const count = Array.isArray(data) ? data.length : (data.data ? data.data.length : 0);
            console.log(`✅ ${endpoint}: ${count} records`);
          } else {
            console.log(`❌ ${endpoint}: ${response.status} ${response.statusText}`);
            const errorText = await response.text();
            console.log(`   Error: ${errorText}`);
          }
        } catch (error) {
          console.log(`❌ ${endpoint}: ${error.message}`);
        }
      }
    } else {
      console.log('❌ Login failed:', loginResponse.status, loginResponse.statusText);
      const errorText = await loginResponse.text();
      console.log('Error:', errorText);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    console.log('\n⚠️  Make sure the server is running on port 5003');
    console.log('   Run: npm start');
  }
}

testAPIEndpoints();
