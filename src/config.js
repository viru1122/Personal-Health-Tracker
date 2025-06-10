// API base URL - make sure it matches your backend exactly
export const API_BASE_URL = 'http://localhost:5000';

// Frontend routes
export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/',
  HABITS: '/habits',
  CHALLENGES: '/challenges',
  BADGES: '/badges',
  WEEKLY_LOG: '/weekly-log',
  PROFILE: '/profile',
  SETTINGS: '/settings'
};

// API endpoints
export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    PROFILE: '/api/auth/profile'
  },
  HABITS: {
    BASE: '/api/habits',
    WEEKLY: '/api/habits/weekly',
    STATS: '/api/habits/stats',
    COMPLETE: (id) => `/api/habits/${id}/complete`,
    PROGRESS: (id) => `/api/habits/${id}/progress`
  },
  CHALLENGES: {
    BASE: '/api/challenges',
    JOIN: (id) => `/api/challenges/${id}/join`,
    PROGRESS: (id) => `/api/challenges/${id}/progress`,
    ACTIVE: '/api/challenges/active',
    COMPLETED: '/api/challenges/completed'
  },
  BADGES: {
    BASE: '/api/badges',
    PROGRESS: '/api/badges/progress',
    EARNED: '/api/badges/earned',
    AVAILABLE: '/api/badges/available'
  },
  USERS: {
    PROFILE: '/api/users/profile',
    SETTINGS: '/api/users/settings',
    STATS: '/api/users/stats',
    PREFERENCES: '/api/users/preferences'
  }
}; 