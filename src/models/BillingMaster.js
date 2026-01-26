const { DataTypes } = require('sequelize');
const { sequelizeTVL } = require('../../config/db');

const BillingMaster = sequelizeTVL.define('billingMaster', {
  bl_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  bl_entry_no: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  bl_bill_no: {
    type: DataTypes.STRING(30),
    allowNull: true
  },
  bl_sub_bill_no: {
    type: DataTypes.STRING(30),
    allowNull: true
  },
  bl_booking_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  bl_booking_no: {
    type: DataTypes.STRING(30),
    allowNull: false
  },
  bl_billing_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  bl_journey_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  bl_customer_name: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  bl_customer_phone: {
    type: DataTypes.STRING(15),
    allowNull: false
  },
  bl_station_boy: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  bl_from_station: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  bl_to_station: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  bl_train_no: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  bl_class: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  bl_pnr: {
    type: DataTypes.STRING(15),
    allowNull: true
  },
  bl_seats_reserved: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  bl_railway_fare: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  bl_sb_incentive: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  bl_gst: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  bl_misc_charges: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  bl_platform_fee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  bl_service_charge: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  bl_delivery_charge: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  bl_cancellation_charge: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  bl_surcharge: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  bl_discount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  bl_gst_type: {
    type: DataTypes.ENUM('INCLUSIVE', 'EXCLUSIVE'),
    defaultValue: 'EXCLUSIVE'
  },
  bl_total_amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  bl_is_split: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  bl_parent_bill_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  bl_created_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  bl_created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'blXbilling',
  timestamps: false
});

// Static method to generate billing data from booking
BillingMaster.generateBillingFromBooking = async (bookingId) => {
  const { BookingTVL } = require('../models');
  const { Op } = require('sequelize');
  
  // Validate booking exists and is confirmed
  const booking = await BookingTVL.findByPk(bookingId);
  
  if (!booking) {
    throw new Error('Booking not found');
  }
  
  // Check if booking status is CONFIRMED - prevent billing for already confirmed bookings
  if (booking.bk_status && booking.bk_status.toUpperCase() === 'CONFIRMED') {
    throw new Error('Billing not allowed for already confirmed bookings');
  }

  // Check if billing already exists for this booking
  const existingBilling = await BillingMaster.findOne({
    where: { bl_booking_id: bookingId }
  });

  if (existingBilling) {
    throw new Error('Billing already exists for this booking');
  }
  
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
    pnr: booking.bk_pnr || '',
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

  return billingData;
};

// Static method to create billing from booking
BillingMaster.createFromBooking = async (billingData, userId) => {
  const { BookingTVL } = require('../models');
  
  const bookingId = billingData.bookingId;
  
  // Validate booking exists and is confirmed
  const booking = await BookingTVL.findByPk(bookingId);
  
  if (!booking) {
    throw new Error('Booking not found');
  }

  // Check if booking status is CONFIRMED - prevent billing for already confirmed bookings
  if (booking.bk_status && booking.bk_status.toUpperCase() === 'CONFIRMED') {
    throw new Error('Billing not allowed for already confirmed bookings');
  }

  // Check if billing already exists for this booking
  const existingBilling = await BillingMaster.findOne({
    where: { bl_booking_id: bookingId }
  });

  if (existingBilling) {
    throw new Error('Billing already exists for this booking');
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
    bl_created_by: userId || null
  });

  // Update booking status to CONFIRMED after creating billing
  await BookingTVL.update(
    { 
      bk_status: 'CONFIRMED',
      mby: userId || null,
      mdtm: new Date()
    },
    { 
      where: { bk_bkid: bookingId }
    }
  );

  return newBilling;
};

// Static method to calculate total amount
BillingMaster.calculateTotalAmount = (billingData) => {
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
  } = billingData;

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
  return Math.max(0, total);
};

module.exports = BillingMaster;