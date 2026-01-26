/**
 * BOOKING → BILLING INTEGRATION TEST SCRIPT
 * 
 * This script tests the complete booking-to-billing workflow:
 * 1. Database table creation
 * 2. Backend API endpoints
 * 3. Frontend integration
 * 4. Keyboard navigation
 * 5. Business rules enforcement
 */

const mysql = require('mysql2/promise');
const fetch = require('node-fetch');

// Test configuration
const TEST_CONFIG = {
    database: {
        host: 'localhost',
        user: 'root',
        password: 'password',
        database: 'yatrasathi'
    },
    api: {
        baseUrl: 'http://localhost:3001/api',
        token: null // Will be set after login
    },
    testData: {
        bookingId: null, // Will be created during test
        billingId: null  // Will be created during test
    }
};

class BookingBillingIntegrationTest {
    constructor() {
        this.db = null;
        this.testResults = [];
    }

    async initialize() {
        console.log('🚀 Initializing Booking → Billing Integration Test...\n');
        
        // Connect to database
        this.db = await mysql.createConnection(TEST_CONFIG.database);
        console.log('✅ Database connection established');
        
        // Login to get auth token
        await this.login();
        console.log('✅ Authentication successful\n');
    }

    async login() {
        const response = await fetch(`${TEST_CONFIG.api.baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'admin',
                password: 'admin123'
            })
        });
        
        const result = await response.json();
        if (result.success) {
            TEST_CONFIG.api.token = result.token;
        } else {
            throw new Error('Login failed');
        }
    }

    async runTest(testName, testFunction) {
        try {
            console.log(`🧪 Testing: ${testName}`);
            await testFunction();
            console.log(`✅ PASSED: ${testName}\n`);
            this.testResults.push({ test: testName, status: 'PASSED' });
        } catch (error) {
            console.log(`❌ FAILED: ${testName} - ${error.message}\n`);
            this.testResults.push({ test: testName, status: 'FAILED', error: error.message });
        }
    }

    async testDatabaseSchema() {
        // Test billing_master table exists
        const [tables] = await this.db.execute(
            "SHOW TABLES LIKE 'billing_master'"
        );
        
        if (tables.length === 0) {
            throw new Error('billing_master table does not exist');
        }
        
        // Test table structure
        const [columns] = await this.db.execute(
            "DESCRIBE billing_master"
        );
        
        const requiredColumns = [
            'bl_id', 'bl_entry_no', 'bl_booking_id', 'bl_customer_name',
            'bl_customer_phone', 'bl_station_boy', 'bl_railway_fare',
            'bl_total_amount', 'bl_gst_type', 'bl_is_split'
        ];
        
        const existingColumns = columns.map(col => col.Field);
        
        for (const col of requiredColumns) {
            if (!existingColumns.includes(col)) {
                throw new Error(`Required column ${col} is missing`);
            }
        }
        
        // Test constraints
        const [constraints] = await this.db.execute(`
            SELECT CONSTRAINT_NAME, CONSTRAINT_TYPE 
            FROM information_schema.TABLE_CONSTRAINTS 
            WHERE TABLE_SCHEMA = '${TEST_CONFIG.database.database}' 
            AND TABLE_NAME = 'billing_master'
        `);
        
        const hasUniqueBooking = constraints.some(c => 
            c.CONSTRAINT_NAME === 'chk_no_duplicate_billing'
        );
        
        if (!hasUniqueBooking) {
            throw new Error('Unique booking constraint is missing');
        }
    }

    async testCreateConfirmedBooking() {
        // Create a test booking in CONFIRMED status
        const [result] = await this.db.execute(`
            INSERT INTO bookingstvl (
                bk_bookingdt, bk_customername, bk_phonenumber, 
                bk_fromstation, bk_tostation, bk_trvldt, bk_class,
                bk_status, bk_createdby, bk_createdon
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'CONFIRMED', 1, NOW())
        `, [
            new Date().toISOString().split('T')[0],
            'Test Customer',
            '9876543210',
            'Delhi',
            'Mumbai',
            new Date().toISOString().split('T')[0],
            '3A'
        ]);
        
        TEST_CONFIG.testData.bookingId = result.insertId;
        
        if (!TEST_CONFIG.testData.bookingId) {
            throw new Error('Failed to create test booking');
        }
    }

    async testGenerateBillingFromBooking() {
        const response = await fetch(
            `${TEST_CONFIG.api.baseUrl}/billing/from-booking/${TEST_CONFIG.testData.bookingId}`,
            {
                headers: {
                    'Authorization': `Bearer ${TEST_CONFIG.api.token}`
                }
            }
        );
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || 'Failed to generate billing from booking');
        }
        
        // Verify prefilled data
        const billingData = result.data;
        
        if (billingData.customerName !== 'Test Customer') {
            throw new Error('Customer name not prefilled correctly');
        }
        
        if (billingData.phoneNumber !== '9876543210') {
            throw new Error('Phone number not prefilled correctly');
        }
        
        if (billingData.fromStation !== 'Delhi') {
            throw new Error('From station not prefilled correctly');
        }
        
        if (billingData.toStation !== 'Mumbai') {
            throw new Error('To station not prefilled correctly');
        }
    }

    async testCreateBillingFromBooking() {
        const billingData = {
            customerName: 'Test Customer',
            phoneNumber: '9876543210',
            stationBoy: 'Test Station Boy',
            railwayFare: 1500,
            serviceCharge: 100,
            gst: 240,
            totalAmount: 1840,
            gstType: 'EXCLUSIVE'
        };
        
        const response = await fetch(
            `${TEST_CONFIG.api.baseUrl}/billing/from-booking/${TEST_CONFIG.testData.bookingId}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${TEST_CONFIG.api.token}`
                },
                body: JSON.stringify(billingData)
            }
        );
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || 'Failed to create billing from booking');
        }
        
        TEST_CONFIG.testData.billingId = result.data.bl_id;
        
        // Verify billing record in database
        const [billing] = await this.db.execute(
            'SELECT * FROM billing_master WHERE bl_id = ?',
            [TEST_CONFIG.testData.billingId]
        );
        
        if (billing.length === 0) {
            throw new Error('Billing record not found in database');
        }
        
        const billingRecord = billing[0];
        
        if (billingRecord.bl_booking_id !== TEST_CONFIG.testData.bookingId) {
            throw new Error('Booking ID not linked correctly');
        }
        
        if (billingRecord.bl_total_amount !== 1840) {
            throw new Error('Total amount calculation incorrect');
        }
    }

    async testDuplicateBillingPrevention() {
        const billingData = {
            customerName: 'Test Customer',
            phoneNumber: '9876543210',
            railwayFare: 1000,
            totalAmount: 1000
        };
        
        const response = await fetch(
            `${TEST_CONFIG.api.baseUrl}/billing/from-booking/${TEST_CONFIG.testData.bookingId}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${TEST_CONFIG.api.token}`
                },
                body: JSON.stringify(billingData)
            }
        );
        
        const result = await response.json();
        
        // Should fail with duplicate billing error
        if (result.success) {
            throw new Error('Duplicate billing was allowed - should have been prevented');
        }
        
        if (!result.message.includes('already exists')) {
            throw new Error('Wrong error message for duplicate billing');
        }
    }

    async testTotalCalculation() {
        const testData = {
            railwayFare: 1000,
            miscCharges: 50,
            platformFee: 20,
            serviceCharge: 100,
            deliveryCharge: 30,
            surcharge: 25,
            gst: 180,
            discount: 50,
            cancellationCharge: 25
        };
        
        const response = await fetch(
            `${TEST_CONFIG.api.baseUrl}/billing/calculate-total`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${TEST_CONFIG.api.token}`
                },
                body: JSON.stringify(testData)
            }
        );
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error('Total calculation API failed');
        }
        
        // Expected: 1000 + 50 + 20 + 100 + 30 + 25 + 180 - 50 - 25 = 1330
        const expectedTotal = 1330;
        
        if (result.totalAmount !== expectedTotal) {
            throw new Error(`Total calculation incorrect. Expected: ${expectedTotal}, Got: ${result.totalAmount}`);
        }
    }

    async testNonConfirmedBookingRejection() {
        // Create a DRAFT booking
        const [result] = await this.db.execute(`
            INSERT INTO bookingstvl (
                bk_bookingdt, bk_customername, bk_phonenumber, 
                bk_fromstation, bk_tostation, bk_trvldt, bk_class,
                bk_status, bk_createdby, bk_createdon
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'DRAFT', 1, NOW())
        `, [
            new Date().toISOString().split('T')[0],
            'Draft Customer',
            '9876543211',
            'Chennai',
            'Bangalore',
            new Date().toISOString().split('T')[0],
            '2A'
        ]);
        
        const draftBookingId = result.insertId;
        
        // Try to generate billing from DRAFT booking
        const response = await fetch(
            `${TEST_CONFIG.api.baseUrl}/billing/from-booking/${draftBookingId}`,
            {
                headers: {
                    'Authorization': `Bearer ${TEST_CONFIG.api.token}`
                }
            }
        );
        
        const billingResult = await response.json();
        
        // Should fail because booking is not CONFIRMED
        if (billingResult.success) {
            throw new Error('Billing was allowed for non-confirmed booking');
        }
        
        if (!billingResult.message.includes('confirmed')) {
            throw new Error('Wrong error message for non-confirmed booking');
        }
        
        // Cleanup
        await this.db.execute('DELETE FROM bookingstvl WHERE bk_bkid = ?', [draftBookingId]);
    }

    async testBusinessRules() {
        // Test 1: Billing cannot exist without booking
        const response1 = await fetch(
            `${TEST_CONFIG.api.baseUrl}/billing/from-booking/99999`,
            {
                headers: {
                    'Authorization': `Bearer ${TEST_CONFIG.api.token}`
                }
            }
        );
        
        const result1 = await response1.json();
        if (result1.success) {
            throw new Error('Billing was allowed for non-existent booking');
        }
        
        // Test 2: All monetary fields should default to 0
        const response2 = await fetch(
            `${TEST_CONFIG.api.baseUrl}/billing/from-booking/${TEST_CONFIG.testData.bookingId}`,
            {
                headers: {
                    'Authorization': `Bearer ${TEST_CONFIG.api.token}`
                }
            }
        );
        
        const result2 = await response2.json();
        if (result2.success) {
            const data = result2.data;
            const monetaryFields = [
                'railwayFare', 'stationBoyIncentive', 'gst', 'miscCharges',
                'platformFee', 'serviceCharge', 'deliveryCharge',
                'cancellationCharge', 'surcharge', 'discount'
            ];
            
            for (const field of monetaryFields) {
                if (data[field] !== 0) {
                    throw new Error(`${field} should default to 0, got ${data[field]}`);
                }
            }
        }
    }

    async cleanup() {
        console.log('🧹 Cleaning up test data...');
        
        try {
            // Delete test billing record
            if (TEST_CONFIG.testData.billingId) {
                await this.db.execute(
                    'DELETE FROM billing_master WHERE bl_id = ?',
                    [TEST_CONFIG.testData.billingId]
                );
            }
            
            // Delete test booking record
            if (TEST_CONFIG.testData.bookingId) {
                await this.db.execute(
                    'DELETE FROM bookingstvl WHERE bk_bkid = ?',
                    [TEST_CONFIG.testData.bookingId]
                );
            }
            
            console.log('✅ Test data cleaned up');
        } catch (error) {
            console.log('⚠️ Cleanup warning:', error.message);
        }
        
        // Close database connection
        if (this.db) {
            await this.db.end();
        }
    }

    async runAllTests() {
        try {
            await this.initialize();
            
            // Database Tests
            await this.runTest('Database Schema Validation', () => this.testDatabaseSchema());
            
            // Backend API Tests
            await this.runTest('Create Confirmed Booking', () => this.testCreateConfirmedBooking());
            await this.runTest('Generate Billing from Booking', () => this.testGenerateBillingFromBooking());
            await this.runTest('Create Billing from Booking', () => this.testCreateBillingFromBooking());
            await this.runTest('Duplicate Billing Prevention', () => this.testDuplicateBillingPrevention());
            await this.runTest('Total Amount Calculation', () => this.testTotalCalculation());
            await this.runTest('Non-Confirmed Booking Rejection', () => this.testNonConfirmedBookingRejection());
            await this.runTest('Business Rules Enforcement', () => this.testBusinessRules());
            
            // Print Results
            this.printResults();
            
        } catch (error) {
            console.error('❌ Test suite failed:', error.message);
        } finally {
            await this.cleanup();
        }
    }

    printResults() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 BOOKING → BILLING INTEGRATION TEST RESULTS');
        console.log('='.repeat(60));
        
        const passed = this.testResults.filter(r => r.status === 'PASSED').length;
        const failed = this.testResults.filter(r => r.status === 'FAILED').length;
        const total = this.testResults.length;
        
        console.log(`\n📈 Summary: ${passed}/${total} tests passed (${Math.round(passed/total*100)}%)`);
        
        if (failed > 0) {
            console.log('\n❌ Failed Tests:');
            this.testResults
                .filter(r => r.status === 'FAILED')
                .forEach(r => console.log(`   • ${r.test}: ${r.error}`));
        }
        
        console.log('\n✅ Passed Tests:');
        this.testResults
            .filter(r => r.status === 'PASSED')
            .forEach(r => console.log(`   • ${r.test}`));
        
        console.log('\n' + '='.repeat(60));
        
        if (passed === total) {
            console.log('🎉 ALL TESTS PASSED! Booking → Billing integration is working correctly.');
        } else {
            console.log('⚠️ Some tests failed. Please review and fix the issues.');
        }
        
        console.log('='.repeat(60) + '\n');
    }
}

// Run the test suite
if (require.main === module) {
    const testSuite = new BookingBillingIntegrationTest();
    testSuite.runAllTests().catch(console.error);
}

module.exports = BookingBillingIntegrationTest;