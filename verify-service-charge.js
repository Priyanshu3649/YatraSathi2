const serviceChargeService = require('./src/services/serviceChargeService');
const { ServiceCharge, ServiceChargeDefault } = require('./src/models');
const { connectDB } = require('./config/db');

/**
 * Verification Script for Service Charge Engine
 */
async function verify() {
  try {
    await connectDB();
    console.log('--- STARTING VERIFICATION ---');

    const customerId = 999;
    
    // 1. Clean up old test rules
    await ServiceCharge.destroy({ where: { customer_id: customerId } });
    await ServiceChargeDefault.destroy({ where: { travel_class: '3A', service_type: 'RESERVATION' } });

    // 2. Create Default Rules
    console.log('Creating Default Rules...');
    await ServiceChargeDefault.create({
      service_type: 'RESERVATION',
      travel_class: '3A',
      charge_mode: 'FIXED',
      passenger_min: 1,
      passenger_max: 2,
      amount: 100.00,
      is_active: true
    });
    await ServiceChargeDefault.create({
      service_type: 'RESERVATION',
      travel_class: '3A',
      charge_mode: 'PER_PASSENGER',
      passenger_min: 3,
      passenger_max: null,
      amount: 40.00,
      is_active: true
    });

    // 3. Test Default Fallback
    console.log('\n--- Test 1: Default Fallback ---');
    const res1 = await serviceChargeService.getServiceCharge({
      customerId: customerId,
      serviceType: 'RESERVATION',
      travelClass: '3A',
      passengerCount: 1
    });
    console.log(`Expected: 100, Got: ${res1}`);

    const res2 = await serviceChargeService.getServiceCharge({
      customerId: customerId,
      serviceType: 'RESERVATION',
      travelClass: '3A',
      passengerCount: 4
    });
    console.log(`Expected: 160 (40 * 4), Got: ${res2}`);

    // 4. Create Customer Override
    console.log('\nCreating Customer Override...');
    await ServiceCharge.create({
      customer_id: customerId,
      service_type: 'RESERVATION',
      travel_class: '3A',
      charge_mode: 'FIXED',
      passenger_min: 1,
      passenger_max: 10,
      amount: 50.00, // Cheaper for this customer
      is_active: true
    });

    // 5. Test Override
    console.log('\n--- Test 2: Customer Override ---');
    const res3 = await serviceChargeService.getServiceCharge({
      customerId: customerId,
      serviceType: 'RESERVATION',
      travelClass: '3A',
      passengerCount: 2
    });
    console.log(`Expected: 50 (Override), Got: ${res3}`);

    console.log('\n--- VERIFICATION COMPLETE ---');
    process.exit(0);
  } catch (err) {
    console.error('Verification failed:', err);
    process.exit(1);
  }
}

verify();
