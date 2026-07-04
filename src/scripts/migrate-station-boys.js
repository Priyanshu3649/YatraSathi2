/**
 * Migration Script: Station Boy Ledger System Tables
 * 
 * This script creates the new tables and alters the billing tables for the Station Boy Ledger.
 * Run this script using:
 * node src/scripts/migrate-station-boys.js
 */

const { sequelizeTVL: sequelize } = require('../../config/db');
const { QueryTypes } = require('sequelize');

async function migrateStationBoys() {
  try {
    console.log('🔄 Starting Station Boy database migration...\n');

    // 1. Create sbXstationBoy table
    console.log('📦 Creating sbXstationBoy table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS sbXstationBoy (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NULL UNIQUE,
        address TEXT NULL,
        status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
        created_by INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_by INT NULL,
        updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);
    console.log('✅ Table sbXstationBoy created or already exists');

    // 2. Create sbXsbpay table
    console.log('📦 Creating sbXsbpay table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS sbXsbpay (
        id INT AUTO_INCREMENT PRIMARY KEY,
        station_boy_id INT NOT NULL,
        payment_date DATE NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        payment_mode VARCHAR(50) NOT NULL,
        reference_number VARCHAR(100) NULL,
        remarks TEXT NULL,
        status ENUM('ACTIVE', 'CANCELLED', 'REVERSED') NOT NULL DEFAULT 'ACTIVE',
        created_by INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_by INT NULL,
        updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (station_boy_id) REFERENCES sbXstationBoy(id) ON DELETE RESTRICT
      ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);
    console.log('✅ Table sbXsbpay created or already exists');

    // 3. Alter blXbilling table to add Station Boy fields
    console.log('🛠️ Checking and altering blXbilling table columns...');
    
    // Check station_boy_id
    const [sbIdCol] = await sequelize.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'blXbilling' AND COLUMN_NAME = 'station_boy_id'
    `, { type: QueryTypes.SELECT });

    if (!sbIdCol) {
      console.log('➕ Adding station_boy_id to blXbilling...');
      await sequelize.query(`ALTER TABLE blXbilling ADD COLUMN station_boy_id INT NULL AFTER bl_sb_incentive`);
    }

    // Check station_boy_name_snapshot
    const [sbNameCol] = await sequelize.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'blXbilling' AND COLUMN_NAME = 'station_boy_name_snapshot'
    `, { type: QueryTypes.SELECT });

    if (!sbNameCol) {
      console.log('➕ Adding station_boy_name_snapshot to blXbilling...');
      await sequelize.query(`ALTER TABLE blXbilling ADD COLUMN station_boy_name_snapshot VARCHAR(150) NULL AFTER station_boy_id`);
    }

    // Check station_boy_incentive_amount
    const [sbIncentiveCol] = await sequelize.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'blXbilling' AND COLUMN_NAME = 'station_boy_incentive_amount'
    `, { type: QueryTypes.SELECT });

    if (!sbIncentiveCol) {
      console.log('➕ Adding station_boy_incentive_amount to blXbilling...');
      await sequelize.query(`ALTER TABLE blXbilling ADD COLUMN station_boy_incentive_amount DECIMAL(10,2) DEFAULT 0.00 AFTER station_boy_name_snapshot`);
    }

    console.log('✅ blXbilling columns verified');

    // 4. Alter billingMaster table to add Station Boy fields
    console.log('🛠️ Checking and altering billingMaster table columns...');
    
    // Check station_boy_id
    const [sbIdColMaster] = await sequelize.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'billingMaster' AND COLUMN_NAME = 'station_boy_id'
    `, { type: QueryTypes.SELECT });

    if (!sbIdColMaster) {
      console.log('➕ Adding station_boy_id to billingMaster...');
      await sequelize.query(`ALTER TABLE billingMaster ADD COLUMN station_boy_id INT NULL AFTER bl_sb_incentive`);
    }

    // Check station_boy_name_snapshot
    const [sbNameColMaster] = await sequelize.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'billingMaster' AND COLUMN_NAME = 'station_boy_name_snapshot'
    `, { type: QueryTypes.SELECT });

    if (!sbNameColMaster) {
      console.log('➕ Adding station_boy_name_snapshot to billingMaster...');
      await sequelize.query(`ALTER TABLE billingMaster ADD COLUMN station_boy_name_snapshot VARCHAR(150) NULL AFTER station_boy_id`);
    }

    // Check station_boy_incentive_amount
    const [sbIncentiveColMaster] = await sequelize.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'billingMaster' AND COLUMN_NAME = 'station_boy_incentive_amount'
    `, { type: QueryTypes.SELECT });

    if (!sbIncentiveColMaster) {
      console.log('➕ Adding station_boy_incentive_amount to billingMaster...');
      await sequelize.query(`ALTER TABLE billingMaster ADD COLUMN station_boy_incentive_amount DECIMAL(10,2) DEFAULT 0.00 AFTER station_boy_name_snapshot`);
    }

    console.log('✅ billingMaster columns verified');

    // 5. Seed default Active Station Boys if table is empty
    const [sbCount] = await sequelize.query(`SELECT COUNT(*) as count FROM sbXstationBoy`, { type: QueryTypes.SELECT });
    if (sbCount && sbCount.count === 0) {
      console.log('\n🌱 Seeding default Active Station Boys...');
      const defaultBoys = [
        { name: 'Ramesh', phone: '9999999991', address: 'Delhi Station' },
        { name: 'Suresh', phone: '9999999992', address: 'Mumbai Station' },
        { name: 'Mahesh', phone: '9999999993', address: 'Kolkata Station' },
        { name: 'Rajesh', phone: '9999999994', address: 'Chennai Station' },
        { name: 'Vijay', phone: '9999999995', address: 'Pune Station' },
        { name: 'Amit', phone: '9999999996', address: 'Bangalore Station' }
      ];

      for (const boy of defaultBoys) {
        await sequelize.query(
          `INSERT INTO sbXstationBoy (name, phone, address, status, created_by) VALUES (?, ?, ?, 'ACTIVE', 1)`,
          { replacements: [boy.name, boy.phone, boy.address] }
        );
      }
      console.log('✅ Seeded 6 active station boys successfully!');
    } else {
      console.log('ℹ️  Station Boy table is not empty, skipping seeding.');
    }

    console.log('\n🎉 Database migration completed successfully!');
  } catch (error) {
    console.error('\n❌ Migration failed!');
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

migrateStationBoys();
