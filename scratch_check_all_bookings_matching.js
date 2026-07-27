require('dotenv').config();
const dbContext = require('./src/utils/dbContext');
const { BookingTVL, UserTVL } = require('./src/models');
const { getCustomerBookings, getAllBookings } = require('./src/controllers/bookingController');

async function testMatching() {
  console.log('🔍 Inspecting All Bookings and Filter Matching...\n');

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

  const testAdmin = {
    us_usid: 'ADM001',
    us_usertype: 'admin',
    us_roid: 'ADM',
    us_phone: '9999999999',
    us_fname: 'Admin',
    us_lname: 'User',
    us_email: 'admin@example.com'
  };

  await dbContext.run('TVL_2026_27', async () => {
    // 1. All raw bookings in TVL_2026_27
    const allRaw = await BookingTVL.findAll({ order: [['bk_bkid', 'DESC']] });
    console.log(`📋 Total Raw Bookings in DB TVL_2026_27: ${allRaw.length}`);
    allRaw.forEach(b => {
      console.log(`   ID: ${b.bk_bkid} | No: ${b.bk_bkno} | USID: ${b.bk_usid} | Phone: ${b.bk_phonenumber} | Name: ${b.bk_customername} | Status: ${b.bk_status} | EBY: ${b.eby}`);
    });

    // 2. Test getCustomerBookings (My Bookings)
    console.log('\n1️⃣ Testing getCustomerBookings (My Bookings page for CUS001)...');
    let customerResData = null;
    await getCustomerBookings({ user: testCustomer, query: {} }, { json: (d) => { customerResData = d; } });
    const custBookings = customerResData?.data?.bookings || [];
    console.log(`   My Bookings returned ${custBookings.length} records:`);
    custBookings.forEach(b => {
      console.log(`   -> ID: ${b.bk_bkid} | No: ${b.bk_bkno} | USID: ${b.bk_usid} | Phone: ${b.bk_phonenumber}`);
    });

    // 3. Test getAllBookings (Admin Bookings page)
    console.log('\n2️⃣ Testing getAllBookings (Admin Bookings page for ADM001)...');
    let adminResData = null;
    await getAllBookings({ user: testAdmin, query: {} }, { json: (d) => { adminResData = d; } });
    const adminBookings = adminResData?.data?.bookings || [];
    console.log(`   Admin Bookings returned ${adminBookings.length} records:`);
    adminBookings.forEach(b => {
      console.log(`   -> ID: ${b.bk_bkid} | No: ${b.bk_bkno} | USID: ${b.bk_usid} | Phone: ${b.bk_phonenumber} | Status: ${b.bk_status}`);
    });
  });

  process.exit(0);
}

testMatching();
