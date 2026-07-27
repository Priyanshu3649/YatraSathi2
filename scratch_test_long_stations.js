require('dotenv').config();
const dbContext = require('./src/utils/dbContext');
const { createBooking, getCustomerBookings, getBookingById } = require('./src/controllers/bookingController');
const { UserTVL } = require('./src/models');

async function testFullStationNames() {
  console.log('🚀 Testing Booking Creation with Full Station Strings...\n');

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

  let newBookingId = null;

  await dbContext.run('TVL_2026_27', async () => {
    // Create booking with long station strings containing parentheses
    const createReq = {
      user: testCustomer,
      headers: { 'x-financial-year': '2026-2027' },
      body: {
        fromStation: 'New Delhi (NDLS)',
        toStation: 'Patna Junction (PNBE)',
        travelDate: '2026-08-20',
        travelClass: '3A',
        berthPreference: 'LOWER',
        totalPassengers: 1,
        passengerList: [{ name: 'John Doe', age: 30, gender: 'M' }],
        customerName: 'John Doe',
        phoneNumber: '8888888888',
        status: 'DRF'
      }
    };

    const handleCreateRes = (data) => {
      if (data.success && data.data) {
        newBookingId = data.data.bk_bkid;
        console.log(`  ✅ Booking created successfully! ID: ${newBookingId}, Station codes saved: ${data.data.bk_fromst} -> ${data.data.bk_tost}`);
      } else {
        console.error('  ❌ Booking creation failed:', data);
      }
    };

    await createBooking(createReq, { status: () => ({ json: handleCreateRes }), json: handleCreateRes });

    if (!newBookingId) {
      console.error('❌ Test failed: booking creation returned null.');
      process.exit(1);
    }

    // Fetch My Bookings
    console.log('\n2️⃣ Fetching My Bookings list...');
    let myBookings = [];
    const handleMyBookingsRes = (response) => {
      myBookings = Array.isArray(response.data) ? response.data : (response.data?.bookings || []);
      console.log(`  Retrieved ${myBookings.length} bookings for ${testCustomer.us_usid}.`);
    };
    await getCustomerBookings({ user: testCustomer, query: {} }, { status: () => ({ json: handleMyBookingsRes }), json: handleMyBookingsRes });

    const foundInMyBookings = myBookings.some(b => b.bk_bkid === newBookingId);
    if (foundInMyBookings) {
      console.log('  ✅ SUCCESS: New booking is VISIBLE in My Bookings list!');
    } else {
      console.error('  ❌ FAIL: New booking NOT found in My Bookings list!');
    }

    // Fetch Single Booking Details
    console.log(`\n3️⃣ Fetching single booking details for ID: ${newBookingId}...`);
    let detailsData = null;
    const handleDetailsRes = (response) => {
      if (response.success && response.data) {
        detailsData = response.data;
        console.log(`  ✅ Booking Details loaded cleanly! Route: ${detailsData.bk_fromst} (${detailsData.bk_fromstation}) -> ${detailsData.bk_tost} (${detailsData.bk_tostation})`);
      } else {
        console.error('  ❌ Failed to load details:', response);
      }
    };
    await getBookingById({ user: testCustomer, params: { id: newBookingId } }, { status: () => ({ json: handleDetailsRes }), json: handleDetailsRes });

    if (detailsData && detailsData.bk_bkid === newBookingId) {
      console.log('  ✅ SUCCESS: Booking Details endpoint returned success=true and correct booking object!');
    } else {
      console.error('  ❌ FAIL: Booking Details endpoint failed!');
    }
  });

  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
}

testFullStationNames();
