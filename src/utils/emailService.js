// Simple email service (in production, you would use a real email service like Nodemailer)

// Mock email sending function
const sendEmail = async (to, subject, htmlContent) => {
  try {
    // In a real implementation, you would use a service like Nodemailer
    // For now, we'll just log the email
    
    console.log('=== EMAIL SENT ===');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('Content:', htmlContent);
    console.log('==================');
    
    // Simulate async operation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          messageId: `mock-${Date.now()}`,
          to,
          subject
        });
      }, 100);
    });
  } catch (error) {
    console.error('Email sending failed:', error);
    throw new Error('Failed to send email');
  }
};

// Send booking confirmation email
const sendBookingConfirmation = async (user, booking) => {
  const subject = 'Booking Confirmation - YatraSathi';
  
  const htmlContent = `
    <h2>Booking Confirmation</h2>
    <p>Dear ${user.name},</p>
    <p>Your booking request has been confirmed. Here are the details:</p>
    
    <ul>
      <li><strong>Booking ID:</strong> ${booking._id}</li>
      <li><strong>Origin:</strong> ${booking.origin}</li>
      <li><strong>Destination:</strong> ${booking.destination}</li>
      <li><strong>Travel Date:</strong> ${new Date(booking.travelDate).toDateString()}</li>
      <li><strong>Class:</strong> ${booking.class}</li>
      <li><strong>Status:</strong> ${booking.status}</li>
    </ul>
    
    <p>An agent will contact you shortly to process your Tatkal ticket request.</p>
    
    <p>Thank you for choosing YatraSathi!</p>
  `;
  
  return await sendEmail(user.email, subject, htmlContent);
};

// Send booking assignment email
const sendBookingAssignment = async (user, booking, employee) => {
  const subject = 'Booking Assigned - YatraSathi';
  
  const htmlContent = `
    <h2>Booking Assigned</h2>
    <p>Dear ${user.name},</p>
    <p>Your booking request has been assigned to our agent. Here are the details:</p>
    
    <ul>
      <li><strong>Booking ID:</strong> ${booking._id}</li>
      <li><strong>Agent Name:</strong> ${employee.name}</li>
      <li><strong>Agent Contact:</strong> ${employee.phone}</li>
    </ul>
    
    <p>Your agent will contact you shortly to process your Tatkal ticket request.</p>
    
    <p>Thank you for choosing YatraSathi!</p>
  `;
  
  return await sendEmail(user.email, subject, htmlContent);
};

// Send PNR confirmation email
const sendPNRConfirmation = async (user, booking) => {
  const subject = 'PNR Confirmed - YatraSathi';
  
  let pnrDetails = '';
  if (booking.pnrs && booking.pnrs.length > 0) {
    pnrDetails = '<h3>PNR Details:</h3><ul>';
    booking.pnrs.forEach(pnr => {
      pnrDetails += `
        <li>
          <strong>PNR:</strong> ${pnr.pnrNumber}<br>
          <strong>Status:</strong> ${pnr.status}<br>
          <strong>Amount:</strong> ₹${pnr.totalAmount}
        </li>
      `;
    });
    pnrDetails += '</ul>';
  }
  
  const htmlContent = `
    <h2>PNR Confirmed</h2>
    <p>Dear ${user.name},</p>
    <p>Your Tatkal ticket request has been processed and confirmed. Here are the details:</p>
    
    <ul>
      <li><strong>Booking ID:</strong> ${booking._id}</li>
      <li><strong>Origin:</strong> ${booking.origin}</li>
      <li><strong>Destination:</strong> ${booking.destination}</li>
      <li><strong>Travel Date:</strong> ${new Date(booking.travelDate).toDateString()}</li>
    </ul>
    
    ${pnrDetails}
    
    <p>Please check your tickets and let us know if you have any questions.</p>
    
    <p>Thank you for choosing YatraSathi!</p>
  `;
  
  return await sendEmail(user.email, subject, htmlContent);
};

// Send payment confirmation email
const sendPaymentConfirmation = async (user, payment, booking) => {
  const subject = 'Payment Received - YatraSathi';
  
  const htmlContent = `
    <h2>Payment Received</h2>
    <p>Dear ${user.name},</p>
    <p>We have received your payment for booking. Here are the details:</p>
    
    <ul>
      <li><strong>Booking ID:</strong> ${booking._id}</li>
      <li><strong>Payment ID:</strong> ${payment._id}</li>
      <li><strong>Amount:</strong> ₹${payment.amount}</li>
      <li><strong>Payment Mode:</strong> ${payment.mode}</li>
      <li><strong>Payment Date:</strong> ${new Date(payment.paymentDate).toDateString()}</li>
    </ul>
    
    <p>Thank you for your payment. Your transaction has been processed successfully.</p>
    
    <p>Thank you for choosing YatraSathi!</p>
  `;
  
  return await sendEmail(user.email, subject, htmlContent);
};

module.exports = {
  sendEmail,
  sendBookingConfirmation,
  sendBookingAssignment,
  sendPNRConfirmation,
  sendPaymentConfirmation
};