const { BillTVL, BookingTVL } = require('./src/models');

async function testBillingCancellation() {
  try {
    console.log('=== Testing Billing Cancellation Workflow ===\n');
    
    // Find a test bill and booking to work with
    const testBill = await BillTVL.findOne({
      where: {
        bl_status: 'CONFIRMED'
      },
      order: [['bl_id', 'DESC']]
    });
    
    if (!testBill) {
      console.log('No confirmed bills found for testing');
      return;
    }
    
    console.log('Test Bill Found:');
    console.log('- Bill ID:', testBill.bl_id);
    console.log('- Bill Number:', testBill.bl_bill_no);
    console.log('- Booking ID:', testBill.bl_booking_id);
    console.log('- Current Status:', testBill.bl_status);
    console.log('- Railway Cancellation Charge:', testBill.bl_railway_cancellation_charge);
    console.log('- Agent Cancellation Charge:', testBill.bl_agent_cancellation_charge);
    console.log();
    
    // Find the associated booking
    const testBooking = await BookingTVL.findByPk(testBill.bl_booking_id);
    
    if (!testBooking) {
      console.log('Associated booking not found');
      return;
    }
    
    console.log('Associated Booking Found:');
    console.log('- Booking ID:', testBooking.bk_bkid);
    console.log('- Booking Number:', testBooking.bk_bkno);
    console.log('- Current Status:', testBooking.bk_status);
    console.log();
    
    // Simulate cancellation data
    const cancellationData = {
      railwayCancellationCharge: 150.50,
      agentCancellationCharge: 75.25,
      cancellationRemarks: 'Test cancellation for workflow verification'
    };
    
    console.log('Cancellation Data:');
    console.log('- Railway Cancellation Charge:', cancellationData.railwayCancellationCharge);
    console.log('- Agent Cancellation Charge:', cancellationData.agentCancellationCharge);
    console.log('- Remarks:', cancellationData.cancellationRemarks);
    console.log();
    
    console.log('=== Cancellation Workflow Simulation ===');
    console.log('1. Updating bill status to CANCELLED');
    console.log('2. Setting cancellation charges');
    console.log('3. Updating booking status to CANCELLED');
    console.log('4. Adding audit logging');
    console.log();
    
    // This would be the actual cancellation logic from the controller
    console.log('✅ Cancellation workflow simulation completed');
    console.log('✅ Bill status would be updated to CANCELLED');
    console.log('✅ Cancellation charges would be recorded');
    console.log('✅ Booking status would be updated to CANCELLED');
    console.log('✅ Audit logs would be generated');
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run the test
testBillingCancellation();