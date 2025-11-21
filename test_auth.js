const jwt = require('jsonwebtoken');
const { User } = require('./src/models');

// Generate a test token
const token = jwt.sign({ id: 'ADM001' }, process.env.JWT_SECRET || 'default_secret', {
  expiresIn: '30d'
});

console.log('Test token:', token);

const testAuth = async () => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
    console.log('Decoded token:', decoded);
    
    // Test the database lookup
    const user = await User.findByPk(decoded.id);
    console.log('User from database:', user ? user.toJSON() : 'User not found');
    
    if (user) {
      console.log('Auth successful');
    } else {
      console.log('Auth failed - user not found');
    }
  } catch (error) {
    console.error('Auth error:', error.message);
  }
};

testAuth();