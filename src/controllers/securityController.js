const ApplicationTVL = require('../models/ApplicationTVL');
const ModuleTVL = require('../models/ModuleTVL');
const PermissionTVL = require('../models/PermissionTVL');
const RoleTVL = require('../models/RoleTVL');
const UserTVL = require('../models/UserTVL');
const RolePermissionTVL = require('../models/RolePermissionTVL');
const UserPermissionTVL = require('../models/UserPermissionTVL');

// ==================== APPLICATION OPERATIONS ====================

// Get all applications
const getAllApplications = async (req, res) => {
  try {
    const applications = await ApplicationTVL.findAll({
      where: { ap_active: 1 },
      order: [['ap_apid', 'ASC']],
      raw: true
    });
    res.json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ message: error.message });
  }
};

// Create application
const createApplication = async (req, res) => {
  try {
    const { ap_apid, ap_apshort, ap_apdesc, ap_rmrks } = req.body;
    
    const application = await ApplicationTVL.create({
      ap_apid,
      ap_apshort,
      ap_apdesc,
      ap_rmrks,
      ap_active: 1,
      ap_eby: req.user?.us_usid || 'SYSTEM',
      ap_edtm: new Date()
    });
    
    res.status(201).json(application);
  } catch (error) {
    console.error('Error creating application:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update application
const updateApplication = async (req, res) => {
  try {
    const { ap_apshort, ap_apdesc, ap_rmrks } = req.body;
    
    const application = await ApplicationTVL.findByPk(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    await application.update({
      ap_apshort: ap_apshort || application.ap_apshort,
      ap_apdesc: ap_apdesc || application.ap_apdesc,
      ap_rmrks: ap_rmrks || application.ap_rmrks,
      ap_mby: req.user?.us_usid || 'SYSTEM',
      ap_mdtm: new Date()
    });
    
    res.json(application);
  } catch (error) {
    console.error('Error updating application:', error);
    res.status(500).json({ message: error.message });
  }
};

// Delete application
const deleteApplication = async (req, res) => {
  try {
    const application = await ApplicationTVL.findByPk(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    await application.destroy();
    res.json({ message: 'Application deleted successfully' });
  } catch (error) {
    console.error('Error deleting application:', error);
    res.status(500).json({ message: error.message });
  }
};

// ==================== MODULE OPERATIONS ====================

// Get all modules
const getAllModules = async (req, res) => {
  try {
    const modules = await ModuleTVL.findAll({
      where: { mo_active: 1 },
      order: [['mo_apid', 'ASC'], ['mo_moid', 'ASC']],
      raw: true
    });
    res.json(modules);
  } catch (error) {
    console.error('Error fetching modules:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get modules by application
const getModulesByApplication = async (req, res) => {
  try {
    const modules = await ModuleTVL.findAll({
      where: { 
        mo_apid: req.params.appId,
        mo_active: 1 
      },
      order: [['mo_moid', 'ASC']],
      raw: true
    });
    res.json(modules);
  } catch (error) {
    console.error('Error fetching modules by application:', error);
    res.status(500).json({ message: error.message });
  }
};

// Create module
const createModule = async (req, res) => {
  try {
    const { 
      mo_apid, mo_moid, mo_moshort, mo_modesc, mo_group, 
      mo_grsrl, mo_mhint, mo_isform, mo_ready, mo_rmrks 
    } = req.body;
    
    const module = await ModuleTVL.create({
      mo_apid,
      mo_moid,
      mo_moshort,
      mo_modesc,
      mo_group,
      mo_grsrl,
      mo_mhint,
      mo_isform: mo_isform ? 1 : 0,
      mo_ready: mo_ready ? 1 : 0,
      mo_rmrks,
      mo_active: 1,
      mo_eby: req.user?.us_usid || 'SYSTEM',
      mo_edtm: new Date()
    });
    
    res.status(201).json(module);
  } catch (error) {
    console.error('Error creating module:', error);
    res.status(500).json({ message: error.message });
  }
};

// ==================== USER OPERATIONS ====================

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await UserTVL.findAll({
      where: { us_active: 1 },
      order: [['us_usid', 'ASC']],
      raw: true
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: error.message });
  }
};

// Create user
const createUser = async (req, res) => {
  try {
    const { 
      us_usid, us_email, us_usname, us_title, us_phone,
      us_admin, us_security, us_limit, us_rmrks 
    } = req.body;
    
    const user = await UserTVL.create({
      us_usid,
      us_email,
      us_usname,
      us_title,
      us_phone,
      us_admin: us_admin ? 1 : 0,
      us_security: us_security ? 1 : 0,
      us_limit,
      us_rmrks,
      us_active: 1,
      us_eby: req.user?.us_usid || 'SYSTEM',
      us_edtm: new Date()
    });
    
    res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: error.message });
  }
};

// ==================== ROLE PERMISSION OPERATIONS ====================

// Get all role permissions
const getAllRolePermissions = async (req, res) => {
  try {
    const rolePermissions = await RolePermissionTVL.findAll({
      where: { fp_active: 1 },
      order: [['fp_fnid', 'ASC'], ['fp_opid', 'ASC']],
      raw: true
    });
    
    // Enhance with role and operation names
    const enhanced = await Promise.all(rolePermissions.map(async (rp) => {
      const role = await RoleTVL.findByPk(rp.fp_fnid);
      const operation = await PermissionTVL.findOne({
        where: {
          op_apid: rp.fp_opid.substring(0, 2),
          op_moid: rp.fp_opid.substring(2, 4),
          op_opid: rp.fp_opid.substring(4, 6)
        }
      });
      
      return {
        ...rp,
        roleName: role?.fn_fnshort || '',
        operationName: operation?.op_opshort || ''
      };
    }));
    
    res.json(enhanced);
  } catch (error) {
    console.error('Error fetching role permissions:', error);
    res.status(500).json({ message: error.message });
  }
};

// Create role permission
const createRolePermission = async (req, res) => {
  try {
    const { fp_fnid, fp_opid, fp_allow, fp_rmrks } = req.body;
    
    const rolePermission = await RolePermissionTVL.create({
      fp_fnid,
      fp_opid,
      fp_allow: fp_allow ? 1 : 0,
      fp_rmrks,
      fp_active: 1,
      fp_eby: req.user?.us_usid || 'SYSTEM',
      fp_edtm: new Date()
    });
    
    res.status(201).json(rolePermission);
  } catch (error) {
    console.error('Error creating role permission:', error);
    res.status(500).json({ message: error.message });
  }
};

// Bulk assign permissions to role
const bulkAssignRolePermissions = async (req, res) => {
  try {
    const { fp_fnid, operations } = req.body;
    
    const permissions = operations.map(op => ({
      fp_fnid,
      fp_opid: op.fp_opid,
      fp_allow: op.fp_allow ? 1 : 0,
      fp_active: 1,
      fp_eby: req.user?.us_usid || 'SYSTEM',
      fp_edtm: new Date()
    }));
    
    const result = await RolePermissionTVL.bulkCreate(permissions, {
      updateOnDuplicate: ['fp_allow', 'fp_mby', 'fp_mdtm']
    });
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Error bulk assigning role permissions:', error);
    res.status(500).json({ message: error.message });
  }
};

// ==================== USER PERMISSION OPERATIONS ====================

// Get all user permissions
const getAllUserPermissions = async (req, res) => {
  try {
    const userPermissions = await UserPermissionTVL.findAll({
      where: { up_active: 1 },
      order: [['up_usid', 'ASC'], ['up_opid', 'ASC']],
      raw: true
    });
    
    // Enhance with user and operation names
    const enhanced = await Promise.all(userPermissions.map(async (up) => {
      const user = await UserTVL.findByPk(up.up_usid);
      const operation = await PermissionTVL.findOne({
        where: {
          op_apid: up.up_opid.substring(0, 2),
          op_moid: up.up_opid.substring(2, 4),
          op_opid: up.up_opid.substring(4, 6)
        }
      });
      
      return {
        ...up,
        userName: user?.us_usname || '',
        operationName: operation?.op_opshort || ''
      };
    }));
    
    res.json(enhanced);
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    res.status(500).json({ message: error.message });
  }
};

// Create user permission
const createUserPermission = async (req, res) => {
  try {
    const { up_usid, up_opid, up_allow, up_rmrks } = req.body;
    
    const userPermission = await UserPermissionTVL.create({
      up_usid,
      up_opid,
      up_allow: up_allow ? 1 : 0,
      up_rmrks,
      up_active: 1,
      up_eby: req.user?.us_usid || 'SYSTEM',
      up_edtm: new Date()
    });
    
    res.status(201).json(userPermission);
  } catch (error) {
    console.error('Error creating user permission:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get effective permissions for user
const getEffectivePermissions = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get user info
    const user = await UserTVL.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // If admin, return all permissions
    if (user.us_admin || user.us_security) {
      const allOperations = await PermissionTVL.findAll({
        where: { op_active: 1 },
        raw: true
      });
      
      const permissions = allOperations.map(op => ({
        operation: `${op.op_apid}${op.op_moid}${op.op_opid}`,
        operationName: op.op_opshort,
        allow: true,
        source: user.us_admin ? 'Admin' : 'Security Admin'
      }));
      
      return res.json(permissions);
    }
    
    // Get user-specific permissions
    const userPermissions = await UserPermissionTVL.findAll({
      where: { up_usid: userId, up_active: 1 },
      raw: true
    });
    
    const permissions = userPermissions.map(up => ({
      operation: up.up_opid,
      allow: up.up_allow === 1,
      source: 'User Permission'
    }));
    
    res.json(permissions);
  } catch (error) {
    console.error('Error getting effective permissions:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  // Applications
  getAllApplications,
  createApplication,
  updateApplication,
  deleteApplication,
  
  // Modules
  getAllModules,
  getModulesByApplication,
  createModule,
  
  // Users
  getAllUsers,
  createUser,
  
  // Role Permissions
  getAllRolePermissions,
  createRolePermission,
  bulkAssignRolePermissions,
  
  // User Permissions
  getAllUserPermissions,
  createUserPermission,
  getEffectivePermissions
};
