const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const CONSTANT_TABLES = [
  'cuXcustomer',
  'emXemployee',
  'fnXfunction',
  'moXmodule',
  'apXapplication',
  'opXoperation',
  'rpRolePermission',
  'fpXfuncperm',
  'upXusrperm',
  'usXuser',
  'lgXlogin',
  'coCompany',
  'stXstation',
  'trXtrain',
  'cmpXmasterpassenger',
  'mlXmasterlist',
  'cuCorporateCustomer',
  'ccCustContact',
  'sbXstationBoy'
];

async function setupViews() {
  const MASTER_DB = process.env.DB_NAME_TVL || 'TVL_001';
  let connection;

  try {
    console.log('🔌 Connecting to MySQL...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    });

    console.log(`✅ Connected. Master database is: ${MASTER_DB}`);

    // 1. Get all active financial year databases from Master
    const [fyRows] = await connection.query(`SELECT db_name FROM \`${MASTER_DB}\`.financial_years WHERE is_active = 1`);
    
    if (fyRows.length === 0) {
      console.log('⚠️ No active financial year databases found.');
      process.exit(0);
    }

    // 2. Loop over each active FY database
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const row of fyRows) {
      const dbName = row.db_name;
      console.log(`\n🔄 Processing Financial Year Database: ${dbName}`);
      
      // Ensure DB exists
      const [dbExists] = await connection.query(`SHOW DATABASES LIKE '${dbName}'`);
      if (dbExists.length === 0) {
        console.log(`⚠️ Database ${dbName} does not exist. Skipping.`);
        continue;
      }

      // Process each constant table
      for (const table of CONSTANT_TABLES) {
        try {
          // Check if table/view exists in FY database
          const [tableStatus] = await connection.query(`SHOW TABLE STATUS FROM \`${dbName}\` LIKE '${table}'`);
          
          if (tableStatus.length > 0) {
            const isView = tableStatus[0].Comment === 'VIEW' || tableStatus[0].Engine === null;

            if (!isView) {
              console.log(`  📦 Physical table found: ${dbName}.${table}. Migrating data...`);
              
              // Ensure table exists in MASTER_DB
              await connection.query(`CREATE TABLE IF NOT EXISTS \`${MASTER_DB}\`.\`${table}\` LIKE \`${dbName}\`.\`${table}\``);
              
              // Migrate data using REPLACE INTO (overwrite master with newest changes)
              await connection.query(`REPLACE INTO \`${MASTER_DB}\`.\`${table}\` SELECT * FROM \`${dbName}\`.\`${table}\``);
              
              // Drop physical table
              await connection.query(`DROP TABLE \`${dbName}\`.\`${table}\``);
              console.log(`  ✅ Migrated data and dropped physical table: ${dbName}.${table}`);
            } else {
              // It's already a view, drop it so we can recreate it cleanly
              await connection.query(`DROP VIEW \`${dbName}\`.\`${table}\``);
            }
          }
          
          // Ensure table exists in MASTER_DB before creating view
          const [masterTableStatus] = await connection.query(`SHOW TABLES FROM \`${MASTER_DB}\` LIKE '${table}'`);
          if (masterTableStatus.length === 0) {
             console.log(`  ⚠️ Master table ${MASTER_DB}.${table} does not exist! Creating it...`);
             console.log(`  ⏭️ Skipping view creation for ${table} as it doesn't exist in master.`);
             continue;
          }

          // Create the view pointing to MASTER_DB
          await connection.query(`CREATE VIEW \`${dbName}\`.\`${table}\` AS SELECT * FROM \`${MASTER_DB}\`.\`${table}\``);
          console.log(`  👁️  Created View: ${dbName}.${table} -> ${MASTER_DB}.${table}`);
          
        } catch (err) {
          console.error(`  ❌ Error processing table ${table} in ${dbName}:`, err.message);
        }
      }
    }
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('\n🎉 Dual-Database View Routing successfully configured!');

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupViews();
