const fs = require('fs');
const path = require('path');

const forms = ['ReceiptForm.jsx', 'ContraForm.jsx', 'JournalForm.jsx'];

forms.forEach(form => {
  const filePath = path.join(__dirname, 'frontend/src/components/Payments', form);
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // Match <div className="erp-form-group"> ... <label ...>Ref Number</label> ... </div>
  // Because we want to stop at the first </div>, we use [\s\S]*?<\/div>
  const refNumRegex = /<div className="erp-form-group">\s*<label className="erp-form-label">Ref Number<\/label>[\s\S]*?<\/div>/g;
  content = content.replace(refNumRegex, '');

  fs.writeFileSync(filePath, content);
  console.log(`Updated ${form}`);
});
