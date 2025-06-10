import React, { createContext, useContext, useState, useCallback } from 'react';
import axiosInstance from '../utils/axios';
import { ENDPOINTS } from '../config';

const BadgeContext = createContext(null);

export const BadgeProvider = ({ children }) => {
    const [badges, setBadges] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchBadges = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await axiosInstance.get(ENDPOINTS.BADGES.BASE);
            setBadges(response.data);
        } catch (err) {
            console.error('Failed to fetch badges:', err);
            setError('Failed to load badges. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    const getBadgeProgress = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await axiosInstance.get(ENDPOINTS.BADGES.PROGRESS);
            return response.data;
        } catch (err) {
            console.error('Failed to fetch badge progress:', err);
            setError('Failed to load badge progress. Please try again.');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const getEarnedBadges = () => {
        return badges.filter(badge => badge.earned);
    };

    const getAvailableBadges = () => {
        return badges.filter(badge => !badge.earned);
    };

    const value = {
        badges,
        loading,
        error,
        fetchBadges,
        getBadgeProgress,
        getEarnedBadges,
        getAvailableBadges
    };

    return (
        <BadgeContext.Provider value={value}>
            {children}
        </BadgeContext.Provider>
    );
};

export const useBadge = () => {
    const context = useContext(BadgeContext);
    if (!context) {
        throw new Error('useBadge must be used within a BadgeProvider');
    }
    return context;
};

export default BadgeContext; 