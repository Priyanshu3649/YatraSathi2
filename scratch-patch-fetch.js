const fs = require('fs');
let code = fs.readFileSync('src/controllers/billingController.js', 'utf8');

const fetchBookingReplacement = `const fetchBookingForBilling = async (req, res) => {
  const { BookingTVL, PassengerTVL } = require('../models');
  try {
    const { id } = req.params;
    // Check if ID is PNR or Booking ID. If it's a number and < 15 digits, assume Booking ID, else PNR
    const isPnr = isNaN(id) || id.length === 10;
    
    let booking;
    if (isPnr) {
      booking = await BookingTVL.findOne({ where: { bk_pnr: id } });
    } else {
      booking = await BookingTVL.findByPk(id);
    }
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking or PNR not found' });
    }
    
    const passengers = await PassengerTVL.findAll({
      where: { ps_bkid: booking.bk_bkid, ps_active: 1 }
    });
    
    // Format the response
    const data = {
      bl_booking_id: booking.bk_bkid,
      bl_pnr: booking.bk_pnr,
      bl_customer_name: booking.bk_contact_name || (passengers[0] ? \`\${passengers[0].ps_fname} \${passengers[0].ps_lname}\`.trim() : ''),
      bl_customer_phone: booking.bk_contact_phone || '',
      bl_from_station: booking.bk_src || '',
      bl_to_station: booking.bk_dest || '',
      bl_train_no: booking.bk_train || '',
      bl_class: booking.bk_class || '',
      bl_journey_date: booking.bk_date,
      passengers: passengers.map(p => ({
        id: p.ps_psid,
        name: \`\${p.ps_fname} \${p.ps_lname}\`.trim(),
        coach: p.ps_coach,
        berth: p.ps_berthalloc || p.ps_berthpref
      }))
    };
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {`;

// Replace module.exports = {
code = code.replace('module.exports = {', fetchBookingReplacement + '\n  fetchBookingForBilling,');

fs.writeFileSync('src/controllers/billingController.js', code);
