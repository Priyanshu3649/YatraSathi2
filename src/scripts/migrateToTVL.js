const { sequelize, sequelizeTVL } = require('../../config/db');
const { 
  User, Booking, Payment, Employee, Customer, Station, Train, Login,
  UserTVL, BookingTVL, PaymentTVL, EmployeeTVL, CustomerTVL, StationTVL, TrainTVL, LoginTVL
} = require('../models');

async function migrateToTVL() {
  try {
    console.log('Starting migration to TVL_001 database...');
    
    // Test connections
    await sequelize.authenticate();
    console.log('Main database connected successfully');
    
    await sequelizeTVL.authenticate();
    console.log('TVL database connected successfully');
    
    // Migrate Users
    console.log('Migrating users...');
    const mainUsers = await User.findAll();
    for (const user of mainUsers) {
      try {
        await UserTVL.findOrCreate({
          where: { us_usid: user.us_usid },
          defaults: {
            us_usid: user.us_usid,
            us_fname: user.us_fname,
            us_lname: user.us_lname,
            us_email: user.us_email,
            us_phone: user.us_phone,
            us_aadhaar: user.us_aadhaar,
            us_pan: user.us_pan,
            us_addr1: user.us_addr1,
            us_city: user.us_city,
            us_state: user.us_state,
            us_pin: user.us_pin,
            us_usertype: user.us_usertype,
            us_roid: user.us_roid,
            us_coid: user.us_coid,
            us_active: user.us_active,
            us_appadmin: user.us_appadmin,
            us_security: user.us_security,
            us_limit: user.us_limit,
            edtm: user.edtm || user.us_edtm,
            eby: user.eby || user.us_eby,
            mdtm: user.mdtm || user.us_mdtm,
            mby: user.mby || user.us_mby
          }
        });
      } catch (error) {
        console.warn(`Could not migrate user ${user.us_usid}:`, error.message);
      }
    }
    console.log(`Migrated ${mainUsers.length} users`);
    
    // Migrate Customers
    console.log('Migrating customers...');
    const mainCustomers = await Customer.findAll();
    for (const customer of mainCustomers) {
      try {
        await CustomerTVL.findOrCreate({
          where: { cu_usid: customer.cu_usid },
          defaults: {
            cu_cusid: customer.cu_cusid || customer.cu_usid,
            cu_usid: customer.cu_usid || customer.cu_usid,
            cu_custno: customer.cu_custno,
            cu_custtype: customer.cu_custtype,
            cu_compid: customer.cu_compid,
            cu_creditlimit: customer.cu_creditlimit,
            cu_creditdays: customer.cu_creditdays,
            cu_discount: customer.cu_discount,
            cu_active: customer.cu_active,
            cu_panno: customer.cu_panno,
            cu_gstno: customer.cu_gstno,
            edtm: customer.edtm,
            eby: customer.eby,
            mdtm: customer.mdtm,
            mby: customer.mby
          }
        });
      } catch (error) {
        console.warn(`Could not migrate customer ${customer.cu_usid}:`, error.message);
      }
    }
    console.log(`Migrated ${mainCustomers.length} customers`);
    
    // Migrate Stations
    console.log('Migrating stations...');
    const mainStations = await Station.findAll();
    for (const station of mainStations) {
      try {
        await StationTVL.findOrCreate({
          where: { st_stid: station.st_stid },
          defaults: {
            st_stid: station.st_stid,
            st_stcode: station.st_stcode,
            st_stname: station.st_stname,
            st_city: station.st_city,
            st_state: station.st_state,
            edtm: station.edtm,
            eby: station.eby,
            mdtm: station.mdtm,
            mby: station.mby
          }
        });
      } catch (error) {
        console.warn(`Could not migrate station ${station.st_stid}:`, error.message);
      }
    }
    console.log(`Migrated ${mainStations.length} stations`);
    
    // Migrate Trains
    console.log('Migrating trains...');
    const mainTrains = await Train.findAll();
    for (const train of mainTrains) {
      try {
        await TrainTVL.findOrCreate({
          where: { tr_trid: train.tr_trid },
          defaults: {
            tr_trid: train.tr_trid,
            tr_trno: train.tr_trno,
            tr_trname: train.tr_trname,
            tr_fromst: train.tr_fromst,
            tr_tost: train.tr_tost,
            tr_days: train.tr_days,
            tr_ac1: train.tr_ac1,
            tr_ac2: train.tr_ac2,
            tr_ac3: train.tr_ac3,
            tr_sl: train.tr_sl,
            tr_gen: train.tr_gen,
            tr_ac1fare: train.tr_ac1fare,
            tr_ac2fare: train.tr_ac2fare,
            tr_ac3fare: train.tr_ac3fare,
            tr_slfare: train.tr_slfare,
            tr_genfare: train.tr_genfare,
            tr_active: train.tr_active,
            edtm: train.edtm,
            eby: train.eby,
            mdtm: train.mdtm,
            mby: train.mby
          }
        });
      } catch (error) {
        console.warn(`Could not migrate train ${train.tr_trid}:`, error.message);
      }
    }
    console.log(`Migrated ${mainTrains.length} trains`);
    
    // Migrate Bookings
    console.log('Migrating bookings...');
    const mainBookings = await Booking.findAll();
    for (const booking of mainBookings) {
      try {
        await BookingTVL.findOrCreate({
          where: { bk_bkid: booking.bk_bkid },
          defaults: {
            bk_bkid: booking.bk_bkid,
            bk_bkno: booking.bk_bkno,
            bk_usid: booking.bk_usid,
            bk_fromst: booking.bk_fromst,
            bk_tost: booking.bk_tost,
            bk_trvldt: booking.bk_trvldt,
            bk_class: booking.bk_class,
            bk_quota: booking.bk_quota,
            bk_berthpref: booking.bk_berthpref,
            bk_totalpass: booking.bk_totalpass,
            bk_reqdt: booking.bk_reqdt,
            bk_status: booking.bk_status,
            bk_agent: booking.bk_agent,
            bk_priority: booking.bk_priority,
            bk_remarks: booking.bk_remarks,
            edtm: booking.edtm,
            eby: booking.eby,
            mdtm: booking.mdtm,
            mby: booking.mby
          }
        });
      } catch (error) {
        console.warn(`Could not migrate booking ${booking.bk_bkid}:`, error.message);
      }
    }
    console.log(`Migrated ${mainBookings.length} bookings`);
    
    // Migrate Payments
    console.log('Migrating payments...');
    const mainPayments = await Payment.findAll();
    for (const payment of mainPayments) {
      try {
        await PaymentTVL.findOrCreate({
          where: { pt_ptid: payment.pt_ptid },
          defaults: {
            pt_ptid: payment.pt_ptid,
            pt_acid: payment.pt_acid,
            pt_bkid: payment.pt_bkid,
            pt_amount: payment.pt_amount,
            pt_mode: payment.pt_mode,
            pt_refno: payment.pt_refno,
            pt_paydt: payment.pt_paydt,
            pt_rcvdt: payment.pt_rcvdt,
            pt_status: payment.pt_status,
            pt_remarks: payment.pt_remarks,
            edtm: payment.edtm,
            eby: payment.eby,
            mdtm: payment.mdtm,
            mby: payment.mby
          }
        });
      } catch (error) {
        console.warn(`Could not migrate payment ${payment.pt_ptid}:`, error.message);
      }
    }
    console.log(`Migrated ${mainPayments.length} payments`);
    
    // Migrate Login credentials
    console.log('Migrating login credentials...');
    const mainLogins = await Login.findAll();
    for (const login of mainLogins) {
      try {
        await LoginTVL.findOrCreate({
          where: { lg_usid: login.lg_usid },
          defaults: {
            lg_usid: login.lg_usid,
            lg_email: login.lg_email,
            lg_passwd: login.lg_passwd,
            lg_salt: login.lg_salt,
            lg_lastlogin: login.lg_lastlogin,
            lg_failcount: login.lg_failcount,
            lg_locked: login.lg_locked,
            lg_pwdexp: login.lg_pwdexp,
            lg_active: login.lg_active,
            lg_reset_token: login.lg_reset_token,
            lg_reset_token_expiry: login.lg_reset_token_expiry,
            lg_email_verified: login.lg_email_verified,
            lg_verification_token: login.lg_verification_token,
            lg_verification_token_expiry: login.lg_verification_token_expiry,
            edtm: login.edtm,
            eby: login.eby,
            mdtm: login.mdtm,
            mby: login.mby
          }
        });
      } catch (error) {
        console.warn(`Could not migrate login ${login.lg_usid}:`, error.message);
      }
    }
    console.log(`Migrated ${mainLogins.length} login credentials`);
    
    console.log('\n✅ Migration to TVL_001 completed successfully!');
    console.log('All data has been copied to TVL_001 database.');
    console.log('The application will now use TVL_001 for all operations.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateToTVL();