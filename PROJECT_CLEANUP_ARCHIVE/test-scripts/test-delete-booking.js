const { sequelizeTVL } = require('./config/db');
const { BookingTVL } = require('./src/models');

async function testDelete() {
  try {
    // Find a test booking to delete
    const booking = await BookingTVL.findOne({
      where: { bk_bkno: 'TEST001' }
    });
    
    if (!booking) {
      console.log('No test booking found with bk_bkno = TEST001');
      return;
    }
    
    console.log('Found booking to delete:', booking.bk_bkid, booking.bk_bkno);
    
    // Check for related records
    const [pnrs] = await sequelizeTVL.query('SELECT COUNT(*) as count FROM pnXpnr WHERE pn_bkid = ?', [booking.bk_bkid]);
    const [payments] = await sequelizeTVL.query('SELECT COUNT(*) as count FROM ptPayment WHERE pt_bkid = ?', [booking.bk_bkid]);
    const [passengers] = await sequelizeTVL.query('SELECT COUNT(*) as count FROM psXpassenger WHERE ps_bkid = ?', [booking.bk_bkid]);
    const [accounts] = await sequelizeTVL.query('SELECT COUNT(*) as count FROM acXaccount WHERE ac_bkid = ?', [booking.bk_bkid]);
    
    console.log('Related records:');
    console.log('  PNRs:', pnrs[0].count);
    console.log('  Payments:', payments[0].count);
    console.log('  Passengers:', passengers[0].count);
    console.log('  Accounts:', accounts[0].count);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelizeTVL.close();
  }
}

testDelete();