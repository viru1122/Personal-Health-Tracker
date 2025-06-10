const express = require('express');
const router = express.Router();
const Challenge = require('../models/Challenge');
const auth = require('../middleware/auth');

// Get all challenges
router.get('/', auth, async (req, res) => {
    try {
        const challenges = await Challenge.find().populate('badge');
        res.json(challenges);
    } catch (error) {
        console.error('Error fetching all challenges:', error);
        res.status(500).json({ message: 'Error fetching challenges', error: error.message });
    }
});

// Get user's active challenges
router.get('/active', auth, async (req, res) => {
    try {
        // Since user is already populated in auth middleware, we can just return the active challenges
        res.json(req.user.activeChallenges || []);
    } catch (error) {
        console.error('Error fetching active challenges:', error);
        res.status(500).json({ message: 'Error fetching active challenges', error: error.message });
    }
});

// Get user's completed challenges
router.get('/completed', auth, async (req, res) => {
    try {
        // Since user is already populated in auth middleware, we can just return the completed challenges
        res.json(req.user.completedChallenges || []);
    } catch (error) {
        console.error('Error fetching completed challenges:', error);
        res.status(500).json({ message: 'Error fetching completed challenges', error: error.message });
    }
});

// Create a new challenge (admin only)
router.post('/', auth, async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const challenge = new Challenge(req.body);
        await challenge.save();
        res.status(201).json(challenge);
    } catch (error) {
        console.error('Error creating challenge:', error);
        res.status(500).json({ message: 'Error creating challenge', error: error.message });
    }
});

// Join a challenge
router.post('/:id/join', auth, async (req, res) => {
    try {
        const challenge = await Challenge.findById(req.params.id);
        if (!challenge) {
            return res.status(404).json({ message: 'Challenge not found' });
        }

        // Check if challenge is already in activeChallenges
        const isAlreadyActive = req.user.activeChallenges.some(ch => ch._id.toString() === challenge._id.toString());
        if (isAlreadyActive) {
            return res.status(400).json({ message: 'Already joined this challenge' });
        }

        req.user.activeChallenges.push(challenge._id);
        await req.user.save();
        
        // Re-populate the user's challenges
        await req.user.populate('activeChallenges');
        
        res.json({ 
            message: 'Successfully joined the challenge',
            challenge: challenge
        });
    } catch (error) {
        console.error('Error joining challenge:', error);
        res.status(500).json({ message: 'Error joining challenge', error: error.message });
    }
});

// Complete a challenge
router.post('/:id/complete', auth, async (req, res) => {
    try {
        const challenge = await Challenge.findById(req.params.id);
        if (!challenge) {
            return res.status(404).json({ message: 'Challenge not found' });
        }

        // Check if challenge is in activeChallenges
        const isActive = req.user.activeChallenges.some(ch => ch._id.toString() === challenge._id.toString());
        if (!isActive) {
            return res.status(400).json({ message: 'Not participating in this challenge' });
        }

        // Remove from active challenges
        req.user.activeChallenges = req.user.activeChallenges.filter(
            ch => ch._id.toString() !== challenge._id.toString()
        );

        // Check if already completed
        const isCompleted = req.user.completedChallenges.some(ch => ch._id.toString() === challenge._id.toString());
        if (!isCompleted) {
            req.user.completedChallenges.push(challenge._id);
            req.user.points += challenge.points;
            req.user.stats.totalPoints += challenge.points;
            req.user.stats.completedChallenges += 1;
        }

        await req.user.save();
        
        // Re-populate the user's challenges
        await req.user.populate(['activeChallenges', 'completedChallenges']);
        
        res.json({ 
            message: 'Challenge completed successfully',
            points: challenge.points,
            challenge: challenge
        });
    } catch (error) {
        console.error('Error completing challenge:', error);
        res.status(500).json({ message: 'Error completing challenge', error: error.message });
    }
});

module.exports = router; 