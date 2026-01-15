const { sequelize } = require('./config/db');
const RoleTVL = require('./src/models/RoleTVL');

const addMissingRoles = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to database');

    // Define missing roles
    const missingRoles = [
      {
        fn_fnid: 'AGT',
        fn_fnshort: 'Agent',
        fn_fndesc: 'Sales Agent Role',
        fn_rmrks: 'Handles customer bookings and interactions',
        fn_active: 1,
        fn_eby: 'SYSTEM',
        fn_edtm: new Date()
      },
      {
        fn_fnid: 'CUS',
        fn_fnshort: 'Customer',
        fn_fndesc: 'Customer Role',
        fn_rmrks: 'Customer access level',
        fn_active: 1,
        fn_eby: 'SYSTEM',
        fn_edtm: new Date()
      }
    ];

    for (const role of missingRoles) {
      const existing = await RoleTVL.findByPk(role.fn_fnid);
      if (!existing) {
        await RoleTVL.create(role);
        console.log(`Created role: ${role.fn_fnshort} (${role.fn_fnid})`);
      } else {
        console.log(`Role already exists: ${role.fn_fnshort} (${role.fn_fnid})`);
      }
    }

    console.log('Missing roles processing completed!');
  } catch (error) {
    console.error('Error adding missing roles:', error);
  }
};

addMissingRoles();