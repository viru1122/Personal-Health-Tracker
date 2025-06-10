const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Create a separate schema for badges to handle validation
const badgeTypes = ['early_bird', 'night_owl', 'healthy_eater', 'exercise_master', 'hydration_hero'];

// Create a separate schema for challenges
const challengeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    startDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    completed: {
        type: Boolean,
        default: false
    },
    progress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    category: {
        type: String,
        required: true,
        enum: ['sleep', 'water', 'activity', 'nutrition']
    },
    requiredScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    duration: {
        type: Number,
        required: true,
        min: 1
    },
    badgeReward: {
        type: String,
        required: true,
        enum: badgeTypes
    }
});

const habitSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    sleepHours: {
        type: Number,
        required: true,
        min: 0,
        max: 24
    },
    waterIntake: {
        type: Number,
        required: true,
        min: 0,
        max: 10
    },
    exercise: {
        type: Boolean,
        required: true,
        default: false
    },
    healthyMeals: {
        type: Number,
        required: true,
        min: 0,
        max: 3
    },
    mood: {
        type: String,
        required: true,
        enum: ['tired', 'sad', 'angry', 'good', 'great']
    },
    productivityLevel: {
        type: String,
        required: true,
        enum: ['low', 'medium', 'high']
    },
    notes: {
        type: String,
        required: false
    },
    score: {
        type: Number,
        required: true,
        default: 0
    }
});

// Calculate habit score
habitSchema.methods.calculateScore = function() {
    let score = 0;
    
    // Sleep (20 points max)
    if (this.sleepHours >= 6 && this.sleepHours <= 8) score += 20;
    else if (this.sleepHours > 4) score += 10;
    
    // Water (20 points max)
    if (this.waterIntake >= 2 && this.waterIntake <= 3) score += 20;
    else if (this.waterIntake > 1) score += 10;
    
    // Exercise (20 points)
    if (this.exercise) score += 20;
    
    // Healthy meals (10 points each, max 30)
    score += Math.min(this.healthyMeals * 10, 30);
    
    // Mood (5 points)
    if (this.mood === 'great') score += 5;
    else if (this.mood === 'good') score += 3;
    
    // Productivity (5 points)
    if (this.productivityLevel === 'high') score += 5;
    else if (this.productivityLevel === 'medium') score += 3;

    return score;
};

// Pre-save middleware for habit to calculate score
habitSchema.pre('save', function(next) {
    if (this.isModified('sleepHours') || 
        this.isModified('waterIntake') || 
        this.isModified('exercise') || 
        this.isModified('healthyMeals') || 
        this.isModified('mood') || 
        this.isModified('productivityLevel')) {
        this.score = this.calculateScore();
    }
    next();
});

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    points: {
        type: Number,
        default: 0
    },
    habits: [habitSchema],
    badges: {
        type: [String],
        default: [],
        validate: {
            validator: function(value) {
                if (!value || !Array.isArray(value)) return true;
                return value.every(badge => !badge || badgeTypes.includes(badge));
            },
            message: 'Invalid badge type'
        }
    },
    challenges: [challengeSchema],
    lastActive: {
        type: Date,
        default: Date.now
    },
    stats: {
        totalPoints: {
            type: Number,
            default: 0
        },
        currentStreak: {
            type: Number,
            default: 0
        },
        longestStreak: {
            type: Number,
            default: 0
        },
        completedHabits: {
            type: Number,
            default: 0
        },
        todayScore: {
            type: Number,
            default: 0
        },
        todayHabits: {
            type: Number,
            default: 0
        },
        weeklyAverage: {
            type: Number,
            default: 0
        },
        progressTrend: {
            daily: {
                type: Number,
                default: 0
            },
            weekly: {
                type: Number,
                default: 0
            },
            improvement: {
                type: Number,
                default: 0
            }
        }
    },
    preferences: {
        emailNotifications: {
            type: Boolean,
            default: true
        },
        dailyReminder: {
            type: Boolean,
            default: true
        },
        weeklyReport: {
            type: Boolean,
            default: true
        },
        theme: {
            type: String,
            default: 'light'
        }
    }
}, {
    timestamps: true
});

// Calculate today's stats
userSchema.methods.calculateTodayStats = function() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayHabits = this.habits.filter(habit => {
        const habitDate = new Date(habit.date);
        habitDate.setHours(0, 0, 0, 0);
        return habitDate.getTime() === today.getTime();
    });

    if (todayHabits.length > 0) {
        const totalScore = todayHabits.reduce((sum, habit) => sum + habit.score, 0);
        this.stats.todayScore = Math.round(totalScore / todayHabits.length);
        this.stats.todayHabits = todayHabits.length;
    } else {
        this.stats.todayScore = 0;
        this.stats.todayHabits = 0;
    }
};

// Calculate weekly average
userSchema.methods.calculateWeeklyStats = function() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weeklyHabits = this.habits.filter(habit => {
        const habitDate = new Date(habit.date);
        habitDate.setHours(0, 0, 0, 0);
        return habitDate >= weekAgo && habitDate <= today;
    });

    if (weeklyHabits.length > 0) {
        const totalScore = weeklyHabits.reduce((sum, habit) => sum + habit.score, 0);
        this.stats.weeklyAverage = Math.round(totalScore / weeklyHabits.length);
    } else {
        this.stats.weeklyAverage = 0;
    }
};

// Pre-save middleware for user to update stats
userSchema.pre('save', async function(next) {
    if (this.isModified('habits')) {
        this.calculateTodayStats();
        this.calculateWeeklyStats();
        
        // Update streak
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const hasHabitToday = this.habits.some(habit => {
            const habitDate = new Date(habit.date);
            habitDate.setHours(0, 0, 0, 0);
            return habitDate.getTime() === today.getTime();
        });

        const hasHabitYesterday = this.habits.some(habit => {
            const habitDate = new Date(habit.date);
            habitDate.setHours(0, 0, 0, 0);
            return habitDate.getTime() === yesterday.getTime();
        });

        if (hasHabitToday) {
            if (hasHabitYesterday) {
                this.stats.currentStreak += 1;
            } else {
                this.stats.currentStreak = 1;
            }
            
            if (this.stats.currentStreak > this.stats.longestStreak) {
                this.stats.longestStreak = this.stats.currentStreak;
            }
        }
    }
    next();
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw error;
    }
};

// Generate JWT token
userSchema.methods.generateAuthToken = function() {
    return jwt.sign(
        { userId: this._id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
};

// Update last active
userSchema.methods.updateLastActive = async function() {
    this.lastActive = new Date();
    await this.save();
};

// Remove sensitive data when converting to JSON
userSchema.methods.toJSON = function() {
    const user = this.toObject();
    delete user.password;
    return user;
};

const User = mongoose.model('User', userSchema);

module.exports = User; 