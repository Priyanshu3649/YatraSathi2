const { sequelizeTVL } = require('../../config/db');

async function removeDesignationField() {
  try {
    console.log('Removing designation field from emXemployee table...');
    
    // Remove designation field from emXemployee table
    await sequelizeTVL.query(`
      ALTER TABLE emXemployee 
      DROP COLUMN IF EXISTS em_designation
    `);
    
    console.log('Designation field removed from emXemployee table successfully!');
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  }
}

if (require.main === module) {
  removeDesignationField()
    .then(() => {
      console.log('Migration script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = removeDesignationField;