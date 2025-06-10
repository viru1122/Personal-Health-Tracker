const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No token, authorization denied' });
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from token with all fields except password
        const user = await User.findById(decoded.userId)
            .select('-password')
            .lean()
            .exec();

        if (!user) {
            return res.status(401).json({ message: 'Token is not valid' });
        }

        // Ensure required fields exist
        user.badges = user.badges || [];
        user.stats = user.stats || {
            totalPoints: 0,
            currentStreak: 0,
            longestStreak: 0,
            completedHabits: 0,
            todayScore: 0,
            todayHabits: 0,
            weeklyAverage: 0,
            progressTrend: {
                daily: 0,
                weekly: 0,
                improvement: 0
            }
        };
        user.habits = user.habits || [];
        user.challenges = user.challenges || [];

        // Add user to request
        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired' });
        }
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = auth; 