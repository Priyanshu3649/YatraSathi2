#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files to clean
const files = [
  'frontend/src/components/Payments/ReceiptForm.jsx',
  'frontend/src/components/Payments/ContraForm.jsx', 
  'frontend/src/components/Payments/JournalForm.jsx'
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Remove CSS content between the opening and closing style tags
  // This will remove everything from the first CSS rule to the media query end
  content = content.replace(/\s*\.\w[\s\S]*?@media[\s\S]*?}\s*}\s*/s, '\n');
  
  fs.writeFileSync(filePath, content);
  console.log(`Cleaned inline CSS from ${file}`);
});

console.log('Inline CSS removal completed.');