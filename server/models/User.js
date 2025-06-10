const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3
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
    bio: {
        type: String,
        default: '',
        maxlength: 500
    },
    joinedDate: {
        type: Date,
        default: Date.now
    },
    points: {
        type: Number,
        default: 0
    },
    preferences: {
        dailyReminders: {
            type: Boolean,
            default: true
        },
        weeklyReport: {
            type: Boolean,
            default: true
        },
        theme: {
            type: String,
            enum: ['light', 'dark', 'system'],
            default: 'system'
        }
    },
    stats: {
        totalPoints: {
            type: Number,
            default: 0
        },
        completedChallenges: {
            type: Number,
            default: 0
        },
        badgesEarned: {
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
        }
    },
    lastActive: {
        type: Date,
        default: Date.now
    },
    badges: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Badge'
    }],
    activeChallenges: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Challenge'
    }],
    completedChallenges: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Challenge'
    }]
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    console.log('Comparing passwords:');
    console.log('- Candidate password length:', candidatePassword.length);
    console.log('- Stored hashed password length:', this.password.length);
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    console.log('- Password match result:', isMatch);
    return isMatch;
};

// Update last active timestamp
userSchema.methods.updateLastActive = function() {
    this.lastActive = new Date();
    return this.save();
};

// Add badge to user
userSchema.methods.addBadge = async function(badgeId) {
    if (!this.badges.includes(badgeId)) {
        this.badges.push(badgeId);
        await this.save();
    }
};

// Get user's habits
userSchema.methods.getHabits = async function(query = {}) {
    return await mongoose.model('Habit').find({
        user: this._id,
        ...query
    }).sort({ date: -1 });
};

const User = mongoose.model('User', userSchema);

module.exports = User; 