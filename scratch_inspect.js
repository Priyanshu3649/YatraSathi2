require('dotenv').config();
const dbContext = require('./src/utils/dbContext');
const { BookingTVL } = require('./src/models');

async function inspect() {
  await dbContext.run('TVL_2026_27', async () => {
    const bookings = await BookingTVL.findAll({ order: [['bk_bkid', 'DESC']] });
    console.log('Total bookings in TVL_2026_27:', bookings.length);
    for (const b of bookings) {
      console.log({
        id: b.bk_bkid,
        bkno: b.bk_bkno,
        usid: b.bk_usid,
        phone: b.bk_phonenumber,
        name: b.bk_customername,
        from: b.bk_fromst,
        to: b.bk_tost,
        status: b.bk_status,
        eby: b.eby
      });
    }
  });
  process.exit(0);
}

inspect();
