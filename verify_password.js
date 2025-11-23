const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();

// Connect to database
const db = new sqlite3.Database('./database.sqlite');

// Get admin password hash
db.get("SELECT lg_passwd FROM lgLogin WHERE lg_email = 'admin@example.com'", async (err, row) => {
  if (err) {
    console.error('Database error:', err);
    process.exit(1);
  }
  
  if (!row) {
    console.error('Admin user not found in lgLogin table');
    process.exit(1);
  }
  
  const storedHash = row.lg_passwd;
  const testPassword = 'admin123';
  
  console.log('Stored hash:', storedHash);
  console.log('Testing password:', testPassword);
  
  try {
    const isMatch = await bcrypt.compare(testPassword, storedHash);
    console.log('Password match:', isMatch);
    
    if (isMatch) {
      console.log('✅ Password verification successful!');
      console.log('The admin credentials are correct:');
      console.log('  Email: admin@example.com');
      console.log('  Password: admin123');
    } else {
      console.log('❌ Password verification failed!');
      console.log('The stored hash does not match the password "admin123"');
      console.log('You may need to reseed the database.');
    }
  } catch (error) {
    console.error('Bcrypt error:', error);
  }
  
  db.close();
});
