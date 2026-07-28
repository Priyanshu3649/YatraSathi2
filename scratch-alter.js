require('dotenv').config();
const { sequelizeTVL } = require('./config/db');

async function alterTable() {
  try {
    console.log("Adding pn_api_request_count...");
    await sequelizeTVL.query(`
      ALTER TABLE pnXpnr 
      ADD COLUMN pn_api_request_count INT DEFAULT 0
    `);
    console.log("Added pn_api_request_count successfully.");
  } catch (err) {
    if (err.message.includes('Duplicate column')) {
      console.log("Column pn_api_request_count already exists.");
    } else {
      console.error(err);
    }
  }

  try {
    console.log("Adding pn_departure_time...");
    await sequelizeTVL.query(`
      ALTER TABLE pnXpnr 
      ADD COLUMN pn_departure_time DATETIME NULL
    `);
    console.log("Added pn_departure_time successfully.");
  } catch (err) {
    if (err.message.includes('Duplicate column')) {
      console.log("Column pn_departure_time already exists.");
    } else {
      console.error(err);
    }
  }

  process.exit(0);
}

alterTable();
