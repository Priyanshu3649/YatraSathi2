import { printComponent, numberToWords, formatDate } from './printUtils';

/**
 * Utility to print accounting vouchers (Payment, Receipt, Contra, Journal)
 * Renders a clean vintage-style ERP voucher and opens pop-up print dialog.
 */
export const printVoucher = (record, type) => {
  if (!record) return;

  const voucherTypeLabels = {
    payment: 'Payment Out Voucher',
    receipt: 'Receipt In Voucher',
    contra: 'Contra Voucher',
    journal: 'Journal Entry Voucher'
  };

  const title = voucherTypeLabels[type] || 'Accounting Voucher';
  
  // Extract fields based on voucher type
  let entryNo = '';
  let date = '';
  let debitAccount = '';
  let creditAccount = '';
  let amount = 0;
  let refNo = 'N/A';
  let mode = 'N/A';
  let party = 'N/A';
  let narration = '';

  if (type === 'payment') {
    entryNo = record.py_entry_no || record.receipt_no || '';
    date = record.py_date || record.date || '';
    amount = Number(record.py_amount || record.amount || 0);
    refNo = record.py_ref_number || record.ref_number || 'N/A';
    mode = record.py_payment_mode || record.payment_mode || 'Cash';
    party = record.py_customer_name || record.customer_name || 'N/A';
    debitAccount = party;
    creditAccount = record.py_bank_account || record.account_name || '';
    narration = record.py_narration || record.narration || '';
  } else if (type === 'receipt') {
    entryNo = record.rc_entry_no || record.receipt_no || '';
    date = record.rc_date || record.date || '';
    amount = Number(record.rc_amount || record.amount || 0);
    refNo = record.rc_ref_number || record.ref_number || 'N/A';
    mode = record.rc_payment_mode || record.payment_mode || 'Cash';
    party = record.rc_customer_name || record.customer_name || 'N/A';
    debitAccount = record.rc_bank_account || record.account_name || '';
    creditAccount = party;
    narration = record.rc_narration || record.narration || '';
  } else if (type === 'contra') {
    entryNo = record.ct_entry_no || record.contra_no || '';
    date = record.ct_date || record.date || '';
    amount = Number(record.ct_amount || record.amount || 0);
    refNo = record.ct_ref_number || record.ref_number || 'N/A';
    mode = 'Contra Transfer';
    debitAccount = record.ct_to_account || record.to_account || '';
    creditAccount = record.ct_from_account || record.from_account || '';
    narration = record.ct_narration || record.narration || '';
  } else if (type === 'journal') {
    entryNo = record.je_entry_no || record.journal_no || '';
    date = record.je_date || record.date || '';
    amount = Number(record.je_amount || record.amount || 0);
    refNo = record.je_ref_number || record.ref_number || 'N/A';
    mode = 'Journal Adjustment';
    
    // For journal, debit/credit accounts are parsed/read
    debitAccount = record.debit_account || '';
    creditAccount = record.credit_account || '';
    narration = record.je_narration || record.narration || '';
  }

  const formattedDate = formatDate(date);
  const amtInWords = numberToWords(Math.floor(amount)) + ' Rupees Only';

  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 2px solid #333; max-width: 700px; margin: 0 auto; color: #000; background-color: #fff;">
      <!-- Company Details -->
      <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px;">
        <h1 style="margin: 0; font-size: 24px; color: #1a237e;">ANMOL TRAVELS</h1>
        <p style="margin: 4px 0; font-size: 12px;">123 Travel Street, Railway Station Road, New Delhi - 110001</p>
        <p style="margin: 2px 0; font-size: 11px;">Phone: +91-11-23456789 | Email: info@anmoltravels.com</p>
        <p style="margin: 2px 0; font-size: 11px;"><strong>GSTIN:</strong> 07AABCA1234B1ZX</p>
      </div>

      <!-- Voucher Title & Details -->
      <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #ccc; padding-bottom: 10px; margin-bottom: 15px;">
        <h2 style="margin: 0; font-size: 18px; text-decoration: underline; text-transform: uppercase;">${title}</h2>
        <div style="text-align: right; font-size: 12px;">
          <div><strong>Voucher No:</strong> ${entryNo}</div>
          <div><strong>Date:</strong> ${formattedDate}</div>
        </div>
      </div>

      <!-- Particulars Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px;">
        <thead>
          <tr style="background-color: #f2f2f2; border-bottom: 1px solid #333;">
            <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Particulars</th>
            <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Account/Details</th>
            <th style="text-align: right; padding: 8px; border: 1px solid #ddd; width: 120px;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Debit Account (To)</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${debitAccount || 'N/A'}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Credit Account (By)</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${creditAccount || 'N/A'}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">-</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Payment Mode</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${mode}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">-</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Reference Number</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${refNo}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">-</td>
          </tr>
          <tr style="background-color: #fafafa;">
            <td colspan="2" style="padding: 8px; border: 1px solid #ddd; font-weight: bold; text-align: right;">Total Amount</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold; font-size: 14px; color: #1a237e;">₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          </tr>
        </tbody>
      </table>

      <!-- Amount in Words -->
      <div style="font-size: 11px; font-style: italic; background-color: #f9f9f9; padding: 8px; border: 1px solid #ddd; margin-bottom: 25px;">
        <strong>Amount in words:</strong> ${amtInWords}
      </div>

      <!-- Narration -->
      <div style="font-size: 12px; margin-bottom: 30px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
        <strong>Narration:</strong> ${narration || 'No narration entered.'}
      </div>

      <!-- Signatures -->
      <div style="display: flex; justify-content: space-between; margin-top: 50px; font-size: 12px;">
        <div style="text-align: center; width: 150px;">
          <div style="border-top: 1px solid #333; padding-top: 5px;">Prepared By</div>
        </div>
        <div style="text-align: center; width: 150px;">
          <div style="border-top: 1px solid #333; padding-top: 5px;">Checked By</div>
        </div>
        <div style="text-align: center; width: 150px;">
          <div style="border-top: 1px solid #333; padding-top: 5px;">Authorised Signatory</div>
        </div>
      </div>

      <!-- Footer Disclaimer -->
      <div style="text-align: center; font-size: 10px; color: #666; margin-top: 35px; border-top: 1px solid #ddd; padding-top: 10px;">
        This is a computer-generated voucher and does not require a physical signature.
      </div>
    </div>
  `;

  printComponent(html, title);
};
