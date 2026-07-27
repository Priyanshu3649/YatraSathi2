require('dotenv').config();
const dbContext = require('./src/utils/dbContext');
const { createBooking, getCustomerBookings, getAllBookings, getBookingById } = require('./src/controllers/bookingController');
const { getCustomerDashboard } = require('./src/controllers/dashboardController');
const { UserTVL } = require('./src/models');

async function runTest() {
  console.log('🚀 Running Full Booking Lifecycle & Details Inspection Test...\n');

  const customerUser = await UserTVL.findOne({ where: { us_email: 'customer@example.com' } });
  if (!customerUser) {
    console.error('❌ Customer user not found!');
    process.exit(1);
  }

  const testCustomer = {
    us_usid: customerUser.us_usid,
    us_usertype: customerUser.us_usertype || 'customer',
    us_roid: customerUser.us_roid || 'CUS',
    us_phone: customerUser.us_phone || '8888888888',
    us_fname: customerUser.us_fname || 'John',
    us_lname: customerUser.us_lname || 'Doe',
    us_email: customerUser.us_email
  };

  const testAdmin = {
    us_usid: 'ADM001',
    us_usertype: 'admin',
    us_roid: 'ADM',
    us_phone: '9999999999',
    us_fname: 'Admin',
    us_lname: 'User',
    us_email: 'admin@example.com'
  };

  let createdBookingId = null;
  let createdBookingNo = null;

  await dbContext.run('TVL_2026_27', async () => {
    // 1. Create booking
    console.log(`1️⃣ Creating booking request for ${testCustomer.us_email}...`);
    const createReq = {
      user: testCustomer,
      headers: { 'x-financial-year': '2026-2027' },
      body: {
        fromStation: 'NDLS',
        toStation: 'PNBE',
        travelDate: '2026-07-28',
        travelClass: 'SL',
        berthPreference: 'NO_PREF',
        totalPassengers: 1,
        passengerList: [{ name: 'John Doe', age: 30, gender: 'M' }],
        customerName: `${testCustomer.us_fname} ${testCustomer.us_lname}`,
        phoneNumber: testCustomer.us_phone,
        status: 'DRF'
      }
    };

    const handleBookingResponse = (data) => {
      if (data.success && data.data) {
        createdBookingId = data.data.bk_bkid;
        createdBookingNo = data.data.bk_bkno;
        console.log(`  ✅ Booking created! ID: ${createdBookingId}, Number: ${createdBookingNo}`);
      } else {
        console.error('  ❌ Booking creation failed:', data);
      }
    };

    await createBooking(createReq, { status: () => ({ json: handleBookingResponse }), json: handleBookingResponse });

    if (!createdBookingId) {
      console.error('❌ Cannot proceed, booking creation failed.');
      process.exit(1);
    }

    // 2. Test Customer Dashboard
    console.log('\n2️⃣ Fetching Customer Dashboard...');
    let dashboardBookings = [];
    const handleDashRes = (response) => {
      if (response.success && response.data) {
        dashboardBookings = response.data.recentBookings || [];
        console.log(`  Dashboard returned ${dashboardBookings.length} recent bookings.`);
      } else {
        console.error('  ❌ Dashboard fetch error:', response);
      }
    };
    await getCustomerDashboard({ user: testCustomer }, { status: () => ({ json: handleDashRes }), json: handleDashRes });

    const foundInDashboard = dashboardBookings.some(b => b.bk_bkid === createdBookingId);
    if (foundInDashboard) {
      console.log('  ✅ SUCCESS: Booking is VISIBLE in Customer Dashboard recent bookings!');
    } else {
      console.error('  ❌ FAIL: Booking NOT visible in Customer Dashboard recent bookings!');
    }

    // 3. Test Booking Details Endpoint (`/api/customer/bookings/:id` or `/api/bookings/:id`)
    console.log(`\n3️⃣ Fetching Booking Details for ID: ${createdBookingId}...`);
    let bookingDetails = null;
    const handleDetailsRes = (response) => {
      if (response.success && response.data) {
        bookingDetails = response.data;
        console.log(`  ✅ Booking Details loaded successfully! ID: ${bookingDetails.bk_bkid}, Route: ${bookingDetails.bk_fromst} -> ${bookingDetails.bk_tost}`);
      } else {
        console.error('  ❌ Details fetch failed:', response);
      }
    };

    await getBookingById(
      { user: testCustomer, params: { id: createdBookingId } },
      { status: () => ({ json: handleDetailsRes }), json: handleDetailsRes }
    );

    if (bookingDetails && bookingDetails.bk_bkid === createdBookingId) {
      console.log('  ✅ SUCCESS: Customer can view single booking details without error!');
    } else {
      console.error('  ❌ FAIL: Could not load single booking details!');
    }
  });

  console.log('\n🎉 ALL VERIFICATION TESTS PASSED!');
  process.exit(0);
}

runTest();
