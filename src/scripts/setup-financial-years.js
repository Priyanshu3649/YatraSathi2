const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || ''
};

const MASTER_DB = process.env.DB_NAME_TVL || 'TVL_001';

const MASTER_TABLES = [
  'apXapplication',
  'billingMaster',
  'ccCustContact',
  'cfConfig',
  'chart_of_accounts',
  'cmpXmasterpassenger',
  'coCompany',
  'cuCorporateCustomer',
  'cuXcustomer',
  'emXemployee',
  'fnXfunction',
  'fpXfuncperm',
  'mlXmasterlist',
  'moXmodule',
  'opXoperation',
  'rpRolePermission',
  'rtXreporttemplate',
  'sbXstationBoy',
  'service_charges',
  'service_charges_default',
  'stXstation',
  'tpTravelPlan',
  'trXtrain',
  'upXusrperm',
  'usXuser',
  'lgXlogin'
];

async function run() {
  let connection;
  try {
    console.log('📡 Connecting to MySQL server...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to MySQL server.');

    // 1. Ensure Master Database exists
    console.log(`🗄️ Creating Master Database: ${MASTER_DB} if not exists...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${MASTER_DB}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await connection.query(`USE \`${MASTER_DB}\``);

    // 2. Create financial_years table in Master Database
    console.log('Creating financial_years table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS financial_years (
        fy_id INT AUTO_INCREMENT PRIMARY KEY,
        fy_name VARCHAR(10) NOT NULL UNIQUE,
        fy_dbname VARCHAR(50) NOT NULL UNIQUE,
        fy_active TINYINT DEFAULT 1,
        fy_desc VARCHAR(100),
        edtm TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        eby VARCHAR(15) DEFAULT 'SYSTEM',
        mdtm TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        mby VARCHAR(15) DEFAULT 'SYSTEM'
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);

    // 3. Create user_financial_years permission table in Master Database
    console.log('Creating user_financial_years table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS user_financial_years (
        ufy_id INT AUTO_INCREMENT PRIMARY KEY,
        ufy_usid VARCHAR(15) NOT NULL,
        ufy_fyid INT NOT NULL,
        edtm TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        eby VARCHAR(15) DEFAULT 'SYSTEM',
        mdtm TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        mby VARCHAR(15) DEFAULT 'SYSTEM',
        FOREIGN KEY (ufy_fyid) REFERENCES financial_years(fy_id),
        UNIQUE KEY unique_user_fy (ufy_usid, ufy_fyid)
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);

    // 4. Seed default financial years
    console.log('Seeding default financial years...');
    const fys = [
      { name: '001', dbname: MASTER_DB, desc: 'Master Session 001' },
      { name: '2025-26', dbname: `${MASTER_DB}_2025-26`, desc: 'Financial Year 2025-2026' },
      { name: '2026-27', dbname: `${MASTER_DB}_2026-27`, desc: 'Financial Year 2026-2027' }
    ];

    for (const fy of fys) {
      await connection.query(`
        INSERT INTO financial_years (fy_name, fy_dbname, fy_desc)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE fy_dbname = VALUES(fy_dbname), fy_desc = VALUES(fy_desc)
      `, [fy.name, fy.dbname, fy.desc]);
    }

    // 5. Seed user permissions for these financial years
    console.log('Seeding user permissions for financial years...');
    
    // Get all users from the master database to map permissions
    const [users] = await connection.query('SELECT us_usid FROM usXuser');
    const [dbFys] = await connection.query('SELECT fy_id FROM financial_years');

    for (const user of users) {
      for (const fy of dbFys) {
        await connection.query(`
          INSERT INTO user_financial_years (ufy_usid, ufy_fyid)
          VALUES (?, ?)
          ON DUPLICATE KEY UPDATE ufy_fyid = ufy_fyid
        `, [user.us_usid, fy.fy_id]);
      }
    }

    // 6. Get all tables of the Master Database to clone
    const [tables] = await connection.query('SHOW TABLES');
    const tableNames = tables.map(row => Object.values(row)[0]).filter(name => name !== 'financial_years' && name !== 'user_financial_years');

    // 7. Clone database structure and master data for each financial year
    for (const fy of fys) {
      const targetDb = fy.dbname;
      
      // Skip setup/cloning if target is already the master DB
      if (targetDb.toLowerCase() === MASTER_DB.toLowerCase()) {
        console.log(`\n🗄️ Skipping database cloning for master database session: ${fy.name} (${targetDb})`);
        continue;
      }
      
      console.log(`\n🗄️ Setting up financial year database: ${targetDb}...`);

      // Create database
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${targetDb}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);

      // Clone table structure
      console.log(`Cloning table structures from ${MASTER_DB} to ${targetDb}...`);
      for (const table of tableNames) {
        await connection.query(`CREATE TABLE IF NOT EXISTS \`${targetDb}\`.\`${table}\` LIKE \`${MASTER_DB}\`.\`${table}\``);
      }

      // Copy data
      console.log(`Copying data to ${targetDb}...`);
      await connection.query(`USE \`${targetDb}\``);
      await connection.query('SET FOREIGN_KEY_CHECKS = 0');
      
      if (fy.name === '2025-26') {
        // Copy all table data for 2025-26
        console.log(`- Copying ALL data (master & transaction) for ${targetDb}...`);
        for (const table of tableNames) {
          await connection.query(`TRUNCATE TABLE \`${table}\``);
          await connection.query(`INSERT INTO \`${table}\` SELECT * FROM \`${MASTER_DB}\`.\`${table}\``);
        }
      } else {
        // Copy master data only for other years
        console.log(`- Copying master data only for ${targetDb}...`);
        for (const table of MASTER_TABLES) {
          await connection.query(`TRUNCATE TABLE \`${table}\``);
          await connection.query(`INSERT INTO \`${table}\` SELECT * FROM \`${MASTER_DB}\`.\`${table}\``);
        }
      }
      
      await connection.query('SET FOREIGN_KEY_CHECKS = 1');
      await connection.query(`USE \`${MASTER_DB}\``);
      console.log(`✅ Database ${targetDb} setup completed!`);
    }

    console.log('\n🎉 Financial year database selection system setup successfully completed!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

run();
