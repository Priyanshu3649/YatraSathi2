
const mysql = require('mysql2/promise');

console.log('=== Applying cmpXmasterpassenger Migration ===');

// Load environment variables
require('dotenv').config();

console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_USER:', process.env.DB_USER);

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  multipleStatements: true,
});

// List of financial year databases (from config/db.js financialYears)
const databases = [
  'TVL_2024_25',
  'TVL_2025_26',
  'TVL_2026_27'
];

// Columns to add, with their definitions
const columnsToAdd = [
  { name: 'cmp_dob', definition: 'DATE DEFAULT NULL AFTER `cmp_age`' },
  { name: 'cmp_nationality', definition: 'VARCHAR(50) DEFAULT NULL AFTER `cmp_dob`' },
  { name: 'cmp_phone', definition: 'VARCHAR(20) DEFAULT NULL AFTER `cmp_nationality`' },
  { name: 'cmp_email', definition: 'VARCHAR(100) DEFAULT NULL AFTER `cmp_phone`' },
  { name: 'cmp_last_booking_ref', definition: 'VARCHAR(50) DEFAULT NULL AFTER `cmp_email`' }
];

async function columnExists(connection, dbName, tableName, columnName) {
  const [rows] = await connection.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [dbName, tableName, columnName]
  );
  return rows.length > 0;
}

async function applyMigration(dbName) {
  console.log(`\nApplying migration to ${dbName}...`);
  const connection = await pool.getConnection();
  try {
    for (const col of columnsToAdd) {
      const exists = await columnExists(connection, dbName, 'cmpXmasterpassenger', col.name);
      if (exists) {
        console.log(`  Column ${col.name} already exists, skipping`);
        continue;
      }
      console.log(`  Adding column ${col.name}...`);
      await connection.query(
        `USE \`${dbName}\`; ALTER TABLE \`cmpXmasterpassenger\` ADD COLUMN \`${col.name}\` ${col.definition}`
      );
      console.log(`  ✅ Column ${col.name} added successfully`);
    }
    console.log(`✅ Migration complete for ${dbName}`);
  } catch (err) {
    console.error(`❌ Failed to apply migration to ${dbName}:`, err.message);
  } finally {
    connection.release();
  }
}

async function runMigrations() {
  for (const db of databases) {
    await applyMigration(db);
  }
  console.log('\n=== All migrations complete ===');
  process.exit(0);
}

runMigrations().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
