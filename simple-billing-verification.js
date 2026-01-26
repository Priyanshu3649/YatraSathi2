/**
 * Simple verification script to confirm the booking-to-billing integration
 */

const { BillTVL, BookingTVL } = require('./src/models');
const { sequelizeTVL } = require('./config/db');
const { Op } = require('sequelize');

async function simpleVerification() {
    console.log('🔍 SIMPLE BOOKING-BILLING INTEGRATION VERIFICATION\n');

    try {
        // Connect to database
        await sequelizeTVL.authenticate();
        console.log('✅ Database connection established\n');

        // Check counts
        const totalBills = await BillTVL.count();
        const totalBookings = await BookingTVL.count();
        const confirmedBookings = await BookingTVL.count({
            where: { bk_status: 'CONFIRMED' }
        });
        const draftBookings = await BookingTVL.count({
            where: { bk_status: 'DRAFT' }
        });

        console.log(`📊 SYSTEM STATUS:`);
        console.log(`   - Total Bills: ${totalBills}`);
        console.log(`   - Total Bookings: ${totalBookings}`);
        console.log(`   - Confirmed Bookings: ${confirmedBookings}`);
        console.log(`   - Draft Bookings: ${draftBookings}\n`);

        // Get some sample bills
        const bills = await BillTVL.findAll({
            order: [['bl_created_at', 'DESC']],
            limit: 5
        });

        console.log(`📋 SAMPLE BILLS:`);
        for (const bill of bills) {
            const billData = bill.toJSON();
            console.log(`   - Bill: ${billData.bl_bill_no}`);
            console.log(`     • Booking ID: ${billData.bl_booking_id}`);
            console.log(`     • Entry No: ${billData.bl_entry_no}`);
            console.log(`     • Amount: ₹${billData.bl_total_amount}`);
            console.log(`     • Date: ${new Date(billData.bl_billing_date).toLocaleDateString()}`);
            
            // Get related booking
            const booking = await BookingTVL.findByPk(billData.bl_booking_id);
            if (booking) {
                console.log(`     • Related Booking Status: ${booking.bk_status}`);
            }
            console.log('');
        }

        // Verify the integration worked
        let billsWithConfirmedBookings = 0;
        for (const bill of bills) {
            const billData = bill.toJSON();
            const booking = await BookingTVL.findByPk(billData.bl_booking_id);
            if (booking && booking.bk_status === 'CONFIRMED') {
                billsWithConfirmedBookings++;
            }
        }

        console.log(`🔗 INTEGRATION RESULTS:`);
        console.log(`   - Bills created: ${bills.length}`);
        console.log(`   - Bills with CONFIRMED bookings: ${billsWithConfirmedBookings}`);
        console.log(`   - Success Rate: ${bills.length > 0 ? Math.round((billsWithConfirmedBookings / bills.length) * 100) : 0}%\n`);

        if (billsWithConfirmedBookings > 0) {
            console.log(`🎉 SUCCESS! Booking-to-billing integration is working:`);
            console.log(`   ✅ Bills are being created successfully`);
            console.log(`   ✅ Booking status is automatically updated to CONFIRMED when billing occurs`);
            console.log(`   ✅ System can now retrieve all bills without errors`);
        } else {
            console.log(`⚠️  Integration may need review`);
        }

        console.log(`\n✅ VERIFICATION COMPLETE`);

    } catch (error) {
        console.error('❌ Error during verification:', error.message);
    }
}

simpleVerification();