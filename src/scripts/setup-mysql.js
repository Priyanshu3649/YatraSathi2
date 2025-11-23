const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
const result = dotenv.config({ path: path.join(__dirname, '../../.env') });

if (result.error) {
  console.error('❌ Error loading .env file:', result.error);
  process.exit(1);
}

console.log('📋 Environment variables loaded:');
console.log('   DB_HOST:', process.env.DB_HOST || 'NOT SET');
console.log('   DB_USER:', process.env.DB_USER || 'NOT SET');
console.log('   DB_PASSWORD:', process.env.DB_PASSWORD ? '✅ SET' : '❌ NOT SET');
console.log('   DB_NAME:', process.env.DB_NAME || 'NOT SET');
console.log('');

async function setupMySQL() {
  let connection;
  
  try {
    console.log('🔧 Setting up MySQL database...\n');
    
    // Connect to MySQL server (without specifying database)
    console.log('📡 Connecting to MySQL server...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });
    console.log('✅ Connected to MySQL server\n');
    
    // Create database if it doesn't exist
    const dbName = process.env.DB_NAME || 'yatrasathi';
    console.log(`🗄️  Creating database: ${dbName}`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`✅ Database '${dbName}' is ready\n`);
    
    // Use the database
    await connection.query(`USE \`${dbName}\``);
    
    console.log('✅ MySQL setup completed successfully!\n');
    console.log('📝 Next steps:');
    console.log('   1. Run: npm run seed (to populate with sample data)');
    console.log('   2. Run: npm start (to start the server)\n');
    
  } catch (error) {
    console.error('❌ MySQL setup failed!');
    console.error('Error:', error.message);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n💡 Access denied. Please check:');
      console.error('   - DB_USER is correct in .env');
      console.error('   - DB_PASSWORD is correct in .env');
      console.error('   - MySQL user has CREATE DATABASE permission');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Cannot connect to MySQL. Please check:');
      console.error('   - MySQL server is running');
      console.error('   - DB_HOST is correct in .env (default: localhost)');
      console.error('   - MySQL is listening on port 3306');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run setup
setupMySQL();
