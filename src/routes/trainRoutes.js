const express = require('express');
const router = express.Router();
const { Train, Station } = require('../models');
const authenticate = require('../middleware/authMiddleware');

// Get all trains
router.get('/', authenticate, async (req, res) => {
  try {
    const trains = await Train.findAll({
      include: [
        { model: Station, as: 'fromStation', attributes: ['st_stcode', 'st_stname', 'st_city'] },
        { model: Station, as: 'toStation', attributes: ['st_stcode', 'st_stname', 'st_city'] }
      ],
      order: [['tr_trno', 'ASC']]
    });
    res.json(trains);
  } catch (error) {
    console.error('Error fetching trains:', error);
    res.status(500).json({ message: 'Error fetching trains', error: error.message });
  }
});

// Get train by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const train = await Train.findByPk(req.params.id, {
      include: [
        { model: Station, as: 'fromStation' },
        { model: Station, as: 'toStation' }
      ]
    });
    if (!train) {
      return res.status(404).json({ message: 'Train not found' });
    }
    res.json(train);
  } catch (error) {
    console.error('Error fetching train:', error);
    res.status(500).json({ message: 'Error fetching train', error: error.message });
  }
});

// Create train (admin only)
router.post('/', authenticate, async (req, res) => {
  try {
    if (req.user.us_usertype !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin access required.' });
    }

    const train = await Train.create({
      ...req.body,
      eby: req.user.us_usid,
      mby: req.user.us_usid
    });
    res.status(201).json(train);
  } catch (error) {
    console.error('Error creating train:', error);
    res.status(500).json({ message: 'Error creating train', error: error.message });
  }
});

// Update train (admin only)
router.put('/:id', authenticate, async (req, res) => {
  try {
    if (req.user.us_usertype !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin access required.' });
    }

    const train = await Train.findByPk(req.params.id);
    if (!train) {
      return res.status(404).json({ message: 'Train not found' });
    }

    await train.update({
      ...req.body,
      mby: req.user.us_usid
    });
    res.json(train);
  } catch (error) {
    console.error('Error updating train:', error);
    res.status(500).json({ message: 'Error updating train', error: error.message });
  }
});

// Delete train (admin only)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    if (req.user.us_usertype !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin access required.' });
    }

    const train = await Train.findByPk(req.params.id);
    if (!train) {
      return res.status(404).json({ message: 'Train not found' });
    }

    await train.destroy();
    res.json({ message: 'Train deleted successfully' });
  } catch (error) {
    console.error('Error deleting train:', error);
    res.status(500).json({ message: 'Error deleting train', error: error.message });
  }
});

module.exports = router;
