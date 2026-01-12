const ApplicationTVL = require('../models/ApplicationTVL');
const ModuleTVL = require('../models/ModuleTVL');
const PermissionTVL = require('../models/PermissionTVL');
const RoleTVL = require('../models/RoleTVL');
const UserTVL = require('../models/UserTVL');
const RolePermissionTVL = require('../models/RolePermissionTVL');
const UserPermissionTVL = require('../models/UserPermissionTVL');
const CustomerTVL = require('../models/CustomerTVL');
const Employee = require('../models/Employee');
const EmployeeTVL = require('../models/EmployeeTVL');
const Role = require('../models/Role'); // Add the regular Role model
const Login = require('../models/Login');
const LoginTVL = require('../models/LoginTVL');
const bcrypt = require('bcryptjs');

// Helper function to parse database errors into user-friendly messages
const parseDbError = (error) => {
  console.error('=== DATABASE ERROR DEBUG ===');
  console.error('Error name:', error.name);
  console.error('Error code:', error.code);
  console.error('Error message:', error.message);
  console.error('Error fields:', error.fields);
  console.error('Error parent:', error.parent);
  console.error('===========================');
  
  // Duplicate entry error (MySQL 1062)
  if (error.name === 'SequelizeUniqueConstraintError' || 
      error.code === 'ER_DUP_ENTRY' ||
      error.parent?.code === 'ER_DUP_ENTRY' ||
      error.message?.includes('Duplicate entry')) {
    
    // Try to extract field and value from error
    let field = 'key';
    let value = '';
    
    if (error.fields) {
      field = Object.keys(error.fields)[0];
      value = error.fields[field];
    } else if (error.parent?.sqlMessage) {
      // Parse from SQL message: "Duplicate entry 'ADM' for key 'PRIMARY'"
      const match = error.parent.sqlMessage.match(/Duplicate entry '([^']+)' for key '([^']+)'/i);
      if (match) {
        value = match[1];
        field = match[2] === 'PRIMARY' ? 'ID' : match[2];
      }
    }
    
    return {
      status: 409,
      message: `Duplicate entry: A record with ${field} = '${value}' already exists.`,
      code: 1062
    };
  }
  
  // Foreign key constraint error - insert/update (MySQL 1452)
  if (error.name === 'SequelizeForeignKeyConstraintError' || error.code === 'ER_NO_REFERENCED_ROW_2') {
    return {
      status: 400,
      message: 'Foreign key constraint failed: Referenced record does not exist.',
      code: 1452
    };
  }
  
  // Cannot delete due to foreign key (MySQL 1451)
  if (error.code === 'ER_ROW_IS_REFERENCED_2') {
    return {
      status: 409,
      message: 'Cannot delete: This record is referenced by other records.',
      code: 1451
    };
  }
  
  // Validation error
  if (error.name === 'SequelizeValidationError') {
    const messages = error.errors.map(e => e.message).join(', ');
    return {
      status: 400,
      message: `Validation error: ${messages}`,
      code: 'VALIDATION_ERROR'
    };
  }
  
  // Data too long (MySQL 1406)
  if (error.code === 'ER_DATA_TOO_LONG') {
    const field = error.message.match(/for column '([^']+)'/)?.[1] || 'field';
    return {
      status: 400,
      message: `Data too long for column '${field}': One or more fields exceed maximum length.`,
      code: 1406
    };
  }
  
  // Required field missing (MySQL 1048)
  if (error.name === 'SequelizeDatabaseError' && error.message.includes('cannot be null')) {
    const field = error.message.match(/'([^']+)'/)?.[1] || 'field';
    return {
      status: 400,
      message: `Required field missing: '${field}' cannot be empty.`,
      code: 1048
    };
  }
  
  // Table doesn't exist (MySQL 1146)
  if (error.code === 'ER_NO_SUCH_TABLE') {
    return {
      status: 500,
      message: "Table doesn't exist: The requested data table does not exist.",
      code: 1146
    };
  }
  
  // Unknown column (MySQL 1054)
  if (error.code === 'ER_BAD_FIELD_ERROR') {
    return {
      status: 400,
      message: 'Unknown column: Invalid field detected.',
      code: 1054
    };
  }
  
  // Default error
  return {
    status: 500,
    message: error.message || 'An unexpected error occurred.',
    code: error.code || 'UNKNOWN_ERROR'
  };
};

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
    res.status(500).json({ message: error.message });
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
    res.status(500).json({ message: error.message });
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

// ==================== CUSTOMER OPERATIONS ====================

// Get all customers
const getAllCustomers = async (req, res) => {
  try {
    const customers = await CustomerTVL.findAll({
      include: [{
        model: UserTVL,
        as: 'user',
        attributes: ['us_fname', 'us_lname', 'us_email', 'us_phone', 'us_roid', 'us_active']
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
        cu_email: custData.user?.us_email || '',
        cu_phone: custData.user?.us_phone || '',
        cu_name: custData.user ? `${custData.user.us_fname || ''} ${custData.user.us_lname || ''}`.trim() : 'N/A',
        cu_gst: custData.cu_gst,
        cu_creditlmt: custData.cu_creditlmt,
        cu_status: custData.cu_status,
        edtm: custData.edtm,
        eby: custData.eby,
        mdtm: custData.mdtm,
        mby: custData.mby,
        fullName: custData.user ? `${custData.user.us_fname || ''} ${custData.user.us_lname || ''}`.trim() : 'N/A'
      };
    });
    
    res.json(formattedCustomers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ message: error.message });
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
    res.status(500).json({ message: error.message });
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
    res.status(500).json({ message: error.message });
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
    res.status(500).json({ message: error.message });
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
    res.status(500).json({ message: error.message });
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
    res.status(500).json({ message: error.message });
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
    res.status(500).json({ message: error.message });
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
    
    if ('fn_active' in req.body) {
      updateData.fn_active = parseInt(req.body.fn_active) || 0;
    }
    
    if (updateData.fn_active === 0) {
      updateData.fn_cby = req.user?.us_usid || 'SYSTEM';
      updateData.fn_cdtm = new Date();
    } else if (updateData.fn_active === 1) {
      updateData.fn_cby = null;
      updateData.fn_cdtm = null;
    }
    
    await role.update(updateData);
    
    res.json(role);
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ message: error.message });
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
    res.status(500).json({ message: error.message });
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
    res.status(500).json({ message: error.message });
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
    res.status(500).json({ message: error.message });
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
    res.status(500).json({ message: error.message });
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
    res.status(500).json({ message: error.message });
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
    res.status(500).json({ message: error.message });
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
    res.status(500).json({ message: error.message });
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
    res.status(500).json({ message: error.message });
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
    res.status(500).json({ message: error.message });
  }
};

// ==================== EMPLOYEE MANAGEMENT ====================

// Get all employees with minimal user information (simplified)
const getAllEmployees = async (req, res) => {
  try {
    // Ensure core association exists
    if (!EmployeeTVL.associations.user) {
      EmployeeTVL.belongsTo(UserTVL, { foreignKey: 'em_usid', targetKey: 'us_usid', as: 'user' });
    }

    const employees = await EmployeeTVL.findAll({
      attributes: [
        'em_usid', 'em_empno', 'em_dept', 'em_salary',
        'em_joindt', 'em_status', 'em_manager', 'em_address', 'em_city',
        'em_state', 'em_pincode', 'edtm', 'eby', 'mdtm', 'mby', 'cdtm', 'cby'
      ],
      include: [
        {
          model: UserTVL,
          as: 'user',
          attributes: ['us_usid', 'us_fname', 'us_lname', 'us_email', 'us_phone', 'us_roid', 'us_active', 'us_addr1', 'us_city', 'us_state', 'us_pin'],
          include: [{
            model: RoleTVL,
            as: 'fnXfunction',
            attributes: ['fn_fnid', 'fn_fnshort', 'fn_fndesc'],
            required: false
          }]
        },
        {
          model: EmployeeTVL,
          as: 'manager',
          include: [{
            model: UserTVL,
            as: 'user',
            attributes: ['us_fname', 'us_lname']
          }]
        }
      ],
      order: [['edtm', 'DESC']]
    });

    const transformedEmployees = employees.map(emp => {
      const user = emp.user || {};
      const role = user.fnXfunction || {};
      const manager = emp.manager ? (emp.manager.user || {}) : null;
      return {
        // Top-level fields aligned to DynamicAdminPanel expectations
        us_usid: user.us_usid,
        us_fname: user.us_fname,
        us_lname: user.us_lname,
        us_email: user.us_email,
        us_phone: user.us_phone,
        us_roid: user.us_roid,
        us_active: user.us_active,
        em_empno: emp.em_empno,
        em_dept: emp.em_dept,
        em_salary: emp.em_salary,
        em_joindt: emp.em_joindt,
        em_manager: emp.em_manager,
        em_status: emp.em_status,
        // Include role information for display
        Role: {
          fn_fnid: role.fn_fnid,
          fn_fnshort: role.fn_fnshort,
          fn_fndesc: role.fn_fndesc
        },
        // Include manager information for display
        manager: manager ? {
          us_fname: manager.us_fname,
          us_lname: manager.us_lname,
          fullName: manager.us_fname && manager.us_lname ? `${manager.us_fname} ${manager.us_lname}`.trim() : manager.us_fname || manager.us_lname || 'N/A'
        } : null,
        // Computed fields for frontend
        fullName: user.us_fname && user.us_lname ? `${user.us_fname} ${user.us_lname}`.trim() : user.us_fname || user.us_lname || 'N/A',
        edtm: emp.edtm,
        eby: emp.eby,
        mdtm: emp.mdtm,
        mby: emp.mby,
        cdtm: emp.cdtm,
        cby: emp.cby,
        // Optional address fields if present
        us_addr1: user.us_addr1,
        us_addr2: user.us_addr2, // Will be undefined for TVL model (doesn't exist)
        us_city: user.us_city,
        us_state: user.us_state,
        us_pin: user.us_pin
      };
    });

    res.json(transformedEmployees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    const getErrorDetails = (err) => {
      if (!err) return 'Unknown error';
      return {
        name: err.name,
        message: err.message,
        sql: err.sql,
        stack: err.stack
      };
    };
    res.status(500).json({
      message: error.message,
      details: getErrorDetails(error)
    });
  }
};


// Create new employee
const createEmployee = async (req, res) => {
  try {
    const {
      us_usid, us_fname, us_lname, us_email, us_phone, us_aadhaar, us_pan,
      us_addr1, us_addr2, us_city, us_state, us_pin, us_roid, us_coid,
      em_empno, em_dept, em_salary, em_joindt, em_manager, em_status,
      us_active, lg_active, temp_password
    } = req.body;

    // Validate required fields
    if (!us_fname || !us_email || !us_phone || !us_roid || !em_dept || !em_joindt) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Generate employee number if not provided
    const timestamp = String(Date.now()).slice(-6);
    const generatedEmpNo = em_empno || `EMP${timestamp}`;
    const generatedUsId = `EMP${timestamp}`;

    // Check if email or phone already exists
    const existingUser = await UserTVL.findOne({
      where: {
        [require('sequelize').Op.or]: [
          { us_email },
          { us_phone }
        ]
      }
    });

    if (existingUser) {
      return res.status(409).json({ message: 'Email or phone already exists' });
    }

    const existingEmployee = await EmployeeTVL.findOne({
      where: { em_empno: generatedEmpNo }
    });

    if (existingEmployee) {
      return res.status(409).json({ message: 'Employee number already exists' });
    }

    // Handle photo upload if present
    let photoPath = null;
    if (req.file) {
      photoPath = `/uploads/employees/${req.file.filename}`;
    }

    // Create user record
    const userData = {
      us_usid: generatedUsId,
      us_fname,
      us_lname: us_lname || '',
      us_email,
      us_phone,
      us_aadhaar: us_aadhaar || null,
      us_pan: us_pan || null,
      us_addr1: us_addr1 || null,
      us_addr2: us_addr2 || null,
      us_city: us_city || null,
      us_state: us_state || null,
      us_pin: us_pin || null,
      us_photo: photoPath, // Add photo path
      us_usertype: 'employee',
      us_roid,
      us_coid: us_coid || 'TRV',
      us_active: us_active !== undefined ? (us_active ? 1 : 0) : 1,
      us_eby: req.user?.us_usid || 'SYSTEM',
      us_edtm: new Date(),
      us_mby: req.user?.us_usid || 'SYSTEM',
      us_mdtm: new Date()
    };

    const user = await UserTVL.create(userData);

    // Create employee record
    const employeeData = {
      em_usid: generatedUsId,
      em_empno: generatedEmpNo,
      em_dept,
      em_salary: em_salary || null,
      em_joindt: new Date(em_joindt),
      em_manager: em_manager || null,
      em_status: em_status || 'ACTIVE',
      em_photo: photoPath, // Add photo path to employee record too
      eby: req.user?.us_usid || 'SYSTEM',
      edtm: new Date(),
      mby: req.user?.us_usid || 'SYSTEM',
      mdtm: new Date()
    };

    const employee = await EmployeeTVL.create(employeeData);

    // Create login credentials
    const password = temp_password || 'employee123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const loginData = {
      lg_usid: generatedUsId,  // Fixed: use generatedUsId instead of us_usid
      lg_email: us_email,
      lg_passwd: hashedPassword,
      lg_salt: salt,
      lg_active: lg_active !== undefined ? (lg_active ? 1 : 0) : 1,
      eby: req.user?.us_usid || 'SYSTEM',
      mby: req.user?.us_usid || 'SYSTEM'
    };

    await LoginTVL.create(loginData);

    // Return the created employee with user data
    const createdEmployee = await EmployeeTVL.findOne({
      where: { em_usid: generatedUsId },
      include: [
        {
          model: UserTVL,
          as: 'user',  // Added the required alias
          include: [
            {
              model: RoleTVL,
              attributes: ['fn_fnid', 'fn_fnshort', 'fn_fndesc'],
              as: 'fnXfunction'  // Fixed: use correct alias
            }
          ]
        }
      ]
    });

    res.status(201).json(createdEmployee);
  } catch (error) {
    console.error('Error creating employee:', error);
    const parsedError = parseDbError(error);
    res.status(parsedError.status).json({ message: parsedError.message });
  }
};

// Update employee
const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      us_fname, us_lname, us_email, us_phone, us_aadhaar, us_pan,
      us_addr1, us_addr2, us_city, us_state, us_pin, us_roid, us_coid,
      em_empno, em_dept, em_salary, em_joindt, em_manager, em_status,
      us_active, lg_active, temp_password
    } = req.body;

    // Find employee and user
    const employee = await EmployeeTVL.findOne({
      where: { em_usid: id },
      include: [{ model: UserTVL, as: 'user' }]
    });

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const user = employee.user;
    if (!user) {
      return res.status(404).json({ message: 'User record not found for employee' });
    }

    // Check if email or phone already exists for other users
    const conditions = [];
    
    // Only add email condition if email is being updated
    if (us_email) {
      conditions.push({ us_email });
    }
    
    // Only add phone condition if phone is being updated
    if (us_phone) {
      conditions.push({ us_phone });
    }
    
    let existingUser = null;
    if (conditions.length > 0) {
      existingUser = await UserTVL.findOne({
        where: {
          [require('sequelize').Op.and]: [
            { [require('sequelize').Op.or]: conditions },
            { us_usid: { [require('sequelize').Op.ne]: id } } // Not the current user
          ]
        }
      });
    }

    if (existingUser) {
      return res.status(409).json({ message: 'Email or phone already exists for another user' });
    }

    // Handle photo upload if present
    let photoPath = user.us_photo; // Keep existing photo if no new upload
    if (req.file) {
      photoPath = `/uploads/employees/${req.file.filename}`;
    }

    // Update user data
    const userUpdateData = {
      us_fname: us_fname || user.us_fname,
      us_lname: us_lname !== undefined ? us_lname : user.us_lname,
      us_email: us_email || user.us_email,
      us_phone: us_phone || user.us_phone,
      us_aadhaar: us_aadhaar !== undefined ? us_aadhaar : user.us_aadhaar,
      us_pan: us_pan !== undefined ? us_pan : user.us_pan,
      us_addr1: us_addr1 !== undefined ? us_addr1 : user.us_addr1,
      us_addr2: us_addr2 !== undefined ? us_addr2 : user.us_addr2,
      us_city: us_city !== undefined ? us_city : user.us_city,
      us_state: us_state !== undefined ? us_state : user.us_state,
      us_pin: us_pin !== undefined ? us_pin : user.us_pin,
      us_photo: photoPath, // Update photo path
      us_roid: us_roid || user.us_roid,
      us_coid: us_coid || user.us_coid,
      us_active: us_active !== undefined ? (us_active ? 1 : 0) : user.us_active,
      us_mby: req.user?.us_usid || 'SYSTEM',
      us_mdtm: new Date()
    };

    await user.update(userUpdateData);

    // Update employee data
    const employeeUpdateData = {
      em_empno: em_empno || employee.em_empno,
      em_dept: em_dept || employee.em_dept,
      em_salary: em_salary !== undefined ? em_salary : employee.em_salary,
      em_joindt: em_joindt ? new Date(em_joindt) : employee.em_joindt,
      em_manager: em_manager !== undefined ? em_manager : employee.em_manager,
      em_status: em_status || employee.em_status,
      em_photo: photoPath, // Update photo path in employee record too
      mby: req.user?.us_usid || 'SYSTEM',
      mdtm: new Date()
    };

    await employee.update(employeeUpdateData);

    // Update login if password is provided
    if (temp_password) {
      const login = await LoginTVL.findOne({ where: { lg_usid: id } });
      if (login) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(temp_password, salt);
        
        await login.update({
          lg_passwd: hashedPassword,
          lg_salt: salt,
          lg_active: lg_active !== undefined ? (lg_active ? 1 : 0) : login.lg_active,
          mby: req.user?.us_usid || 'SYSTEM',
          mdtm: new Date()
        });
      }
    } else if (lg_active !== undefined) {
      const login = await LoginTVL.findOne({ where: { lg_usid: id } });
      if (login) {
        await login.update({
          lg_active: lg_active ? 1 : 0,
          mby: req.user?.us_usid || 'SYSTEM',
          mdtm: new Date()
        });
      }
    }

    // Return updated employee
    const updatedEmployee = await EmployeeTVL.findOne({
      where: { em_usid: id },
      include: [
        {
          model: UserTVL,
          as: 'user',  // Add the required alias
          include: [
            {
              model: RoleTVL,
              attributes: ['fn_fnid', 'fn_fnshort', 'fn_fndesc'],
              as: 'fnXfunction'  // Fixed: use correct alias
            }
          ]
        }
      ]
    });

    res.json(updatedEmployee);
  } catch (error) {
    console.error('Error updating employee:', error);
    const parsedError = parseDbError(error);
    res.status(parsedError.status).json({ message: parsedError.message });
  }
};

// Delete employee
const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    // Find employee
    const employee = await EmployeeTVL.findOne({ where: { em_usid: id } });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Delete in proper order (respecting foreign key constraints)
    // 1. Delete login
    await LoginTVL.destroy({ where: { lg_usid: id } });
    
    // 2. Delete employee
    await EmployeeTVL.destroy({ where: { em_usid: id } });
    
    // 3. Delete user
    await UserTVL.destroy({ where: { us_usid: id } });

    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    const parsedError = parseDbError(error);
    res.status(parsedError.status).json({ message: parsedError.message });
  }
};

/*
// Create new employee
const createEmployee = async (req, res) => {
  try {
    const {
      us_usid, us_fname, us_lname, us_email, us_phone, us_aadhaar, us_pan,
      us_addr1, us_addr2, us_city, us_state, us_pin, us_roid, us_coid,
      em_empno, em_designation, em_dept, em_salary, em_joindt, em_manager, em_status,
      us_active, lg_active, temp_password
    } = req.body;

    // Validate required fields
    if (!us_usid || !us_fname || !us_email || !us_phone || !us_roid || !em_empno || !em_designation || !em_dept || !em_joindt) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if user ID, email, phone, or employee number already exists
    const existingUser = await User.findOne({
      where: {
        [require('sequelize').Op.or]: [
          { us_usid },
          { us_email },
          { us_phone }
        ]
      }
    });

    if (existingUser) {
      return res.status(409).json({ message: 'User ID, email, or phone already exists' });
    }

    const existingEmployee = await Employee.findOne({
      where: { em_empno }
    });

    if (existingEmployee) {
      return res.status(409).json({ message: 'Employee number already exists' });
    }

    // Create user record
    const userData = {
      us_usid,
      us_fname,
      us_lname: us_lname || '',
      us_email,
      us_phone,
      us_aadhaar: us_aadhaar || null,
      us_pan: us_pan || null,
      us_addr1: us_addr1 || null,
      us_addr2: us_addr2 || null,
      us_city: us_city || null,
      us_state: us_state || null,
      us_pin: us_pin || null,
      us_usertype: 'employee',
      us_roid,
      us_coid: us_coid || 'TRV',
      us_active: us_active !== undefined ? (us_active ? 1 : 0) : 1,
      eby: req.user?.us_usid || 'SYSTEM',
      mby: req.user?.us_usid || 'SYSTEM'
    };

    const user = await User.create(userData);

    // Create employee record
    const employeeData = {
      em_usid: us_usid,
      em_empno,
      em_designation,
      em_dept,
      em_salary: em_salary || null,
      em_joindt: new Date(em_joindt),
      em_manager: em_manager || null,
      em_status: em_status || 'ACTIVE',
      eby: req.user?.us_usid || 'SYSTEM',
      mby: req.user?.us_usid || 'SYSTEM'
    };

    const employee = await Employee.create(employeeData);

    // Create login credentials
    const password = temp_password || 'employee123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const loginData = {
      lg_usid: us_usid,
      lg_email: us_email,
      lg_passwd: hashedPassword,
      lg_salt: salt,
      lg_active: lg_active !== undefined ? (lg_active ? 1 : 0) : 1,
      eby: req.user?.us_usid || 'SYSTEM',
      mby: req.user?.us_usid || 'SYSTEM'
    };

    await Login.create(loginData);

    // Return the created employee with user data
    const createdEmployee = await Employee.findOne({
      where: { em_usid: us_usid },
      include: [
        {
          model: User,
          include: [
            {
              model: RoleTVL,
              attributes: ['fn_fnid', 'fn_fnshort', 'fn_fndesc'],
              as: 'Role'
            }
          ]
        }
      ]
    });

    res.status(201).json(createdEmployee);
  } catch (error) {
    console.error('Error creating employee:', error);
    const parsedError = parseDbError(error);
    res.status(parsedError.status).json({ message: parsedError.message });
  }
};

// Update employee
const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      us_fname, us_lname, us_email, us_phone, us_aadhaar, us_pan,
      us_addr1, us_addr2, us_city, us_state, us_pin, us_roid, us_coid,
      em_empno, em_designation, em_dept, em_salary, em_joindt, em_manager, em_status,
      us_active, lg_active, temp_password
    } = req.body;

    // Find employee and user
    const employee = await Employee.findOne({
      where: { em_usid: id },
      include: [{ model: User }]
    });

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const user = employee.User;
    if (!user) {
      return res.status(404).json({ message: 'User record not found for employee' });
    }

    // Update user data
    const userUpdateData = {
      us_fname: us_fname || user.us_fname,
      us_lname: us_lname !== undefined ? us_lname : user.us_lname,
      us_email: us_email || user.us_email,
      us_phone: us_phone || user.us_phone,
      us_aadhaar: us_aadhaar !== undefined ? us_aadhaar : user.us_aadhaar,
      us_pan: us_pan !== undefined ? us_pan : user.us_pan,
      us_addr1: us_addr1 !== undefined ? us_addr1 : user.us_addr1,
      us_addr2: us_addr2 !== undefined ? us_addr2 : user.us_addr2,
      us_city: us_city !== undefined ? us_city : user.us_city,
      us_state: us_state !== undefined ? us_state : user.us_state,
      us_pin: us_pin !== undefined ? us_pin : user.us_pin,
      us_roid: us_roid || user.us_roid,
      us_coid: us_coid || user.us_coid,
      us_active: us_active !== undefined ? (us_active ? 1 : 0) : user.us_active,
      mby: req.user?.us_usid || 'SYSTEM',
      mdtm: new Date()
    };

    await user.update(userUpdateData);

    // Update employee data
    const employeeUpdateData = {
      em_empno: em_empno || employee.em_empno,
      em_designation: em_designation || employee.em_designation,
      em_dept: em_dept || employee.em_dept,
      em_salary: em_salary !== undefined ? em_salary : employee.em_salary,
      em_joindt: em_joindt ? new Date(em_joindt) : employee.em_joindt,
      em_manager: em_manager !== undefined ? em_manager : employee.em_manager,
      em_status: em_status || employee.em_status,
      mby: req.user?.us_usid || 'SYSTEM',
      mdtm: new Date()
    };

    await employee.update(employeeUpdateData);

    // Update login if password is provided
    if (temp_password) {
      const login = await Login.findOne({ where: { lg_usid: id } });
      if (login) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(temp_password, salt);
        
        await login.update({
          lg_passwd: hashedPassword,
          lg_salt: salt,
          lg_active: lg_active !== undefined ? (lg_active ? 1 : 0) : login.lg_active,
          mby: req.user?.us_usid || 'SYSTEM',
          mdtm: new Date()
        });
      }
    } else if (lg_active !== undefined) {
      const login = await Login.findOne({ where: { lg_usid: id } });
      if (login) {
        await login.update({
          lg_active: lg_active ? 1 : 0,
          mby: req.user?.us_usid || 'SYSTEM',
          mdtm: new Date()
        });
      }
    }

    // Return updated employee
    const updatedEmployee = await Employee.findOne({
      where: { em_usid: id },
      include: [
        {
          model: User,
          include: [
            {
              model: RoleTVL,
              attributes: ['fn_fnid', 'fn_fnshort', 'fn_fndesc'],
              as: 'Role'
            }
          ]
        }
      ]
    });

    res.json(updatedEmployee);
  } catch (error) {
    console.error('Error updating employee:', error);
    const parsedError = parseDbError(error);
    res.status(parsedError.status).json({ message: parsedError.message });
  }
};

// Delete employee
const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    // Find employee
    const employee = await Employee.findOne({ where: { em_usid: id } });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Delete in proper order (respecting foreign key constraints)
    // 1. Delete login
    await Login.destroy({ where: { lg_usid: id } });
    
    // 2. Delete employee
    await Employee.destroy({ where: { em_usid: id } });
    
    // 3. Delete user
    await User.destroy({ where: { us_usid: id } });

    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    const parsedError = parseDbError(error);
    res.status(parsedError.status).json({ message: parsedError.message });
  }
};
*/
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
  
  // Employees
  getAllEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  
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
