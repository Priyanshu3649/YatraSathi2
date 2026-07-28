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
      
      const alterQueries = [
        "ALTER TABLE blXbilling ADD COLUMN super_bill_id BIGINT NULL;",
        "ALTER TABLE blXbilling ADD COLUMN bl_special_id VARCHAR(100) NULL;",
        "ALTER TABLE blXbilling ADD COLUMN is_deleted TINYINT(1) DEFAULT 0;"
      ];
      
      for (let q of alterQueries) {
        try {
          await sequelize.query(q);
          console.log(`  [OK] ${q}`);
        } catch(e) {
          console.log(`  [SKIP] ${q.substring(0, 30)}... (${e.message})`);
        }
      }
      
      try {
        await sequelize.query("UPDATE blXbilling SET bl_sub_bill_no = CONCAT(bl_bill_no, '-A') WHERE (bl_sub_bill_no IS NULL OR bl_sub_bill_no = '') AND bl_bill_no IS NOT NULL;");
        console.log(`  [OK] Updated bl_sub_bill_no for existing bills`);
      } catch (e) {
        console.log(`  [ERR] Failed to update bl_sub_bill_no:`, e.message);
      }
      
    } catch (e) {
      console.log(`Failed for db ${db}: ${e.message}`);
    }
  }
  process.exit();
}
migrateAll();
