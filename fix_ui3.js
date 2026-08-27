const fs = require('fs');
const path = require('path');

const forms = [
  { name: 'PaymentForm.jsx', id: 'payment' },
  { name: 'ReceiptForm.jsx', id: 'receipt' },
  { name: 'ContraForm.jsx', id: 'contra' },
  { name: 'JournalForm.jsx', id: 'journal' }
];

forms.forEach(form => {
  const filePath = path.join(__dirname, 'frontend/src/components/Payments', form.name);
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  const startStr = '<div className="erp-form-section">';
  const endStr = '{/* Audit Section */}';

  const startIdx = content.indexOf(startStr);
  const endIdx = content.indexOf(endStr);

  if (startIdx === -1 || endIdx === -1) {
    console.log(`Could not find boundaries for ${form.name}`);
    return;
  }

  let voucherOptions = "";
  if (form.name === 'PaymentForm.jsx') {
    voucherOptions = '<option value="Debit">Debit (Payment Out)</option>\n                    <option value="Credit">Credit (Refund In)</option>';
  } else if (form.name === 'ReceiptForm.jsx') {
    voucherOptions = '<option value="Credit">Credit (Receipt In)</option>\n                    <option value="Debit">Debit (Refund Out)</option>';
  } else if (form.name === 'ContraForm.jsx') {
    voucherOptions = '<option value="Contra">Contra (Bank/Cash Transfer)</option>';
  } else {
    voucherOptions = '<option value="Journal">Journal (Adjustment)</option>';
  }

  const replacement = `<div className="erp-form-section">
              <div className="erp-form-row-compact-3">
                <div className="erp-form-group">
                  <label className="erp-form-label">Receipt No</label>
                  <input type="text" className="erp-input" value={formData.receipt_no} readOnly tabIndex="-1" />
                </div>
                <div className="erp-form-group">
                  <label className="erp-form-label">Date</label>
                  <input 
                    type="date" 
                    name="date"
                    className="erp-input" 
                    value={formData.date} 
                    onChange={handleInputChange} 
                    onFocus={() => handleManualFocus('${form.id}', 'date')}
                    disabled={!isEditing}
                  />
                </div>
                <div className="erp-form-group">
                  <label className="erp-form-label">Voucher Type</label>
                  <select 
                    name="type"
                    className="erp-input" 
                    value={formData.type} 
                    onChange={handleInputChange}
                    onFocus={() => handleManualFocus('${form.id}', 'type')}
                    disabled={!isEditing}
                  >
                    ${voucherOptions}
                  </select>
                </div>
              </div>

              <div className="erp-form-row-compact-2" style={{ marginTop: '10px' }}>
                <div className="erp-form-group">
                  <label className="erp-form-label required">Customer / Payee</label>
                  <input 
                    type="text" 
                    name="customer_name"
                    className="erp-input" 
                    value={formData.customer_name} 
                    onChange={handleInputChange} 
                    placeholder="Search or enter name" 
                    onFocus={() => handleManualFocus('${form.id}', 'customer_name')}
                    disabled={!isEditing || (typeof autoFillReadOnly !== 'undefined' && autoFillReadOnly)}
                  />
                </div>
                <div className="erp-form-group">
                  <label className="erp-form-label">Phone Number</label>
                  <input 
                    type="text" 
                    name="customer_phone"
                    className="erp-input" 
                    value={formData.customer_phone} 
                    onChange={handleInputChange} 
                    onFocus={() => handleManualFocus('${form.id}', 'customer_phone')}
                    disabled={!isEditing || (typeof autoFillReadOnly !== 'undefined' && autoFillReadOnly)}
                  />
                </div>
              </div>

              <div className="erp-form-row-compact-4" style={{ marginTop: '10px' }}>
                <div className="erp-form-group">
                  <label className="erp-form-label required">Account</label>
                  <select 
                    name="account_name"
                    className="erp-input" 
                    value={formData.account_name} 
                    onChange={handleInputChange}
                    onFocus={() => handleManualFocus('${form.id}', 'account_name')}
                    disabled={!isEditing}
                  >
                    <option value="">Select Account</option>
                    {accounts.map(acc => <option key={acc} value={acc}>{acc}</option>)}
                  </select>
                </div>
                <div className="erp-form-group">
                  <label className="erp-form-label required">Amount (₹)</label>
                  <input 
                    type="number" 
                    name="amount"
                    className="erp-input" 
                    value={formData.amount} 
                    onChange={handleInputChange} 
                    placeholder="0.00" 
                    style={{ fontWeight: 'bold' }}
                    onFocus={() => handleManualFocus('${form.id}', 'amount')}
                    disabled={!isEditing}
                  />
                </div>
                <div className="erp-form-group">
                  <label className="erp-form-label">Mode</label>
                  <select 
                    name="payment_mode"
                    className="erp-input" 
                    value={formData.payment_mode} 
                    onChange={handleInputChange}
                    onFocus={() => handleManualFocus('${form.id}', 'payment_mode')}
                    disabled={!isEditing}
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
                <div className="erp-form-group">
                  <label className="erp-form-label">UTR Number</label>
                  <input 
                    type="text" 
                    name="utr_number"
                    className="erp-input" 
                    value={formData.utr_number}
                    onChange={handleInputChange}
                    placeholder="Enter UTR if applicable..."
                    onFocus={() => handleManualFocus('${form.id}', 'utr_number')}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="erp-form-row-compact-2" style={{ marginTop: '10px' }}>
                <div className="erp-form-group">
                  <label className="erp-form-label" style={{ display: 'block', textAlign: 'left', marginBottom: '2px' }}>Payment Proof (Image)</label>
                  <input 
                    type="file" 
                    name="payment_proof"
                    className="erp-input" 
                    onChange={handleInputChange}
                    onFocus={() => handleManualFocus('${form.id}', 'payment_proof')}
                    disabled={!isEditing}
                    accept="image/*"
                  />
                  {selectedRecord?.attachment_path && (
                    <div style={{ marginTop: '5px', fontSize: '12px' }}>
                      <a href={selectedRecord.attachment_path} target="_blank" rel="noopener noreferrer">View Current Proof</a>
                    </div>
                  )}
                </div>
                <div className="erp-form-group">
                  <label className="erp-form-label" style={{ display: 'block', textAlign: 'left', marginBottom: '2px' }}>Transaction Narration</label>
                  <textarea 
                    name="narration"
                    className="erp-input" 
                    style={{ height: '50px', resize: 'none', width: '100%' }}
                    value={formData.narration}
                    onChange={handleInputChange}
                    placeholder="Enter specific details for this payment..."
                    onFocus={() => handleManualFocus('${form.id}', 'narration')}
                    disabled={!isEditing}
                    onKeyDown={(e) => {
                      if (e.key === 'Tab' && !e.shiftKey && isEditing) {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowSaveModal(true);
                      }
                    }}
                  />
                </div>
              </div>
            </div>
            
            `;

  content = content.substring(0, startIdx) + replacement + content.substring(endIdx);
  fs.writeFileSync(filePath, content);
  console.log(`Successfully updated layout for ${form.name}`);
});
