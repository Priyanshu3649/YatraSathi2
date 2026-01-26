const { BookingTVL, BillingMaster } = require('../models');
const { Op } = require('sequelize');

// Generate billing data from booking
const generateBillingFromBooking = async (req, res) => {
  try {
    const bookingId = req.params.bookingId;
    
    console.log(`Attempting to generate billing for booking ID: ${bookingId}`);
    
    // Validate booking exists and is confirmed
    const booking = await BookingTVL.findByPk(bookingId);
    
    if (!booking) {
      console.log(`Booking not found for ID: ${bookingId}`);
      return res.status(404).json({ 
        success: false, 
        message: 'Booking not found' 
      });
    }
    
    console.log(`Found booking with status: ${booking.bk_status}`);

    // Check if booking status is CONFIRMED - prevent billing for already confirmed bookings
    // REVISED LOGIC: Billing generation is permitted for bookings with ANY status EXCEPT 'CONFIRMED'
    if (booking.bk_status && booking.bk_status.toUpperCase() === 'CONFIRMED') {
      console.log(`Booking ${bookingId} is already CONFIRMED, billing not allowed`);
      return res.status(400).json({ 
        success: false, 
        message: 'Billing not allowed for already confirmed bookings' 
      });
    }

    // Check if billing already exists for this booking
    const existingBilling = await BillingMaster.findOne({
      where: { bl_booking_id: bookingId }
    });

    if (existingBilling) {
      console.log(`Billing already exists for booking ID: ${bookingId}`);
      return res.status(400).json({ 
        success: false, 
        message: 'Billing already exists for this booking' 
      });
    }
    
    console.log(`Booking ${bookingId} is eligible for billing generation`);

    // Generate entry number (format: YYYYMMDD-XXX)
    const today = new Date();
    const dateStr = today.getFullYear() + 
                   String(today.getMonth() + 1).padStart(2, '0') + 
                   String(today.getDate()).padStart(2, '0');
    
    // Find next sequence number for today
    const existingEntries = await BillingMaster.findAll({
      where: {
        bl_entry_no: {
          [Op.like]: `${dateStr}%`
        }
      }
    });
    
    const nextSeq = existingEntries.length + 1;
    const entryNo = `${dateStr}-${String(nextSeq).padStart(3, '0')}`;

    // Generate bill number
    const billNo = `BILL-${Date.now()}`;

    // Return prefilled billing data
    const billingData = {
      bookingId: booking.bk_bkid,
      bookingNo: booking.bk_bkno,
      entryNo: entryNo,
      billNo: billNo,
      billingDate: new Date().toISOString().split('T')[0],
      journeyDate: booking.bk_trvldt ? new Date(booking.bk_trvldt).toISOString().split('T')[0] : null,
      customerName: booking.bk_customername || '',
      customerPhone: booking.bk_phonenumber || '',
      fromStation: booking.bk_fromst || '',
      toStation: booking.bk_tost || '',
      trainNo: booking.bk_trno || '',
      class: booking.bk_class || '',
      pnr: booking.bk_pnr || '', // Assuming there's a PNR field
      seatsReserved: booking.bk_totalpass ? booking.bk_totalpass.toString() : '1',
      railwayFare: 0,
      stationBoyIncentive: 0,
      gst: 0,
      miscCharges: 0,
      platformFee: 0,
      serviceCharge: 0,
      deliveryCharge: 0,
      cancellationCharge: 0,
      surcharge: 0,
      discount: 0,
      gstType: 'EXCLUSIVE',
      totalAmount: 0,
      isSplit: false
    };

    res.json({
      success: true,
      data: billingData
    });
  } catch (error) {
    console.error('Generate billing from booking error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Create billing from booking
const createBillingFromBooking = async (req, res) => {
  try {
    const bookingId = req.params.bookingId;
    const billingData = req.body;

    // Validate booking exists and is confirmed
    const booking = await BookingTVL.findByPk(bookingId);
    
    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        message: 'Booking not found' 
      });
    }

    // Check if booking status is CONFIRMED - prevent billing for already confirmed bookings
    // REVISED LOGIC: Billing generation is permitted for bookings with ANY status EXCEPT 'CONFIRMED'
    if (booking.bk_status && booking.bk_status.toUpperCase() === 'CONFIRMED') {
      return res.status(400).json({ 
        success: false, 
        message: 'Billing not allowed for already confirmed bookings' 
      });
    }

    // Check if billing already exists for this booking
    const existingBilling = await BillingMaster.findOne({
      where: { bl_booking_id: bookingId }
    });

    if (existingBilling) {
      return res.status(400).json({ 
        success: false, 
        message: 'Billing already exists for this booking' 
      });
    }

    // Create the billing record
    const newBilling = await BillingMaster.create({
      bl_entry_no: billingData.entryNo,
      bl_bill_no: billingData.billNo,
      bl_booking_id: bookingId,
      bl_booking_no: booking.bk_bkno,
      bl_billing_date: new Date(billingData.billingDate),
      bl_journey_date: billingData.journeyDate ? new Date(billingData.journeyDate) : new Date(booking.bk_trvldt),
      bl_customer_name: billingData.customerName,
      bl_customer_phone: billingData.customerPhone,
      bl_station_boy: billingData.stationBoy || '',
      bl_from_station: billingData.fromStation,
      bl_to_station: billingData.toStation,
      bl_train_no: billingData.trainNo,
      bl_class: billingData.class,
      bl_pnr: billingData.pnr,
      bl_seats_reserved: billingData.seatsReserved,
      bl_railway_fare: parseFloat(billingData.railwayFare) || 0,
      bl_station_boy_incentive: parseFloat(billingData.stationBoyIncentive) || 0,
      bl_gst: parseFloat(billingData.gst) || 0,
      bl_misc_charges: parseFloat(billingData.miscCharges) || 0,
      bl_platform_fee: parseFloat(billingData.platformFee) || 0,
      bl_service_charge: parseFloat(billingData.serviceCharge) || 0,
      bl_delivery_charge: parseFloat(billingData.deliveryCharge) || 0,
      bl_cancellation_charge: parseFloat(billingData.cancellationCharge) || 0,
      bl_surcharge: parseFloat(billingData.surcharge) || 0,
      bl_discount: parseFloat(billingData.discount) || 0,
      bl_gst_type: billingData.gstType || 'EXCLUSIVE',
      bl_total_amount: parseFloat(billingData.totalAmount) || 0,
      bl_is_split: billingData.isSplit || false,
      bl_created_by: req.user?.us_usid || null
    });

    // Update booking status to CONFIRMED after creating billing
    await BookingTVL.update(
      { 
        bk_status: 'CONFIRMED',
        mby: req.user?.us_usid || null,
        mdtm: new Date()
      },
      { 
        where: { bk_bkid: bookingId }
      }
    );

    res.json({
      success: true,
      message: 'Billing created successfully and booking status updated to Confirmed',
      data: newBilling
    });
  } catch (error) {
    console.error('Create billing from booking error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Calculate total amount
const calculateTotal = async (req, res) => {
  try {
    const { 
      railwayFare = 0, 
      miscCharges = 0, 
      platformFee = 0, 
      serviceCharge = 0, 
      deliveryCharge = 0, 
      surcharge = 0, 
      gst = 0, 
      discount = 0, 
      cancellationCharge = 0 
    } = req.body;

    // Calculate total based on the formula
    let total = parseFloat(railwayFare) || 0;
    total += parseFloat(miscCharges) || 0;
    total += parseFloat(platformFee) || 0;
    total += parseFloat(serviceCharge) || 0;
    total += parseFloat(deliveryCharge) || 0;
    total += parseFloat(surcharge) || 0;
    total += parseFloat(gst) || 0;
    total -= parseFloat(discount) || 0;
    total -= parseFloat(cancellationCharge) || 0;

    // Ensure total is not negative
    total = Math.max(0, total);

    res.json({
      success: true,
      total: total
    });
  } catch (error) {
    console.error('Calculate total error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Get billing by booking ID
const getBillingByBookingId = async (req, res) => {
  try {
    const bookingId = req.params.bookingId;

    const billing = await BillingMaster.findOne({
      where: { bl_booking_id: bookingId }
    });

    if (!billing) {
      return res.status(404).json({ 
        success: false, 
        message: 'No billing found for this booking' 
      });
    }

    res.json({
      success: true,
      data: billing
    });
  } catch (error) {
    console.error('Get billing by booking ID error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

module.exports = {
  generateBillingFromBooking,
  createBillingFromBooking,
  calculateTotal,
  getBillingByBookingId
};