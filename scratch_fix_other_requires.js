const fs = require('fs');
const path = require('path');

const replacementMap = {
  "models/User": "models/UserTVL",
  "models/Login": "models/LoginTVL",
  "models/Employee": "models/EmployeeTVL",
  "models/Customer": "models/CustomerTVL",
  "models/Station": "models/StationTVL",
  "models/Train": "models/TrainTVL",
  "models/Account": "models/AccountTVL",
  "models/Payment": "models/PaymentTVL",
  "models/CustomerAdvance": "models/CustomerAdvanceTVL",
  "models/YearEndClosing": "models/YearEndClosingTVL"
};

function getFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== '.qoder' && file !== 'frontend') {
        getFiles(filePath, fileList);
      }
    } else {
      if (file.endsWith('.js')) {
        fileList.push(filePath);
      }
    }
  }
  return fileList;
}

const allJsFiles = [];
if (fs.existsSync('./src')) {
  getFiles('./src', allJsFiles);
}

console.log(`Scanning ${allJsFiles.length} files in src/ for legacy direct imports...`);

for (const filePath of allJsFiles) {
  // Skip models directory itself since we already handled it
  if (filePath.includes('src/models/')) {
    continue;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  for (const [target, replacement] of Object.entries(replacementMap)) {
    // We want to match requireStatements with models/User
    // To be precise, let's search for the target string
    if (content.includes(target)) {
      console.log(`Found legacy path '${target}' in ${filePath}, replacing with '${replacement}'...`);
      content = content.split(target).join(replacement);
      modified = true;
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated file: ${filePath}`);
  }
}

console.log('Scan and replacement complete.');
process.exit(0);
