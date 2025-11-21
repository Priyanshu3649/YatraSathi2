const mysql = require('mysql2');

// Create a connection to the database
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'yatrasathi'
});

// Connect to the database
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err.stack);
    return;
  }
  console.log('Connected to the database as id', connection.threadId);
  
  // Create database if it doesn't exist
  connection.query('CREATE DATABASE IF NOT EXISTS yatrasathi', (error, results) => {
    if (error) {
      console.error('Error creating database:', error);
    } else {
      console.log('Database "yatrasathi" is ready');
    }
    
    // Close the connection
    connection.end();
  });
});