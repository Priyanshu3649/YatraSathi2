/**
 * Script to add verification status column to both ptPayment and ptXpayment tables
 * Run this script to add the pt_verification_status column if it doesn't exist
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');

// Create database connection - using main database first
const sequelizeMain = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: 'mysql',
  logging: console.log // Temporarily enable logging to see what happens
});

// Create database connection - using TVL database
const sequelizeTVL = new Sequelize('TVL_001', process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: 'mysql',
  logging: console.log // Temporarily enable logging to see what happens
});

async function addVerificationStatusColumnToTable(sequelize, dbName, tableName) {
  try {
    console.log(`Checking ${tableName} in ${dbName} database...`);
    await sequelize.authenticate();
    console.log(`Connected to ${dbName} database successfully.`);

    // Check if the column already exists
    const [results] = await sequelize.query(`SHOW COLUMNS FROM ${tableName} LIKE 'pt_verification_status'`);
    
    if (results.length > 0) {
      console.log(`${tableName}.pt_verification_status column already exists.`);
      return;
    }

    // Add the column
    console.log(`Adding pt_verification_status column to ${tableName} table...`);
    await sequelize.query(`
      ALTER TABLE ${tableName} 
      ADD COLUMN pt_verification_status VARCHAR(15) DEFAULT 'PENDING' COMMENT 'Verification Status: PENDING | VERIFIED | REJECTED'
    `);

    console.log(`${tableName}.pt_verification_status column added successfully!`);
    
    // Verify the column was added
    const [verifyResults] = await sequelize.query(`SHOW COLUMNS FROM ${tableName} LIKE 'pt_verification_status'`);
    if (verifyResults.length > 0) {
      console.log('Verification: Column exists in database:', verifyResults[0]);
    }

  } catch (error) {
    console.error(`Error adding verification status column to ${tableName}:`, error);
  }
}

async function addVerificationStatusColumn() {
  try {
    // Add to TVL table
    await addVerificationStatusColumnToTable(sequelizeTVL, 'TVL_001', 'ptXpayment');
    
    // Add to main table
    await addVerificationStatusColumnToTable(sequelizeMain, process.env.DB_NAME, 'ptPayment');
    
  } catch (error) {
    console.error('Error in main function:', error);
  } finally {
    await sequelizeMain.close();
    await sequelizeTVL.close();
  }
}

// Run the script
if (require.main === module) {
  addVerificationStatusColumn().catch(console.error);
}

module.exports = addVerificationStatusColumn;