const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Habit = require('../models/Habit');
const auth = require('../middleware/auth');

// Calculate weekly average
const calculateWeeklyAverage = async (userId) => {
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const weekHabits = await Habit.find({
        user: userId,
        date: { $gte: lastWeek, $lt: today }
    });

    if (!weekHabits.length) return 0;

    const dailyScores = weekHabits.reduce((acc, habit) => {
        const date = habit.date.toISOString().split('T')[0];
        if (!acc[date]) {
            acc[date] = {
                totalScore: 0,
                totalPossible: 0
            };
        }
        acc[date].totalScore += habit.score?.total || 0;
        acc[date].totalPossible += 100;
        return acc;
    }, {});

    const dailyPercentages = Object.values(dailyScores).map(day => 
        (day.totalScore / day.totalPossible) * 100
    );

    return Math.round(
        dailyPercentages.reduce((sum, score) => sum + score, 0) / dailyPercentages.length
    );
};

// Register
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if user already exists
        let user = await User.findOne({ $or: [{ email }, { username }] });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create new user
        user = new User({
            username,
            email,
            password,
            stats: {
                totalPoints: 0,
                completedChallenges: 0,
                badgesEarned: 0,
                currentStreak: 0,
                longestStreak: 0
            }
        });

        await user.save();

        // Generate token
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
            expiresIn: '7d'
        });

        res.status(201).json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                points: user.points,
                stats: user.stats
            }
        });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get current user
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('-password')
            .populate('badges')
            .populate('activeChallenges')
            .populate('completedChallenges');
        res.json(user);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update user
router.put('/me', auth, async (req, res) => {
    try {
        const updates = Object.keys(req.body);
        const allowedUpdates = ['username', 'email', 'password'];
        const isValidOperation = updates.every(update => allowedUpdates.includes(update));

        if (!isValidOperation) {
            return res.status(400).json({ message: 'Invalid updates' });
        }

        updates.forEach(update => {
            req.user[update] = req.body[update];
        });

        await req.user.save();
        res.json(req.user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user stats
router.get('/stats', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('stats points habits');
        
        // Get today's habits and their categories
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayHabits = await Habit.find({
            user: req.user._id,
            date: {
                $gte: today,
                $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
            }
        }).lean();

        // Initialize category scores
        const categoryScores = {
            health: { score: 0, total: 0, count: 0 },
            fitness: { score: 0, total: 0, count: 0 },
            mindfulness: { score: 0, total: 0, count: 0 },
            productivity: { score: 0, total: 0, count: 0 },
            other: { score: 0, total: 0, count: 0 }
        };

        // Process today's habits
        let totalScore = 0;
        let totalPossible = 0;
        let completedHabits = 0;

        todayHabits.forEach(habit => {
            const category = habit.category?.toLowerCase() || 'other';
            if (categoryScores[category]) {
                const habitScore = habit.score?.total || 0;
                categoryScores[category].score += habitScore;
                categoryScores[category].total += 100;
                categoryScores[category].count++;
                totalScore += habitScore;
                totalPossible += 100;
                if (habit.completed) {
                    completedHabits++;
                }
            }
        });

        // Calculate weekly progress
        const weeklyAverage = await calculateWeeklyAverage(req.user._id);
        const previousWeekAverage = weeklyAverage; // You might want to calculate this separately

        // Calculate final scores
        const todayScore = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;
        const completionRate = todayHabits.length > 0 ? Math.round((completedHabits / todayHabits.length) * 100) : 0;

        // Calculate improvement
        const improvement = previousWeekAverage > 0 
            ? Math.round(((todayScore - previousWeekAverage) / previousWeekAverage) * 100)
            : 0;

        // Prepare category breakdown
        const categoryBreakdown = {};
        Object.entries(categoryScores).forEach(([category, data]) => {
            if (data.count > 0) {
                categoryBreakdown[category] = {
                    score: Math.round((data.score / data.total) * 100),
                    habitCount: data.count
                };
            }
        });

        // Prepare response with all required fields
        const stats = {
            totalPoints: user.points || 0,
            weeklyAverage: weeklyAverage || 0,
            todayScore: todayScore,
            todayHabits: todayHabits.length,
            completionRate: completionRate,
            currentStreak: user.stats?.currentStreak || 0,
            longestStreak: user.stats?.longestStreak || 0,
            completedChallenges: user.stats?.completedChallenges || 0,
            badgesEarned: user.stats?.badgesEarned || 0,
            categoryBreakdown: categoryBreakdown,
            progressTrend: {
                daily: todayScore,
                weekly: weeklyAverage,
                improvement: improvement
            }
        };

        res.json(stats);
    } catch (error) {
        console.error('Error fetching user stats:', error);
        res.status(500).json({ 
            message: 'Error fetching user stats', 
            error: error.message 
        });
    }
});

// Get user profile
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json(user);
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ message: 'Error fetching profile' });
    }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
    try {
        const { username, email, bio, preferences } = req.body;
        const updates = {};

        // Only update fields that are provided
        if (username) updates.username = username;
        if (email) updates.email = email;
        if (bio) updates.bio = bio;
        if (preferences) updates.preferences = preferences;

        // Check if email or username already exists
        if (email || username) {
            const existingUser = await User.findOne({
                $and: [
                    { _id: { $ne: req.user._id } },
                    {
                        $or: [
                            { email: email || '' },
                            { username: username || '' }
                        ]
                    }
                ]
            });

            if (existingUser) {
                return res.status(400).json({
                    message: 'Username or email already in use'
                });
            }
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: updates },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Error updating profile' });
    }
});

// Update user preferences
router.put('/preferences', auth, async (req, res) => {
    try {
        const { preferences } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: { preferences } },
            { new: true, runValidators: true }
        ).select('preferences');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user.preferences);
    } catch (error) {
        console.error('Error updating preferences:', error);
        res.status(500).json({ message: 'Error updating preferences' });
    }
});

module.exports = router; 