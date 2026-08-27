const { BookingTVL } = require('./src/models');
const { sequelizeTVL } = require('./config/db');

async function run() {
  try {
    const booking = await BookingTVL.create({
      bk_bkno: 'BK-TEST-' + Date.now(),
      bk_usid: 'US123',
      bk_phonenumber: '1234567890',
      bk_customername: 'Test',
      bk_fromst: 'NDLS',
      bk_tost: 'BCT',
      bk_trvldt: new Date(),
      bk_class: 'SL',
      eby: 'US123',
      mby: 'US123'
    }, {
      userId: 123
    });
    console.log("Successfully created booking:", booking.bk_bkid);
  } catch (err) {
    console.error("Failed:", err.message);
  } finally {
    process.exit(0);
  }
}
run();
