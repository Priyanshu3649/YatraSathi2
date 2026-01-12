const { sequelize } = require('../config/db');
const RoleTVL = require('../models/RoleTVL');
const PermissionTVL = require('../models/PermissionTVL');
const RolePermissionTVL = require('../models/RolePermissionTVL');

const seedDefaultRoles = async () => {
  try {
    console.log('Starting RBAC role seeding...');

    // Define the initial system roles
    const roles = [
      {
        fn_fnid: 'ACC',
        fn_fnshort: 'Accountant',
        fn_fndesc: 'Primary Responsibility: Payments, Billing, Financial Reports',
        fn_rmrks: 'Can VIEW, NEW, EDIT, APPROVE, SEARCH payments and billing. Restricted from employee management and system configuration.',
        fn_active: 1
      },
      {
        fn_fnid: 'MGR',
        fn_fnshort: 'Manager',
        fn_fndesc: 'Primary Responsibility: Oversight, approvals, reports',
        fn_rmrks: 'Can VIEW bookings, payments, travel plans and GENERATE reports. Can APPROVE bookings, payments, and travel plans. Cannot delete records.',
        fn_active: 1
      },
      {
        fn_fnid: 'ADX',
        fn_fnshort: 'Administration Executive',
        fn_fndesc: 'Primary Responsibility: System configuration & master data',
        fn_rmrks: 'Full CRUD on users, employees, roles, permissions, customers. Only role that can manage roles & permissions.',
        fn_active: 1
      },
      {
        fn_fnid: 'SAG',
        fn_fnshort: 'Sales Agent',
        fn_fndesc: 'Primary Responsibility: Customer interaction & bookings',
        fn_rmrks: 'Can VIEW, NEW, EDIT customers and bookings. Can VIEW travel plans. Cannot delete bookings or approve payments.',
        fn_active: 1
      },
      {
        fn_fnid: 'OPM',
        fn_fnshort: 'Operations Manager',
        fn_fndesc: 'Primary Responsibility: Execution & operations flow',
        fn_rmrks: 'Can VIEW, EDIT, CONFIRM, CANCEL bookings. Can NEW, EDIT, DELETE travel plans. Can manage operational status.',
        fn_active: 1
      }
    ];

    // Create roles if they don't exist
    for (const role of roles) {
      const existingRole = await RoleTVL.findByPk(role.fn_fnid);
      if (!existingRole) {
        await RoleTVL.create({
          ...role,
          fn_eby: 'SYSTEM',
          fn_edtm: new Date()
        });
        console.log(`Created role: ${role.fn_fnshort}`);
      } else {
        console.log(`Role already exists: ${role.fn_fnshort}`);
      }
    }

    console.log('RBAC role seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding RBAC roles:', error);
    throw error;
  }
};

const seedRolePermissions = async () => {
  try {
    console.log('Starting role permission seeding...');

    // Define role permissions based on requirements
    const rolePermissions = [
      // Accountant permissions
      { fp_fnid: 'ACC', fp_opid: 'PYMT_VIEW', fp_allow: 1, fp_rmrks: 'View payments' },
      { fp_fnid: 'ACC', fp_opid: 'PYMT_NEW', fp_allow: 1, fp_rmrks: 'Create payments' },
      { fp_fnid: 'ACC', fp_opid: 'PYMT_EDIT', fp_allow: 1, fp_rmrks: 'Edit payments' },
      { fp_fnid: 'ACC', fp_opid: 'PYMT_APPROVE', fp_allow: 1, fp_rmrks: 'Approve payments' },
      { fp_fnid: 'ACC', fp_opid: 'PYMT_SEARCH', fp_allow: 1, fp_rmrks: 'Search payments' },
      { fp_fnid: 'ACC', fp_opid: 'BILL_VIEW', fp_allow: 1, fp_rmrks: 'View billing' },
      { fp_fnid: 'ACC', fp_opid: 'BILL_GEN', fp_allow: 1, fp_rmrks: 'Generate billing' },
      { fp_fnid: 'ACC', fp_opid: 'BILL_PRINT', fp_allow: 1, fp_rmrks: 'Print billing' },
      { fp_fnid: 'ACC', fp_opid: 'RPT_REV', fp_allow: 1, fp_rmrks: 'Revenue reports' },
      { fp_fnid: 'ACC', fp_opid: 'RPT_PYMT', fp_allow: 1, fp_rmrks: 'Payment reports' },
      
      // Manager permissions
      { fp_fnid: 'MGR', fp_opid: 'DASH_VIEW', fp_allow: 1, fp_rmrks: 'View dashboard' },
      { fp_fnid: 'MGR', fp_opid: 'BKNG_VIEW', fp_allow: 1, fp_rmrks: 'View bookings' },
      { fp_fnid: 'MGR', fp_opid: 'BKNG_SEARCH', fp_allow: 1, fp_rmrks: 'Search bookings' },
      { fp_fnid: 'MGR', fp_opid: 'BKNG_APPROVE', fp_allow: 1, fp_rmrks: 'Approve bookings' },
      { fp_fnid: 'MGR', fp_opid: 'PYMT_VIEW', fp_allow: 1, fp_rmrks: 'View payments' },
      { fp_fnid: 'MGR', fp_opid: 'PYMT_APPROVE', fp_allow: 1, fp_rmrks: 'Approve payments' },
      { fp_fnid: 'MGR', fp_opid: 'TPLN_VIEW', fp_allow: 1, fp_rmrks: 'View travel plans' },
      { fp_fnid: 'MGR', fp_opid: 'TPLN_APPROVE', fp_allow: 1, fp_rmrks: 'Approve travel plans' },
      { fp_fnid: 'MGR', fp_opid: 'RPT_ALL', fp_allow: 1, fp_rmrks: 'All reports' },
      
      // Administration Executive permissions
      { fp_fnid: 'ADX', fp_opid: 'APP_LIST', fp_allow: 1, fp_rmrks: 'Application list' },
      { fp_fnid: 'ADX', fp_opid: 'MOD_LIST', fp_allow: 1, fp_rmrks: 'Module list' },
      { fp_fnid: 'ADX', fp_opid: 'OP_LIST', fp_allow: 1, fp_rmrks: 'Operation list' },
      { fp_fnid: 'ADX', fp_opid: 'ROLE_LIST', fp_allow: 1, fp_rmrks: 'Role list' },
      { fp_fnid: 'ADX', fp_opid: 'USR_LIST', fp_allow: 1, fp_rmrks: 'User list' },
      { fp_fnid: 'ADX', fp_opid: 'ROLE_PERM', fp_allow: 1, fp_rmrks: 'Role permission' },
      { fp_fnid: 'ADX', fp_opid: 'USR_PERM', fp_allow: 1, fp_rmrks: 'User permission' },
      { fp_fnid: 'ADX', fp_opid: 'CUST_LIST', fp_allow: 1, fp_rmrks: 'Customer list' },
      { fp_fnid: 'ADX', fp_opid: 'EMPL_MGT', fp_allow: 1, fp_rmrks: 'Employee management' },
      { fp_fnid: 'ADX', fp_opid: 'EMPL_CRUD', fp_allow: 1, fp_rmrks: 'Employee CRUD' },
      { fp_fnid: 'ADX', fp_opid: 'EMPL_NEW', fp_allow: 1, fp_rmrks: 'Employee new' },
      { fp_fnid: 'ADX', fp_opid: 'EMPL_EDIT', fp_allow: 1, fp_rmrks: 'Employee edit' },
      { fp_fnid: 'ADX', fp_opid: 'EMPL_DELETE', fp_allow: 1, fp_rmrks: 'Employee delete' },
      { fp_fnid: 'ADX', fp_opid: 'EMPL_SEARCH', fp_allow: 1, fp_rmrks: 'Employee search' },
      { fp_fnid: 'ADX', fp_opid: 'EMPL_ACT', fp_allow: 1, fp_rmrks: 'Employee activate/deactivate' },
      
      // Sales Agent permissions
      { fp_fnid: 'SAG', fp_opid: 'CUST_VIEW', fp_allow: 1, fp_rmrks: 'Customer view' },
      { fp_fnid: 'SAG', fp_opid: 'CUST_NEW', fp_allow: 1, fp_rmrks: 'Customer new' },
      { fp_fnid: 'SAG', fp_opid: 'CUST_EDIT', fp_allow: 1, fp_rmrks: 'Customer edit' },
      { fp_fnid: 'SAG', fp_opid: 'BKNG_NEW', fp_allow: 1, fp_rmrks: 'Booking new' },
      { fp_fnid: 'SAG', fp_opid: 'BKNG_EDIT', fp_allow: 1, fp_rmrks: 'Booking edit' },
      { fp_fnid: 'SAG', fp_opid: 'BKNG_VIEW', fp_allow: 1, fp_rmrks: 'Booking view' },
      { fp_fnid: 'SAG', fp_opid: 'BKNG_SEARCH', fp_allow: 1, fp_rmrks: 'Booking search' },
      { fp_fnid: 'SAG', fp_opid: 'TPLN_VIEW', fp_allow: 1, fp_rmrks: 'Travel plan view' },
      
      // Operations Manager permissions
      { fp_fnid: 'OPM', fp_opid: 'BKNG_VIEW', fp_allow: 1, fp_rmrks: 'Booking view' },
      { fp_fnid: 'OPM', fp_opid: 'BKNG_EDIT', fp_allow: 1, fp_rmrks: 'Booking edit' },
      { fp_fnid: 'OPM', fp_opid: 'BKNG_CONFIRM', fp_allow: 1, fp_rmrks: 'Booking confirm' },
      { fp_fnid: 'OPM', fp_opid: 'BKNG_CANCEL', fp_allow: 1, fp_rmrks: 'Booking cancel' },
      { fp_fnid: 'OPM', fp_opid: 'TPLN_NEW', fp_allow: 1, fp_rmrks: 'Travel plan new' },
      { fp_fnid: 'OPM', fp_opid: 'TPLN_EDIT', fp_allow: 1, fp_rmrks: 'Travel plan edit' },
      { fp_fnid: 'OPM', fp_opid: 'TPLN_DELETE', fp_allow: 1, fp_rmrks: 'Travel plan delete' },
      { fp_fnid: 'OPM', fp_opid: 'RPT_BKNG', fp_allow: 1, fp_rmrks: 'Booking reports' },
      { fp_fnid: 'OPM', fp_opid: 'RPT_OP', fp_allow: 1, fp_rmrks: 'Operations reports' },
    ];

    // Create role permissions if they don't exist
    for (const perm of rolePermissions) {
      const existingPerm = await RolePermissionTVL.findOne({
        where: {
          fp_fnid: perm.fp_fnid,
          fp_opid: perm.fp_opid
        }
      });
      
      if (!existingPerm) {
        await RolePermissionTVL.create({
          ...perm,
          fp_active: 1,
          fp_eby: 'SYSTEM',
          fp_edtm: new Date()
        });
        console.log(`Created role permission: ${perm.fp_fnid} - ${perm.fp_opid}`);
      } else {
        console.log(`Role permission already exists: ${perm.fp_fnid} - ${perm.fp_opid}`);
      }
    }

    console.log('Role permission seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding role permissions:', error);
    throw error;
  }
};

const seedRBAC = async () => {
  try {
    await seedDefaultRoles();
    await seedRolePermissions();
    console.log('RBAC seeding completed successfully!');
  } catch (error) {
    console.error('Error in RBAC seeding:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  seedRBAC();
}

module.exports = { seedRBAC, seedDefaultRoles, seedRolePermissions };