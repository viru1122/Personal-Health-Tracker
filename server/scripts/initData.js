const mongoose = require('mongoose');
const Challenge = require('../models/Challenge');
const Badge = require('../models/Badge');
require('dotenv').config();

const initializeData = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/personal-tracker');
        console.log('Connected to MongoDB');

        // Clear existing data
        await Challenge.deleteMany({});
        await Badge.deleteMany({});

        // Create initial challenges
        const challenges = [
            {
                title: '30 Days of Exercise',
                description: 'Exercise for at least 30 minutes every day for 30 days',
                category: 'activity',
                requirements: {
                    type: 'total',
                    target: 30,
                    duration: 30
                },
                points: 100,
                startDate: new Date(),
                isActive: true
            },
            {
                title: 'Water Challenge',
                description: 'Drink 8 glasses of water daily for a week',
                category: 'water',
                requirements: {
                    type: 'streak',
                    target: 8,
                    duration: 7
                },
                points: 50,
                startDate: new Date(),
                isActive: true
            },
            {
                title: 'Sleep Well',
                description: 'Get 8 hours of sleep for 5 consecutive days',
                category: 'sleep',
                requirements: {
                    type: 'score',
                    target: 8,
                    duration: 5
                },
                points: 30,
                startDate: new Date(),
                isActive: true
            }
        ];

        // Create initial badges
        const badges = [
            {
                name: 'Exercise Enthusiast',
                description: 'Complete 10 exercise sessions',
                category: 'activity',
                icon: 'fitness_center',
                tier: 'bronze',
                points: 50,
                criteria: {
                    type: 'total',
                    value: 10
                },
                isSecret: false
            },
            {
                name: 'Hydration Hero',
                description: 'Maintain perfect water intake for 7 days',
                category: 'water',
                icon: 'local_drink',
                tier: 'silver',
                points: 75,
                criteria: {
                    type: 'streak',
                    value: 7
                },
                isSecret: false
            },
            {
                name: 'Sleep Master',
                description: 'Achieve 90% sleep score for 5 days',
                category: 'sleep',
                icon: 'bedtime',
                tier: 'gold',
                points: 100,
                criteria: {
                    type: 'score',
                    value: 90
                },
                isSecret: false
            }
        ];

        // Insert the data
        const savedChallenges = await Challenge.insertMany(challenges);
        const savedBadges = await Badge.insertMany(badges);

        // Link badges to challenges
        savedChallenges[0].badge = savedBadges[0]._id;
        savedChallenges[1].badge = savedBadges[1]._id;
        savedChallenges[2].badge = savedBadges[2]._id;

        // Save the updated challenges
        await Promise.all(savedChallenges.map(challenge => challenge.save()));

        console.log('Sample data initialized successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error initializing data:', error);
        process.exit(1);
    }
};

initializeData(); 