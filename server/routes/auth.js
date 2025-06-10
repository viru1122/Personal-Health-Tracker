const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Validation middleware
const validateRegistration = (req, res, next) => {
    const { username, email, password } = req.body;
    const errors = [];

    if (!username || username.length < 3) {
        errors.push('Username must be at least 3 characters long');
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push('Please provide a valid email address');
    }

    if (!password || password.length < 6) {
        errors.push('Password must be at least 6 characters long');
    }

    if (errors.length > 0) {
        return res.status(400).json({ message: 'Validation failed', errors });
    }

    next();
};

// Register
router.post('/register', validateRegistration, async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if user already exists
        let user = await User.findOne({ $or: [{ email }, { username }] });
        if (user) {
            return res.status(400).json({ 
                message: 'User already exists',
                errors: ['A user with this email or username already exists']
            });
        }

        // Create new user
        user = new User({
            username,
            email,
            password // Password will be hashed by the pre-save middleware
        });

        await user.save();

        // Create token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                points: user.points
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ 
            message: 'Registration failed',
            errors: [error.message]
        });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Login attempt for email:', email);

        if (!email || !password) {
            console.log('Missing email or password');
            return res.status(400).json({ 
                message: 'Validation failed',
                errors: ['Email and password are required']
            });
        }

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            console.log('User not found for email:', email);
            return res.status(400).json({ 
                message: 'Authentication failed',
                errors: ['Invalid email or password']
            });
        }

        console.log('User found:', { email: user.email, id: user._id });

        // Check password
        const isMatch = await user.comparePassword(password);
        console.log('Password comparison result:', isMatch);

        if (!isMatch) {
            console.log('Password does not match for user:', email);
            return res.status(400).json({ 
                message: 'Authentication failed',
                errors: ['Invalid email or password']
            });
        }

        // Create token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        console.log('Login successful for user:', email);

        // Update last active timestamp
        await user.updateLastActive();

        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                points: user.points
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            message: 'Login failed',
            errors: [error.message]
        });
    }
});

// Get current user profile
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId)
            .select('-password')
            .populate('badges')
            .populate('activeChallenges')
            .populate('completedChallenges');
            
        if (!user) {
            return res.status(404).json({ 
                message: 'User not found',
                errors: ['User no longer exists']
            });
        }

        res.json(user);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ 
            message: 'Failed to fetch user profile',
            errors: [error.message]
        });
    }
});

// Logout
router.post('/logout', auth, (req, res) => {
    try {
        // Since we're using JWT, we just need to tell the client to remove the token
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ 
            message: 'Logout failed',
            errors: [error.message]
        });
    }
});

module.exports = router; 