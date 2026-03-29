/**
 * Lightweight notification helper. Configure SMTP via .env to send real mail;
 * otherwise events are logged only (safe for local dev).
 *
 * Optional env:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 *   FINANCE_NOTIFY_EMAILS=comma@separated.com
 */

function parseFinanceRecipients() {
  const raw = process.env.FINANCE_NOTIFY_EMAILS || '';
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

async function sendMailIfConfigured({ to, subject, text, html }) {
  const host = process.env.SMTP_HOST;
  if (!host) {
    console.info('[emailService] SMTP_HOST not set — skipping outbound email.');
    console.info('[emailService] Would send to:', to, 'subject:', subject);
    return { sent: false, skipped: true };
  }

  let nodemailer;
  try {
    nodemailer = require('nodemailer');
  } catch {
    console.warn('[emailService] nodemailer not installed — run: npm install nodemailer');
    return { sent: false, skipped: true };
  }

  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@yatrasathi',
    to: Array.isArray(to) ? to.join(',') : to,
    subject,
    text,
    html: html || text
  });

  return { sent: true };
}

/**
 * Notify customer + finance team about a cancelled bill.
 * Customer email resolved by caller; omit if unknown.
 */
async function notifyBillCancelled({
  customerEmail,
  customerName,
  billNo,
  cancellationRef,
  reason,
  performedBy
}) {
  const finance = parseFinanceRecipients();
  const lines = [
    `Bill ${billNo || 'N/A'} has been cancelled.`,
    `Reference: ${cancellationRef || 'N/A'}`,
    `Reason: ${reason || 'N/A'}`,
    `Recorded by: ${performedBy || 'N/A'}`
  ].join('\n');

  const tasks = [];

  if (customerEmail) {
    tasks.push(
      sendMailIfConfigured({
        to: customerEmail,
        subject: `[Anmol Travels] Bill cancelled — ${billNo || ''}`,
        text: `Dear ${customerName || 'Customer'},\n\n${lines}\n\nPlease contact finance for refund settlement if applicable.\n`
      }).catch((err) => console.error('[emailService] customer mail error:', err.message))
    );
  }

  if (finance.length) {
    tasks.push(
      sendMailIfConfigured({
        to: finance,
        subject: `[Finance] Bill cancelled — ${billNo || ''} (${cancellationRef || ''})`,
        text: `Team,\n\n${lines}\n`
      }).catch((err) => console.error('[emailService] finance mail error:', err.message))
    );
  }

  await Promise.all(tasks);
}

module.exports = {
  sendMailIfConfigured,
  notifyBillCancelled,
  parseFinanceRecipients
};
