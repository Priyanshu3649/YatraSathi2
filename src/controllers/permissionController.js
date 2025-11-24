const RoleTVL = require('../models/RoleTVL');
const PermissionTVL = require('../models/PermissionTVL');

// Create a new role
const createRole = async (req, res) => {
  try {
    const { fn_fnid, fn_fnshort, fn_fndesc, fn_rmrks } = req.body;
    
    // Check if role already exists
    const existingRole = await RoleTVL.findOne({ 
      where: { fn_fnshort: fn_fnshort } 
    });
    
    if (existingRole) {
      return res.status(400).json({ message: 'Role already exists' });
    }
    
    // Create new role
    const role = await RoleTVL.create({
      fn_fnid,
      fn_fnshort,
      fn_fndesc,
      fn_rmrks,
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

// Get all roles
const getAllRoles = async (req, res) => {
  try {
    const roles = await RoleTVL.findAll({
      where: { fn_active: 1 },
      order: [['fn_fnid', 'ASC']],
      raw: true
    });
    res.json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get role by ID
const getRoleById = async (req, res) => {
  try {
    const role = await RoleTVL.findByPk(req.params.id);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }
    res.json(role);
  } catch (error) {
    console.error('Error fetching role:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update role
const updateRole = async (req, res) => {
  try {
    const { fn_fnshort, fn_fndesc, fn_rmrks } = req.body;
    
    const role = await RoleTVL.findByPk(req.params.id);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }
    
    // Update role fields
    await role.update({
      fn_fnshort: fn_fnshort || role.fn_fnshort,
      fn_fndesc: fn_fndesc || role.fn_fndesc,
      fn_rmrks: fn_rmrks || role.fn_rmrks,
      fn_mby: req.user?.us_usid || 'SYSTEM',
      fn_mdtm: new Date()
    });
    
    res.json(role);
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ message: error.message });
  }
};

// Delete role
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

// Get all permissions
const getAllPermissions = async (req, res) => {
  try {
    const permissions = await PermissionTVL.findAll({
      where: { op_active: 1 },
      order: [['op_apid', 'ASC'], ['op_moid', 'ASC'], ['op_opid', 'ASC']],
      raw: true
    });
    res.json(permissions);
  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({ message: error.message });
  }
};

// Create permission
const createPermission = async (req, res) => {
  try {
    const { op_apid, op_moid, op_opid, op_opshort, op_opdesc } = req.body;
    
    const permission = await PermissionTVL.create({
      op_apid,
      op_moid,
      op_opid,
      op_opshort,
      op_opdesc,
      op_active: 1,
      op_eby: req.user?.us_usid || 'SYSTEM',
      op_edtm: new Date()
    });
    
    res.status(201).json(permission);
  } catch (error) {
    console.error('Error creating permission:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  deleteRole,
  getAllPermissions,
  createPermission
};
