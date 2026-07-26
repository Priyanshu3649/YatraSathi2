
console.log('=== Test Connection Script Started ===');
console.log('Current directory:', process.cwd());

console.log('\n1. Checking if config/db.js exists...');
const fs = require('fs');
const path = require('path');
const dbPath = path.join(__dirname, 'config/db.js');
console.log('dbPath:', dbPath);
console.log('exists:', fs.existsSync(dbPath));

console.log('\n2. Trying to require ./config/db.js...');

try {
  console.log('a. Requiring...');
  const db = require('./config/db');
  console.log('b. Loaded db.js');
  console.log('c. db keys:', Object.keys(db));
  
  console.log('\n3. Calling connectDB...');
  db.connectDB().then(() => {
    console.log('d. connectDB resolved');
  }).catch(err => {
    console.error('e. connectDB error:', err);
    console.error(err.stack);
    process.exit(1);
  });

} catch(e) {
  console.error('ERROR requiring config/db.js:', e);
  console.error(e.stack);
  process.exit(1);
}
