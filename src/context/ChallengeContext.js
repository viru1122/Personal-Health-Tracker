import React, { createContext, useContext, useState, useCallback } from 'react';
import axiosInstance from '../utils/axios';
import { ENDPOINTS } from '../config';

const ChallengeContext = createContext(null);

export const ChallengeProvider = ({ children }) => {
    const [challenges, setChallenges] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchChallenges = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await axiosInstance.get(ENDPOINTS.CHALLENGES.BASE);
            setChallenges(response.data);
        } catch (err) {
            console.error('Failed to fetch challenges:', err);
            setError('Failed to load challenges. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    const joinChallenge = async (challengeId) => {
        try {
            setLoading(true);
            setError(null);
            const response = await axiosInstance.post(ENDPOINTS.CHALLENGES.JOIN(challengeId));
            setChallenges(prevChallenges =>
                prevChallenges.map(challenge =>
                    challenge._id === challengeId ? response.data : challenge
                )
            );
            return response.data;
        } catch (err) {
            console.error('Failed to join challenge:', err);
            setError('Failed to join challenge. Please try again.');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateProgress = async (challengeId, progress) => {
        try {
            setLoading(true);
            setError(null);
            const response = await axiosInstance.post(ENDPOINTS.CHALLENGES.PROGRESS(challengeId), { progress });
            setChallenges(prevChallenges =>
                prevChallenges.map(challenge =>
                    challenge._id === challengeId ? response.data : challenge
                )
            );
            return response.data;
        } catch (err) {
            console.error('Failed to update challenge progress:', err);
            setError('Failed to update progress. Please try again.');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const getActiveChallenges = () => {
        return challenges.filter(challenge => challenge.status === 'active');
    };

    const getCompletedChallenges = () => {
        return challenges.filter(challenge => challenge.status === 'completed');
    };

    const value = {
        challenges,
        loading,
        error,
        fetchChallenges,
        joinChallenge,
        updateProgress,
        getActiveChallenges,
        getCompletedChallenges
    };

    return (
        <ChallengeContext.Provider value={value}>
            {children}
        </ChallengeContext.Provider>
    );
};

export const useChallenge = () => {
    const context = useContext(ChallengeContext);
    if (!context) {
        throw new Error('useChallenge must be used within a ChallengeProvider');
    }
    return context;
};

export default ChallengeContext; 