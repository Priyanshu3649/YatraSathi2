const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/Billing.jsx', 'utf8');

const oldBtn = `        <button className="erp-button" onClick={handleMergeBills} title="Merge selected bills (select 2+ with checkboxes)" disabled={selectedBillIdsForMerge.length < 2} style={selectedBillIdsForMerge.length >= 2 ? { background: '#1565c0', color: '#fff' } : {}}>
          Merge{selectedBillIdsForMerge.length >= 2 ? \` (\${selectedBillIdsForMerge.length})\` : ''}
        </button>`;

const newBtn = `        <button id="merge-pdf-btn" className="erp-button" onClick={handleMergeBills} title="Generate merged PDF for selected bills (select 2+ with checkboxes)" disabled={selectedBillIdsForMerge.length < 2} style={selectedBillIdsForMerge.length >= 2 ? { background: '#1565c0', color: '#fff' } : {}}>
          Merge PDF{selectedBillIdsForMerge.length >= 2 ? \` (\${selectedBillIdsForMerge.length})\` : ''}
        </button>`;

if (code.includes(oldBtn)) {
  code = code.replace(oldBtn, newBtn);
  fs.writeFileSync('frontend/src/pages/Billing.jsx', code);
  console.log('Merge button updated with id and PDF label');
} else {
  console.log('Pattern not found');
}
