const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/controllers/bookingController.js');
let content = fs.readFileSync(filePath, 'utf8');

// Replace { transaction } with { transaction, userId: req.user?.us_usid || req.user?.id }
content = content.replace(/\{\s*transaction\s*\}/g, '{ transaction, userId: req.user?.us_usid || req.user?.id }');

fs.writeFileSync(filePath, content);
console.log('Fixed missing userId in bookingController.js');
