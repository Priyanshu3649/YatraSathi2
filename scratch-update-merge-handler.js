const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/Billing.jsx', 'utf8');

const oldHandler = `  const handleMergeBills = async () => {
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

const newHandler = `  const handleMergeBills = async () => {
    if (selectedBillIdsForMerge.length < 1) {
      alert('Please select at least 2 bills to merge by checking the checkboxes in the table.');
      return;
    }
    if (selectedBillIdsForMerge.length < 2) {
      alert('Please select at least 2 bills to generate a merged PDF.');
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
      \`Generate a combined PDF for \${selectedBillIdsForMerge.length} selected bill(s)?\\n\\nNote: No bills will be modified — this generates a merged printable document only.\`
    );
    if (!confirmed) return;

    try {
      // Show loading state
      const btn = document.getElementById('merge-pdf-btn');
      if (btn) btn.textContent = 'Generating PDF...';

      const blob = await billingAPI.mergeBillsPDF(selectedBillIdsForMerge);
      
      // Create download link and open PDF
      const url = URL.createObjectURL(blob);
      const timestamp = new Date().toISOString().slice(0, 10);
      const link = document.createElement('a');
      link.href = url;
      link.download = \`Merged_Bills_\${timestamp}_\${selectedBillIdsForMerge.length}bills.pdf\`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Also open in new tab for immediate viewing
      window.open(url, '_blank');
      
      // Cleanup URL after delay
      setTimeout(() => URL.revokeObjectURL(url), 5000);

      setSelectedBillIdsForMerge([]);
    } catch (error) {
      alert(error.message || 'Failed to generate merged PDF');
    } finally {
      const btn = document.getElementById('merge-pdf-btn');
      if (btn) btn.textContent = 'Merge PDF';
    }
  };`;

if (code.includes(oldHandler)) {
  code = code.replace(oldHandler, newHandler);
  fs.writeFileSync('frontend/src/pages/Billing.jsx', code);
  console.log('handleMergeBills updated to generate PDF');
} else {
  console.log('Handler pattern not found - checking...');
  const idx = code.indexOf('handleMergeBills');
  console.log('Found at index:', idx, 'context:', code.substring(idx, idx + 200));
}
