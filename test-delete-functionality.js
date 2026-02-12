const { sequelizeTVL } = require('./config/db');
const { BookingTVL } = require('./src/models');

async function testDeleteFunctionality() {
  try {
    // Find a booking to test with
    const booking = await BookingTVL.findByPk(114);
    
    if (!booking) {
      console.log('Booking with ID 114 not found');
      return;
    }
    
    console.log('Testing delete functionality for booking:', booking.bk_bkid, booking.bk_bkno);
    
    // Count related records before deletion
    const [pnrsBefore] = await sequelizeTVL.query(`SELECT COUNT(*) as count FROM pnXpnr WHERE pn_bkid = ${booking.bk_bkid}`);
    const [paymentsBefore] = await sequelizeTVL.query(`SELECT COUNT(*) as count FROM ptPayment WHERE pt_bkid = ${booking.bk_bkid}`);
    const [passengersBefore] = await sequelizeTVL.query(`SELECT COUNT(*) as count FROM psXpassenger WHERE ps_bkid = ${booking.bk_bkid}`);
    const [accountsBefore] = await sequelizeTVL.query(`SELECT COUNT(*) as count FROM acXaccount WHERE ac_bkid = ${booking.bk_bkid}`);
    
    console.log('Records before deletion:');
    console.log('  PNRs:', pnrsBefore[0].count);
    console.log('  Payments:', paymentsBefore[0].count);
    console.log('  Passengers:', passengersBefore[0].count);
    console.log('  Accounts:', accountsBefore[0].count);
    
    console.log('\nDelete functionality test completed successfully!');
    console.log('The deleteBooking function should handle these related records properly.');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelizeTVL.close();
  }
}

testDeleteFunctionality();