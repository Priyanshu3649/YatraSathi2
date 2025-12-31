const bcrypt = require('bcryptjs');
const { User, Employee, Customer, Login, Booking, Payment, CorporateCustomer, sequelize } = require('../models');

const createDemoData = async () => {
  try {
    console.log('🌱 Creating demo data for YatraSathi portals...');

    // Check if demo data already exists
    const existingUser = await User.findOne({ where: { us_usid: 'EMP001' } });
    if (existingUser) {
      console.log('✅ Demo data already exists! Skipping creation.');
      console.log('\n🔐 Login Credentials:');
      console.log('Password for all accounts: demo123\n');
      
      console.log('👥 EMPLOYEE LOGINS:');
      console.log('Agent (Rajesh): rajesh.agent@yatrasathi.com');
      console.log('Accounts (Priya): priya.accounts@yatrasathi.com');
      console.log('HR (Amit): amit.hr@yatrasathi.com');
      console.log('Support (Sunita): sunita.support@yatrasathi.com');
      console.log('Marketing (Vikram): vikram.marketing@yatrasathi.com');
      console.log('Management (Deepak): deepak.manager@yatrasathi.com');
      console.log('Agent (Neha): neha.agent@yatrasathi.com');
      console.log('Agent (Rohit): rohit.agent@yatrasathi.com');
      
      console.log('\n👤 CUSTOMER LOGINS:');
      console.log('Customer 1: arjun.mehta@gmail.com');
      console.log('Customer 2: kavya.reddy@yahoo.com');
      console.log('Customer 3: ravi.iyer@hotmail.com');
      
      console.log('\n🎯 PORTAL ACCESS:');
      console.log('Employee Portal: /auth/employee-login');
      console.log('Customer Portal: /auth/login');
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('demo123', salt);

    // 1. Create Employee Users with different roles
    const employees = [
      {
        user: {
          us_usid: 'EMP001',
          us_fname: 'Rajesh',
          us_lname: 'Kumar',
          us_email: 'rajesh.agent@yatrasathi.com',
          us_phone: '9876543210',
          us_usertype: 'employee',
          us_roid: 'AGT',
          us_coid: 'TRV',
          us_active: 1
        },
        employee: {
          em_usid: 'EMP001',
          em_empno: 'E001',
          em_designation: 'Senior Agent',
          em_dept: 'BOOKING',
          em_salary: 35000,
          em_joindt: new Date('2023-01-15'),
          em_status: 'ACTIVE'
        },
        login: {
          lg_usid: 'EMP001',
          lg_email: 'rajesh.agent@yatrasathi.com',
          lg_passwd: hashedPassword,
          lg_salt: salt,
          lg_active: 1
        }
      },
      {
        user: {
          us_usid: 'EMP002',
          us_fname: 'Priya',
          us_lname: 'Sharma',
          us_email: 'priya.accounts@yatrasathi.com',
          us_phone: '9876543211',
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
        },
        login: {
          lg_usid: 'EMP002',
          lg_email: 'priya.accounts@yatrasathi.com',
          lg_passwd: hashedPassword,
          lg_salt: salt,
          lg_active: 1
        }
      },
      {
        user: {
          us_usid: 'EMP003',
          us_fname: 'Amit',
          us_lname: 'Singh',
          us_email: 'amit.hr@yatrasathi.com',
          us_phone: '9876543212',
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
        },
        login: {
          lg_usid: 'EMP003',
          lg_email: 'amit.hr@yatrasathi.com',
          lg_passwd: hashedPassword,
          lg_salt: salt,
          lg_active: 1
        }
      },
      {
        user: {
          us_usid: 'EMP004',
          us_fname: 'Sunita',
          us_lname: 'Patel',
          us_email: 'sunita.support@yatrasathi.com',
          us_phone: '9876543213',
          us_usertype: 'employee',
          us_roid: 'CC',
          us_coid: 'TRV',
          us_active: 1
        },
        employee: {
          em_usid: 'EMP004',
          em_empno: 'E004',
          em_designation: 'Support Executive',
          em_dept: 'SUPPORT',
          em_salary: 28000,
          em_joindt: new Date('2023-06-01'),
          em_status: 'ACTIVE'
        },
        login: {
          lg_usid: 'EMP004',
          lg_email: 'sunita.support@yatrasathi.com',
          lg_passwd: hashedPassword,
          lg_salt: salt,
          lg_active: 1
        }
      },
      {
        user: {
          us_usid: 'EMP005',
          us_fname: 'Vikram',
          us_lname: 'Gupta',
          us_email: 'vikram.marketing@yatrasathi.com',
          us_phone: '9876543214',
          us_usertype: 'employee',
          us_roid: 'MKT',
          us_coid: 'TRV',
          us_active: 1
        },
        employee: {
          em_usid: 'EMP005',
          em_empno: 'E005',
          em_designation: 'Marketing Manager',
          em_dept: 'MARKETING',
          em_salary: 55000,
          em_joindt: new Date('2021-11-15'),
          em_status: 'ACTIVE'
        },
        login: {
          lg_usid: 'EMP005',
          lg_email: 'vikram.marketing@yatrasathi.com',
          lg_passwd: hashedPassword,
          lg_salt: salt,
          lg_active: 1
        }
      },
      {
        user: {
          us_usid: 'EMP006',
          us_fname: 'Deepak',
          us_lname: 'Agarwal',
          us_email: 'deepak.manager@yatrasathi.com',
          us_phone: '9876543215',
          us_usertype: 'employee',
          us_roid: 'MGT',
          us_coid: 'TRV',
          us_active: 1
        },
        employee: {
          em_usid: 'EMP006',
          em_empno: 'E006',
          em_designation: 'General Manager',
          em_dept: 'MANAGEMENT',
          em_salary: 85000,
          em_joindt: new Date('2020-01-01'),
          em_status: 'ACTIVE',
          em_manager: null
        },
        login: {
          lg_usid: 'EMP006',
          lg_email: 'deepak.manager@yatrasathi.com',
          lg_passwd: hashedPassword,
          lg_salt: salt,
          lg_active: 1
        }
      },
      // Additional agents for performance data
      {
        user: {
          us_usid: 'EMP007',
          us_fname: 'Neha',
          us_lname: 'Joshi',
          us_email: 'neha.agent@yatrasathi.com',
          us_phone: '9876543216',
          us_usertype: 'employee',
          us_roid: 'AGT',
          us_coid: 'TRV',
          us_active: 1
        },
        employee: {
          em_usid: 'EMP007',
          em_empno: 'E007',
          em_designation: 'Agent',
          em_dept: 'BOOKING',
          em_salary: 30000,
          em_joindt: new Date('2023-09-01'),
          em_status: 'ACTIVE',
          em_manager: 'EMP001'
        },
        login: {
          lg_usid: 'EMP007',
          lg_email: 'neha.agent@yatrasathi.com',
          lg_passwd: hashedPassword,
          lg_salt: salt,
          lg_active: 1
        }
      },
      {
        user: {
          us_usid: 'EMP008',
          us_fname: 'Rohit',
          us_lname: 'Verma',
          us_email: 'rohit.agent@yatrasathi.com',
          us_phone: '9876543217',
          us_usertype: 'employee',
          us_roid: 'AGT',
          us_coid: 'TRV',
          us_active: 1
        },
        employee: {
          em_usid: 'EMP008',
          em_empno: 'E008',
          em_designation: 'Junior Agent',
          em_dept: 'BOOKING',
          em_salary: 25000,
          em_joindt: new Date('2024-01-15'),
          em_status: 'ACTIVE',
          em_manager: 'EMP001'
        },
        login: {
          lg_usid: 'EMP008',
          lg_email: 'rohit.agent@yatrasathi.com',
          lg_passwd: hashedPassword,
          lg_salt: salt,
          lg_active: 1
        }
      }
    ];

    // Create employee data
    for (const emp of employees) {
      await User.create({ ...emp.user, eby: 'SYSTEM', mby: 'SYSTEM' });
      await Employee.create({ ...emp.employee, eby: 'SYSTEM', mby: 'SYSTEM' });
      await Login.create({ ...emp.login, eby: 'SYSTEM', mby: 'SYSTEM' });
    }

    // 2. Create Customer Users
    const customers = [
      {
        user: {
          us_usid: 'CUS001',
          us_fname: 'Arjun',
          us_lname: 'Mehta',
          us_email: 'arjun.mehta@gmail.com',
          us_phone: '9123456789',
          us_usertype: 'customer',
          us_roid: 'CUS',
          us_coid: 'TRV',
          us_active: 1
        },
        customer: {
          cu_usid: 'CUS001',
          cu_name: 'Arjun Mehta',
          cu_email: 'arjun.mehta@gmail.com',
          cu_phone: '9123456789',
          cu_address: '123 MG Road, Bangalore',
          cu_city: 'Bangalore',
          cu_state: 'Karnataka',
          cu_pincode: '560001',
          cu_active: 1
        },
        login: {
          lg_usid: 'CUS001',
          lg_email: 'arjun.mehta@gmail.com',
          lg_passwd: hashedPassword,
          lg_salt: salt,
          lg_active: 1
        }
      },
      {
        user: {
          us_usid: 'CUS002',
          us_fname: 'Kavya',
          us_lname: 'Reddy',
          us_email: 'kavya.reddy@yahoo.com',
          us_phone: '9123456790',
          us_usertype: 'customer',
          us_roid: 'CUS',
          us_coid: 'TRV',
          us_active: 1
        },
        customer: {
          cu_usid: 'CUS002',
          cu_name: 'Kavya Reddy',
          cu_email: 'kavya.reddy@yahoo.com',
          cu_phone: '9123456790',
          cu_address: '456 Park Street, Mumbai',
          cu_city: 'Mumbai',
          cu_state: 'Maharashtra',
          cu_pincode: '400001',
          cu_active: 1
        },
        login: {
          lg_usid: 'CUS002',
          lg_email: 'kavya.reddy@yahoo.com',
          lg_passwd: hashedPassword,
          lg_salt: salt,
          lg_active: 1
        }
      },
      {
        user: {
          us_usid: 'CUS003',
          us_fname: 'Ravi',
          us_lname: 'Iyer',
          us_email: 'ravi.iyer@hotmail.com',
          us_phone: '9123456791',
          us_usertype: 'customer',
          us_roid: 'CUS',
          us_coid: 'TRV',
          us_active: 1
        },
        customer: {
          cu_usid: 'CUS003',
          cu_name: 'Ravi Iyer',
          cu_email: 'ravi.iyer@hotmail.com',
          cu_phone: '9123456791',
          cu_address: '789 CP, New Delhi',
          cu_city: 'New Delhi',
          cu_state: 'Delhi',
          cu_pincode: '110001',
          cu_active: 1
        },
        login: {
          lg_usid: 'CUS003',
          lg_email: 'ravi.iyer@hotmail.com',
          lg_passwd: hashedPassword,
          lg_salt: salt,
          lg_active: 1
        }
      }
    ];

    // Create customer data
    for (const cust of customers) {
      await User.create({ ...cust.user, eby: 'SYSTEM', mby: 'SYSTEM' });
      await Customer.create({ ...cust.customer, eby: 'SYSTEM', mby: 'SYSTEM' });
      await Login.create({ ...cust.login, eby: 'SYSTEM', mby: 'SYSTEM' });
    }

    // 3. Create Corporate Customers for Marketing Dashboard
    const corporateCustomers = [
      {
        cc_ccid: 'CC001',
        cc_company: 'TechCorp Solutions',
        cc_contact_person: 'Rajesh Kumar',
        cc_email: 'rajesh@techcorp.com',
        cc_phone: '9876543220',
        cc_address: 'Tech Park, Whitefield',
        cc_city: 'Bangalore',
        cc_state: 'Karnataka',
        cc_pincode: '560066',
        cc_active: 1,
        eby: 'EMP005',
        mby: 'EMP005'
      },
      {
        cc_ccid: 'CC002',
        cc_company: 'Global Industries Ltd',
        cc_contact_person: 'Priya Sharma',
        cc_email: 'priya@globalind.com',
        cc_phone: '9876543221',
        cc_address: 'Industrial Area, Gurgaon',
        cc_city: 'Gurgaon',
        cc_state: 'Haryana',
        cc_pincode: '122001',
        cc_active: 1,
        eby: 'EMP005',
        mby: 'EMP005'
      },
      {
        cc_ccid: 'CC003',
        cc_company: 'Innovative Systems',
        cc_contact_person: 'Amit Patel',
        cc_email: 'amit@innovative.com',
        cc_phone: '9876543222',
        cc_address: 'IT Hub, Pune',
        cc_city: 'Pune',
        cc_state: 'Maharashtra',
        cc_pincode: '411001',
        cc_active: 1,
        eby: 'EMP005',
        mby: 'EMP005'
      }
    ];

    for (const corp of corporateCustomers) {
      await CorporateCustomer.create(corp);
    }

    // 4. Create Bookings with different statuses and dates
    const bookings = [
      // Recent bookings for different agents
      {
        bk_bkid: 'BK001',
        bk_cuid: 'CUS001',
        bk_euid: 'EMP001',
        bk_from: 'New Delhi',
        bk_to: 'Mumbai',
        bk_jdate: new Date('2024-02-15'),
        bk_class: '3A',
        bk_berth: 'LOWER',
        bk_pax: 2,
        bk_status: 'CONFIRMED',
        bk_amount: 4500,
        eby: 'EMP001',
        mby: 'EMP001'
      },
      {
        bk_bkid: 'BK002',
        bk_cuid: 'CUS002',
        bk_euid: 'EMP001',
        bk_from: 'Bangalore',
        bk_to: 'Chennai',
        bk_jdate: new Date('2024-02-20'),
        bk_class: 'SL',
        bk_berth: 'NO_PREF',
        bk_pax: 1,
        bk_status: 'PENDING',
        bk_amount: 800,
        eby: 'EMP001',
        mby: 'EMP001'
      },
      {
        bk_bkid: 'BK003',
        bk_cuid: 'CUS003',
        bk_euid: 'EMP007',
        bk_from: 'Mumbai',
        bk_to: 'Pune',
        bk_jdate: new Date('2024-02-10'),
        bk_class: '2A',
        bk_berth: 'UPPER',
        bk_pax: 3,
        bk_status: 'CONFIRMED',
        bk_amount: 3200,
        eby: 'EMP007',
        mby: 'EMP007'
      },
      {
        bk_bkid: 'BK004',
        bk_cuid: 'CUS001',
        bk_euid: 'EMP008',
        bk_from: 'Delhi',
        bk_to: 'Kolkata',
        bk_jdate: new Date('2024-01-25'),
        bk_class: '1A',
        bk_berth: 'LOWER',
        bk_pax: 2,
        bk_status: 'CONFIRMED',
        bk_amount: 6800,
        eby: 'EMP008',
        mby: 'EMP008'
      },
      {
        bk_bkid: 'BK005',
        bk_cuid: 'CUS002',
        bk_euid: 'EMP001',
        bk_from: 'Chennai',
        bk_to: 'Bangalore',
        bk_jdate: new Date('2024-01-30'),
        bk_class: 'CC',
        bk_berth: 'NO_PREF',
        bk_pax: 1,
        bk_status: 'CANCELLED',
        bk_amount: 500,
        eby: 'EMP001',
        mby: 'EMP001'
      },
      // More bookings for this month to show performance
      {
        bk_bkid: 'BK006',
        bk_cuid: 'CUS003',
        bk_euid: 'EMP001',
        bk_from: 'Hyderabad',
        bk_to: 'Bangalore',
        bk_jdate: new Date('2024-02-05'),
        bk_class: 'SL',
        bk_berth: 'MIDDLE',
        bk_pax: 4,
        bk_status: 'CONFIRMED',
        bk_amount: 2400,
        eby: 'EMP001',
        mby: 'EMP001'
      },
      {
        bk_bkid: 'BK007',
        bk_cuid: 'CUS001',
        bk_euid: 'EMP007',
        bk_from: 'Pune',
        bk_to: 'Mumbai',
        bk_jdate: new Date('2024-02-12'),
        bk_class: '3A',
        bk_berth: 'SIDE_LOWER',
        bk_pax: 2,
        bk_status: 'CONFIRMED',
        bk_amount: 1800,
        eby: 'EMP007',
        mby: 'EMP007'
      },
      {
        bk_bkid: 'BK008',
        bk_cuid: 'CUS002',
        bk_euid: 'EMP008',
        bk_from: 'Kolkata',
        bk_to: 'Delhi',
        bk_jdate: new Date('2024-02-18'),
        bk_class: '2A',
        bk_berth: 'LOWER',
        bk_pax: 1,
        bk_status: 'PENDING',
        bk_amount: 2200,
        eby: 'EMP008',
        mby: 'EMP008'
      }
    ];

    for (const booking of bookings) {
      await Booking.create(booking);
    }

    // 5. Create Payments
    const payments = [
      {
        pt_ptid: 'PT001',
        pt_bkid: 'BK001',
        pt_amount: 4500,
        pt_mode: 'UPI',
        pt_status: 'PROCESSED',
        pt_ref: 'UPI123456789',
        eby: 'EMP002',
        mby: 'EMP002'
      },
      {
        pt_ptid: 'PT002',
        pt_bkid: 'BK003',
        pt_amount: 3200,
        pt_mode: 'CARD',
        pt_status: 'PROCESSED',
        pt_ref: 'CARD987654321',
        eby: 'EMP002',
        mby: 'EMP002'
      },
      {
        pt_ptid: 'PT003',
        pt_bkid: 'BK004',
        pt_amount: 6800,
        pt_mode: 'NEFT',
        pt_status: 'PROCESSED',
        pt_ref: 'NEFT456789123',
        eby: 'EMP002',
        mby: 'EMP002'
      },
      {
        pt_ptid: 'PT004',
        pt_bkid: 'BK006',
        pt_amount: 2400,
        pt_mode: 'UPI',
        pt_status: 'PENDING',
        pt_ref: 'UPI789123456',
        eby: 'EMP002',
        mby: 'EMP002'
      },
      {
        pt_ptid: 'PT005',
        pt_bkid: 'BK007',
        pt_amount: 1800,
        pt_mode: 'CASH',
        pt_status: 'PENDING',
        pt_ref: 'CASH001',
        eby: 'EMP002',
        mby: 'EMP002'
      },
      {
        pt_ptid: 'PT006',
        pt_bkid: 'BK002',
        pt_amount: 800,
        pt_mode: 'UPI',
        pt_status: 'PENDING',
        pt_ref: 'UPI456123789',
        eby: 'EMP002',
        mby: 'EMP002'
      }
    ];

    for (const payment of payments) {
      await Payment.create(payment);
    }

    console.log('✅ Demo data created successfully!');
    console.log('\n🔐 Login Credentials:');
    console.log('Password for all accounts: demo123\n');
    
    console.log('👥 EMPLOYEE LOGINS:');
    console.log('Agent (Rajesh): rajesh.agent@yatrasathi.com');
    console.log('Accounts (Priya): priya.accounts@yatrasathi.com');
    console.log('HR (Amit): amit.hr@yatrasathi.com');
    console.log('Support (Sunita): sunita.support@yatrasathi.com');
    console.log('Marketing (Vikram): vikram.marketing@yatrasathi.com');
    console.log('Management (Deepak): deepak.manager@yatrasathi.com');
    console.log('Agent (Neha): neha.agent@yatrasathi.com');
    console.log('Agent (Rohit): rohit.agent@yatrasathi.com');
    
    console.log('\n👤 CUSTOMER LOGINS:');
    console.log('Customer 1: arjun.mehta@gmail.com');
    console.log('Customer 2: kavya.reddy@yahoo.com');
    console.log('Customer 3: ravi.iyer@hotmail.com');
    
    console.log('\n📊 DATA SUMMARY:');
    console.log(`- ${employees.length} Employees created`);
    console.log(`- ${customers.length} Customers created`);
    console.log(`- ${corporateCustomers.length} Corporate customers created`);
    console.log(`- ${bookings.length} Bookings created`);
    console.log(`- ${payments.length} Payments created`);
    
    console.log('\n🎯 PORTAL ACCESS:');
    console.log('Employee Portal: /auth/employee-login');
    console.log('Customer Portal: /auth/login');

  } catch (error) {
    console.error('❌ Error creating demo data:', error);
    throw error;
  }
};

module.exports = { createDemoData };

// Run if called directly
if (require.main === module) {
  const { connectDB } = require('../../config/db');
  
  connectDB().then(async () => {
    await createDemoData();
    process.exit(0);
  }).catch((error) => {
    console.error('Failed to connect to database:', error);
    process.exit(1);
  });
}