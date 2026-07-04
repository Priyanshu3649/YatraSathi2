const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { getAvailableYears, selectYear } = require('../controllers/sessionController');

const router = express.Router();

// All session endpoints require authentication
router.use(authMiddleware);

router.get('/financial-years', getAvailableYears);
router.post('/select-year', selectYear);

module.exports = router;
