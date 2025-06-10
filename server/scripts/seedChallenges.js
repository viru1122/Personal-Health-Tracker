const mongoose = require('mongoose');
const Challenge = require('../models/Challenge');
require('dotenv').config();

const challenges = [
    {
        title: "Sleep Master",
        description: "Maintain a consistent sleep schedule for 7 days",
        category: "sleep",
        requirements: {
            type: "streak",
            target: 7,
            duration: 7
        },
        points: 300,
        isActive: true
    },
    {
        title: "Early Bird",
        description: "Complete sleep goals for 3 consecutive days",
        category: "sleep",
        requirements: {
            type: "streak",
            target: 3,
            duration: 3
        },
        points: 100,
        isActive: true
    },
    {
        title: "Hydration Hero",
        description: "Meet your daily water intake goal for 5 days",
        category: "water",
        requirements: {
            type: "streak",
            target: 5,
            duration: 5
        },
        points: 200,
        isActive: true
    },
    {
        title: "Water Warrior",
        description: "Achieve 100% of your water goals 10 times",
        category: "water",
        requirements: {
            type: "total",
            target: 10,
            duration: 14
        },
        points: 300,
        isActive: true
    },
    {
        title: "Active Achiever",
        description: "Complete your activity goals for 3 days straight",
        category: "activity",
        requirements: {
            type: "streak",
            target: 3,
            duration: 3
        },
        points: 100,
        isActive: true
    },
    {
        title: "Exercise Expert",
        description: "Maintain an average of 90% completion rate in activities",
        category: "activity",
        requirements: {
            type: "score",
            target: 90,
            duration: 7
        },
        points: 500,
        isActive: true
    },
    {
        title: "Nutrition Novice",
        description: "Track your meals for 5 consecutive days",
        category: "nutrition",
        requirements: {
            type: "streak",
            target: 5,
            duration: 5
        },
        points: 100,
        isActive: true
    },
    {
        title: "Meal Master",
        description: "Complete 20 healthy meal goals",
        category: "nutrition",
        requirements: {
            type: "total",
            target: 20,
            duration: 30
        },
        points: 300,
        isActive: true
    },
    {
        title: "Habit Hero",
        description: "Achieve 100% completion in all categories for a day",
        category: "overall",
        requirements: {
            type: "score",
            target: 100,
            duration: 1
        },
        points: 500,
        isActive: true
    },
    {
        title: "Consistency King",
        description: "Maintain a 10-day streak in any category",
        category: "overall",
        requirements: {
            type: "streak",
            target: 10,
            duration: 10
        },
        points: 400,
        isActive: true
    }
];

const seedChallenges = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Clear existing challenges
        await Challenge.deleteMany({});
        console.log('Cleared existing challenges');

        // Insert new challenges
        await Challenge.insertMany(challenges);
        console.log('Added new challenges');

        console.log('Database seeded successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedChallenges(); 