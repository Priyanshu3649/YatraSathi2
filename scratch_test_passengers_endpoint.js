require('dotenv').config();
const dbContext = require('./src/utils/dbContext');
const { getBookingPassengers, getBookingById } = require('./src/controllers/bookingController');
const { UserTVL } = require('./src/models');

async function testPassengersEndpoint() {
  console.log('🚀 Testing /api/customer/bookings/:id/passengers Endpoint...\n');

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
    // Test passengers endpoint for booking 8
    console.log('1️⃣ Fetching passengers for booking 8...');
    let passData = null;
    const handlePassRes = (data) => {
      passData = data;
    };
    await getBookingPassengers(
      { user: testCustomer, params: { id: '8', bookingId: '8' } },
      { status: (code) => ({ json: (d) => { passData = { code, ...d }; } }), json: handlePassRes }
    );

    console.log('  Passengers response success:', passData?.success);
    console.log('  Passengers count:', passData?.passengers?.length || passData?.data?.length || 0);

    if (passData?.success) {
      console.log('  ✅ SUCCESS: /api/customer/bookings/:id/passengers returned success=true!');
    } else {
      console.error('  ❌ FAIL: Passenger endpoint returned error:', passData);
    }

    // Test details endpoint for booking 8
    console.log('\n2️⃣ Fetching details for booking 8...');
    let detailsData = null;
    await getBookingById(
      { user: testCustomer, params: { id: '8' } },
      { json: (d) => { detailsData = d; } }
    );

    if (detailsData?.success && detailsData?.data) {
      console.log('  ✅ SUCCESS: Booking Details endpoint returned success=true and valid booking object!');
    } else {
      console.error('  ❌ FAIL: Details endpoint error:', detailsData);
    }
  });

  console.log('\n🎉 PASSENGERS & DETAILS VERIFICATION COMPLETE!');
  process.exit(0);
}

testPassengersEndpoint();
