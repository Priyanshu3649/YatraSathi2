const fs = require('fs');
const path = require('path');

const forms = ['PaymentForm.jsx', 'ReceiptForm.jsx', 'ContraForm.jsx', 'JournalForm.jsx'];

forms.forEach(form => {
  const filePath = path.join(__dirname, 'frontend/src/components/Payments', form);
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // Add th for Proof
  content = content.replace(
    /<th style=\{\{ width: '90px' \}\}>History<\/th>/g,
    "<th style={{ width: '90px' }}>History</th>\n                    <th style={{ width: '60px' }}>Proof</th>"
  );

  // Add td for Proof filter row
  content = content.replace(
    /<td><\/td>\s*<\/tr>/g,
    "<td></td>\n                    <td></td>\n                  </tr>"
  );

  // Add td for Proof in data row
  content = content.replace(
    /(<AuditHistoryButton[^>]+recordId=\{[^\}]+\}[^>]+label="History"[^>]*\/>\s*\n\s*\}\)\s*\n\s*<\/td>)/g,
    `$1\n                        <td onClick={(e) => e.stopPropagation()}>\n                          {r.attachment_path && (\n                            <a href={r.attachment_path} target="_blank" rel="noopener noreferrer" title="View Proof" style={{ fontSize: "16px", textDecoration: "none" }}>\n                              🖼️\n                            </a>\n                          )}\n                        </td>`
  );

  fs.writeFileSync(filePath, content);
  console.log(`Updated tables in ${form}`);
});
