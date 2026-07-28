const fs = require('fs');
let code = fs.readFileSync('frontend/src/services/api.js', 'utf8');

const mergePDFFunc = `
  // Generate a combined PDF for selected bills (READ-ONLY — no DB changes)
  mergeBillsPDF: async (billIds) => {
    const response = await fetch(\`\${API_BASE_URL}/billing/merge-pdf\`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ billIds })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to generate merged PDF');
    }

    // Return as blob for download/print
    return response.blob();
  },
`;

// Insert after mergeBills closing
const marker = `    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to merge bills');
    return data;
  },`;

if (code.includes(marker) && !code.includes('mergeBillsPDF')) {
  code = code.replace(marker, marker + mergePDFFunc);
  fs.writeFileSync('frontend/src/services/api.js', code);
  console.log('mergeBillsPDF added to api.js');
} else if (code.includes('mergeBillsPDF')) {
  console.log('Already patched');
} else {
  console.log('Marker not found');
}
