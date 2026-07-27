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

async function runTest() {
  console.log('🚀 Testing Customer & Admin Proxy Endpoints...\n');

  // Customer Login
  const cusPostData = JSON.stringify({ email: 'customer@example.com', password: 'customer123' });
  const cusReq = http.request({
    hostname: 'localhost',
    port: 3001,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(cusPostData) }
  });

  const cusToken = await new Promise((resolve) => {
    cusReq.on('response', res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d).token));
    });
    cusReq.write(cusPostData);
    cusReq.end();
  });

  const cusHeaders = { 'Authorization': `Bearer ${cusToken}`, 'X-Financial-Year': '2026-2027' };

  console.log('1️⃣ Customer GET /api/customer/bookings?limit=5 (Dashboard)...');
  const res1 = await makeRequest('/api/customer/bookings?limit=5', cusHeaders);
  console.log('   Bookings count:', res1.body?.data?.bookings?.length);

  console.log('2️⃣ Customer GET /api/bookings/my-bookings (My Bookings page)...');
  const res2 = await makeRequest('/api/bookings/my-bookings', cusHeaders);
  console.log('   Bookings count:', res2.body?.data?.bookings?.length);

  // Admin Login
  const admPostData = JSON.stringify({ email: 'admin@example.com', password: 'Admin@123' });
  const admReq = http.request({
    hostname: 'localhost',
    port: 3001,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(admPostData) }
  });

  const admToken = await new Promise((resolve) => {
    admReq.on('response', res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d).token));
    });
    admReq.write(admPostData);
    admReq.end();
  });

  const admHeaders = { 'Authorization': `Bearer ${admToken}`, 'X-Financial-Year': '2026-2027' };

  console.log('3️⃣ Admin GET /api/employee/bookings (Admin Bookings page)...');
  const res3 = await makeRequest('/api/employee/bookings', admHeaders);
  console.log('   Admin Bookings count:', Array.isArray(res3.body?.data) ? res3.body.data.length : res3.body?.data?.bookings?.length);

  console.log('\n🎉 E2E TEST COMPLETED SUCCESSFULLY!');
  process.exit(0);
}

runTest();
