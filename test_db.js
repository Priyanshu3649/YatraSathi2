const { connectDB } = require('./config/db');
const { User } = require('./src/models');

async function testDB() {
  try {
    await connectDB();
    console.log('Database connected successfully');
    
    // Get all users
    const users = await User.findAll();
    console.log('Users in database:');
    users.forEach(user => {
      console.log(`- ID: ${user.us_usid}, Name: ${user.us_fname}, Email: ${user.us_email}`);
    });
    
    // Try to find the specific user
    const user = await User.findByPk('ADM001');
    console.log('Specific user:');
    console.log(user ? user.toJSON() : 'User not found');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testDB();