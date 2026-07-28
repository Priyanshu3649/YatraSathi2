const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/Billing.jsx', 'utf8');

const old = `        <button className="erp-button" onClick={handleMergeBills} title="Merge Bills">Merge</button>`;
const newBtn = `        <button className="erp-button" onClick={handleMergeBills} title="Merge selected bills (select 2+ with checkboxes)" disabled={selectedBillIdsForMerge.length < 2} style={selectedBillIdsForMerge.length >= 2 ? { background: '#1565c0', color: '#fff' } : {}}>
          Merge{selectedBillIdsForMerge.length >= 2 ? \` (\${selectedBillIdsForMerge.length})\` : ''}
        </button>`;

if (code.includes(old)) {
  code = code.replace(old, newBtn);
  fs.writeFileSync('frontend/src/pages/Billing.jsx', code);
  console.log('Merge button updated');
} else {
  console.log('Not found, checking...');
  const idx = code.indexOf('handleMergeBills');
  console.log('handleMergeBills at index:', idx, 'context:', code.substring(idx - 50, idx + 100));
}
