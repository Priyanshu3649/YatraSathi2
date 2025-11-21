const User = require('../models/User');
const Role = require('../models/Role');
const Station = require('../models/Station');
const Train = require('../models/Train');
const bcrypt = require('bcryptjs');

// Seed roles
const seedRoles = async () => {
  try {
    const roles = [
      {
        roleName: 'Admin',
        description: 'System Administrator with full access',
        userType: 'admin',
        permissions: {
          canCreateEmployee: true,
          canRemoveEmployee: true,
          canApproveRequest: true,
          approvalLimit: 999999,
          canEnterTransaction: true,
          canModifyTransaction: true,
          canViewAllBookings: true,
          canModifyAllBookings: true,
          canViewFinancialReports: true,
          canManageCustomers: true,
          canManageCorporateAccounts: true
        }
      },
      {
        roleName: 'Accounts Team',
        description: 'Accounts team member',
        userType: 'employee',
        department: 'accounts',
        permissions: {
          canCreateEmployee: false,
          canRemoveEmployee: false,
          canApproveRequest: false,
          approvalLimit: 0,
          canEnterTransaction: true,
          canModifyTransaction: true,
          canViewAllBookings: true,
          canModifyAllBookings: false,
          canViewFinancialReports: true,
          canManageCustomers: false,
          canManageCorporateAccounts: false
        }
      },
      {
        roleName: 'Booking Agent',
        description: 'Booking agent who processes Tatkal requests',
        userType: 'employee',
        department: 'agent',
        permissions: {
          canCreateEmployee: false,
          canRemoveEmployee: false,
          canApproveRequest: true,
          approvalLimit: 50000,
          canEnterTransaction: false,
          canModifyTransaction: false,
          canViewAllBookings: true,
          canModifyAllBookings: true,
          canViewFinancialReports: false,
          canManageCustomers: false,
          canManageCorporateAccounts: false
        }
      },
      {
        roleName: 'Customer',
        description: 'Regular customer',
        userType: 'customer',
        permissions: {
          canCreateEmployee: false,
          canRemoveEmployee: false,
          canApproveRequest: false,
          approvalLimit: 0,
          canEnterTransaction: false,
          canModifyTransaction: false,
          canViewAllBookings: false,
          canModifyAllBookings: false,
          canViewFinancialReports: false,
          canManageCustomers: false,
          canManageCorporateAccounts: false
        }
      }
    ];

    for (const roleData of roles) {
      const existingRole = await Role.findOne({ roleName: roleData.roleName });
      if (!existingRole) {
        const role = new Role(roleData);
        await role.save();
        console.log(`Created role: ${role.roleName}`);
      }
    }
  } catch (error) {
    console.error('Error seeding roles:', error);
  }
};

// Seed admin user
const seedAdminUser = async () => {
  try {
    const adminRole = await Role.findOne({ roleName: 'Admin' });
    if (!adminRole) {
      console.log('Admin role not found. Please seed roles first.');
      return;
    }

    const existingAdmin = await User.findOne({ email: 'admin@yatrasathi.com' });
    if (!existingAdmin) {
      const salt = await bcrypt.genSalt(10);
      const password = await bcrypt.hash('Admin@123', salt);

      const admin = new User({
        name: 'System Administrator',
        email: 'admin@yatrasathi.com',
        phone: '9876543210',
        password: password,
        userType: 'admin',
        isActive: true
      });

      await admin.save();
      console.log('Created admin user: admin@yatrasathi.com');
    }
  } catch (error) {
    console.error('Error seeding admin user:', error);
  }
};

// Seed sample stations
const seedStations = async () => {
  try {
    const stations = [
      {
        stationName: 'Chhatrapati Shivaji Maharaj Terminus',
        stationCode: 'CSMT',
        city: 'Mumbai',
        state: 'Maharashtra'
      },
      {
        stationName: 'New Delhi',
        stationCode: 'NDLS',
        city: 'Delhi',
        state: 'Delhi'
      },
      {
        stationName: 'Bangalore City',
        stationCode: 'SBC',
        city: 'Bangalore',
        state: 'Karnataka'
      },
      {
        stationName: 'Chennai Central',
        stationCode: 'MAS',
        city: 'Chennai',
        state: 'Tamil Nadu'
      },
      {
        stationName: 'Howrah Junction',
        stationCode: 'HWH',
        city: 'Kolkata',
        state: 'West Bengal'
      }
    ];

    for (const stationData of stations) {
      const existingStation = await Station.findOne({ stationCode: stationData.stationCode });
      if (!existingStation) {
        const station = new Station(stationData);
        await station.save();
        console.log(`Created station: ${station.stationName}`);
      }
    }
  } catch (error) {
    console.error('Error seeding stations:', error);
  }
};

// Seed sample trains
const seedTrains = async () => {
  try {
    const trains = [
      {
        trainNumber: '12951',
        trainName: 'Mumbai Rajdhani Express',
        departureStation: 'CSMT',
        arrivalStation: 'NDLS',
        departureTime: new Date('2023-01-01T16:55:00'),
        arrivalTime: new Date('2023-01-02T08:35:00'),
        classes: [
          { className: '1A', tatkalAvailable: true },
          { className: '2A', tatkalAvailable: true },
          { className: '3A', tatkalAvailable: true }
        ]
      },
      {
        trainNumber: '12629',
        trainName: 'Karnataka Express',
        departureStation: 'NDLS',
        arrivalStation: 'SBC',
        departureTime: new Date('2023-01-01T21:50:00'),
        arrivalTime: new Date('2023-01-02T21:15:00'),
        classes: [
          { className: '1A', tatkalAvailable: true },
          { className: '2A', tatkalAvailable: true },
          { className: '3A', tatkalAvailable: true },
          { className: 'SL', tatkalAvailable: true }
        ]
      }
    ];

    for (const trainData of trains) {
      const existingTrain = await Train.findOne({ trainNumber: trainData.trainNumber });
      if (!existingTrain) {
        const train = new Train(trainData);
        await train.save();
        console.log(`Created train: ${train.trainName}`);
      }
    }
  } catch (error) {
    console.error('Error seeding trains:', error);
  }
};

// Seed all data
const seedAll = async () => {
  console.log('Seeding database...');
  
  await seedRoles();
  await seedAdminUser();
  await seedStations();
  await seedTrains();
  
  console.log('Database seeding completed.');
};

module.exports = {
  seedRoles,
  seedAdminUser,
  seedStations,
  seedTrains,
  seedAll
};