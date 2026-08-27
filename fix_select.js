const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'frontend/src/pages/Bookings.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace the passenger_berth e.target.select()
content = content.replace(
  /handleFieldFocus\('passenger_berth'\);\s*e\.target\.select\(\);\s*\}\}/g,
  "handleFieldFocus('passenger_berth');\n                            }}"
);

// Remove from passenger_gender as well just in case
content = content.replace(
  /handleFieldFocus\('passenger_gender'\);\s*e\.target\.select\(\);\s*\}\}/g,
  "handleFieldFocus('passenger_gender');\n                            }}"
);

fs.writeFileSync(filePath, content);
console.log('Fixed select() on non-text inputs in Bookings.jsx');
