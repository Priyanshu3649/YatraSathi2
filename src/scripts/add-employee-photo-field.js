const { sequelizeTVL } = require('../../config/db');

async function addEmployeePhotoField() {
  try {
    console.log('Adding photo field to UserTVL table...');
    
    // Add photo field to usXuser table
    await sequelizeTVL.query(`
      ALTER TABLE usXuser 
      ADD COLUMN us_photo VARCHAR(255) DEFAULT NULL COMMENT 'Employee Photo Path'
    `);
    
    console.log('Photo field added to UserTVL table successfully!');
    
    // Add photo field to emXemployee table
    await sequelizeTVL.query(`
      ALTER TABLE emXemployee 
      ADD COLUMN em_photo VARCHAR(255) DEFAULT NULL COMMENT 'Employee Photo Path'
    `);
    
    console.log('Photo field added to EmployeeTVL table successfully!');
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  }
}

if (require.main === module) {
  addEmployeePhotoField()
    .then(() => {
      console.log('Migration script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = addEmployeePhotoField;