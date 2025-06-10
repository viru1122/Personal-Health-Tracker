const mongoose = require('mongoose');
const Badge = require('../models/Badge');
require('dotenv').config();

const badges = [
    // Sleep Badges
    {
        name: 'Sleep Master',
        description: 'Maintain a consistent sleep schedule for 7 days',
        icon: 'bedtime',
        category: 'sleep',
        tier: 'gold',
        criteria: {
            type: 'streak',
            value: 7
        },
        points: 300
    },
    {
        name: 'Early Bird',
        description: 'Complete sleep goals for 3 consecutive days',
        icon: 'bedtime',
        category: 'sleep',
        tier: 'bronze',
        criteria: {
            type: 'streak',
            value: 3
        },
        points: 100
    },
    
    // Water Badges
    {
        name: 'Hydration Hero',
        description: 'Meet your daily water intake goal for 5 days',
        icon: 'water_drop',
        category: 'water',
        tier: 'silver',
        criteria: {
            type: 'streak',
            value: 5
        },
        points: 200
    },
    {
        name: 'Water Warrior',
        description: 'Achieve 100% of your water goals 10 times',
        icon: 'water_drop',
        category: 'water',
        tier: 'gold',
        criteria: {
            type: 'total',
            value: 10
        },
        points: 300
    },
    
    // Activity Badges
    {
        name: 'Active Achiever',
        description: 'Complete your activity goals for 3 days straight',
        icon: 'directions_run',
        category: 'activity',
        tier: 'bronze',
        criteria: {
            type: 'streak',
            value: 3
        },
        points: 100
    },
    {
        name: 'Exercise Expert',
        description: 'Maintain an average of 90% completion rate in activities',
        icon: 'directions_run',
        category: 'activity',
        tier: 'platinum',
        criteria: {
            type: 'score',
            value: 90
        },
        points: 500
    },
    
    // Nutrition Badges
    {
        name: 'Nutrition Novice',
        description: 'Track your meals for 5 consecutive days',
        icon: 'restaurant',
        category: 'nutrition',
        tier: 'bronze',
        criteria: {
            type: 'streak',
            value: 5
        },
        points: 100
    },
    {
        name: 'Meal Master',
        description: 'Complete 20 healthy meal goals',
        icon: 'restaurant',
        category: 'nutrition',
        tier: 'gold',
        criteria: {
            type: 'total',
            value: 20
        },
        points: 300
    },
    
    // Overall Badges
    {
        name: 'Habit Hero',
        description: 'Achieve 100% completion in all categories for a day',
        icon: 'star',
        category: 'overall',
        tier: 'platinum',
        criteria: {
            type: 'score',
            value: 100
        },
        points: 500
    },
    {
        name: 'Consistency King',
        description: 'Maintain a 10-day streak in any category',
        icon: 'star',
        category: 'overall',
        tier: 'gold',
        criteria: {
            type: 'streak',
            value: 10
        },
        points: 400
    }
];

const seedBadges = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Clear existing badges
        await Badge.deleteMany({});
        console.log('Cleared existing badges');

        // Insert new badges
        await Badge.insertMany(badges);
        console.log('Inserted new badges');

        console.log('Seeding completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding badges:', error);
        process.exit(1);
    }
};

seedBadges(); 