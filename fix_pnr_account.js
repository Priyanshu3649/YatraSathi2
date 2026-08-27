const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'src/controllers/bookingController.js');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  /eby: req.user.us_usid,\s*mby: req.user.us_usid\s*\}\);/g,
  'eby: req.user.us_usid,\n      mby: req.user.us_usid\n    }, { userId: req.user?.us_usid || req.user?.id });'
);

fs.writeFileSync(filePath, content);
console.log('Fixed missing userId for Pnr, Account, BillingMaster');
