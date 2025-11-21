const { Role, Permission, RolePermission, User } = require('./src/models');
const Sequelize = require('sequelize');
const jwt = require('jsonwebtoken');

async function testMiddleware() {
  try {
    console.log('=== Testing RBAC Middleware Logic ===\n');
    
    // Simulate a request with admin user
    const user = await User.findByPk('ADM001');
    console.log('User:', user.us_fname);
    
    // Simulate requirePermissionAction('BKG', 'view')
    const permission = 'BKG';
    const action = 'view';
    
    // Get user's role
    const userRole = await Role.findByPk(user.us_roid);
    console.log('User Role:', userRole.ur_rodesc);
    
    // Get the specific permission
    const perm = await Permission.findOne({
      where: {
        [Sequelize.Op.or]: [
          { pr_peid: permission },
          { pr_peshort: permission }
        ]
      }
    });
    console.log('Permission:', perm.pr_pedesc);
    
    // Get role permission for this specific permission
    const rolePermission = await RolePermission.findOne({
      where: {
        rp_roid: userRole.ur_roid,
        rp_peid: perm.pr_peid
      }
    });
    console.log('Role Permission:', rolePermission ? 'Found' : 'Not Found');
    console.log('Can View:', rolePermission.rp_canview);
    
    if (rolePermission && rolePermission.rp_canview === 1) {
      console.log('✓ User has permission to view bookings');
    } else {
      console.log('✗ User does not have permission to view bookings');
    }
  } catch (error) {
    console.error('Test error:', error.message);
    console.error('Error stack:', error.stack);
  }
}

testMiddleware();