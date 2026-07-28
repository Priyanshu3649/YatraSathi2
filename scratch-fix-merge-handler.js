const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/Billing.jsx', 'utf8');

const old = `  const handleMergeBills = async () => {
    if (selectedBillIdsForMerge.length < 2) {
      alert('Please select at least 2 valid bills to merge by checking the checkboxes in the table.');
      return;
    }

    try {
      await billingAPI.mergeBills(selectedBillIdsForMerge);
      alert('Bills merged successfully');
      setSelectedBillIdsForMerge([]);
      setSelectedBill(null);
      fetchBills();
    } catch (error) {
      setError(error.message);
    }
  };`;

const newHandler = `  const handleMergeBills = async () => {
    if (selectedBillIdsForMerge.length < 2) {
      alert('Please select at least 2 bills to merge by checking the checkboxes in the table.');
      return;
    }

    // Validate same customer
    const selectedBillObjects = bills.filter(b => selectedBillIdsForMerge.includes(b.bl_id || b.id));
    const customerNames = [...new Set(selectedBillObjects.map(b => b.bl_customer_name || b.customerName).filter(Boolean))];
    if (customerNames.length > 1) {
      alert('All selected bills must belong to the same customer.');
      return;
    }

    const confirmed = window.confirm(
      \`Merge \${selectedBillIdsForMerge.length} selected bill(s) under a single Super Bill ID?\\n\\nNote: Individual bills will NOT be deleted — they will be grouped for combined printing.\`
    );
    if (!confirmed) return;

    try {
      const result = await billingAPI.mergeBills(selectedBillIdsForMerge);
      alert(\`Bills merged successfully!\\nSuper Bill ID: \${result.superBillId}\`);
      setSelectedBillIdsForMerge([]);
      setSelectedBill(null);
      fetchBills();
    } catch (error) {
      alert(error.message || 'Failed to merge bills');
    }
  };`;

if (code.includes(old)) {
  code = code.replace(old, newHandler);
  fs.writeFileSync('frontend/src/pages/Billing.jsx', code);
  console.log('handleMergeBills updated successfully');
} else {
  console.log('Pattern not found');
}
