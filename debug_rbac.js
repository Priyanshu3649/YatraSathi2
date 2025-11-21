const { Role, Permission, RolePermission, User } = require('./src/models');

async function debugRBAC() {
  try {
    console.log('=== Debugging RBAC System ===\n');
    
    // Get admin user
    const user = await User.findByPk('ADM001');
    console.log('User:', user ? user.toJSON() : 'User not found');
    
    if (user) {
      // Get user's role
      const role = await Role.findByPk(user.us_roid);
      console.log('Role:', role ? role.toJSON() : 'Role not found');
      
      if (role) {
        // Get all permissions for this role
        const rolePermissions = await RolePermission.findAll({
          where: { rp_roid: role.ur_roid },
          include: [{
            model: Permission,
            as: 'Permission'
          }]
        });
        console.log('Role Permissions:', rolePermissions.length);
        rolePermissions.forEach(rp => {
          console.log('  -', rp.toJSON());
        });
        
        // Get specific permission
        const perm = await Permission.findOne({
          where: {
            pr_peid: 'BKG'
          }
        });
        console.log('Booking Permission:', perm ? perm.toJSON() : 'Permission not found');
      }
    }
  } catch (error) {
    console.error('Debug error:', error.message);
    console.error('Error stack:', error.stack);
  }
}

debugRBAC();