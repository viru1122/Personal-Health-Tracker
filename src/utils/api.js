import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

export const ENDPOINTS = {
    AUTH: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        VERIFY: '/auth/verify'
    },
    USERS: {
        STATS: '/users/stats',
        PROFILE: '/users/profile'
    },
    HABITS: {
        BASE: '/habits',
        WEEKLY: '/habits/weekly',
        COMPLETE: (id) => `/habits/${id}/complete`,
        UNCOMPLETE: (id) => `/habits/${id}/uncomplete`
    }
};

// Create axios instance with default config
export const axiosInstance = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add auth token to requests if it exists
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor for debugging
axiosInstance.interceptors.response.use(
    (response) => {
        console.log(`API Response [${response.config.url}]:`, response.data);
        return response;
    },
    (error) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
    }
); 