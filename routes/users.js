const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// Get user profile
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json(user);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
    try {
        const updates = Object.keys(req.body);
        const allowedUpdates = ['name', 'email', 'preferences'];
        const isValidOperation = updates.every(update => allowedUpdates.includes(update));

        if (!isValidOperation) {
            return res.status(400).json({ message: 'Invalid updates' });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        updates.forEach(update => {
            if (update === 'preferences') {
                Object.assign(user.preferences, req.body.preferences);
            } else {
                user[update] = req.body[update];
            }
        });

        await user.save();
        res.json(user);
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user stats
router.get('/stats', auth, async (req, res) => {
    try {
        // Use the user from auth middleware which has all fields initialized
        const user = req.user;
        
        // Calculate stats without saving
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Calculate today's stats
        const todayHabits = user.habits.filter(habit => {
            const habitDate = new Date(habit.date);
            habitDate.setHours(0, 0, 0, 0);
            return habitDate.getTime() === today.getTime();
        });

        let todayScore = 0;
        let todayHabitsCount = todayHabits.length;
        if (todayHabits.length > 0) {
            const totalScore = todayHabits.reduce((sum, habit) => sum + habit.score, 0);
            todayScore = Math.round(totalScore / todayHabits.length);
        }

        // Calculate weekly stats
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        const weeklyHabits = user.habits.filter(habit => {
            const habitDate = new Date(habit.date);
            habitDate.setHours(0, 0, 0, 0);
            return habitDate >= weekAgo && habitDate <= today;
        });

        let weeklyAverage = 0;
        if (weeklyHabits.length > 0) {
            const totalScore = weeklyHabits.reduce((sum, habit) => sum + habit.score, 0);
            weeklyAverage = Math.round(totalScore / weeklyHabits.length);
        }

        // Calculate streak
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const hasHabitToday = todayHabits.length > 0;
        const hasHabitYesterday = user.habits.some(habit => {
            const habitDate = new Date(habit.date);
            habitDate.setHours(0, 0, 0, 0);
            return habitDate.getTime() === yesterday.getTime();
        });

        let currentStreak = user.stats.currentStreak || 0;
        if (hasHabitToday) {
            if (hasHabitYesterday || currentStreak === 0) {
                currentStreak += 1;
            }
        }

        // Return formatted stats without saving
        res.json({
            totalPoints: user.stats.totalPoints || 0,
            todayScore,
            todayHabits: todayHabitsCount,
            weeklyAverage,
            currentStreak,
            longestStreak: user.stats.longestStreak || 0,
            completedHabits: user.stats.completedHabits || 0,
            progressTrend: {
                daily: todayScore,
                weekly: weeklyAverage,
                improvement: weeklyAverage - (user.stats.weeklyAverage || 0)
            }
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 