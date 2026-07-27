require('dotenv').config();
const dbContext = require('./src/utils/dbContext');
const { getCustomerBookings } = require('./src/controllers/bookingController');
const { UserTVL } = require('./src/models');

async function debugSql() {
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
    console.log('1️⃣ Querying with limit: 5...');
    let res1Data = null;
    await getCustomerBookings({ user: testCustomer, query: { limit: '5' } }, { json: (d) => { res1Data = d; } });
    console.log('   Total returned:', res1Data?.data?.bookings?.length);
    res1Data?.data?.bookings?.forEach(b => console.log(`   ID: ${b.bk_bkid}, No: ${b.bk_bkno}, USID: ${b.bk_usid}, Phone: ${b.bk_phonenumber}, EBY: ${b.eby}`));

    console.log('\n2️⃣ Querying with empty query {}...');
    let res2Data = null;
    await getCustomerBookings({ user: testCustomer, query: {} }, { json: (d) => { res2Data = d; } });
    console.log('   Total returned:', res2Data?.data?.bookings?.length);
    res2Data?.data?.bookings?.forEach(b => console.log(`   ID: ${b.bk_bkid}, No: ${b.bk_bkno}, USID: ${b.bk_usid}, Phone: ${b.bk_phonenumber}, EBY: ${b.eby}`));
  });

  process.exit(0);
}

debugSql();
