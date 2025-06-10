import React, { createContext, useContext, useState, useCallback } from 'react';
import axiosInstance from '../utils/axios';
import { ENDPOINTS } from '../config';

const HabitContext = createContext(null);

export const HabitProvider = ({ children }) => {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalPoints: 0,
    currentStreak: 0,
    completedHabits: 0
  });

  const fetchStats = useCallback(async () => {
    try {
      const response = await axiosInstance.get(ENDPOINTS.USERS.STATS);
      if (response.data) {
        setStats({
          totalPoints: response.data.totalPoints || 0,
          currentStreak: response.data.currentStreak || 0,
          completedHabits: response.data.completedHabits || 0
        });
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  const fetchHabits = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get(ENDPOINTS.HABITS.BASE);
      setHabits(response.data);
      await fetchStats(); // Fetch updated stats after getting habits
    } catch (err) {
      console.error('Failed to fetch habits:', err);
      setError('Failed to load habits. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [fetchStats]);

  const addHabit = async (habitData) => {
    try {
      setLoading(true);
      setError(null);

      // Log the data being sent
      console.log('Sending habit data:', habitData);

      const response = await axiosInstance.post(ENDPOINTS.HABITS.BASE, habitData);
      
      // Log the response
      console.log('Server response:', response.data);

      // Update habits list with the new habit
      if (response.data) {
        setHabits(prevHabits => [response.data, ...prevHabits]);
        await fetchStats(); // Fetch updated stats after adding habit
      }

      return response.data;
    } catch (err) {
      console.error('Failed to add habit:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
      let errorMessage = 'Failed to create habit. ';
      if (err.response?.data?.message) {
        errorMessage += err.response.data.message;
      } else if (err.message) {
        errorMessage += err.message;
      }
      
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateHabit = async (habitId, habitData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.put(`${ENDPOINTS.HABITS.BASE}/${habitId}`, habitData);
      setHabits(prevHabits =>
        prevHabits.map(habit =>
          habit._id === habitId ? response.data : habit
        )
      );
      await fetchStats(); // Fetch updated stats after updating habit
      return response.data;
    } catch (err) {
      console.error('Failed to update habit:', err);
      setError('Failed to update habit. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteHabit = async (habitId) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Making request to:', `${ENDPOINTS.HABITS.BASE}/${habitId}`);
      const response = await axiosInstance.delete(`${ENDPOINTS.HABITS.BASE}/${habitId}`);
      
      if (response.status === 200) {
        setHabits(prevHabits => prevHabits.filter(habit => habit._id !== habitId));
        await fetchStats(); // Fetch updated stats after deletion
      } else {
        throw new Error('Failed to delete habit');
      }
    } catch (err) {
      console.error('Failed to delete habit:', err);
      setError('Failed to delete habit. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getHabitStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get(ENDPOINTS.HABITS.STATS);
      return response.data;
    } catch (err) {
      console.error('Failed to fetch habit stats:', err);
      setError('Failed to load habit statistics. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getWeeklyHabits = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get(ENDPOINTS.HABITS.WEEKLY);
      return response.data;
    } catch (err) {
      console.error('Failed to fetch weekly habits:', err);
      setError('Failed to load weekly habits. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    habits,
    loading,
    error,
    stats,
    fetchHabits,
    addHabit,
    updateHabit,
    deleteHabit,
    getHabitStats,
    getWeeklyHabits,
    fetchStats
  };

  return (
    <HabitContext.Provider value={value}>
      {children}
    </HabitContext.Provider>
  );
};

export const useHabit = () => {
  const context = useContext(HabitContext);
  if (!context) {
    throw new Error('useHabit must be used within a HabitProvider');
  }
  return context;
};

export default HabitContext; 