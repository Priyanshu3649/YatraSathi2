const { User, Employee } = require('./src/models');

async function testEmployeeData() {
  try {
    // Get employee user with employee data
    const employeeUser = await User.findByPk('EMP001', {
      include: [{
        model: Employee,
        required: false
      }]
    });
    
    console.log('Employee user:', employeeUser.toJSON());
    console.log('Employee data:', employeeUser.employee ? employeeUser.employee.toJSON() : null);
    console.log('Department:', employeeUser.employee ? employeeUser.employee.em_dept : 'No employee data');
  } catch (error) {
    console.error('Error:', error);
  }
}

testEmployeeData();