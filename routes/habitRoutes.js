const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const habitController = require('../controllers/habitController');

// Get all habits
router.get('/', protect, habitController.getHabits);

// Get weekly data
router.get('/weekly', protect, habitController.getWeeklyData);

// Create new habit
router.post('/', protect, habitController.createHabit);

// Update habit
router.put('/:id', protect, habitController.updateHabit);

// Delete habit
router.delete('/:id', protect, habitController.deleteHabit);

// Mark habit as complete for today
router.post('/:id/complete', protect, habitController.completeHabit);

// Get habit statistics
router.get('/stats', protect, habitController.getHabitStats);

module.exports = router; 