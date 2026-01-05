const { Sequelize } = require('sequelize');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
const result = dotenv.config({ path: path.join(__dirname, '../.env') });

if (result.error) {
  console.error('Error loading .env file:', result.error);
} else {
  console.log('Environment variables loaded successfully');
}

// Validate required MySQL environment variables
if (!process.env.DB_NAME || !process.env.DB_HOST || !process.env.DB_USER) {
  console.error('❌ ERROR: MySQL configuration is incomplete!');
  console.error('Required environment variables:');
  console.error('  - DB_NAME:', process.env.DB_NAME || '❌ MISSING');
  console.error('  - DB_HOST:', process.env.DB_HOST || '❌ MISSING');
  console.error('  - DB_USER:', process.env.DB_USER || '❌ MISSING');
  console.error('  - DB_PASSWORD:', process.env.DB_PASSWORD ? '✅ SET' : '⚠️  NOT SET (optional)');
  console.error('\nPlease configure these variables in your .env file');
  process.exit(1);
}

// Create MySQL Sequelize instance for main database (yatrasathi)
console.log('🔧 Configuring MySQL database connections...');
console.log('  Main Database:', process.env.DB_NAME);
console.log('  TVL Database:', process.env.DB_NAME_TVL || 'TVL_001');
console.log('  Host:', process.env.DB_HOST);
console.log('  User:', process.env.DB_USER);
console.log('  Password:', process.env.DB_PASSWORD ? '✅ Configured' : '⚠️  Not set');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: false,
      freezeTableName: true
    }
  }
);

// Create separate connection for TVL_001 database (for roles and permissions)
const sequelizeTVL = new Sequelize(
  process.env.DB_NAME_TVL || 'TVL_001',
  process.env.DB_USER,
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: false,
      freezeTableName: true
    }
  }
);

// Test the connection and sync models
const connectDB = async () => {
  try {
    console.log('🔌 Connecting to MySQL databases...');
    await sequelize.authenticate();
    console.log('✅ Main database connected successfully!');
    console.log(`   Connected to: ${process.env.DB_NAME}@${process.env.DB_HOST}`);
    
    await sequelizeTVL.authenticate();
    console.log('✅ TVL database connected successfully!');
    console.log(`   Connected to: ${process.env.DB_NAME_TVL}@${process.env.DB_HOST}`);
    
    // Sync all models without altering existing tables
    // Use { alter: false } to prevent schema changes
    // Use { force: false } to prevent dropping tables
    console.log('🔄 Synchronizing database models...');
    try {
      await sequelize.sync({ alter: false, force: false });
      await sequelizeTVL.sync({ alter: false, force: false });
      console.log('✅ All models synchronized successfully!');
    } catch (syncError) {
      // If sync fails, it's usually because of index/constraint issues
      // This is OK if tables already exist - we'll just log a warning
      if (syncError.message.includes("doesn't exist") || syncError.message.includes("Key column")) {
        console.log('⚠️  Model sync warning (tables may need manual migration):', syncError.message);
        console.log('   This is usually OK if tables already exist. Continuing...');
      } else {
        throw syncError;
      }
    }
    
    return sequelize;
  } catch (error) {
    console.error('❌ Failed to connect to MySQL database!');
    console.error('Error details:', error.message);
    
    // Provide helpful error messages
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n💡 Access denied. Please check:');
      console.error('   - DB_USER is correct');
      console.error('   - DB_PASSWORD is correct');
      console.error('   - User has permissions for the database');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('\n💡 Database does not exist. Please:');
      console.error('   1. Create the database: CREATE DATABASE yatrasathi;');
      console.error('   2. Or run: npm run setup-mysql');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Cannot connect to MySQL server. Please check:');
      console.error('   - MySQL server is running');
      console.error('   - DB_HOST is correct (default: localhost)');
      console.error('   - MySQL is listening on port 3306');
    }
    
    console.error('\n🔧 To fix this:');
    console.error('   1. Check your .env file configuration');
    console.error('   2. Ensure MySQL server is running');
    console.error('   3. Create the database if it doesn\'t exist');
    console.error('   4. Run: npm run setup-mysql (to create database and seed data)');
    
    process.exit(1);
  }
};

module.exports = { sequelize, sequelizeTVL, connectDB };