const http = require('http');

function makeRequest(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ statusCode: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function runAdminTest() {
  console.log('🚀 Testing Admin Login and All Bookings Fetch...\n');

  // Admin login credentials
  const loginPostData = JSON.stringify({ email: 'admin@example.com', password: 'Admin@123' });
  const loginReq = http.request({
    hostname: 'localhost',
    port: 3001,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginPostData)
    }
  });

  const loginResData = await new Promise((resolve) => {
    loginReq.on('response', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, data: JSON.parse(data) });
      });
    });
    loginReq.write(loginPostData);
    loginReq.end();
  });

  console.log('Admin login status:', loginResData.statusCode, loginResData.data?.message);
  const token = loginResData.data?.token || loginResData.data?.data?.token;

  if (!token) {
    console.error('❌ Admin login failed:', loginResData.data);
    process.exit(1);
  }

  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'X-Financial-Year': '2026-2027'
  };

  console.log('\n1️⃣ GET /api/employee/bookings (Admin Bookings)...');
  const res1 = await makeRequest('/api/employee/bookings', authHeaders);
  console.log('   Status Code:', res1.statusCode);
  console.log('   Success:', res1.body?.success);
  console.log('   Total Bookings returned for Admin:', Array.isArray(res1.body?.data) ? res1.body.data.length : res1.body?.data?.bookings?.length);

  console.log('\n2️⃣ GET /api/bookings (General Bookings)...');
  const res2 = await makeRequest('/api/bookings', authHeaders);
  console.log('   Status Code:', res2.statusCode);
  console.log('   Success:', res2.body?.success);
  console.log('   Total Bookings returned:', Array.isArray(res2.body?.data) ? res2.body.data.length : res2.body?.data?.bookings?.length);

  console.log('\n🎉 ADMIN TEST COMPLETE!');
  process.exit(0);
}

runAdminTest();
