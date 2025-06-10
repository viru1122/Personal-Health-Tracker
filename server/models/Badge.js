const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: true
    },
    icon: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ['sleep', 'water', 'activity', 'nutrition', 'overall']
    },
    tier: {
        type: String,
        required: true,
        enum: ['bronze', 'silver', 'gold', 'platinum']
    },
    criteria: {
        type: {
            type: String,
            required: true,
            enum: ['score', 'streak', 'total', 'challenge']
        },
        value: {
            type: Number,
            required: true
        }
    },
    points: {
        type: Number,
        required: true,
        default: 100
    },
    isSecret: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Method to check if a user meets the badge requirements
badgeSchema.methods.checkRequirements = function(userData, habitData) {
    let meetsRequirements = true;

    this.requirements.forEach((required, metric) => {
        let achieved = false;
        
        switch(metric) {
            case 'totalScore':
                achieved = habitData.score.total >= required;
                break;
            case 'streakDays':
                achieved = userData.streaks.currentStreak >= required;
                break;
            case 'challengesCompleted':
                achieved = userData.completedChallenges.length >= required;
                break;
            case 'level':
                achieved = userData.level >= required;
                break;
            case 'perfectDays': // Days with 100% score
                achieved = habitData.score.total === 100;
                break;
            default:
                achieved = false;
        }
        
        meetsRequirements = meetsRequirements && achieved;
    });

    return meetsRequirements;
};

const Badge = mongoose.model('Badge', badgeSchema);

module.exports = Badge; 