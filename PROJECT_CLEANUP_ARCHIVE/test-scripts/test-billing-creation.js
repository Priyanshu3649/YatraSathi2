const { BillTVL, BookingTVL } = require('./src/models');
const { sequelizeTVL } = require('./config/db');

async function testBillingCreation() {
  try {
    // Check if booking 117 exists
    const booking = await BookingTVL.findByPk(117);
    console.log('Booking 117 exists:', !!booking);
    if (booking) {
      console.log('Booking 117 status:', booking.bk_status);
      console.log('Booking 117 billed:', booking.bk_billed);
      console.log('Booking 117 journey date:', booking.bk_trvldt);
    }

    // Test creating a bill with minimal data
    const testData = {
      bl_entry_no: 'TEST_BILL_001',
      bl_bill_no: 'TEST_BILL_001',
      bl_booking_id: 117,
      bl_billing_date: new Date(),
      bl_journey_date: booking.bk_trvldt || new Date(), // Use booking journey date or current date
      bl_customer_name: 'Test Customer',
      bl_customer_phone: '1234567890',
      bl_total_amount: 1000.00,
      bl_created_by: 1
    };

    console.log('Attempting to create bill with data:', testData);

    const bill = await BillTVL.create(testData);
    console.log('Bill created successfully:', bill.toJSON());

    // Clean up
    await bill.destroy();
    console.log('Test bill cleaned up');

  } catch (error) {
    console.error('Error in test:', error.message);
    console.error('Error stack:', error.stack);
  } finally {
    await sequelizeTVL.close();
  }
}

testBillingCreation();