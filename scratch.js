const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const path = require('path');
const { sequelizeTVL } = require('./config/db');
const BookingTVL = require('./src/models/BookingTVL');
const BillTVL = require('./src/models/BillTVL');

dotenv.config();

async function seed() {
  try {
    const db = 'TVL_2024_25';
    await sequelizeTVL.query(`USE \`${db}\`;`);
    
    console.log(`Starting to seed 1000 bookings and bills in ${db}...`);
    
    const bookings = [];
    const bills = [];
    
    for (let i = 0; i < 1000; i++) {
      const pnr = 'P' + Math.floor(Math.random() * 100000000);
      const customerName = 'Customer ' + i;
      const customerPhone = '99999' + String(i).padStart(5, '0');
      const amount = 1000 + Math.random() * 4000;
      const jDate = new Date();
      
      const bk_id = 1000000 + i; 
      
      bookings.push({
        bk_bkid: bk_id,
        bk_bkno: `BK-${100000 + i}`,
        bk_usid: 'CUS001',
        bk_customername: customerName,
        bk_phonenumber: customerPhone,
        bk_pnr: pnr,
        bk_trvldt: jDate,
        bk_fromst: 'MUMBAI',
        bk_tost: 'DELHI',
        bk_class: '3A',
        bk_status: 'CNF',
        eby: 1
      });
      
      bills.push({
        bl_booking_id: bk_id,
        bl_entry_no: `SEED-${Date.now()}-${i}`,
        bl_bill_no: `BILL-${100000 + i}`,
        bl_billing_date: new Date(),
        bl_journey_date: jDate,
        bl_customer_name: customerName,
        bl_customer_phone: customerPhone,
        bl_pnr: pnr,
        bl_total_amount: amount,
        bl_status: 'CNF',
        bl_is_merged: false,
        bl_is_split: false
      });
    }
    
    await BookingTVL.bulkCreate(bookings);
    console.log('Bookings seeded.');
    
    await BillTVL.bulkCreate(bills);
    console.log('Bills seeded.');
    
    console.log('Done!');
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    process.exit();
  }
}

seed();
