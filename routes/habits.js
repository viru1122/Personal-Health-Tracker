const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const mongoose = require('mongoose');

// Get all habits for a user
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user.habits.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch (error) {
        console.error('Get habits error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get weekly habits
router.get('/weekly', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 7);

        // Get habits for the past week
        const weeklyHabits = user.habits.filter(habit => {
            const habitDate = new Date(habit.date);
            return habitDate >= startDate && habitDate <= endDate;
        });

        // Group habits by date
        const habitsByDate = weeklyHabits.reduce((acc, habit) => {
            const dateKey = new Date(habit.date).toISOString().split('T')[0];
            if (!acc[dateKey]) {
                acc[dateKey] = {
                    date: dateKey,
                    habits: [],
                    score: {
                        health: 0,
                        fitness: 0,
                        mindfulness: 0,
                        productivity: 0
                    },
                    completion: 0,
                    totalScore: 0
                };
            }
            acc[dateKey].habits.push(habit);
            return acc;
        }, {});

        // Calculate scores for each date
        Object.values(habitsByDate).forEach(dayData => {
            let totalPossibleScore = 0;
            let totalActualScore = 0;

            dayData.habits.forEach(habit => {
                // Health score (sleep and water)
                if (habit.sleepHours >= 6 && habit.sleepHours <= 8) {
                    dayData.score.health += 20;
                } else if (habit.sleepHours > 4) {
                    dayData.score.health += 10;
                }
                if (habit.waterIntake >= 2) {
                    dayData.score.health += 20;
                }

                // Fitness score
                if (habit.exerciseDone) {
                    dayData.score.fitness += 30;
                }

                // Mindfulness score (based on mood)
                if (habit.mood === 'great') {
                    dayData.score.mindfulness += 20;
                } else if (habit.mood === 'good') {
                    dayData.score.mindfulness += 15;
                }

                // Productivity score
                if (habit.productivityLevel === 'high') {
                    dayData.score.productivity += 30;
                } else if (habit.productivityLevel === 'medium') {
                    dayData.score.productivity += 20;
                }

                totalPossibleScore += 100;
                totalActualScore += habit.score || 0;
            });

            // Calculate completion percentage
            dayData.completion = Math.round((totalActualScore / totalPossibleScore) * 100) || 0;
            
            // Normalize category scores
            const habitCount = dayData.habits.length || 1;
            dayData.score.health = Math.round(dayData.score.health / habitCount);
            dayData.score.fitness = Math.round(dayData.score.fitness / habitCount);
            dayData.score.mindfulness = Math.round(dayData.score.mindfulness / habitCount);
            dayData.score.productivity = Math.round(dayData.score.productivity / habitCount);
            
            // Calculate total score
            dayData.totalScore = Math.round(
                (dayData.score.health + dayData.score.fitness + 
                dayData.score.mindfulness + dayData.score.productivity) / 4
            );
        });

        // Fill in missing dates with zero values
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateKey = d.toISOString().split('T')[0];
            if (!habitsByDate[dateKey]) {
                habitsByDate[dateKey] = {
                    date: dateKey,
                    habits: [],
                    score: {
                        health: 0,
                        fitness: 0,
                        mindfulness: 0,
                        productivity: 0
                    },
                    completion: 0,
                    totalScore: 0
                };
            }
        }

        // Convert to array and sort by date
        const weeklyData = Object.values(habitsByDate)
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        res.json(weeklyData);
    } catch (error) {
        console.error('Get weekly habits error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Calculate habit score
const calculateScore = (habitData) => {
    let score = 0;
    
    // Sleep (20 points max)
    if (habitData.sleepHours >= 6 && habitData.sleepHours <= 8) score += 20;
    else if (habitData.sleepHours > 4) score += 10;
    
    // Water (20 points max)
    if (habitData.waterIntake >= 2 && habitData.waterIntake <= 3) score += 20;
    else if (habitData.waterIntake > 1) score += 10;
    
    // Exercise (20 points)
    if (habitData.exerciseDone) score += 20;
    
    // Healthy meals (10 points each, max 30)
    score += Math.min(habitData.healthyMeals * 10, 30);
    
    // Mood (5 points)
    if (habitData.mood === 'great') score += 5;
    else if (habitData.mood === 'good') score += 3;
    
    // Productivity (5 points)
    if (habitData.productivityLevel === 'high') score += 5;
    else if (habitData.productivityLevel === 'medium') score += 3;

    return score;
};

// Add a new habit
router.post('/', auth, async (req, res) => {
    try {
        const habitData = {
            date: new Date(),
            sleepHours: req.body.sleepHours,
            waterIntake: req.body.waterIntake,
            exercise: req.body.exerciseDone,
            healthyMeals: req.body.healthyMeals,
            mood: req.body.mood,
            productivityLevel: req.body.productivityLevel,
            notes: req.body.notes || '',
            score: calculateScore(req.body)
        };

        // Update user document and stats
        const result = await User.findByIdAndUpdate(
            req.user._id,
            {
                $push: { habits: habitData },
                $inc: { 
                    points: habitData.score,
                    'stats.totalPoints': habitData.score,
                    'stats.completedHabits': 1
                }
            },
            { 
                new: true,
                runValidators: true
            }
        );

        if (!result) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Calculate streak
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const hasHabitYesterday = result.habits.some(habit => {
            const habitDate = new Date(habit.date);
            habitDate.setHours(0, 0, 0, 0);
            return habitDate.getTime() === yesterday.getTime();
        });

        if (hasHabitYesterday) {
            await User.findByIdAndUpdate(
                req.user._id,
                {
                    $inc: { 'stats.currentStreak': 1 },
                    $max: { 'stats.longestStreak': result.stats.currentStreak + 1 }
                }
            );
        } else {
            await User.findByIdAndUpdate(
                req.user._id,
                { 'stats.currentStreak': 1 }
            );
        }

        res.status(201).json(habitData);
    } catch (error) {
        console.error('Add habit error:', error);
        res.status(500).json({ 
            message: 'Failed to add habit',
            error: error.message
        });
    }
});

// Update a habit
router.put('/:habitId', auth, async (req, res) => {
    try {
        const { habitId } = req.params;
        const updates = req.body;
        
        const user = await User.findById(req.user._id);
        const habit = user.habits.id(habitId);
        
        if (!habit) {
            return res.status(404).json({ message: 'Habit not found' });
        }

        // Update fields
        Object.keys(updates).forEach(key => {
            habit[key] = updates[key];
        });

        await user.save();
        res.json(habit);
    } catch (error) {
        console.error('Update habit error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete a habit
router.delete('/:habitId', auth, async (req, res) => {
    try {
        const { habitId } = req.params;
        
        // Find the user and update in one operation
        const result = await User.findOneAndUpdate(
            { 
                _id: req.user._id,
                'habits._id': habitId 
            },
            {
                $pull: { habits: { _id: habitId } },
                $inc: { 
                    points: -1,
                    'stats.totalPoints': -1,
                    'stats.completedHabits': -1
                }
            },
            { 
                new: true,
                runValidators: true
            }
        );

        if (!result) {
            return res.status(404).json({ message: 'Habit not found' });
        }
        
        res.json({ message: 'Habit deleted successfully' });
    } catch (error) {
        console.error('Delete habit error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 