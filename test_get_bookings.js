const { BookingTVL, PassengerTVL: Passenger, StationTVL: Station } = require('./src/models');
const { Sequelize, Op } = require('sequelize');

async function test() {
  try {
    const where = { is_reconciled: 1 };
    
    console.log('Running findAndCountAll...');
    const result = await BookingTVL.findAndCountAll({
      where,
      limit: 50,
      offset: 0
    });
    console.log('Result:', result.count, 'rows');
    
    // Batch fetch passenger counts for all bookings
    const bookingIds = result.rows.map(booking => booking.bk_bkid);
    console.log('Booking IDs:', bookingIds);
    
    if (bookingIds.length > 0) {
      // Get passenger counts in batch
      const passengerCountResults = await Passenger.findAll({
        attributes: ['ps_bkid', [Sequelize.fn('COUNT', Sequelize.col('ps_psid')), 'count']],
        where: {
          ps_bkid: { [Op.in]: bookingIds },
          ps_active: 1
        },
        group: ['ps_bkid']
      });
      console.log('Passengers count fetched', passengerCountResults.length);
    }
  } catch (err) {
    console.error('ERROR:', err);
  }
  process.exit(0);
}

test();
