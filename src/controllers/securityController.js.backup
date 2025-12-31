const ApplicationTVL = require('../models/ApplicationTVL');
const ModuleTVL = require('../models/ModuleTVL');
const PermissionTVL = require('../models/PermissionTVL');
const RoleTVL = require('../models/RoleTVL');
const UserTVL = require('../models/UserTVL');
const RolePermissionTVL = require('../models/RolePermissionTVL');
const UserPermissionTVL = require('../models/UserPermissionTVL');
const Customer = require('../models/Customer');
const User = require('../models/User');

// ==================== APPLICATION OPERATIONS ====================

// Get all applications
const getAllApplications = async (req, res) => {
  try {
    const applications = await ApplicationTVL.findAll({
      order: [['ap_apid', 'ASC']],
      raw: true
    });
    res.json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    const { status, message } = parseDbError(error);
    res.status(status).json({ message });
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
    const { status, message } = parseDbError(error);
    res.status(status).json({ message });
  }
};

// Update application
const updateApplication = async (req, res) => {
  try {
    const application = await ApplicationTVL.findByPk(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    console.log('=== UPDATE APPLICATION DEBUG ===');
    console.log('Request body:', req.body);
    console.log('Current active status:', application.ap_active);
    console.log('New active status:', req.body.ap_active);
    
    const updateData = {
      ...req.body,
      ap_mby: req.user?.us_usid || 'SYSTEM',
      ap_mdtm: new Date()
    };
    
    // Convert active to integer
    if ('ap_active' in req.body) {
      updateData.ap_active = parseInt(req.body.ap_active) || 0;
    }
    
    // If active status is being set to 0 (inactive), set closed fields
    if (updateData.ap_active === 0) {
      updateData.ap_cby = req.user?.us_usid || 'SYSTEM';
      updateData.ap_cdtm = new Date();
      console.log('Setting closed fields:', updateData.ap_cby, updateData.ap_cdtm);
    } else if (updateData.ap_active === 1) {
      // If reactivating, clear closed fields
      updateData.ap_cby = null;
      updateData.ap_cdtm = null;
      console.log('Clearing closed fields (reactivating)');
    }
    
    console.log('Update data:', updateData);
    
    await application.update(updateData);
    
    console.log('Updated application:', application.toJSON());
    console.log('================================');
    
    res.json(application);
  } catch (error) {
    console.error('Error updating application:', error);
    const { status, message } = parseDbError(error);
    res.status(status).json({ message });
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
    const { status, message } = parseDbError(error);
    res.status(status).json({ message });
  }
};

// ==================== MODULE OPERATIONS ====================

// Get all modules
const getAllModules = async (req, res) => {
  try {
    const modules = await ModuleTVL.findAll({
      order: [['mo_apid', 'ASC'], ['mo_moid', 'ASC']],
      raw: true
    });
    res.json(modules);
  } catch (error) {
    console.error('Error fetching modules:', error);
    const { status, message } = parseDbError(error);
    res.status(status).json({ message });
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
    const { status, message } = parseDbError(error);
    res.status(status).json({ message });
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
    const { status, message } = parseDbError(error);
    res.status(status).json({ message });
  }
};

// Update module
const updateModule = async (req, res) => {
  try {
    const { appId, moduleId } = req.params;
    const module = await ModuleTVL.findOne({
      where: { mo_apid: appId, mo_moid: moduleId }
    });
    
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }
    
    const updateData = {
      ...req.body,
      mo_isform: req.body.mo_isform ? 1 : 0,
      mo_ready: req.body.mo_ready ? 1 : 0,
      mo_mby: req.user?.us_usid || 'SYSTEM',
      mo_mdtm: new Date()
    };
    
    // Convert active to integer
    if ('mo_active' in req.body) {
      updateData.mo_active = parseInt(req.body.mo_active) || 0;
    }
    
    // If active status is being set to 0 (inactive), set closed fields
    if (updateData.mo_active === 0) {
      updateData.mo_cby = req.user?.us_usid || 'SYSTEM';
      updateData.mo_cdtm = new Date();
    } else if (updateData.mo_active === 1) {
      // If reactivating, clear closed fields
      updateData.mo_cby = null;
      updateData.mo_cdtm = null;
    }
    
    await module.update(updateData);
    
    res.json(module);
  } catch (error) {
    console.error('Error updating module:', error);
    const { status, message } = parseDbError(error);
    res.status(status).json({ message });
  }
};

// Delete module
const deleteModule = async (req, res) => {
  try {
    const { appId, moduleId } = req.params;
    const module = await ModuleTVL.findOne({
      where: { mo_apid: appId, mo_moid: moduleId }
    });
    
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }
    
    await module.destroy();
    res.json({ message: 'Module deleted successfully' });
  } catch (error) {
    console.error('Error deleting module:', error);
    const { status, message } = parseDbError(error);
    res.status(status).json({ message });
  }
};

// ==================== USER OPERATIONS ====================

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await UserTVL.findAll({
      order: [['us_usid', 'ASC']],
      raw: true
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    const { status, message } = parseDbError(error);
    res.status(status).json({ message });
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
    const { status, message } = parseDbError(error);
    res.status(status).json({ message });
  }
};

// ==================== ROLE PERMISSION OPERATIONS ====================

// Get all role permissions
const getAllRolePermissions = async (req, res) => {
  try {
    const rolePermissions = await RolePermissionTVL.findAll({
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
    const { status, message } = parseDbError(error);
    res.status(status).json({ message });
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
    const { status, message } = parseDbError(error);
    res.status(status).json({ message });
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
    const { status, message } = parseDbError(error);
    res.status(status).json({ message });
  }
};

// ==================== USER PERMISSION OPERATIONS ====================

// Get all user permissions
const getAllUserPermissions = async (req, res) => {
  try {
    const userPermissions = await UserPermissionTVL.findAll({
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
    const { status, message } = parseDbError(error);
    res.status(status).json({ message });
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
    const { status, message } = parseDbError(error);
    res.status(status).json({ message });
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
    const { status, message } = parseDbError(error);
    res.status(status).json({ message });
  }
};

// ==================== CUSTOMER OPERATIONS ====================

// Get all customers
const getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.findAll({
      include: [{
        model: User,
        attributes: ['us_fname', 'us_lname', 'us_email', 'us_phone']
      }],
      order: [['cu_custno', 'ASC']],
      raw: false
    });
    
    // Format data for frontend
    const formattedCustomers = customers.map(cust => {
      const custData = cust.toJSON();
      return {
        cu_usid: custData.cu_usid,
        cu_custno: custData.cu_custno,
        cu_custtype: custData.cu_custtype,
        cu_company: custData.cu_company,
        cu_email: custData.usUser?.us_email || '',
        cu_phone: custData.usUser?.us_phone || '',
        cu_name: custData.usUser ? `${custData.usUser.us_fname} ${custData.usUser.us_lname}` : '',
        cu_gst: custData.cu_gst,
        cu_creditlmt: custData.cu_creditlmt,
        cu_status: custData.cu_status,
        edtm: custData.edtm,
        eby: custData.eby,
        mdtm: custData.mdtm,
        mby: custData.mby
      };
    });
    
    res.json(formattedCustomers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    const { status, message } = parseDbError(error);
    res.status(status).json({ message });
  }
};

// ==================== OPERATION CRUD ====================
const getAllOperations = async (req, res) => {
  try {
    const operations = await PermissionTVL.findAll({
      order: [['op_apid', 'ASC'], ['op_moid', 'ASC'], ['op_opid', 'ASC']],
      raw: true
    });
    res.json(operations);
  } catch (error) {
    console.error('Error fetching operations:', error);
    const { status, message } = parseDbError(error);
    res.status(status).json({ message });
  }
};

const createOperation = async (req, res) => {
  try {
    const operation = await PermissionTVL.create({
      ...req.body,
      op_active: 1,
      op_eby: req.user?.us_usid || 'SYSTEM',
      op_edtm: new Date()
    });
    res.status(201).json(operation);
  } catch (error) {
    console.error('Error creating operation:', error);
    const { status, message } = parseDbError(error);
    res.status(status).json({ message });
  }
};

const updateOperation = async (req, res) => {
  try {
    const { appId, moduleId, opId } = req.params;
    const operation = await PermissionTVL.findOne({
      where: { op_apid: appId, op_moid: moduleId, op_opid: opId }
    });
    
    if (!operation) {
      return res.status(404).json({ message: 'Operation not found' });
    }
    
    const updateData = {
      ...req.body,
      op_mby: req.user?.us_usid || 'SYSTEM',
      op_mdtm: new Date()
    };
    
    // Convert active to integer
    if ('op_active' in req.body) {
      updateData.op_active = parseInt(req.body.op_active) || 0;
    }
    
    // If active status is being set to 0 (inactive), set closed fields
    if (updateData.op_active === 0) {
      updateData.op_cby = req.user?.us_usid || 'SYSTEM';
      updateData.op_cdtm = new Date();
    } else if (updateData.op_active === 1) {
      // If reactivating, clear closed fields
      updateData.op_cby = null;
      updateData.op_cdtm = null;
    }
    
    await operation.update(updateData);
    
    res.json(operation);
  } catch (error) {
    console.error('Error updating operation:', error);
    const { status, message } = parseDbError(error);
    res.status(status).json({ message });
  }
};

const deleteOperation = async (req, res) => {
  try {
    const { appId, moduleId, opId } = req.params;
    const operation = await PermissionTVL.findOne({
      where: { op_apid: appId, op_moid: moduleId, op_opid: opId }
    });
    
    if (!operation) {
      return res.status(404).json({ message: 'Operation not found' });
    }
    
    await operation.destroy();
    res.json({ message: 'Operation deleted successfully' });
  } catch (error) {
    console.error('Error deleting operation:', error);
    const { status, message } = parseDbError(error);
    res.status(status).json({ message });
  }
};

// ==================== ROLE CRUD ====================
const getAllRoles = async (req, res) => {
  try {
    const roles = await RoleTVL.findAll({
      order: [['fn_fnid', 'ASC']],
      raw: true
    });
    console.log('Fetched roles sample:', roles[0]);
    res.json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    const { status, message } = parseDbError(error);
    res.status(status).json({ message });
  }
};

const createRole = async (req, res) => {
  try {
    const role = await RoleTVL.create({
      ...req.body,
      fn_active: 1,
      fn_eby: req.user?.us_usid || 'SYSTEM',
      fn_edtm: new Date()
    });
    res.status(201).json(role);
  } catch (error) {
    console.error('Error creating role:', error);
    const { status, message } = parseDbError(error);
    res.status(status).json({ message });
  }
};

const updateRole = async (req, res) => {
  try {
    const role = await RoleTVL.findByPk(req.params.id);
    
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }
    
    const updateData = {
      ...req.body,
      fn_mby: req.user?.us_usid || 'SYSTEM',
      fn_mdtm: new Date()
    };
    
    // Convert active to integer
    if ('fn_active' in req.body) {
      updateData.fn_active = parseInt(req.body.fn_active) || 0;
    }
    
    // If active status is being set to 0 (inactive), set closed fields
    if (updateData.fn_active === 0) {
      updateData.fn_cby = req.user?.us_usid || 'SYSTEM';
      updateData.fn_cdtm = new Date();
    } else if (updateData.fn_active === 1) {
      // If reactivating, clear closed fields
      updateData.fn_cby = null;
      updateData.fn_cdtm = null;
    }
    
    await role.update(updateData);
    
    res.json(role);
  } catch (error) {
    console.error('Error updating role:', error);
    const { status, message } = parseDbError(error);
    res.status(status).json({ message });
  }
};

const deleteRole = async (req, res) => {
  try {
    const role = await RoleTVL.findByPk(req.params.id);
    
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }
    
    await role.destroy();
    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Error deleting role:', error);
    const { status, message } = parseDbError(error);
    res.status(status).json({ message });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const user = await UserTVL.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const updateData = {
      ...req.body,
      us_admin: req.body.us_admin ? 1 : 0,
      us_security: req.body.us_security ? 1 : 0,
      us_mby: req.user?.us_usid || 'SYSTEM',
      us_mdtm: new Date()
    };
    
    // Convert active to integer
    if ('us_active' in req.body) {
      updateData.us_active = parseInt(req.body.us_active) || 0;
    }
    
    // If active status is being set to 0 (inactive), set closed fields
    if (updateData.us_active === 0) {
      updateData.us_cby = req.user?.us_usid || 'SYSTEM';
      updateData.us_cdtm = new Date();
    } else if (updateData.us_active === 1) {
      // If reactivating, clear closed fields
      updateData.us_cby = null;
      updateData.us_cdtm = null;
    }
    
    await user.update(updateData);
    
    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    const { status, message } = parseDbError(error);
    res.status(status).json({ message });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const user = await UserTVL.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    await user.destroy();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    const { status, message } = parseDbError(error);
    res.status(status).json({ message });
  }
};

// Update customer
const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    await customer.update({
      ...req.body,
      mby: req.user?.us_usid || 'SYSTEM',
      mdtm: new Date()
    });
    
    res.json(customer);
  } catch (error) {
    console.error('Error updating customer:', error);
    const { status, message } = parseDbError(error);
    res.status(status).json({ message });
  }
};

// Delete customer
const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    await customer.destroy();
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    const { status, message } = parseDbError(error);
    res.status(status).json({ message });
  }
};

// Update role permission
const updateRolePermission = async (req, res) => {
  try {
    const { roleId, opId } = req.params;
    const permission = await RolePermissionTVL.findOne({
      where: { fp_fnid: roleId, fp_opid: opId }
    });
    
    if (!permission) {
      return res.status(404).json({ message: 'Role permission not found' });
    }
    
    const updateData = {
      ...req.body,
      fp_allow: req.body.fp_allow ? 1 : 0,
      fp_mby: req.user?.us_usid || 'SYSTEM',
      fp_mdtm: new Date()
    };
    
    // Convert active to integer
    if ('fp_active' in req.body) {
      updateData.fp_active = parseInt(req.body.fp_active) || 0;
    }
    
    // If active status is being set to 0 (inactive), set closed fields
    if (updateData.fp_active === 0) {
      updateData.fp_cby = req.user?.us_usid || 'SYSTEM';
      updateData.fp_cdtm = new Date();
    } else if (updateData.fp_active === 1) {
      // If reactivating, clear closed fields
      updateData.fp_cby = null;
      updateData.fp_cdtm = null;
    }
    
    await permission.update(updateData);
    
    res.json(permission);
  } catch (error) {
    console.error('Error updating role permission:', error);
    const { status, message } = parseDbError(error);
    res.status(status).json({ message });
  }
};

// Delete role permission
const deleteRolePermission = async (req, res) => {
  try {
    const { roleId, opId } = req.params;
    const permission = await RolePermissionTVL.findOne({
      where: { fp_fnid: roleId, fp_opid: opId }
    });
    
    if (!permission) {
      return res.status(404).json({ message: 'Role permission not found' });
    }
    
    await permission.destroy();
    res.json({ message: 'Role permission deleted successfully' });
  } catch (error) {
    console.error('Error deleting role permission:', error);
    const { status, message } = parseDbError(error);
    res.status(status).json({ message });
  }
};

// Update user permission
const updateUserPermission = async (req, res) => {
  try {
    const { userId, opId } = req.params;
    const permission = await UserPermissionTVL.findOne({
      where: { up_usid: userId, up_opid: opId }
    });
    
    if (!permission) {
      return res.status(404).json({ message: 'User permission not found' });
    }
    
    const updateData = {
      ...req.body,
      up_allow: req.body.up_allow ? 1 : 0,
      up_mby: req.user?.us_usid || 'SYSTEM',
      up_mdtm: new Date()
    };
    
    // Convert active to integer
    if ('up_active' in req.body) {
      updateData.up_active = parseInt(req.body.up_active) || 0;
    }
    
    // If active status is being set to 0 (inactive), set closed fields
    if (updateData.up_active === 0) {
      updateData.up_cby = req.user?.us_usid || 'SYSTEM';
      updateData.up_cdtm = new Date();
    } else if (updateData.up_active === 1) {
      // If reactivating, clear closed fields
      updateData.up_cby = null;
      updateData.up_cdtm = null;
    }
    
    await permission.update(updateData);
    
    res.json(permission);
  } catch (error) {
    console.error('Error updating user permission:', error);
    const { status, message } = parseDbError(error);
    res.status(status).json({ message });
  }
};

// Delete user permission
const deleteUserPermission = async (req, res) => {
  try {
    const { userId, opId } = req.params;
    const permission = await UserPermissionTVL.findOne({
      where: { up_usid: userId, up_opid: opId }
    });
    
    if (!permission) {
      return res.status(404).json({ message: 'User permission not found' });
    }
    
    await permission.destroy();
    res.json({ message: 'User permission deleted successfully' });
  } catch (error) {
    console.error('Error deleting user permission:', error);
    const { status, message } = parseDbError(error);
    res.status(status).json({ message });
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
  updateModule,
  deleteModule,
  
  // Operations
  getAllOperations,
  createOperation,
  updateOperation,
  deleteOperation,
  
  // Roles
  getAllRoles,
  createRole,
  updateRole,
  deleteRole,
  
  // Users
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  
  // Customers
  getAllCustomers,
  updateCustomer,
  deleteCustomer,
  
  // Role Permissions
  getAllRolePermissions,
  createRolePermission,
  updateRolePermission,
  deleteRolePermission,
  bulkAssignRolePermissions,
  
  // User Permissions
  getAllUserPermissions,
  createUserPermission,
  updateUserPermission,
  deleteUserPermission,
  getEffectivePermissions
};
