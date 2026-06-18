require('dotenv').config();
const { sequelizeTVL } = require('./config/db');

async function runMigration() {
  console.log('Starting Database Schema Maintenance and Constraints Updates...');
  
  // Steps to drop constraints safely (we wrap each in a try/catch)
  const dropConstraints = [
    {
      table: 'ptXpayment',
      constraint: 'ptxpayment_ibfk_1',
      sql: 'ALTER TABLE `ptXpayment` DROP FOREIGN KEY `ptxpayment_ibfk_1`'
    },
    {
      table: 'cuCorporateCustomer',
      constraint: 'cucorporatecustomer_ibfk_1',
      sql: 'ALTER TABLE `cuCorporateCustomer` DROP FOREIGN KEY `cucorporatecustomer_ibfk_1`'
    },
    {
      table: 'pnXpnr',
      constraint: 'pnxpnr_ibfk_2',
      sql: 'ALTER TABLE `pnXpnr` DROP FOREIGN KEY `pnxpnr_ibfk_2`'
    },
    {
      table: 'ssSession',
      constraint: 'sssession_ibfk_1',
      sql: 'ALTER TABLE `ssSession` DROP FOREIGN KEY `sssession_ibfk_1`'
    },
    {
      table: 'lgLedger',
      constraint: 'lgledger_ibfk_3',
      sql: 'ALTER TABLE `lgLedger` DROP FOREIGN KEY `lgledger_ibfk_3`'
    },
    {
      table: 'ctXcontra',
      constraint: 'ctxcontra_ibfk_1',
      sql: 'ALTER TABLE `ctXcontra` DROP FOREIGN KEY `ctxcontra_ibfk_1`'
    },
    {
      table: 'rcXreceipt',
      constraint: 'rcxreceipt_ibfk_1',
      sql: 'ALTER TABLE `rcXreceipt` DROP FOREIGN KEY `rcxreceipt_ibfk_1`'
    },
    {
      table: 'jeXjournal',
      constraint: 'jexjournal_ibfk_1',
      sql: 'ALTER TABLE `jeXjournal` DROP FOREIGN KEY `jexjournal_ibfk_1`'
    },
    {
      table: 'service_charges',
      constraint: 'service_charges_ibfk_1',
      sql: 'ALTER TABLE `service_charges` DROP FOREIGN KEY `service_charges_ibfk_1`'
    }
  ];

  // Disable FK checks
  try {
    await sequelizeTVL.query('SET FOREIGN_KEY_CHECKS = 0');
    console.log('Disabled foreign key checks.');
  } catch (e) {
    console.error('Failed to disable foreign key checks:', e.message);
  }

  // 1. Drop constraints
  for (const item of dropConstraints) {
    try {
      console.log(`Dropping FK constraint ${item.constraint} on table ${item.table}...`);
      await sequelizeTVL.query(item.sql);
      console.log(`Successfully dropped FK constraint ${item.constraint}.`);
    } catch (err) {
      console.warn(`⚠️ Warning: Could not drop FK ${item.constraint} on ${item.table} (maybe already dropped or mismatch): ${err.message}`);
    }
  }

  // 2. Drop legacy tables
  const tablesToDrop = [
    'acAccount', 'caCustomerAdvance', 'cuCustomer', 'emEmployee', 
    'lgLogin', 'pyXpayment', 'stStation', 'trTrain', 'usUser', 'yeYearEndClosing'
  ];
  for (const table of tablesToDrop) {
    try {
      console.log(`Dropping legacy table: ${table}...`);
      await sequelizeTVL.query(`DROP TABLE IF EXISTS \`${table}\``);
      console.log(`Successfully dropped table: ${table}.`);
    } catch (err) {
      console.error(`❌ Error dropping table ${table}: ${err.message}`);
    }
  }

  // 3. Create active TVL foreign key constraints
  const createConstraints = [
    {
      table: 'ptXpayment',
      constraint: 'ptxpayment_ibfk_1',
      sql: 'ALTER TABLE `ptXpayment` ADD CONSTRAINT `ptxpayment_ibfk_1` FOREIGN KEY (`pt_acid`) REFERENCES `acXaccount` (`ac_acid`)'
    },
    {
      table: 'cuCorporateCustomer',
      constraint: 'cucorporatecustomer_ibfk_1',
      sql: 'ALTER TABLE `cuCorporateCustomer` ADD CONSTRAINT `cucorporatecustomer_ibfk_1` FOREIGN KEY (`cu_usid`) REFERENCES `usXuser` (`us_usid`)'
    },
    {
      table: 'pnXpnr',
      constraint: 'pnxpnr_ibfk_2',
      sql: 'ALTER TABLE `pnXpnr` ADD CONSTRAINT `pnxpnr_ibfk_2` FOREIGN KEY (`pn_trid`) REFERENCES `trXtrain` (`tr_trid`)'
    },
    {
      table: 'ssSession',
      constraint: 'sssession_ibfk_1',
      sql: 'ALTER TABLE `ssSession` ADD CONSTRAINT `sssession_ibfk_1` FOREIGN KEY (`ss_usid`) REFERENCES `usXuser` (`us_usid`)'
    },
    {
      table: 'lgLedger',
      constraint: 'lgledger_ibfk_3',
      sql: 'ALTER TABLE `lgLedger` ADD CONSTRAINT `lgledger_ibfk_3` FOREIGN KEY (`lg_acid`) REFERENCES `acXaccount` (`ac_acid`)'
    },
    {
      table: 'ctXcontra',
      constraint: 'ctxcontra_ibfk_1',
      sql: 'ALTER TABLE `ctXcontra` ADD CONSTRAINT `ctxcontra_ibfk_1` FOREIGN KEY (`ct_created_by`) REFERENCES `usXuser` (`us_usid`)'
    },
    {
      table: 'rcXreceipt',
      constraint: 'rcxreceipt_ibfk_1',
      sql: 'ALTER TABLE `rcXreceipt` ADD CONSTRAINT `rcxreceipt_ibfk_1` FOREIGN KEY (`rc_created_by`) REFERENCES `usXuser` (`us_usid`)'
    },
    {
      table: 'jeXjournal',
      constraint: 'jexjournal_ibfk_1',
      sql: 'ALTER TABLE `jeXjournal` ADD CONSTRAINT `jexjournal_ibfk_1` FOREIGN KEY (`je_created_by`) REFERENCES `usXuser` (`us_usid`)'
    },
    {
      table: 'service_charges',
      constraint: 'service_charges_ibfk_1',
      sql: 'ALTER TABLE `service_charges` ADD CONSTRAINT `service_charges_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `cuXcustomer` (`cu_usid`)'
    }
  ];

  for (const item of createConstraints) {
    try {
      console.log(`Re-creating FK constraint ${item.constraint} on table ${item.table} referencing TVL table...`);
      await sequelizeTVL.query(item.sql);
      console.log(`Successfully created FK constraint ${item.constraint}.`);
    } catch (err) {
      console.error(`❌ Error creating FK ${item.constraint} on ${item.table}: ${err.message}`);
    }
  }

  // Enable FK checks
  try {
    await sequelizeTVL.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('Re-enabled foreign key checks.');
  } catch (e) {
    console.error('Failed to re-enable foreign key checks:', e.message);
  }

  console.log('Database Schema Maintenance completed.');
  process.exit(0);
}

runMigration().catch(err => {
  console.error('Migration Fatal Error:', err);
  process.exit(1);
});
