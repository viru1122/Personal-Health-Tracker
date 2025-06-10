// API Configuration
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Axios default configuration
export const axiosConfig = {
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
};

// Auth configuration
export const AUTH_CONFIG = {
    tokenKey: 'token',
    tokenExpiry: '7d'
};

// Route paths
export const ROUTES = {
    LOGIN: '/login',
    REGISTER: '/register',
    DASHBOARD: '/',
    HABITS: '/habits',
    CHALLENGES: '/challenges',
    BADGES: '/badges',
    WEEKLY_LOG: '/weekly-log',
    PROFILE: '/profile'
};

// API endpoints
export const ENDPOINTS = {
    AUTH: {
        LOGIN: '/api/auth/login',
        REGISTER: '/api/auth/register',
        ME: '/api/auth/me'
    },
    HABITS: {
        BASE: '/api/habits',
        WEEKLY: '/api/habits/weekly'
    },
    CHALLENGES: {
        BASE: '/api/challenges',
        ACTIVE: '/api/challenges/active',
        COMPLETED: '/api/challenges/completed'
    },
    BADGES: {
        BASE: '/api/badges'
    },
    USERS: {
        STATS: '/api/users/stats',
        PROFILE: '/api/users/profile',
        PREFERENCES: '/api/users/preferences'
    }
}; 