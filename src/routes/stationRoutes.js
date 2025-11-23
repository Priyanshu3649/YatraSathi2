const express = require('express');
const router = express.Router();
const { Station } = require('../models');
const authenticate = require('../middleware/authMiddleware');

// Get all stations
router.get('/', authenticate, async (req, res) => {
  try {
    const stations = await Station.findAll({
      order: [['st_stcode', 'ASC']]
    });
    res.json(stations);
  } catch (error) {
    console.error('Error fetching stations:', error);
    res.status(500).json({ message: 'Error fetching stations', error: error.message });
  }
});

// Get station by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const station = await Station.findByPk(req.params.id);
    if (!station) {
      return res.status(404).json({ message: 'Station not found' });
    }
    res.json(station);
  } catch (error) {
    console.error('Error fetching station:', error);
    res.status(500).json({ message: 'Error fetching station', error: error.message });
  }
});

// Create station (admin only)
router.post('/', authenticate, async (req, res) => {
  try {
    if (req.user.us_usertype !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin access required.' });
    }

    const station = await Station.create({
      ...req.body,
      eby: req.user.us_usid,
      mby: req.user.us_usid
    });
    res.status(201).json(station);
  } catch (error) {
    console.error('Error creating station:', error);
    res.status(500).json({ message: 'Error creating station', error: error.message });
  }
});

// Update station (admin only)
router.put('/:id', authenticate, async (req, res) => {
  try {
    if (req.user.us_usertype !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin access required.' });
    }

    const station = await Station.findByPk(req.params.id);
    if (!station) {
      return res.status(404).json({ message: 'Station not found' });
    }

    await station.update({
      ...req.body,
      mby: req.user.us_usid
    });
    res.json(station);
  } catch (error) {
    console.error('Error updating station:', error);
    res.status(500).json({ message: 'Error updating station', error: error.message });
  }
});

// Delete station (admin only)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    if (req.user.us_usertype !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin access required.' });
    }

    const station = await Station.findByPk(req.params.id);
    if (!station) {
      return res.status(404).json({ message: 'Station not found' });
    }

    await station.destroy();
    res.json({ message: 'Station deleted successfully' });
  } catch (error) {
    console.error('Error deleting station:', error);
    res.status(500).json({ message: 'Error deleting station', error: error.message });
  }
});

module.exports = router;
