const User = require('./src/models/User');
const { connectDB } = require('./config/db');

async function testUsers() {
  try {
    await connectDB();
    
    console.log('Checking users in main database...\n');
    const users = await User.findAll({ raw: true });
    console.log(`Found ${users.length} users`);
    
    if (users.length > 0) {
      console.log('\nUsers:');
      users.forEach(user => {
        console.log(`- ${user.us_email} (ID: ${user.us_usid}, Type: ${user.us_usertype})`);
      });
    } else {
      console.log('\n⚠️  No users found in main database!');
      console.log('You need to create a user first.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testUsers();
