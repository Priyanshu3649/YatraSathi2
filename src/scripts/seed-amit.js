require('dotenv').config({ path: '../.env' });
const { sequelizeTVL } = require('../../config/db');
const { QueryTypes } = require('sequelize');

const Booking = require('../models/Booking');
const BillingMaster = require('../models/BillingMaster');
const StationBoy = require('../models/StationBoy');

async function seedData() {
  console.log('Connecting to database...');
  try {
    // 1. Ensure Station Boy Amit exists
    let amit = await StationBoy.findOne({ where: { name: 'Amit' } });

    if (!amit) {
      console.log('Creating Station Boy "Amit"...');
      amit = await StationBoy.create({
        name: 'Amit',
        phone: '9876543210',
        address: 'Main Station',
        status: 'ACTIVE'
      }, { userId: 1 });
    } else {
      console.log('Found existing Station Boy Amit with ID:', amit.id);
    }

    // 2. Create 10 mock bookings and billings
    console.log('Generating 10 sample bookings and billings...');
    
    for (let i = 1; i <= 10; i++) {
      const pnr = `AMIT-TEST-${Math.floor(Math.random() * 100000)}`;
      const amount = Math.floor(Math.random() * 5000) + 1000;
      const incentive = Math.floor(amount * 0.1);

      // Insert Booking
      const booking = await Booking.create({
        bk_bkno: pnr,
        bk_usid: '1',
        bk_fromst: 'NDLS',
        bk_tost: 'BCT',
        bk_trvldt: new Date(),
        bk_class: 'SL',
        bk_status: 'CNF',
        bk_pnr: pnr
      }, { userId: 1 });

      // Insert Billing
      await BillingMaster.create({
        bl_entry_no: pnr,
        bl_booking_id: booking.bk_bkid,
        bl_booking_no: pnr,
        bl_billing_date: new Date(),
        bl_journey_date: new Date(),
        bl_customer_name: 'Test Customer',
        bl_customer_phone: '9999999999',
        bl_status: 'PAID',
        bl_total_amount: amount,
        station_boy_id: amit.id,
        bl_sb_incentive: incentive
      }, { userId: 1 });
      
      console.log(`Created Booking #${booking.bk_bkid} and linked Billing with ₹${incentive} incentive.`);
    }

    console.log('Successfully seeded 10 sample records for Amit!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedData();
