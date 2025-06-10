const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const statsController = require('../controllers/statsController');

// Stats routes
router.get('/stats', protect, statsController.getUserStats);

module.exports = router; 