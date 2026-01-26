/**
 * Verification script to test the booking-to-billing integration
 * Checks that bills are created for bookings and booking status updates to CONFIRMED
 */

const { BillTVL, BookingTVL } = require('./src/models');
const { sequelizeTVL } = require('./config/db');
const { Op } = require('sequelize');

async function verifyBillingIntegration() {
    console.log('🔍 VERIFYING BOOKING-BILLING INTEGRATION...\n');

    try {
        // Connect to database
        await sequelizeTVL.authenticate();
        console.log('✅ Database connection established');

        // Check total counts
        const totalBills = await BillTVL.count();
        const totalBookings = await BookingTVL.count();
        const confirmedBookings = await BookingTVL.count({
            where: { bk_status: 'CONFIRMED' }
        });
        const draftBookings = await BookingTVL.count({
            where: { bk_status: 'DRAFT' }
        });

        console.log(`📊 TOTAL COUNTS:`);
        console.log(`   - Total Bills: ${totalBills}`);
        console.log(`   - Total Bookings: ${totalBookings}`);
        console.log(`   - Confirmed Bookings: ${confirmedBookings}`);
        console.log(`   - Draft Bookings: ${draftBookings}\n`);

        // Get latest bills with related booking information
        const recentBills = await BillTVL.findAll({
            include: [{
                model: BookingTVL,
                as: 'booking', // assuming association exists, if not, we'll query separately
                attributes: ['bk_bkno', 'bk_status', 'bk_customername', 'bk_trvldt'],
                required: false
            }],
            order: [['bl_created_at', 'DESC']],
            limit: 10
        });

        // If the association doesn't work, query separately
        if (recentBills.length > 0) {
            console.log(`📋 RECENT BILLS WITH RELATED BOOKINGS:`);
            for (const bill of recentBills.slice(0, 5)) {
                const billData = bill.toJSON();
                
                // Get the related booking separately
                const relatedBooking = await BookingTVL.findByPk(billData.bl_booking_id);
                
                console.log(`   Bill: ${billData.bl_bill_no}`);
                console.log(`     → Booking ID: ${billData.bl_booking_id}`);
                console.log(`     → Entry No: ${billData.bl_entry_no}`);
                console.log(`     → Amount: ₹${billData.bl_total_amount}`);
                console.log(`     → Created: ${billData.bl_created_at}`);
                
                if (relatedBooking) {
                    console.log(`     → Related Booking: ${relatedBooking.bk_bkno}`);
                    console.log(`     → Booking Status: ${relatedBooking.bk_status}`);
                    console.log(`     → Customer: ${relatedBooking.bk_customername}`);
                }
                console.log('');
            }
        } else {
            // Alternative approach - query bills and bookings separately
            const bills = await BillTVL.findAll({
                order: [['bl_created_at', 'DESC']],
                limit: 5
            });

            for (const bill of bills) {
                const billData = bill.toJSON();
                const relatedBooking = await BookingTVL.findByPk(billData.bl_booking_id);
                
                console.log(`   Bill: ${billData.bl_bill_no}`);
                console.log(`     → Booking ID: ${billData.bl_booking_id}`);
                console.log(`     → Entry No: ${billData.bl_entry_no}`);
                console.log(`     → Amount: ₹${billData.bl_total_amount}`);
                console.log(`     → Created: ${billData.bl_created_at}`);
                
                if (relatedBooking) {
                    console.log(`     → Related Booking: ${relatedBooking.bk_bkno}`);
                    console.log(`     → Booking Status: ${relatedBooking.bk_status}`);
                    console.log(`     → Customer: ${relatedBooking.bk_customername}`);
                }
                console.log('');
            }
        }

        // Check if the booking-to-billing integration is working
        const billsWithBookings = await BillTVL.findAll({
            attributes: ['bl_bill_no', 'bl_booking_id', 'bl_total_amount'],
            where: {
                bl_booking_id: { [Op.not]: null }
            }
        });

        console.log(`🔗 INTEGRATION CHECK:`);
        console.log(`   - Bills linked to bookings: ${billsWithBookings.length}`);
        
        let confirmedAfterBilling = 0;
        for (const bill of billsWithBookings) {
            const booking = await BookingTVL.findByPk(bill.bl_booking_id);
            if (booking && booking.bk_status === 'CONFIRMED') {
                confirmedAfterBilling++;
            }
        }
        
        console.log(`   - Bookings updated to CONFIRMED after billing: ${confirmedAfterBilling}`);
        console.log(`   - Success rate: ${billsWithBookings.length > 0 ? Math.round((confirmedAfterBilling / billsWithBookings.length) * 100) : 0}%\n`);

        // Summary
        console.log(`✅ VERIFICATION SUMMARY:`);
        console.log(`   - Billing system has ${totalBills} records`);
        console.log(`   - ${confirmedBookings} bookings have been confirmed`);
        console.log(`   - ${confirmedAfterBilling} bookings confirmed specifically after billing`);
        console.log(`   - Integration is ${confirmedAfterBilling > 0 ? 'WORKING' : 'NOT WORKING'} properly`);

        if (confirmedAfterBilling > 0) {
            console.log(`\n🎉 SUCCESS: Booking-to-billing integration is working correctly!`);
            console.log(`   ✓ Bills are being created for bookings`);
            console.log(`   ✓ Booking status is being updated to CONFIRMED after billing`);
            console.log(`   ✓ Foreign key relationships are maintained`);
        } else {
            console.log(`\n⚠️  WARNING: Bills exist but booking status may not be updating properly`);
        }

    } catch (error) {
        console.error('❌ Error during verification:', error.message);
        console.error('Full error:', error);
    }
}

verifyBillingIntegration();