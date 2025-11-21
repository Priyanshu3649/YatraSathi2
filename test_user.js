const { connectDB } = require('./config/db');
const { User } = require('./src/models');

async function testUser() {
  try {
    await connectDB();
    console.log('Database connected successfully');
    
    // Try to find the specific user
    const user = await User.findByPk('ADM001');
    console.log('User found:', user ? user.toJSON() : 'User not found');
    
    // Try with a different approach
    const user2 = await User.findOne({ where: { us_usid: 'ADM001' } });
    console.log('User found with findOne:', user2 ? user2.toJSON() : 'User not found');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testUser();