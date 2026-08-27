const fs = require('fs');
const path = require('path');

const forms = ['PaymentForm.jsx', 'ReceiptForm.jsx', 'ContraForm.jsx', 'JournalForm.jsx'];
const prefixMap = {
  'PaymentForm.jsx': 'py_ref_number',
  'ReceiptForm.jsx': 'rc_ref_number',
  'ContraForm.jsx': 'co_ref_number',
  'JournalForm.jsx': 'jl_ref_number'
};

forms.forEach(form => {
  const filePath = path.join(__dirname, 'frontend/src/components/Payments', form);
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping ${form}`);
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');

  const refNumProp = prefixMap[form];

  // 1. Remove the entire "Ref Number" erp-form-group block
  const refNumRegex = /<div className="erp-form-group">\s*<label className="erp-form-label">Ref Number<\/label>\s*<input[^>]+name="ref_number"[^>]+>\s*<\/div>/g;
  content = content.replace(refNumRegex, '');

  // 2. Map payload.append('py_ref_number', formData.ref_number) to use formData.utr_number
  const payloadRegex = new RegExp(`payload\\.append\\('${refNumProp}',\\s*formData\\.ref_number\\);`, 'g');
  content = content.replace(payloadRegex, `payload.append('${refNumProp}', formData.utr_number);`);

  fs.writeFileSync(filePath, content);
  console.log(`Updated ${form}`);
});
