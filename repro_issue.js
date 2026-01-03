
const { sequelizeTVL } = require('./config/db');
const { EmployeeTVL, UserTVL, RoleTVL } = require('./src/models');

async function runTest() {
  try {
    console.log('Connecting to TVL database...');
    await sequelizeTVL.authenticate();
    console.log('TVL database connected.');

    // Manually define associations if they are missing (similar to the runtime fix)
    // This helps us verify if the issue is in the query execution itself or the model definition
    if (!UserTVL.associations.fnXfunction) {
      console.log('Defining UserTVL -> RoleTVL association');
      UserTVL.belongsTo(RoleTVL, { foreignKey: 'us_roid', targetKey: 'fn_fnid', as: 'fnXfunction' });
    }
    
    if (!EmployeeTVL.associations.manager) {
      console.log('Defining EmployeeTVL -> manager association');
      EmployeeTVL.belongsTo(EmployeeTVL, { foreignKey: 'em_manager', targetKey: 'em_usid', as: 'manager' });
    }

    if (!EmployeeTVL.associations.user) {
      console.log('Defining EmployeeTVL -> user association');
      EmployeeTVL.belongsTo(UserTVL, { foreignKey: 'em_usid', targetKey: 'us_usid', as: 'user' });
    }

    console.log('Executing findAll query...');
    const employees = await EmployeeTVL.findAll({
      include: [
        {
          model: UserTVL,
          as: 'user',
          attributes: ['us_usid', 'us_fname', 'us_lname', 'us_email', 'us_phone', 'us_aadhaar', 'us_pan', 'us_addr1', 'us_addr2', 'us_city', 'us_state', 'us_pin', 'us_roid', 'us_coid', 'us_active'],
          include: [
            {
              model: RoleTVL,
              attributes: ['fn_fnid', 'fn_fnshort', 'fn_fndesc'],
              as: 'fnXfunction'
            }
          ]
        },
        {
          model: EmployeeTVL,
          as: 'manager',
          attributes: ['em_usid', 'em_empno'],
          include: [{
            model: UserTVL,
            as: 'user',
            attributes: ['us_usid', 'us_fname', 'us_lname']
          }],
          required: false
        }
      ],
      order: [['edtm', 'DESC']]
    });

    console.log('Query successful!');
    console.log(`Found ${employees.length} employees.`);
    
  } catch (error) {
    console.error('Query failed!');
    console.error('Error message:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await sequelizeTVL.close();
  }
}

runTest();
