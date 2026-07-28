const fs = require('fs');

let apiCode = fs.readFileSync('frontend/src/services/api.js', 'utf8');

// Replace splitBill
apiCode = apiCode.replace(/splitBill: async \(id, splitCount\) => \{[\s\S]*?\},/, 
`splitBill: async (id, splits) => {
    const response = await fetch(\`\${API_BASE_URL}/billing/\${id}/split\`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ splits })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to split bill');
    return data;
  },`);

// Add fetchBookingForBilling after mergeBills
const mergeBillsEndIdx = apiCode.indexOf('mergeBills: async (billIds) => {');
if (mergeBillsEndIdx > -1) {
  const nextFuncIdx = apiCode.indexOf(',', mergeBillsEndIdx + 100); // Find end of mergeBills
  if (nextFuncIdx > -1) {
    const newFunc = `\n
  fetchBookingForBilling: async (id) => {
    const response = await fetch(\`\${API_BASE_URL}/billing/fetch-booking/\${id}\`, {
      headers: getHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch booking');
    return data.data;
  },`;
    apiCode = apiCode.slice(0, nextFuncIdx + 1) + newFunc + apiCode.slice(nextFuncIdx + 1);
  }
}

fs.writeFileSync('frontend/src/services/api.js', apiCode);
