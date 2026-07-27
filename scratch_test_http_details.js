require('dotenv').config();
const http = require('http');
const dbContext = require('./src/utils/dbContext');
const { getCustomerBookings, getBookingById } = require('./src/controllers/bookingController');
const { UserTVL } = require('./src/models');

async function testHttp() {
  console.log('🔍 Testing Customer Booking Endpoints...\n');

  const customerUser = await UserTVL.findOne({ where: { us_email: 'customer@example.com' } });
  const testCustomer = {
    us_usid: customerUser.us_usid,
    us_usertype: customerUser.us_usertype || 'customer',
    us_roid: customerUser.us_roid || 'CUS',
    us_phone: customerUser.us_phone || '8888888888',
    us_fname: customerUser.us_fname || 'John',
    us_lname: customerUser.us_lname || 'Doe',
    us_email: customerUser.us_email
  };

  await dbContext.run('TVL_2026_27', async () => {
    // 1. Test /api/customer/bookings
    console.log('1️⃣ Testing GET /api/customer/bookings...');
    const req1 = { user: testCustomer, query: { limit: '5' } };
    let res1Data = null;
    const res1 = {
      json: (data) => { res1Data = data; }
    };
    await getCustomerBookings(req1, res1);
    console.log('  Response success:', res1Data?.success);
    console.log('  Response data keys:', res1Data?.data ? Object.keys(res1Data.data) : null);
    console.log('  Bookings count:', res1Data?.data?.bookings?.length);
    if (res1Data?.data?.bookings?.length > 0) {
      console.log('  First booking ID:', res1Data.data.bookings[0].bk_bkid, 'No:', res1Data.data.bookings[0].bk_bkno);
    }

    // 2. Test /api/bookings/my-bookings
    console.log('\n2️⃣ Testing GET /api/bookings/my-bookings...');
    const req2 = { user: testCustomer, query: {} };
    let res2Data = null;
    const res2 = {
      json: (data) => { res2Data = data; }
    };
    await getCustomerBookings(req2, res2);
    console.log('  Response success:', res2Data?.success);
    console.log('  Bookings count:', res2Data?.data?.bookings?.length);

    // 3. Test GET /api/customer/bookings/:id (e.g. ID 7)
    console.log('\n3️⃣ Testing GET /api/customer/bookings/7...');
    const req3 = { user: testCustomer, params: { id: '7' } };
    let res3Data = null;
    const res3 = {
      status: (code) => ({
        json: (data) => { res3Data = { code, ...data }; }
      }),
      json: (data) => { res3Data = data; }
    };
    await getBookingById(req3, res3);
    console.log('  Response:', res3Data);
  });

  process.exit(0);
}

testHttp();
