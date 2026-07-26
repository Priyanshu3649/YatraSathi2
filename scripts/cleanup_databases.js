const mysql = require('mysql2/promise');
require('dotenv').config();

const config = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || ''
};

const masterDbName = process.env.DB_NAME_TVL || 'TVL_001';

async function run() {
  let connection;
  try {
    console.log('Connecting to MySQL server...');
    connection = await mysql.createConnection(config);

    // 1. Drop all databases starting with TVL_ except TVL_001
    const [dbs] = await connection.query("SHOW DATABASES LIKE 'TVL_%'");
    console.log(`Found ${dbs.length} TVL databases.`);

    for (const dbObj of dbs) {
      const dbName = Object.values(dbObj)[0];
      if (dbName !== masterDbName) {
        console.log(`Dropping database: ${dbName}`);
        await connection.query(`DROP DATABASE \`${dbName}\``);
      }
    }

    // 2. Fetch financial years from TVL_001
    await connection.changeUser({ database: masterDbName });
    const [years] = await connection.query("SELECT * FROM financial_years WHERE is_active = 1");
    console.log(`Found ${years.length} active financial years.`);

    // Initialize sequelize so we can sync transactional models
    const { sequelize } = require('../config/db');

    for (const year of years) {
      const sessDbName = year.db_name;
      if (sessDbName === masterDbName) continue; // Skip if it's identical

      console.log(`Creating sessional database: ${sessDbName}`);
      await connection.query(`DROP DATABASE IF EXISTS \`${sessDbName}\``);
      await connection.query(`CREATE DATABASE \`${sessDbName}\``);

      // Now we want to sync the transactional models in this newly created database
      // Let's use mysqldump to copy the schema for the transactional tables from master DB
      console.log(`Syncing transactional tables for ${sessDbName} via mysqldump...`);
      const tablesToCopy = [
        'acXaccount', 'audit_forensic_log', 'billingMaster', 'bkXbooking',
        'blXbilling', 'caXcustomeradvance', 'ctXcontra', 'customer_ledger',
        'jeXjournal', 'lgLedger', 'paXpayalloc', 'payment_allocations',
        'pnXpnr', 'psXpassenger', 'ptXpayment', 'pyXpayment', 'rcXreceipt',
        'rtXreporttemplate', 'sbXsbpay', 'service_charges', 'service_charges_default',
        'tpTravelPlan', 'yeXyearendclosing'
      ];
      
      const { exec } = require('child_process');
      const util = require('util');
      const execAsync = util.promisify(exec);
      
      const dumpCmd = `MYSQL_PWD="${config.password}" mysqldump -u ${config.user} ${config.host !== '127.0.0.1' && config.host !== 'localhost' ? `-h ${config.host} -P ${config.port}` : ''} --no-data ${masterDbName} ${tablesToCopy.join(' ')}`;
      const importCmd = `MYSQL_PWD="${config.password}" mysql -u ${config.user} ${config.host !== '127.0.0.1' && config.host !== 'localhost' ? `-h ${config.host} -P ${config.port}` : ''} ${sessDbName}`;
      
      try {
        await execAsync(`${dumpCmd} | ${importCmd}`);
        console.log(`✅ Synced models for ${sessDbName}`);
      } catch (err) {
        console.error(`❌ Failed to sync models for ${sessDbName}:`, err.message);
      }
    }

    console.log('Database cleanup and recreation completed successfully!');
  } catch (err) {
    console.error('Error during cleanup:', err);
  } finally {
    if (connection) await connection.end();
    process.exit(0);
  }
}

run();
