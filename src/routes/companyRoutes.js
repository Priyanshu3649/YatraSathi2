const express = require('express');
const router = express.Router();
const { Company } = require('../models');
const authenticate = require('../middleware/authMiddleware');

// Get all companies
router.get('/', authenticate, async (req, res) => {
  try {
    const companies = await Company.findAll({
      order: [['co_coid', 'ASC']]
    });
    res.json(companies);
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ message: 'Error fetching companies', error: error.message });
  }
});

// Get company by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    res.json(company);
  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({ message: 'Error fetching company', error: error.message });
  }
});

// Create company (admin only)
router.post('/', authenticate, async (req, res) => {
  try {
    if (req.user.us_usertype !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin access required.' });
    }

    const company = await Company.create({
      ...req.body,
      eby: req.user.us_usid,
      mby: req.user.us_usid
    });
    res.status(201).json(company);
  } catch (error) {
    console.error('Error creating company:', error);
    res.status(500).json({ message: 'Error creating company', error: error.message });
  }
});

// Update company (admin only)
router.put('/:id', authenticate, async (req, res) => {
  try {
    if (req.user.us_usertype !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin access required.' });
    }

    const company = await Company.findByPk(req.params.id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    await company.update({
      ...req.body,
      mby: req.user.us_usid
    });
    res.json(company);
  } catch (error) {
    console.error('Error updating company:', error);
    res.status(500).json({ message: 'Error updating company', error: error.message });
  }
});

// Delete company (admin only)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    if (req.user.us_usertype !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin access required.' });
    }

    const company = await Company.findByPk(req.params.id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    await company.destroy();
    res.json({ message: 'Company deleted successfully' });
  } catch (error) {
    console.error('Error deleting company:', error);
    res.status(500).json({ message: 'Error deleting company', error: error.message });
  }
});

module.exports = router;
