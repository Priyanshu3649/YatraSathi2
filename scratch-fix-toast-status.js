const fs = require('fs');
let code = fs.readFileSync('src/controllers/billingController.js', 'utf8');
let frontCode = fs.readFileSync('frontend/src/pages/Billing.jsx', 'utf8');

// Fix 1: Backend - replace invalid 'Disabled' status with 'CAN' (the closest valid ENUM for disabled/split bills)
// and use bl_status instead of status
code = code.replace(
  `    parentBill.bl_is_split = true;\n    parentBill.status = 'Disabled'; \n    parentBill.is_deleted = 1;`,
  `    parentBill.bl_is_split = true;\n    parentBill.bl_status = 'CANCELLED';\n    parentBill.is_deleted = 1;`
);

// Also fix the deleteBillV2 usage
code = code.replace(
  `    bill.status = 'Disabled';\n    bill.is_deleted = 1;`,
  `    bill.bl_status = 'CANCELLED';\n    bill.is_deleted = 1;`
);

fs.writeFileSync('src/controllers/billingController.js', code);
console.log('Backend status fix applied');

// Fix 2: Frontend - replace all toast.success/toast.error with alert()
// in handleSplitBill handler only
frontCode = frontCode.replace(
  `      toast.success(\`Bill successfully split into \${count} parts\`);`,
  `      alert(\`Bill successfully split into \${count} parts\`);`
);
frontCode = frontCode.replace(
  `      toast.error(error.message || 'Failed to split bill');\n    }\n  };\n\n  const handleMergeBills`,
  `      alert(error.message || 'Failed to split bill');\n    }\n  };\n\n  const handleMergeBills`
);

// Fix all other injected toast calls (from the injected handlers block)
frontCode = frontCode.replace(/toast\.success\('Booking data fetched successfully'\)/g, "alert('Booking data fetched successfully')");
frontCode = frontCode.replace(/toast\.error\(error\.message \|\| 'Failed to fetch booking data'\)/g, "alert(error.message || 'Failed to fetch booking data')");
frontCode = frontCode.replace(/toast\.error\('Please enter a PNR number or Booking ID to fetch data'\)/g, "alert('Please enter a PNR number or Booking ID to fetch data')");
frontCode = frontCode.replace(/toast\.success\('Bill split successfully'\)/g, "alert('Bill split successfully')");
frontCode = frontCode.replace(/toast\.error\(error\.message \|\| 'Failed to split bill'\)/g, "alert(error.message || 'Failed to split bill')");
frontCode = frontCode.replace(/toast\.success\('Bill cancelled successfully'\)/g, "alert('Bill cancelled successfully')");
frontCode = frontCode.replace(/toast\.error\(error\.message \|\| 'Failed to cancel bill'\)/g, "alert(error.message || 'Failed to cancel bill')");
frontCode = frontCode.replace(/toast\.success\('Bill deleted successfully'\)/g, "alert('Bill deleted successfully')");
frontCode = frontCode.replace(/toast\.error\(error\.message \|\| 'Failed to delete bill'\)/g, "alert(error.message || 'Failed to delete bill')");

fs.writeFileSync('frontend/src/pages/Billing.jsx', frontCode);

// Count remaining toast usages
const remaining = (frontCode.match(/toast\./g) || []).length;
console.log(`Frontend toast fix applied. Remaining toast usages: ${remaining}`);
