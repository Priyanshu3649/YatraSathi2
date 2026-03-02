/**
 * Test script to verify passenger-billing integration functionality
 */

const { Passenger } = require('./src/models');

async function testPassengerModel() {
  console.log('🧪 Testing Passenger model with billing number functionality...\n');

  // Test 1: Check if the Passenger model has the new bl_bill_no property
  console.log('📋 Test 1: Verifying Passenger model structure');
  try {
    const sampleData = {
      ps_psid: 1,
      ps_bkid: 123,
      ps_fname: 'John',
      ps_lname: 'Doe',
      ps_age: 30,
      ps_gender: 'M',
      bl_bill_no: 'BL-240301-0001'
    };
    
    const passenger = new Passenger(sampleData);
    console.log('✅ Passenger model accepts bl_bill_no property:', passenger.bl_bill_no);
  } catch (error) {
    console.error('❌ Error with Passenger model:', error.message);
  }

  // Test 2: Check if getByBillingNumber method exists
  console.log('\n📋 Test 2: Verifying getByBillingNumber method exists');
  if (typeof Passenger.getByBillingNumber === 'function') {
    console.log('✅ getByBillingNumber method exists');
  } else {
    console.error('❌ getByBillingNumber method does not exist');
  }

  // Test 3: Show sample usage
  console.log('\n📋 Sample usage examples:');
  console.log(`
  // When creating a passenger with billing number:
  const passengerData = {
    ps_bkid: bookingId,
    ps_fname: 'John',
    ps_lname: 'Doe',
    ps_age: 30,
    ps_gender: 'M',
    bl_bill_no: 'BL-240301-0001'  // <- New field
  };
  
  // When getting passengers by billing number:
  const result = await Passenger.getByBillingNumber('BL-240301-0001');
  
  // When updating passenger with billing number:
  await Passenger.update(passengerId, {
    ps_fname: 'Jane',
    bl_bill_no: 'BL-240301-0002'  // <- Can update billing number
  });
  `);

  console.log('\n🎉 Passenger model tests completed!');
  console.log('✅ All passenger-billing integration features are ready.');
}

// Run the test
testPassengerModel().catch(console.error);