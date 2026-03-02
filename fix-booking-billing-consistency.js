/**
 * Script to fix booking-billing inconsistency
 * 
 * Issues found:
 * 1. Confirmed bookings (114, 115, 136, 137) have NO corresponding bills
 * 2. These bookings have bk_billed flag set to 0
 * 3. Only 20% of confirmed bookings have bills
 * 
 * Solution: Reset status of confirmed bookings without bills back to DRAFT
 */

const { BookingTVL } = require('./src/models');
const { sequelizeTVL } = require('./config/db');

async function fixBookingBillingInconsistency() {
  console.log('🔧 Fixing booking-billing inconsistency...\n');

  try {
    await sequelizeTVL.authenticate();
    console.log('✅ Database connection successful.\n');

    // Get all confirmed bookings
    const confirmedBookings = await BookingTVL.findAll({
      where: { bk_status: 'CONFIRMED' }
    });

    console.log(`Found ${confirmedBookings.length} CONFIRMED bookings\n`);

    // Check each confirmed booking for corresponding bill
    let bookingsWithoutBills = [];
    
    for (const booking of confirmedBookings) {
      const { BillingMaster } = require('./src/models');
      const bill = await BillingMaster.findOne({
        where: { bl_booking_id: booking.bk_bkid }
      });
      
      if (!bill) {
        bookingsWithoutBills.push(booking);
        console.log(`❌ Booking ${booking.bk_bkid} (${booking.bk_bkno}) has NO bill! Status: ${booking.bk_status}, Billed: ${booking.bk_billed}`);
      } else {
        console.log(`✅ Booking ${booking.bk_bkid} (${booking.bk_bkno}) has bill: ${bill.bl_bill_no}`);
      }
    }

    console.log(`\n📊 Summary: ${bookingsWithoutBills.length} out of ${confirmedBookings.length} confirmed bookings have NO bills\n`);

    if (bookingsWithoutBills.length > 0) {
      console.log('⚠️  ACTION REQUIRED: Resetting status of problematic bookings back to DRAFT...\n');
      
      // Start a transaction
      const transaction = await sequelizeTVL.transaction();
      
      try {
        for (const booking of bookingsWithoutBills) {
          // Reset booking status to DRAFT
          await booking.update({
            bk_status: 'DRAFT',
            bk_billed: 0,
            mby: 'SYSTEM_FIX', // Mark as system fix
            mdtm: new Date()
          }, { transaction });
          
          console.log(`✅ Booking ${booking.bk_bkid} (${booking.bk_bkno}) status reset to DRAFT`);
        }
        
        // Commit the transaction
        await transaction.commit();
        
        console.log('\n✅ All problematic bookings have been reset to DRAFT status successfully!');
        console.log('💡 Users can now create bills for these bookings through the normal billing workflow.');
        
      } catch (error) {
        // Rollback on error
        await transaction.rollback();
        console.error('❌ Error during update:', error.message);
        throw error;
      }
    } else {
      console.log('✅ All confirmed bookings have corresponding bills. No action needed.');
    }

    // Final verification
    console.log('\n📈 FINAL VERIFICATION:');
    const finalConfirmedBookings = await BookingTVL.count({ where: { bk_status: 'CONFIRMED' }});
    const finalDraftBookings = await BookingTVL.count({ where: { bk_status: 'DRAFT' }});
    const totalBills = await require('./src/models').BillingMaster.count();
    
    console.log(`  - Confirmed bookings: ${finalConfirmedBookings}`);
    console.log(`  - Draft bookings: ${finalDraftBookings}`);
    console.log(`  - Total bills: ${totalBills}`);
    console.log(`  - Consistency ratio: ${finalConfirmedBookings > 0 ? ((totalBills / finalConfirmedBookings) * 100).toFixed(2) + '%' : 'N/A'}`);

  } catch (error) {
    console.error('❌ Error fixing booking-billing inconsistency:', error.message);
    console.error(error.stack);
  } finally {
    await sequelizeTVL.close();
  }
}

// Run the fix
fixBookingBillingInconsistency();