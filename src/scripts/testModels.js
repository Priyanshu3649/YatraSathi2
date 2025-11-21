const { connectDB } = require('../../config/db');
const { User, Role, Company } = require('../models');

async function testModels() {
  try {
    // Connect to database
    console.log('Attempting to connect to database...');
    await connectDB();
    console.log('Database connected successfully');

    // Test creating a company
    console.log('Creating test company...');
    const company = await Company.create({
      co_coid: 'TRV',
      co_coshort: 'TravelCorp',
      co_codesc: 'Travel Corporation Ltd',
      co_city: 'Mumbai',
      co_state: 'Maharashtra',
      eby: 'ADMIN',
      mby: 'ADMIN'
    });
    console.log('Company created:', company.toJSON());

    // Test creating a role
    console.log('Creating test role...');
    const role = await Role.create({
      ur_roid: 'ADM',
      ur_roshort: 'ADMIN',
      ur_rodesc: 'System Administrator',
      ur_dept: 'ADMIN',
      eby: 'SYSTEM',
      mby: 'SYSTEM'
    });
    console.log('Role created:', role.toJSON());

    // Test creating a user
    console.log('Creating test user...');
    const user = await User.create({
      us_usid: 'USR001',
      us_fname: 'John',
      us_lname: 'Doe',
      us_email: 'john.doe@example.com',
      us_phone: '9876543210',
      us_usertype: 'admin',
      us_roid: 'ADM',
      us_coid: 'TRV',
      eby: 'ADMIN',
      mby: 'ADMIN'
    });
    console.log('User created:', user.toJSON());

    console.log('All tests passed! Database setup is working correctly.');
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error.message);
    
    if (error.message.includes('Access denied')) {
      console.log('\n=== DATABASE CONNECTION ERROR ===');
      console.log('Please make sure:');
      console.log('1. MySQL is installed and running');
      console.log('2. You have created the database and user as described in SETUP_DATABASE.md');
      console.log('3. Your .env file has the correct database credentials');
      console.log('4. The database user has proper permissions');
    }
    
    process.exit(1);
  }
}

testModels();