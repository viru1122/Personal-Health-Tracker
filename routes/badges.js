const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

const AVAILABLE_BADGES = [
    {
        name: 'early_bird',
        description: 'Wake up early and maintain a consistent sleep schedule',
        category: 'sleep',
        isEarned: false
    },
    {
        name: 'night_owl',
        description: 'Track your sleep consistently for a week',
        category: 'sleep',
        isEarned: false
    },
    {
        name: 'healthy_eater',
        description: 'Log healthy meals consistently',
        category: 'nutrition',
        isEarned: false
    },
    {
        name: 'exercise_master',
        description: 'Exercise regularly and maintain an active lifestyle',
        category: 'activity',
        isEarned: false
    },
    {
        name: 'hydration_hero',
        description: 'Stay hydrated by drinking enough water daily',
        category: 'water',
        isEarned: false
    }
];

// Get all badges for a user
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const userBadges = user.badges || [];
        
        // Mark badges as earned if user has them
        const badges = AVAILABLE_BADGES.map(badge => ({
            ...badge,
            isEarned: userBadges.includes(badge.name)
        }));

        res.json(badges);
    } catch (error) {
        console.error('Get badges error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 