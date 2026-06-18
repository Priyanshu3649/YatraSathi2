const fs = require('fs');
const path = require('path');

const replacementMap = {
  "require('./User')": "require('./UserTVL')",
  "require('./Login')": "require('./LoginTVL')",
  "require('./Employee')": "require('./EmployeeTVL')",
  "require('./Customer')": "require('./CustomerTVL')",
  "require('./Station')": "require('./StationTVL')",
  "require('./Train')": "require('./TrainTVL')",
  "require('./Account')": "require('./AccountTVL')",
  "require('./Payment')": "require('./PaymentTVL')",
  "require('./CustomerAdvance')": "require('./CustomerAdvanceTVL')",
  "require('./YearEndClosing')": "require('./YearEndClosingTVL')",
  
  "require(\"./User\")": "require(\"./UserTVL\")",
  "require(\"./Login\")": "require(\"./LoginTVL\")",
  "require(\"./Employee\")": "require(\"./EmployeeTVL\")",
  "require(\"./Customer\")": "require(\"./CustomerTVL\")",
  "require(\"./Station\")": "require(\"./StationTVL\")",
  "require(\"./Train\")": "require(\"./TrainTVL\")",
  "require(\"./Account\")": "require(\"./AccountTVL\")",
  "require(\"./Payment\")": "require(\"./PaymentTVL\")",
  "require(\"./CustomerAdvance\")": "require(\"./CustomerAdvanceTVL\")",
  "require(\"./YearEndClosing\")": "require(\"./YearEndClosingTVL\")"
};

const modelsDir = './src/models';

if (fs.existsSync(modelsDir)) {
  const files = fs.readdirSync(modelsDir);
  for (const file of files) {
    if (file.endsWith('.js') && file !== 'index.js') {
      const filePath = path.join(modelsDir, file);
      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;
      
      for (const [target, replacement] of Object.entries(replacementMap)) {
        if (content.includes(target)) {
          console.log(`Replacing ${target} with ${replacement} in ${file}...`);
          // Use replaceAll (or regex helper)
          content = content.split(target).join(replacement);
          modified = true;
        }
      }
      
      if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated file: ${filePath}`);
      }
    }
  }
} else {
  console.error('Models directory not found.');
}
process.exit(0);
