const Role = require('../models/Role');

// Create a new role
const createRole = async (req, res) => {
  try {
    const { roleName, description, userType, department, permissions } = req.body;
    
    // Check if role already exists
    const existingRole = await Role.findOne({ roleName });
    if (existingRole) {
      return res.status(400).json({ message: 'Role already exists' });
    }
    
    // Create new role
    const role = new Role({
      roleName,
      description,
      userType,
      department,
      permissions
    });
    
    const savedRole = await role.save();
    res.status(201).json(savedRole);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all roles
const getAllRoles = async (req, res) => {
  try {
    const roles = await Role.find();
    res.json(roles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get role by ID
const getRoleById = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }
    res.json(role);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update role
const updateRole = async (req, res) => {
  try {
    const { roleName, description, userType, department, permissions } = req.body;
    
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }
    
    // Update role fields
    role.roleName = roleName || role.roleName;
    role.description = description || role.description;
    role.userType = userType || role.userType;
    role.department = department || role.department;
    role.permissions = permissions || role.permissions;
    
    const updatedRole = await role.save();
    res.json(updatedRole);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete role
const deleteRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }
    
    await role.remove();
    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Check if user has specific permission
const checkPermission = async (userId, permission) => {
  try {
    // This would typically involve checking the user's role and the role's permissions
    // For now, we'll implement a basic check
    // In a real implementation, you would join with the User model to get the user's role
    // and then check if that role has the required permission
    
    // Placeholder implementation - in a real app, you would check against the database
    return true;
  } catch (error) {
    return false;
  }
};

module.exports = {
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  deleteRole,
  checkPermission
};