const mongoose = require('mongoose');

const habitSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    category: {
        type: String,
        required: true,
        enum: ['health', 'fitness', 'mindfulness', 'productivity', 'other']
    },
    targetValue: {
        type: Number,
        required: true,
        min: 0
    },
    currentValue: {
        type: Number,
        default: 0,
        min: 0
    },
    unit: {
        type: String,
        required: true
    },
    frequency: {
        type: String,
        required: true,
        enum: ['daily', 'weekly', 'monthly']
    },
    date: {
        type: Date,
        default: Date.now,
        required: true
    },
    completed: {
        type: Boolean,
        default: false
    },
    streak: {
        type: Number,
        default: 0
    },
    lastCompletedDate: Date,
    history: [{
        date: { type: Date, required: true },
        value: { type: Number, required: true },
        completed: { type: Boolean, default: false },
        score: { type: Number, default: 0 }
    }],
    score: {
        total: {
            type: Number,
            default: 0
        },
        health: {
            type: Number,
            default: 0
        },
        fitness: {
            type: Number,
            default: 0
        },
        mindfulness: {
            type: Number,
            default: 0
        },
        productivity: {
            type: Number,
            default: 0
        }
    }
}, {
    timestamps: true
});

// Calculate score before saving
habitSchema.pre('save', async function(next) {
    try {
        // Calculate completion percentage
        const percentage = this.targetValue > 0 
            ? Math.min((this.currentValue / this.targetValue) * 100, 100) 
            : 0;
        
        // Base score calculation
        let score = Math.round(percentage);
        
        // Category-specific score adjustments
        switch(this.category) {
            case 'health':
                // Health score considers both duration and quality
                this.score.health = score;
                break;
            case 'fitness':
                // Fitness score
                this.score.fitness = score;
                break;
            case 'mindfulness':
                // Mindfulness score
                this.score.mindfulness = score;
                break;
            case 'productivity':
                // Productivity score
                this.score.productivity = score;
                break;
            default:
                // For 'other' category
                score = percentage;
        }
        
        // Update total score
        const scores = [
            this.score.health,
            this.score.fitness,
            this.score.mindfulness,
            this.score.productivity
        ].filter(s => s > 0);
        
        this.score.total = scores.length > 0 
            ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
            : 0;
        
        // Check if habit is completed
        const wasCompleted = this.completed;
        this.completed = percentage >= 100;
        
        // Update streak and history only if completion status changed
        if (this.completed !== wasCompleted) {
            await this.updateStreak();
            
            // Add to history
            this.history.push({
                date: new Date(),
                value: this.currentValue,
                completed: this.completed,
                score: this.score.total
            });
            
            // Keep only last 30 days of history
            if (this.history.length > 30) {
                this.history = this.history.slice(-30);
            }
            
            // Update user's stats if completed
            if (this.completed) {
                const User = mongoose.model('User');
                const user = await User.findById(this.user);
                if (user) {
                    user.stats.totalPoints += this.score.total;
                    await user.save();
                }
            }
        }
        
        next();
    } catch (error) {
        next(error);
    }
});

// Method to check if habit is completed for today
habitSchema.methods.isCompletedForToday = function() {
    if (!this.lastCompletedDate) return false;
    
    const today = new Date();
    const lastCompleted = new Date(this.lastCompletedDate);
    
    return today.getDate() === lastCompleted.getDate() &&
           today.getMonth() === lastCompleted.getMonth() &&
           today.getFullYear() === lastCompleted.getFullYear();
};

// Method to update streak
habitSchema.methods.updateStreak = async function() {
    const today = new Date();
    const lastCompleted = this.lastCompletedDate ? new Date(this.lastCompletedDate) : null;
    
    if (!lastCompleted) {
        this.streak = 1;
    } else {
        const diffTime = Math.abs(today - lastCompleted);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
            this.streak += 1;
        } else if (diffDays > 1) {
            this.streak = 1;
        }
        // If completed multiple times in same day, don't reset streak
    }
    
    this.lastCompletedDate = today;
    
    // Update user's streak stats if this is a new record
    try {
        const User = mongoose.model('User');
        const user = await User.findById(this.user);
        if (user && this.streak > user.stats.longestStreak) {
            user.stats.longestStreak = this.streak;
            await user.save();
        }
    } catch (error) {
        console.error('Error updating user streak stats:', error);
    }
};

const Habit = mongoose.model('Habit', habitSchema);

module.exports = Habit; 