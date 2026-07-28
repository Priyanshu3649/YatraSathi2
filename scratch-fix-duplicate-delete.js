const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/Billing.jsx', 'utf8');

// Replace the duplicate handleDeleteBill declaration with handleToolbarDelete
code = code.replace(
  'const handleDeleteBill = async () => {',
  'const handleToolbarDelete = async () => {'
);

// Update the toolbar button onClick to call handleToolbarDelete
// The toolbar button is:
// <button className="erp-button" onClick={handleDeleteBill} title="Delete Bill" disabled={!selectedBill || selectedBill.bl_status === 'CANCELLED'} style={{ background: '#d32f2f', color: '#fff' }}>Delete</button>

code = code.replace(
  '<button className="erp-button" onClick={handleDeleteBill} title="Delete Bill"',
  '<button className="erp-button" onClick={handleToolbarDelete} title="Delete Bill"'
);

fs.writeFileSync('frontend/src/pages/Billing.jsx', code);
console.log("Renamed handleDeleteBill to handleToolbarDelete");
