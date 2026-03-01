const { BookingTVL } = require('./src/models');

async function testDelete() {
  try {
    console.log('Testing delete functionality...');
    
    // Find a booking to delete
    const booking = await BookingTVL.findOne({
      order: [['bk_bkid', 'DESC']]
    });
    
    if (!booking) {
      console.log('No bookings found');
      return;
    }
    
    console.log('Found booking:', booking.bk_bkid, booking.bk_bkno);
    
    // Test the deleteBooking function
    const { deleteBooking } = require('./src/controllers/bookingController');
    
    const mockReq = {
      params: { id: booking.bk_bkid },
      user: { us_roid: 'ADM', us_usid: 'ADM001' }
    };
    
    const mockRes = {
      status: function(code) {
        console.log('Status:', code);
        return this;
      },
      json: function(data) {
        console.log('Response:', data);
      }
    };
    
    await deleteBooking(mockReq, mockRes);
    
    // Verify deletion
    const deletedBooking = await BookingTVL.findByPk(booking.bk_bkid);
    if (!deletedBooking) {
      console.log('Booking deleted successfully');
    } else {
      console.log('Booking still exists');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testDelete();