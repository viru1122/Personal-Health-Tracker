const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

const AVAILABLE_CHALLENGES = [
    {
        name: 'Early Bird Week',
        description: 'Log 7 days of waking up before 7 AM',
        requiredScore: 70,
        duration: 7, // days
        badgeReward: 'early_bird',
        category: 'sleep'
    },
    {
        name: 'Sleep Master',
        description: 'Maintain a consistent sleep schedule for 5 days',
        requiredScore: 50,
        duration: 5,
        badgeReward: 'night_owl',
        category: 'sleep'
    },
    {
        name: 'Healthy Eating Streak',
        description: 'Log 3 healthy meals per day for 5 days',
        requiredScore: 60,
        duration: 5,
        badgeReward: 'healthy_eater',
        category: 'nutrition'
    },
    {
        name: 'Exercise Champion',
        description: 'Complete daily exercise for 7 days straight',
        requiredScore: 80,
        duration: 7,
        badgeReward: 'exercise_master',
        category: 'activity'
    },
    {
        name: 'Hydration Challenge',
        description: 'Drink at least 2L of water daily for 5 days',
        requiredScore: 50,
        duration: 5,
        badgeReward: 'hydration_hero',
        category: 'water'
    }
];

// Get all challenges
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const userChallenges = user.challenges || [];
        
        // Map available challenges with user progress
        const challenges = AVAILABLE_CHALLENGES.map(challenge => {
            const userChallenge = userChallenges.find(uc => uc.name === challenge.name);
            return {
                ...challenge,
                isActive: userChallenge ? !userChallenge.completed : false,
                completed: userChallenge ? userChallenge.completed : false,
                startDate: userChallenge ? userChallenge.startDate : null,
                progress: userChallenge ? userChallenge.progress : 0
            };
        });

        res.json(challenges);
    } catch (error) {
        console.error('Get challenges error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get active challenges
router.get('/active', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const activeChallenges = user.challenges.filter(
            challenge => !challenge.completed && new Date(challenge.deadline) >= new Date()
        );
        res.json(activeChallenges);
    } catch (error) {
        console.error('Get active challenges error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get completed challenges
router.get('/completed', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const completedChallenges = user.challenges.filter(
            challenge => challenge.completed
        );
        res.json(completedChallenges);
    } catch (error) {
        console.error('Get completed challenges error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Start a challenge
router.post('/:challengeName/start', auth, async (req, res) => {
    try {
        const { challengeName } = req.params;
        const challenge = AVAILABLE_CHALLENGES.find(c => c.name === challengeName);
        
        if (!challenge) {
            return res.status(404).json({ message: 'Challenge not found' });
        }

        // Use findOneAndUpdate to atomically update the user document
        const result = await User.findOneAndUpdate(
            {
                _id: req.user._id,
                // Make sure challenge isn't already active
                'challenges.name': { $ne: challengeName }
            },
            {
                $push: {
                    challenges: {
                        name: challenge.name,
                        description: challenge.description,
                        startDate: new Date(),
                        completed: false,
                        progress: 0,
                        category: challenge.category,
                        requiredScore: challenge.requiredScore,
                        duration: challenge.duration,
                        badgeReward: challenge.badgeReward
                    }
                }
            },
            { 
                new: true,
                runValidators: false // Disable validation since we know the data is correct
            }
        );

        if (!result) {
            return res.status(400).json({ message: 'Challenge already active or user not found' });
        }

        res.json({ message: 'Challenge started successfully' });
    } catch (error) {
        console.error('Start challenge error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update challenge progress based on daily habits
router.put('/update-progress', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const today = new Date();
        let updated = false;

        // Update progress for each active challenge
        for (let challenge of user.challenges) {
            if (challenge.completed) continue;

            const startDate = new Date(challenge.startDate);
            const daysSinceStart = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));

            // Check if challenge duration has passed
            if (daysSinceStart >= challenge.duration) {
                challenge.completed = true;
                // If user met the required score, award the badge
                if (challenge.progress >= challenge.requiredScore) {
                    if (!user.badges.includes(challenge.badgeReward)) {
                        user.badges.push(challenge.badgeReward);
                    }
                }
                updated = true;
                continue;
            }

            // Get today's habit score for the challenge category
            const todayHabits = user.habits.filter(h => {
                const habitDate = new Date(h.date);
                return habitDate.toDateString() === today.toDateString();
            });

            if (todayHabits.length > 0) {
                let categoryScore = 0;
                switch (challenge.category) {
                    case 'sleep':
                        categoryScore = todayHabits.reduce((sum, h) => sum + (h.sleepHours >= 6 && h.sleepHours <= 8 ? 10 : 5), 0);
                        break;
                    case 'water':
                        categoryScore = todayHabits.reduce((sum, h) => sum + (h.waterIntake >= 2 ? 10 : 5), 0);
                        break;
                    case 'activity':
                        categoryScore = todayHabits.reduce((sum, h) => sum + (h.exercise ? 10 : 0), 0);
                        break;
                    case 'nutrition':
                        categoryScore = todayHabits.reduce((sum, h) => sum + (h.healthyMeals * 3), 0);
                        break;
                }

                challenge.progress = Math.round((challenge.progress * daysSinceStart + categoryScore) / (daysSinceStart + 1));
                updated = true;
            }
        }

        if (updated) {
            await User.findByIdAndUpdate(
                user._id,
                { 
                    $set: { 
                        challenges: user.challenges,
                        badges: user.badges
                    }
                },
                { runValidators: false }
            );
        }

        res.json({ message: 'Progress updated successfully' });
    } catch (error) {
        console.error('Update progress error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 
module.exports = router; 