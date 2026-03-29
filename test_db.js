require('dotenv').config();
const { BookingTVL, EmployeeTVL, Customer, UserTVL, PaymentTVL, PassengerTVL: Passenger, Station } = require('./src/models');
const { Sequelize } = require('sequelize');

async function test() {
  try {
    console.log('Testing Admin dashboard queries...');
    console.log('BookingTVL count:');
    const totalBookings = await BookingTVL.count();
    console.log(totalBookings);
    
    console.log('EmployeeTVL count:');
    const totalEmployees = await EmployeeTVL.count();
    console.log(totalEmployees);
    
    console.log('Customer count:');
    const totalCustomers = await Customer.count();
    console.log(totalCustomers);
    
    console.log('UserTVL count:');
    const totalUsers = await UserTVL.count();
    console.log(totalUsers);
    
    console.log('PaymentTVL sum:');
    const totalRevenue = await PaymentTVL.sum('pt_amount', {
      where: { pt_status: 'PROCESSED' }
    });
    console.log(totalRevenue);
    
    console.log('Testing getAllBookings queries...');
    const { count, rows: bookings } = await BookingTVL.findAndCountAll({ limit: 5 });
    console.log('findAndCountAll Bookings count:', count);
    
    if (bookings && bookings.length > 0) {
      const bookingIds = bookings.map(booking => booking.bk_bkid);
      const passengerCountResults = await Passenger.findAll({
        attributes: ['ps_bkid', [Sequelize.fn('COUNT', Sequelize.col('ps_psid')), 'count']],
        where: {
          ps_bkid: { [Sequelize.Op.in]: bookingIds },
          ps_active: 1
        },
        group: ['ps_bkid']
      });
      console.log('passengerCountResults', passengerCountResults.length);
    }
    
    // Testing dashboard employee performance (with user details)
    console.log('Testing Employee Bookings...');
    const employeeBookings = await BookingTVL.findAll({
      attributes: [
        'bk_agent',
        [BookingTVL.sequelize.fn('COUNT', BookingTVL.sequelize.col('bk_bkid')), 'totalBookings'],
        [BookingTVL.sequelize.fn('SUM', BookingTVL.sequelize.literal("CASE WHEN bk_status = 'CONFIRMED' THEN 1 ELSE 0 END")), 'confirmedBookings']
      ],
      where: { bk_agent: { [Sequelize.Op.not]: null } },
      group: ['bk_agent'],
      order: [[BookingTVL.sequelize.fn('COUNT', BookingTVL.sequelize.col('bk_bkid')), 'DESC']],
      limit: 5
    });
    console.log('Employee Bookings count:', employeeBookings.length);
    console.log('All tests passed!');
  } catch (e) {
    console.error('ERROR:', e);
  }
  process.exit(0);
}

test();
