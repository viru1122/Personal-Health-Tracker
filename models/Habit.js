const mongoose = require('mongoose');

const habitSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
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
    exerciseDone: {
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
        required: false,
        maxLength: 1000
    },
    score: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    }
}, {
    timestamps: true
});

// Index for efficient querying by user and date
habitSchema.index({ userId: 1, date: -1 });

// Method to calculate the lifestyle score
habitSchema.methods.calculateScore = function() {
    let score = 0;
    
    // Sleep score (6-8 hours is optimal)
    if (this.sleepHours >= 6 && this.sleepHours <= 8) score += 20;
    else if (this.sleepHours >= 5 && this.sleepHours <= 9) score += 10;
    
    // Water score (2-3 liters is optimal)
    if (this.waterIntake >= 2 && this.waterIntake <= 3) score += 20;
    else if (this.waterIntake >= 1.5) score += 10;
    
    // Exercise score
    if (this.exerciseDone) score += 20;
    
    // Healthy meals score
    score += this.healthyMeals * 10;
    
    // Mood score
    if (this.mood === 'great') score += 20;
    else if (this.mood === 'good') score += 15;
    else if (this.mood === 'tired') score += 5;
    
    // Productivity score
    const productivityScores = {
        'high': 20,
        'medium': 10,
        'low': 0
    };
    score += productivityScores[this.productivityLevel] || 0;

    return score;
};

// Pre-save middleware to calculate and set the score
habitSchema.pre('save', function(next) {
    if (this.isModified('sleepHours') || 
        this.isModified('waterIntake') || 
        this.isModified('exerciseDone') || 
        this.isModified('healthyMeals') || 
        this.isModified('mood') || 
        this.isModified('productivityLevel')) {
        this.score = this.calculateScore();
    }
    next();
});

const Habit = mongoose.model('Habit', habitSchema);

module.exports = Habit; 