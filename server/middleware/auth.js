const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ message: 'No token, authorization denied' });
        }

        // Ensure JWT_SECRET is set
        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET is not set in environment variables');
            return res.status(500).json({ message: 'Server configuration error' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from database and populate challenges and badges
        let user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        // Initialize arrays if they don't exist
        if (!user.badges) user.badges = [];
        if (!user.activeChallenges) user.activeChallenges = [];
        if (!user.completedChallenges) user.completedChallenges = [];
        
        // Save if we had to initialize any arrays
        if (!user.badges || !user.activeChallenges || !user.completedChallenges) {
            await user.save();
        }

        // Now populate the references
        user = await User.findById(user._id)
            .populate('badges')
            .populate('activeChallenges')
            .populate('completedChallenges');

        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token has expired' });
        }
        res.status(500).json({ message: 'Server error during authentication' });
    }
};

module.exports = auth; 