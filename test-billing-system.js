// Test script for the new billing system
const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:5004/api';

// Test data
const testBillData = {
  bookingNumber: 'BK001',
  customerId: 'CUS001',
  customerName: 'Test Customer',
  phoneNo: '9876543210',
  billingDate: new Date().toISOString().split('T')[0],
  stationBoyName: 'Station Boy 1',
  trainNumber: '12345',
  pnrNumber: 'PNR123456',
  berthDetail: 'S1-25 (LB)',
  netJourneyFare: 1500.00,
  stationBoyCharge: 50.00,
  serviceCharge: 100.00,
  platformFees: 20.00,
  gst: 82.50,
  miscCharges: 25.00,
  deliveryCharge: 30.00,
  cancellationCharges: 0.00,
  gstOnCancellation: 0.00,
  surCharge: 15.00,
  gstType: 'CGST+SGST',
  roundedOffAmount: 0.50,
  totalAmount: 1823.00
};

// Mock authentication token (you'll need a real token)
const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c191c2lkIjoiQURNSU4wMSIsInVzX3JvaWQiOiJBRE0iLCJpYXQiOjE3Mzc0NzI4MDAsImV4cCI6MTczNzU1OTIwMH0.test';

async function testBillingSystem() {
  console.log('🧪 Testing New Billing System...\n');

  try {
    // Test 1: Create a new bill
    console.log('1️⃣ Testing bill creation...');
    const createResponse = await fetch(`${API_BASE_URL}/billing`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mockToken}`
      },
      body: JSON.stringify(testBillData)
    });

    if (createResponse.ok) {
      const createdBill = await createResponse.json();
      console.log('✅ Bill created successfully:', createdBill.bill_no);
      
      // Test 2: Get all bills
      console.log('\n2️⃣ Testing get all bills...');
      const getAllResponse = await fetch(`${API_BASE_URL}/employee/billing`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${mockToken}`
        }
      });

      if (getAllResponse.ok) {
        const billsData = await getAllResponse.json();
        console.log('✅ Bills fetched successfully. Count:', billsData.data?.bills?.length || 0);
        
        if (billsData.data?.bills?.length > 0) {
          const firstBill = billsData.data.bills[0];
          console.log('📋 Sample bill structure:');
          console.log('   - Bill ID:', firstBill.billId);
          console.log('   - Booking Number:', firstBill.bookingNumber);
          console.log('   - Customer Name:', firstBill.customerName);
          console.log('   - Total Amount:', firstBill.totalAmount);
          console.log('   - Station Boy:', firstBill.stationBoyName);
        }
      } else {
        const error = await getAllResponse.text();
        console.log('❌ Failed to fetch bills:', error);
      }

    } else {
      const error = await createResponse.text();
      console.log('❌ Failed to create bill:', error);
    }

    // Test 3: Test booking lookup (simulate frontend functionality)
    console.log('\n3️⃣ Testing booking lookup functionality...');
    const bookingSearchResponse = await fetch(`${API_BASE_URL}/bookings/search?bookingNumber=BK001`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${mockToken}`
      }
    });

    if (bookingSearchResponse.ok) {
      const bookingData = await bookingSearchResponse.json();
      console.log('✅ Booking lookup working. Found bookings:', bookingData.data?.length || 0);
    } else {
      console.log('⚠️ Booking lookup endpoint may need setup');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }

  console.log('\n🏁 Billing system test completed!');
}

// Run the test
testBillingSystem();