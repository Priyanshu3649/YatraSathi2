const express = require('express');
const router = express.Router();
const { User, Role, Company } = require('../models');
const authenticate = require('../middleware/authMiddleware');

// Get all users (admin only)
router.get('/', authenticate, async (req, res) => {
  try {
    if (req.user.us_usertype !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin access required.' });
    }

    const users = await User.findAll({
      include: [
        { model: Role, attributes: ['ur_roid', 'ur_roshort', 'ur_rodesc'] },
        { model: Company, attributes: ['co_coid', 'co_coshort'] }
      ],
      order: [['us_usid', 'ASC']]
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

// Get user by ID (admin only)
router.get('/:id', authenticate, async (req, res) => {
  try {
    if (req.user.us_usertype !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin access required.' });
    }

    const user = await User.findByPk(req.params.id, {
      include: [
        { model: Role },
        { model: Company }
      ]
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
});

// Update user (admin only)
router.put('/:id', authenticate, async (req, res) => {
  try {
    if (req.user.us_usertype !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin access required.' });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.update({
      ...req.body,
      mby: req.user.us_usid
    });
    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
});

// Delete user (admin only)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    if (req.user.us_usertype !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin access required.' });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.destroy();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
});

module.exports = router;
