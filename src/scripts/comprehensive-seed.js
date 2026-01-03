const bcrypt = require('bcryptjs');
const { User, Employee, Customer, Login, Booking, Payment, sequelize } = require('../models');

const createComprehensiveData = async () => {
  try {
    console.log('🌱 Creating comprehensive seed data for YatraSathi...');

    // Check if data already exists
    const existingUser = await User.findOne({ where: { us_usid: 'ADM001' } });
    if (existingUser) {
      console.log('✅ Comprehensive data already exists! Skipping creation.');
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('demo123', salt);

    // Start transaction
    const transaction = await sequelize.transaction();

    try {
      // 1. Create Admin User
      await User.create({
        us_usid: 'ADM001',
        us_fname: 'Admin',
        us_lname: 'User',
        us_email: 'admin@yatrasathi.com',
        us_phone: '9999999999',
        us_usertype: 'admin',
        us_roid: 'ADM',
        us_coid: 'TRV',
        us_active: 1,
        eby: 'SYSTEM',
        mby: 'SYSTEM'
      }, { transaction });

      await Login.create({
        lg_usid: 'ADM001',
        lg_email: 'admin@yatrasathi.com',
        lg_passwd: hashedPassword,
        lg_salt: salt,
        lg_active: 1,
        eby: 'SYSTEM',
        mby: 'SYSTEM'
      }, { transaction });

      // 2. Create Employee Users and Employee Records
      const employees = [
        {
          user: {
            us_usid: 'EMP001',
            us_fname: 'Rajesh',
            us_lname: 'Kumar',
            us_email: 'rajesh.kumar@yatrasathi.com',
            us_phone: '9876543210',
            us_aadhaar: '123456789012',
            us_pan: 'ABCDE1234F',
            us_addr1: '123 MG Road',
            us_city: 'Mumbai',
            us_state: 'Maharashtra',
            us_pin: '400001',
            us_usertype: 'employee',
            us_roid: 'AGT',
            us_coid: 'TRV',
            us_active: 1
          },
          employee: {
            em_usid: 'EMP001',
            em_empno: 'E001',
            em_designation: 'Senior Travel Agent',
            em_dept: 'BOOKING',
            em_salary: 35000,
            em_joindt: new Date('2023-01-15'),
            em_status: 'ACTIVE'
          }
        },
        {
          user: {
            us_usid: 'EMP002',
            us_fname: 'Priya',
            us_lname: 'Sharma',
            us_email: 'priya.sharma@yatrasathi.com',
            us_phone: '9876543211',
            us_aadhaar: '123456789013',
            us_pan: 'ABCDE1234G',
            us_addr1: '456 Brigade Road',
            us_city: 'Bangalore',
            us_state: 'Karnataka',
            us_pin: '560001',
            us_usertype: 'employee',
            us_roid: 'ACC',
            us_coid: 'TRV',
            us_active: 1
          },
          employee: {
            em_usid: 'EMP002',
            em_empno: 'E002',
            em_designation: 'Accounts Manager',
            em_dept: 'ACCOUNTS',
            em_salary: 45000,
            em_joindt: new Date('2022-08-20'),
            em_status: 'ACTIVE'
          }
        },
        {
          user: {
            us_usid: 'EMP003',
            us_fname: 'Amit',
            us_lname: 'Patel',
            us_email: 'amit.patel@yatrasathi.com',
            us_phone: '9876543212',
            us_aadhaar: '123456789014',
            us_pan: 'ABCDE1234H',
            us_addr1: '789 SG Highway',
            us_city: 'Ahmedabad',
            us_state: 'Gujarat',
            us_pin: '380001',
            us_usertype: 'employee',
            us_roid: 'HR',
            us_coid: 'TRV',
            us_active: 1
          },
          employee: {
            em_usid: 'EMP003',
            em_empno: 'E003',
            em_designation: 'HR Manager',
            em_dept: 'HR',
            em_salary: 50000,
            em_joindt: new Date('2022-03-10'),
            em_status: 'ACTIVE'
          }
        },
        {
          user: {
            us_usid: 'EMP004',
            us_fname: 'Sunita',
            us_lname: 'Singh',
            us_email: 'sunita.singh@yatrasathi.com',
            us_phone: '9876543213',
            us_aadhaar: '123456789015',
            us_pan: 'ABCDE1234I',
            us_addr1: '321 CP Road',
            us_city: 'Delhi',
            us_state: 'Delhi',
            us_pin: '110001',
            us_usertype: 'employee',
            us_roid: 'SUP',
            us_coid: 'TRV',
            us_active: 1
          },
          employee: {
            em_usid: 'EMP004',
            em_empno: 'E004',
            em_designation: 'Customer Support Executive',
            em_dept: 'SUPPORT',
            em_salary: 30000,
            em_joindt: new Date('2023-06-01'),
            em_status: 'ACTIVE'
          }
        },
        {
          user: {
            us_usid: 'EMP005',
            us_fname: 'Vikram',
            us_lname: 'Reddy',
            us_email: 'vikram.reddy@yatrasathi.com',
            us_phone: '9876543214',
            us_aadhaar: '123456789016',
            us_pan: 'ABCDE1234J',
            us_addr1: '654 Banjara Hills',
            us_city: 'Hyderabad',
            us_state: 'Telangana',
            us_pin: '500001',
            us_usertype: 'employee',
            us_roid: 'MKT',
            us_coid: 'TRV',
            us_active: 1
          },
          employee: {
            em_usid: 'EMP005',
            em_empno: 'E005',
            em_designation: 'Marketing Executive',
            em_dept: 'MARKETING',
            em_salary: 40000,
            em_joindt: new Date('2023-02-15'),
            em_status: 'ACTIVE'
          }
        },
        {
          user: {
            us_usid: 'EMP006',
            us_fname: 'Deepak',
            us_lname: 'Gupta',
            us_email: 'deepak.gupta@yatrasathi.com',
            us_phone: '9876543215',
            us_aadhaar: '123456789017',
            us_pan: 'ABCDE1234K',
            us_addr1: '987 Park Street',
            us_city: 'Kolkata',
            us_state: 'West Bengal',
            us_pin: '700001',
            us_usertype: 'employee',
            us_roid: 'MGR',
            us_coid: 'TRV',
            us_active: 1
          },
          employee: {
            em_usid: 'EMP006',
            em_empno: 'E006',
            em_designation: 'Branch Manager',
            em_dept: 'MANAGEMENT',
            em_salary: 60000,
            em_joindt: new Date('2021-11-01'),
            em_manager: null,
            em_status: 'ACTIVE'
          }
        }
      ];

      // Create employee users and employee records
      for (const emp of employees) {
        await User.create({
          ...emp.user,
          eby: 'SYSTEM',
          mby: 'SYSTEM'
        }, { transaction });

        await Employee.create({
          ...emp.employee,
          eby: 'SYSTEM',
          mby: 'SYSTEM'
        }, { transaction });

        await Login.create({
          lg_usid: emp.user.us_usid,
          lg_email: emp.user.us_email,
          lg_passwd: hashedPassword,
          lg_salt: salt,
          lg_active: 1,
          eby: 'SYSTEM',
          mby: 'SYSTEM'
        }, { transaction });
      }

      // 3. Create Customer Users and Customer Records
      const customers = [
        {
          user: {
            us_usid: 'CUS001',
            us_fname: 'Arjun',
            us_lname: 'Mehta',
            us_email: 'arjun.mehta@gmail.com',
            us_phone: '9876543220',
            us_aadhaar: '123456789020',
            us_pan: 'ABCDE1234L',
            us_addr1: '123 Linking Road',
            us_city: 'Mumbai',
            us_state: 'Maharashtra',
            us_pin: '400050',
            us_usertype: 'customer',
            us_roid: 'CUS',
            us_coid: 'TRV',
            us_active: 1
          },
          customer: {
            cu_usid: 'CUS001',
            cu_custno: 'C001',
            cu_custtype: 'INDIVIDUAL',
            cu_company: null,
            cu_gst: null,
            cu_creditlmt: 50000,
            cu_creditused: 0,
            cu_paymentterms: 'IMMEDIATE',
            cu_status: 'ACTIVE'
          }
        },
        {
          user: {
            us_usid: 'CUS002',
            us_fname: 'Kavya',
            us_lname: 'Reddy',
            us_email: 'kavya.reddy@yahoo.com',
            us_phone: '9876543221',
            us_aadhaar: '123456789021',
            us_pan: 'ABCDE1234M',
            us_addr1: '456 Jubilee Hills',
            us_city: 'Hyderabad',
            us_state: 'Telangana',
            us_pin: '500033',
            us_usertype: 'customer',
            us_roid: 'CUS',
            us_coid: 'TRV',
            us_active: 1
          },
          customer: {
            cu_usid: 'CUS002',
            cu_custno: 'C002',
            cu_custtype: 'INDIVIDUAL',
            cu_company: null,
            cu_gst: null,
            cu_creditlmt: 30000,
            cu_creditused: 0,
            cu_paymentterms: 'IMMEDIATE',
            cu_status: 'ACTIVE'
          }
        },
        {
          user: {
            us_usid: 'CUS003',
            us_fname: 'Ravi',
            us_lname: 'Iyer',
            us_email: 'ravi.iyer@hotmail.com',
            us_phone: '9876543222',
            us_aadhaar: '123456789022',
            us_pan: 'ABCDE1234N',
            us_addr1: '789 T Nagar',
            us_city: 'Chennai',
            us_state: 'Tamil Nadu',
            us_pin: '600017',
            us_usertype: 'customer',
            us_roid: 'CUS',
            us_coid: 'TRV',
            us_active: 1
          },
          customer: {
            cu_usid: 'CUS003',
            cu_custno: 'C003',
            cu_custtype: 'INDIVIDUAL',
            cu_company: null,
            cu_gst: null,
            cu_creditlmt: 75000,
            cu_creditused: 0,
            cu_paymentterms: 'IMMEDIATE',
            cu_status: 'ACTIVE'
          }
        },
        {
          user: {
            us_usid: 'CUS004',
            us_fname: 'Neha',
            us_lname: 'Agarwal',
            us_email: 'neha.agarwal@gmail.com',
            us_phone: '9876543223',
            us_aadhaar: '123456789023',
            us_pan: 'ABCDE1234O',
            us_addr1: '321 Sector 18',
            us_city: 'Noida',
            us_state: 'Uttar Pradesh',
            us_pin: '201301',
            us_usertype: 'customer',
            us_roid: 'CUS',
            us_coid: 'TRV',
            us_active: 1
          },
          customer: {
            cu_usid: 'CUS004',
            cu_custno: 'C004',
            cu_custtype: 'CORPORATE',
            cu_company: 'Tech Solutions Pvt Ltd',
            cu_gst: '07ABCDE1234F1Z5',
            cu_creditlmt: 200000,
            cu_creditused: 0,
            cu_paymentterms: 'NET30',
            cu_status: 'ACTIVE'
          }
        },
        {
          user: {
            us_usid: 'CUS005',
            us_fname: 'Rohit',
            us_lname: 'Sharma',
            us_email: 'rohit.sharma@outlook.com',
            us_phone: '9876543224',
            us_aadhaar: '123456789024',
            us_pan: 'ABCDE1234P',
            us_addr1: '654 Koramangala',
            us_city: 'Bangalore',
            us_state: 'Karnataka',
            us_pin: '560034',
            us_usertype: 'customer',
            us_roid: 'CUS',
            us_coid: 'TRV',
            us_active: 1
          },
          customer: {
            cu_usid: 'CUS005',
            cu_custno: 'C005',
            cu_custtype: 'INDIVIDUAL',
            cu_company: null,
            cu_gst: null,
            cu_creditlmt: 40000,
            cu_creditused: 0,
            cu_paymentterms: 'IMMEDIATE',
            cu_status: 'ACTIVE'
          }
        }
      ];

      // Create customer users and customer records
      for (const cust of customers) {
        await User.create({
          ...cust.user,
          eby: 'SYSTEM',
          mby: 'SYSTEM'
        }, { transaction });

        await Customer.create({
          ...cust.customer,
          eby: 'SYSTEM',
          mby: 'SYSTEM'
        }, { transaction });

        await Login.create({
          lg_usid: cust.user.us_usid,
          lg_email: cust.user.us_email,
          lg_passwd: hashedPassword,
          lg_salt: salt,
          lg_active: 1,
          eby: 'SYSTEM',
          mby: 'SYSTEM'
        }, { transaction });
      }

      // Commit transaction
      await transaction.commit();

      console.log('✅ Comprehensive seed data created successfully!');
      console.log('\n🔐 Login Credentials (Password: demo123):');
      console.log('\n👤 ADMIN LOGIN:');
      console.log('Email: admin@yatrasathi.com');
      
      console.log('\n👥 EMPLOYEE LOGINS:');
      console.log('Rajesh Kumar (Agent): rajesh.kumar@yatrasathi.com');
      console.log('Priya Sharma (Accounts): priya.sharma@yatrasathi.com');
      console.log('Amit Patel (HR): amit.patel@yatrasathi.com');
      console.log('Sunita Singh (Support): sunita.singh@yatrasathi.com');
      console.log('Vikram Reddy (Marketing): vikram.reddy@yatrasathi.com');
      console.log('Deepak Gupta (Manager): deepak.gupta@yatrasathi.com');
      
      console.log('\n👤 CUSTOMER LOGINS:');
      console.log('Arjun Mehta: arjun.mehta@gmail.com');
      console.log('Kavya Reddy: kavya.reddy@yahoo.com');
      console.log('Ravi Iyer: ravi.iyer@hotmail.com');
      console.log('Neha Agarwal (Corporate): neha.agarwal@gmail.com');
      console.log('Rohit Sharma: rohit.sharma@outlook.com');
      
      console.log('\n📊 DATA SUMMARY:');
      console.log('- 1 Admin user');
      console.log('- 6 Employee users with emEmployee records');
      console.log('- 5 Customer users with cuCustomer records');
      console.log('- All users have login credentials');
      
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    console.error('❌ Error creating comprehensive seed data:', error);
    throw error;
  }
};

// Run if called directly
if (require.main === module) {
  createComprehensiveData()
    .then(() => {
      console.log('🎉 Seed data creation completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seed data creation failed:', error);
      process.exit(1);
    });
}

module.exports = { createComprehensiveData };