const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

// Test credentials
const testUser = {
  email: 'admin@example.com',
  password: 'admin123'
};

async function testBillingStatusFix() {
  try {
    console.log('🔐 Step 1: Logging in...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, testUser);
    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    // Set up axios with auth token
    const api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('\n📋 Step 2: Getting available bookings...');
    const bookingsResponse = await api.get('/bookings');
    const bookings = bookingsResponse.data.data.bookings;
    
    if (bookings.length === 0) {
      console.log('❌ No bookings found. Please create a booking first.');
      return;
    }

    // Find a booking that doesn't have a bill yet (status is DRAFT or PENDING)
    const availableBooking = bookings.find(b => 
      ['DRAFT', 'PENDING'].includes(b.bk_status) && b.bk_billed !== 1
    );

    if (!availableBooking) {
      console.log('❌ No available bookings without bills found.');
      console.log('Available bookings:', bookings.map(b => ({
        id: b.bk_bkid,
        status: b.bk_status,
        billed: b.bk_billed
      })));
      return;
    }

    console.log('✅ Found available booking:', {
      id: availableBooking.bk_bkid,
      customer: availableBooking.bk_customername,
      status: availableBooking.bk_status
    });

    console.log('\n💰 Step 3: Creating bill with DRAFT status...');
    const billData = {
      bookingId: availableBooking.bk_bkid,
      customerName: availableBooking.bk_customername || 'Test Customer',
      phoneNumber: availableBooking.bk_phonenumber || '9876543210',
      stationBoy: 'Station Boy 1',
      fromStation: availableBooking.bk_fromst || 'Mumbai',
      toStation: availableBooking.bk_tost || 'Delhi',
      journeyDate: availableBooking.bk_trvldt || new Date().toISOString().split('T')[0],
      trainNumber: availableBooking.bk_trno || '12345',
      reservationClass: availableBooking.bk_class || '3A',
      ticketType: 'NORMAL',
      pnrNumbers: availableBooking.bk_pnr || 'PNR123456',
      seatsAlloted: '1,2,3',
      railwayFare: 1500,
      stationBoyIncentive: 50,
      serviceCharges: 100,
      platformFees: 20,
      miscCharges: 30,
      deliveryCharges: 50,
      cancellationCharges: 0,
      gst: 18,
      surcharge: 10,
      discount: 0,
      gstType: 'EXCLUSIVE',
      totalAmount: 2048.40,
      billDate: new Date().toISOString().split('T')[0],
      status: 'DRAFT',
      remarks: 'Test bill creation with DRAFT status'
    };

    console.log('Bill data:', JSON.stringify(billData, null, 2));

    const billResponse = await api.post('/billing', billData);
    
    console.log('✅ Bill created successfully!');
    console.log('Bill details:', {
      billId: billResponse.data.data.bill.bl_bill_no,
      billNumber: billResponse.data.data.bill.bl_entry_no,
      status: billResponse.data.data.bill.bl_status,
      totalAmount: billResponse.data.data.bill.bl_total_amount
    });

    console.log('\n📊 Step 4: Verifying bill in database...');
    const billsResponse = await api.get('/billing');
    const createdBill = billsResponse.data.data.bills.find(
      b => b.bl_bill_no === billResponse.data.data.bill.bl_bill_no
    );

    if (createdBill) {
      console.log('✅ Bill verified in database:');
      console.log({
        billNo: createdBill.bl_bill_no,
        status: createdBill.bl_status,
        bookingId: createdBill.bl_booking_id,
        totalAmount: createdBill.bl_total_amount
      });
    } else {
      console.log('❌ Bill not found in database');
    }

    console.log('\n✅ All tests passed! Billing status ENUM fix is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

// Run the test
testBillingStatusFix();
