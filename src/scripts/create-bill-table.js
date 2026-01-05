const { sequelizeTVL } = require('../../config/db');
const { BillTVL } = require('../models');

async function createBillTable() {
  try {
    console.log('Creating bills table...');
    
    // Sync the BillTVL model to create the table
    await BillTVL.sync({ force: false }); // Use force: false to avoid dropping existing data
    
    console.log('Bills table created successfully!');
    
    // Close the database connection
    await sequelizeTVL.close();
    console.log('Database connection closed.');
  } catch (error) {
    console.error('Error creating bills table:', error);
  }
}

// Run the function
createBillTable();