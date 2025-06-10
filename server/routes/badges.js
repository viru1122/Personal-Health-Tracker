const express = require('express');
const router = express.Router();
const Badge = require('../models/Badge');
const auth = require('../middleware/auth');

// Get all badges (including progress for authenticated user)
router.get('/', auth, async (req, res) => {
    try {
        const badges = await Badge.find();
        const userBadges = (req.user.badges || []).map(badge => badge._id.toString());

        // Get user's habits for the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const habits = await req.user.getHabits({ 
            createdAt: { $gte: thirtyDaysAgo }
        });
        
        // Calculate progress for each badge
        const badgesWithProgress = await Promise.all(badges.map(async (badge) => {
            let progress = 0;
            let isEarned = userBadges.includes(badge._id.toString());
            
            if (!isEarned) {
                try {
                    switch (badge.criteria.type) {
                        case 'score':
                            // Calculate average completion rate for the category
                            const relevantHabits = habits.filter(h => h.category === badge.category);
                            const completionRates = relevantHabits.map(h => 
                                h.targetValue > 0 ? (h.currentValue / h.targetValue) * 100 : 0
                            );
                            const avgRate = completionRates.length > 0 
                                ? completionRates.reduce((a, b) => a + b, 0) / completionRates.length 
                                : 0;
                            progress = (avgRate / badge.criteria.value) * 100;
                            isEarned = avgRate >= badge.criteria.value;
                            break;
                            
                        case 'streak':
                            // Find the highest streak in the category
                            const streaks = habits
                                .filter(h => h.category === badge.category)
                                .map(h => h.streak || 0);
                            const maxStreak = streaks.length > 0 ? Math.max(...streaks) : 0;
                            progress = (maxStreak / badge.criteria.value) * 100;
                            isEarned = maxStreak >= badge.criteria.value;
                            break;
                            
                        case 'total':
                            // Calculate total completion rate
                            const totalCompletions = habits
                                .filter(h => h.category === badge.category && h.completed)
                                .length;
                            progress = (totalCompletions / badge.criteria.value) * 100;
                            isEarned = totalCompletions >= badge.criteria.value;
                            break;

                        case 'challenge':
                            // Calculate progress based on completed challenges
                            const completedChallenges = (req.user.completedChallenges || []).length;
                            progress = (completedChallenges / badge.criteria.value) * 100;
                            isEarned = completedChallenges >= badge.criteria.value;
                            break;
                    }

                    // If badge is earned, add it to user's badges
                    if (isEarned && !userBadges.includes(badge._id.toString())) {
                        if (!req.user.badges) req.user.badges = [];
                        req.user.badges.push(badge._id);
                        req.user.points += badge.points;
                        req.user.stats.totalPoints += badge.points;
                        req.user.stats.badgesEarned += 1;
                        await req.user.save();
                    }
                } catch (error) {
                    console.error(`Error calculating progress for badge ${badge._id}:`, error);
                    progress = 0;
                    isEarned = false;
                }
            }
            
            return {
                ...badge.toObject(),
                progress: Math.min(100, Math.round(progress)),
                isEarned
            };
        }));
        
        res.json(badgesWithProgress);
    } catch (error) {
        console.error('Error getting badges:', error);
        res.status(500).json({ message: 'Error fetching badges', error: error.message });
    }
});

// Get user's badges
router.get('/my-badges', auth, async (req, res) => {
    try {
        // Since user is already populated in auth middleware, we can just return the badges
        res.json(req.user.badges || []);
    } catch (error) {
        console.error('Error fetching user badges:', error);
        res.status(500).json({ message: 'Error fetching user badges', error: error.message });
    }
});

// Create a new badge (admin only)
router.post('/', auth, async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const badge = new Badge(req.body);
        await badge.save();
        res.status(201).json(badge);
    } catch (error) {
        console.error('Error creating badge:', error);
        res.status(500).json({ message: 'Error creating badge', error: error.message });
    }
});

// Update a badge (admin only)
router.put('/:id', auth, async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const badge = await Badge.findById(req.params.id);
        if (!badge) {
            return res.status(404).json({ message: 'Badge not found' });
        }

        Object.assign(badge, req.body);
        await badge.save();
        res.json(badge);
    } catch (error) {
        console.error('Error updating badge:', error);
        res.status(500).json({ message: 'Error updating badge', error: error.message });
    }
});

// Delete a badge (admin only)
router.delete('/:id', auth, async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const badge = await Badge.findById(req.params.id);
        if (!badge) {
            return res.status(404).json({ message: 'Badge not found' });
        }

        await Badge.deleteOne({ _id: badge._id });
        res.json({ message: 'Badge deleted successfully' });
    } catch (error) {
        console.error('Error deleting badge:', error);
        res.status(500).json({ message: 'Error deleting badge', error: error.message });
    }
});

module.exports = router; 