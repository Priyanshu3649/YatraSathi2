const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME_TVL || 'YATRASATHI_MASTER',
  process.env.DB_USER,
  process.env.DB_PASSWORD || '',
  { host: process.env.DB_HOST, port: parseInt(process.env.DB_PORT || '3306'), dialect: 'mysql', logging: false }
);

async function migrateAll() {
  const dbs = ['YATRASATHI_MASTER', 'TVL_2024_25', 'TVL_2025_26', 'TVL_2026_27'];
  for (const db of dbs) {
    console.log('\n--- Migrating', db, '---');
    try {
      await sequelize.query(`USE \`${db}\`;`);
      const q = "ALTER TABLE blXbilling ADD COLUMN cancellation_data JSON NULL;";
      await sequelize.query(q);
      console.log(`  [OK] ${q}`);
    } catch (e) {
      console.log(`Failed for db ${db}: ${e.message}`);
    }
  }
  process.exit();
}
migrateAll();
