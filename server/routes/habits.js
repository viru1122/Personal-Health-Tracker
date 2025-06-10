const express = require('express');
const router = express.Router();
const Habit = require('../models/Habit');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Validation middleware
const validateHabitData = (req, res, next) => {
    const { sleepHours, waterIntake, exerciseDone, healthyMeals, mood, productivityLevel } = req.body;

    // Validate required fields
    if (sleepHours === undefined || waterIntake === undefined || exerciseDone === undefined || 
        healthyMeals === undefined || !mood || !productivityLevel) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate numeric ranges
    if (sleepHours < 0 || sleepHours > 24) {
        return res.status(400).json({ message: 'Sleep hours must be between 0 and 24' });
    }

    if (waterIntake < 0 || waterIntake > 10) {
        return res.status(400).json({ message: 'Water intake must be between 0 and 10 liters' });
    }

    if (healthyMeals < 0 || healthyMeals > 3) {
        return res.status(400).json({ message: 'Healthy meals must be between 0 and 3' });
    }

    // Validate mood
    const validMoods = ['tired', 'sad', 'angry', 'good', 'great'];
    if (!validMoods.includes(mood)) {
        return res.status(400).json({ message: 'Invalid mood value' });
    }

    // Validate productivity level
    const validProductivityLevels = ['low', 'medium', 'high'];
    if (!validProductivityLevels.includes(productivityLevel)) {
        return res.status(400).json({ message: 'Invalid productivity level' });
    }

    next();
};

// Helper function to update user stats
const updateUserStats = async (userId, habit) => {
    try {
        const user = await User.findById(userId);
        if (!user) return;

        // Update total points if habit is completed
        if (habit.completed) {
            user.stats.totalPoints += habit.score.total;
        }

        // Update current streak if habit is completed
        if (habit.streak > user.stats.currentStreak) {
            user.stats.currentStreak = habit.streak;
        }

        // Update longest streak if current streak is longer
        if (user.stats.currentStreak > user.stats.longestStreak) {
            user.stats.longestStreak = user.stats.currentStreak;
        }

        await user.save();
    } catch (error) {
        console.error('Error updating user stats:', error);
    }
};

// Get all habits for current user
router.get('/', auth, async (req, res) => {
    try {
        const habits = await Habit.find({ userId: req.user._id })
            .sort({ date: -1 });
        res.json(habits);
    } catch (error) {
        console.error('Error fetching habits:', error);
        res.status(500).json({ message: 'Error fetching habits' });
    }
});

// Get weekly habits
router.get('/weekly', auth, async (req, res) => {
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 7);

        const habits = await Habit.find({
            userId: req.user._id,
            date: {
                $gte: startDate,
                $lte: endDate
            }
        }).sort({ date: -1 });

        res.json(habits);
    } catch (error) {
        console.error('Error fetching weekly habits:', error);
        res.status(500).json({ message: 'Error fetching weekly habits' });
    }
});

// Get habit stats
router.get('/stats', auth, async (req, res) => {
    try {
        const habits = await Habit.find({ userId: req.user._id });
        
        const stats = {
            totalHabits: habits.length,
            averageScore: 0,
            bestDay: null,
            worstDay: null,
            streaks: {
                current: 0,
                longest: 0
            }
        };

        if (habits.length > 0) {
            // Calculate average score
            const totalScore = habits.reduce((sum, habit) => sum + habit.score, 0);
            stats.averageScore = Math.round(totalScore / habits.length);

            // Find best and worst days
            const sortedByScore = [...habits].sort((a, b) => b.score - a.score);
            stats.bestDay = {
                date: sortedByScore[0].date,
                score: sortedByScore[0].score
            };
            stats.worstDay = {
                date: sortedByScore[sortedByScore.length - 1].date,
                score: sortedByScore[sortedByScore.length - 1].score
            };
        }

        res.json(stats);
    } catch (error) {
        console.error('Error fetching habit stats:', error);
        res.status(500).json({ message: 'Error fetching habit stats' });
    }
});

// Get habit by date
router.get('/:date', auth, async (req, res) => {
    try {
        const date = new Date(req.params.date);
        const startOfDay = new Date(date.setHours(0, 0, 0, 0));
        const endOfDay = new Date(date.setHours(23, 59, 59, 999));

        const habits = await Habit.find({
            userId: req.user._id,
            date: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        });

        if (habits.length === 0) {
            return res.status(404).json({ message: 'No habit data found for this date' });
        }

        res.json(habits);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Create a new habit
router.post('/', auth, validateHabitData, async (req, res) => {
    try {
        const { 
            sleepHours, 
            waterIntake, 
            exerciseDone, 
            healthyMeals, 
            mood, 
            productivityLevel, 
            notes,
            date 
        } = req.body;

        // Create habit with validated data
        const habitData = {
            userId: req.user._id,
            date: date || new Date(),
            sleepHours,
            waterIntake,
            exerciseDone,
            healthyMeals,
            mood,
            productivityLevel,
            notes: notes || ''
        };

        // Create and save the habit
        const habit = new Habit(habitData);
        const savedHabit = await habit.save();

        // Update user stats
        try {
            const user = await User.findById(req.user._id);
            if (user) {
                if (!user.stats) {
                    user.stats = {
                        totalPoints: 0,
                        currentStreak: 0,
                        longestStreak: 0,
                        completedHabits: 0
                    };
                }

                user.stats.completedHabits = (user.stats.completedHabits || 0) + 1;
                user.stats.totalPoints = (user.stats.totalPoints || 0) + savedHabit.score;
                
                await user.save();
            }
        } catch (error) {
            console.error('Error updating user stats:', error);
            // Don't fail the request if stats update fails
        }

        res.status(201).json(savedHabit);
    } catch (error) {
        console.error('Error creating habit:', error);
        res.status(500).json({ 
            message: 'Error creating habit',
            error: error.message
        });
    }
});

// Update a habit
router.put('/:id', auth, async (req, res) => {
    try {
        const { completed } = req.body;
        const habit = await Habit.findOne({ _id: req.params.id, userId: req.user._id });

        if (!habit) {
            return res.status(404).json({ message: 'Habit not found' });
        }

        // Update completion status and score
        if (completed !== undefined && completed !== habit.completed) {
            habit.completed = completed;
            if (completed) {
                // Set scores when marking as completed
                habit.score = {
                    total: 100,
                    health: habit.category === 'health' ? 100 : 0,
                    fitness: habit.category === 'fitness' ? 100 : 0,
                    mindfulness: habit.category === 'mindfulness' ? 100 : 0,
                    productivity: habit.category === 'productivity' ? 100 : 0
                };

                // Update user stats
                const user = await User.findById(req.user._id);
                user.points = (user.points || 0) + 10;
                user.stats = user.stats || {};
                user.stats.currentStreak = (user.stats.currentStreak || 0) + 1;
                user.stats.longestStreak = Math.max(user.stats.longestStreak || 0, user.stats.currentStreak);
                await user.save();
            } else {
                // Reset scores when unmarking as completed
                habit.score = {
                    total: 0,
                    health: 0,
                    fitness: 0,
                    mindfulness: 0,
                    productivity: 0
                };
            }
        }

        // Update other fields if provided
        if (req.body.title) habit.title = req.body.title;
        if (req.body.description) habit.description = req.body.description;
        if (req.body.category) habit.category = req.body.category;

        await habit.save();
        res.json(habit);
    } catch (error) {
        console.error('Error updating habit:', error);
        res.status(500).json({ message: 'Error updating habit', error: error.message });
    }
});

// Delete habit entry
router.delete('/:id', auth, async (req, res) => {
    try {
        const habit = await Habit.findOneAndDelete({ 
            _id: req.params.id, 
            userId: req.user._id 
        });

        if (!habit) {
            return res.status(404).json({ message: 'Habit not found' });
        }

        res.json({ message: 'Habit deleted successfully' });
    } catch (error) {
        console.error('Error deleting habit:', error);
        res.status(500).json({ message: 'Error deleting habit' });
    }
});

module.exports = router; 