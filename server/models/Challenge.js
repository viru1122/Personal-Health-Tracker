const mongoose = require('mongoose');

const challengeSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ['sleep', 'water', 'activity', 'nutrition', 'overall']
    },
    requirements: {
        type: {
            type: String,
            required: true,
            enum: ['score', 'streak', 'total']
        },
        target: {
            type: Number,
            required: true
        },
        duration: {
            type: Number,
            required: true
        }
    },
    points: {
        type: Number,
        required: true,
        default: 100
    },
    badge: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Badge'
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: Date,
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const Challenge = mongoose.model('Challenge', challengeSchema);

module.exports = Challenge; 