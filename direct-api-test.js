// Test the delete API endpoint directly
const { BookingTVL } = require('./src/models');

async function testDirectAPI() {
  try {
    console.log('Testing direct API call...');
    
    // Find a booking to delete
    const booking = await BookingTVL.findOne({
      order: [['bk_bkid', 'DESC']]
    });
    
    if (!booking) {
      console.log('No bookings found');
      return;
    }
    
    console.log('Found booking:', booking.bk_bkid, booking.bk_bkno);
    
    // Test the deleteBooking function directly
    const { deleteBooking } = require('./src/controllers/bookingController');
    
    // Mock request and response
    const mockReq = {
      params: { id: booking.bk_bkid },
      user: { us_roid: 'ADM', us_usid: 'ADM001' }
    };
    
    let responseStatus = null;
    let responseData = null;
    
    const mockRes = {
      status: function(code) {
        responseStatus = code;
        console.log('Response status:', code);
        return this;
      },
      json: function(data) {
        responseData = data;
        console.log('Response data:', JSON.stringify(data, null, 2));
      }
    };
    
    console.log('Calling deleteBooking function...');
    await deleteBooking(mockReq, mockRes);
    
    console.log('Response status:', responseStatus);
    console.log('Response data:', responseData);
    
    // Verify the booking was deleted
    const deletedBooking = await BookingTVL.findByPk(booking.bk_bkid);
    if (!deletedBooking) {
      console.log('✅ Booking was successfully deleted');
    } else {
      console.log('❌ Booking still exists');
    }
    
  } catch (error) {
    console.error('Test error:', error.message);
    console.error('Error stack:', error.stack);
  }
}

testDirectAPI();