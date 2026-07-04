const { Sequelize } = require('sequelize');
const mysql = require('mysql2/promise');
const path = require('path');
const dotenv = require('dotenv');
const dbContext = require('../src/utils/dbContext');

const registerSwitchingHook = (sequelizeInstance) => {
  const defaultDb = sequelizeInstance.config.database || 'TVL_001';
  sequelizeInstance.addHook('afterPoolAcquire', async (connection, options) => {
    const targetDb = dbContext.getStore() || defaultDb;
    if (connection.__currentDb !== targetDb) {
      await new Promise((resolve, reject) => {
        connection.changeUser({ database: targetDb }, (err) => {
          if (err) {
            console.error(`Failed to change database to ${targetDb}:`, err.message);
            return reject(err);
          }
          connection.__currentDb = targetDb;
          resolve();
        });
      });
    }
  });
};


// Load environment variables from .env file (only in development)
if (process.env.NODE_ENV !== 'production') {
  const result = dotenv.config();

  if (result.error) {
    console.log('No .env file found (running in production or missing file)');
  } else {
    console.log('Environment variables loaded successfully');
  }
}

// Validate required MySQL environment variables
if (!process.env.DB_NAME_TVL || !process.env.DB_HOST || !process.env.DB_USER) {
  console.error('❌ ERROR: MySQL configuration is incomplete!');
  console.error('Required environment variables:');
  console.error('  - DB_NAME_TVL:', process.env.DB_NAME_TVL || '❌ MISSING');
  console.error('  - DB_HOST:', process.env.DB_HOST || '❌ MISSING');
  console.error('  - DB_USER:', process.env.DB_USER || '❌ MISSING');
  console.error('  - DB_PASSWORD:', process.env.DB_PASSWORD ? '✅ SET' : '⚠️  NOT SET (optional)');
  console.error('\nPlease configure these variables in your environment');
  process.exit(1);
}

// Create MySQL Sequelize instance for TVL database only (as per requirements)
console.log('🔧 Configuring MySQL database connections...');
console.log('  TVL Database:', process.env.DB_NAME_TVL || 'TVL_001');
console.log('  Host:', process.env.DB_HOST);
console.log('  Port:', process.env.DB_PORT || '3306');
console.log('  User:', process.env.DB_USER);
console.log('  Password:', process.env.DB_PASSWORD ? '✅ Configured' : '⚠️  Not set');

// Using TVL database for all operations as per requirements
const sequelize = new Sequelize(
  process.env.DB_NAME_TVL || 'TVL_001',
  process.env.DB_USER,
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 20, // Increased pool size for better concurrency
      min: 5,  // Maintain minimum connections
      acquire: 60000, // Increased timeout
      idle: 30000    // Longer idle time
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
    port: parseInt(process.env.DB_PORT || '3306'),
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 15, // Increased pool size for TVL connection
      min: 3,  // Maintain minimum connections
      acquire: 60000, // Increased timeout
      idle: 30000    // Longer idle time
    },
    define: {
      timestamps: false,
      freezeTableName: true
    }
  }
);

registerSwitchingHook(sequelize);
registerSwitchingHook(sequelizeTVL);

// Test the connection and sync models
const connectDB = async () => {
  try {
    console.log('🔌 Connecting to MySQL databases...');
    await sequelize.authenticate();
    console.log('✅ Main database connected successfully!');
    console.log(`   Connected to: ${process.env.DB_NAME_TVL}@${process.env.DB_HOST}`);

    await sequelizeTVL.authenticate();
    console.log('✅ TVL database connected successfully!');
    console.log(`   Connected to: ${process.env.DB_NAME_TVL}@${process.env.DB_HOST}`);

    // Skip sync for now since tables are already created by seed script
    console.log('🔄 Skipping model sync (tables already created by seed script)');
    console.log('✅ All models are ready!');

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

// Create MySQL connection pool for raw queries
const originalPool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME_TVL || 'TVL_001',
  waitForConnections: true,
  connectionLimit: 20,  // Increased for better performance
  queueLimit: 0
});

const mysqlPool = new Proxy(originalPool, {
  get(target, prop) {
    const defaultDb = process.env.DB_NAME_TVL || 'TVL_001';
    if (prop === 'execute' || prop === 'query') {
      return async function(sql, values) {
        const dbName = dbContext.getStore();
        if (dbName) {
          const connection = await target.getConnection();
          try {
            await connection.changeUser({ database: dbName });
            const result = await connection[prop](sql, values);
            return result;
          } finally {
            await connection.changeUser({ database: defaultDb });
            connection.release();
          }
        } else {
          return target[prop](sql, values);
        }
      };
    }
    
    if (prop === 'getConnection') {
      return async function() {
        const connection = await target.getConnection();
        const dbName = dbContext.getStore();
        if (dbName) {
          await connection.changeUser({ database: dbName });
        }
        
        const originalRelease = connection.release;
        connection.release = function() {
          connection.changeUser({ database: defaultDb })
            .then(() => {
              originalRelease.call(connection);
            })
            .catch((err) => {
              console.error('Failed to restore connection database on release:', err);
              originalRelease.call(connection);
            });
        };
        return connection;
      };
    }

    const value = target[prop];
    if (typeof value === 'function') {
      return value.bind(target);
    }
    return value;
  }
});

module.exports = { sequelize, sequelizeTVL, connectDB, mysqlPool };