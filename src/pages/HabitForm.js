import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  Alert,
  Rating,
  CircularProgress
} from '@mui/material';
import { LocalDrink, DirectionsRun, Restaurant, Mood } from '@mui/icons-material';
import axiosInstance from '../utils/axios';
import { ENDPOINTS, ROUTES } from '../config';
import { useHabits } from '../context/HabitContext';

const HabitForm = () => {
  const navigate = useNavigate();
  const { addHabit } = useHabits();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    sleep: {
      hours: 7,
      quality: 3
    },
    water: {
      glasses: 4,
      target: 8
    },
    activity: {
      minutes: 30,
      type: 'moderate',
      steps: 5000
    },
    nutrition: {
      meals: 3,
      quality: 3,
      snacks: 2
    },
    mood: {
      rating: 3,
      notes: ''
    },
    notes: ''
  });

  const validateHabitData = (habits) => {
    for (const habit of habits) {
      if (!habit.title || !habit.category || !habit.targetValue || !habit.unit || !habit.frequency) {
        throw new Error('Missing required habit fields');
      }
      if (habit.currentValue < 0 || habit.targetValue < 0) {
        throw new Error('Values cannot be negative');
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Create habits for each category with proper data transformation
      const habits = [
        {
          title: 'Sleep Quality',
          category: 'health',
          targetValue: 5,
          currentValue: Number(formData.sleep.quality || 0),
          unit: 'stars',
          frequency: 'daily',
          description: `Sleep duration: ${formData.sleep.hours} hours`
        },
        {
          title: 'Sleep Duration',
          category: 'health',
          targetValue: 8,
          currentValue: Number(formData.sleep.hours || 0),
          unit: 'hours',
          frequency: 'daily',
          description: 'Daily sleep tracking'
        },
        {
          title: 'Water Intake',
          category: 'health',
          targetValue: Number(formData.water.target || 8),
          currentValue: Number(formData.water.glasses || 0),
          unit: 'glasses',
          frequency: 'daily',
          description: 'Daily water intake tracking'
        },
        {
          title: 'Physical Activity',
          category: 'fitness',
          targetValue: 30,
          currentValue: Number(formData.activity.minutes || 0),
          unit: 'minutes',
          frequency: 'daily',
          description: `Activity type: ${formData.activity.type}, Steps: ${formData.activity.steps}`
        },
        {
          title: 'Nutrition Quality',
          category: 'health',
          targetValue: 5,
          currentValue: Number(formData.nutrition.quality || 0),
          unit: 'stars',
          frequency: 'daily',
          description: `Meals: ${formData.nutrition.meals}, Snacks: ${formData.nutrition.snacks}`
        }
      ];

      // Log the habits being submitted
      console.log('Preparing to submit habits:', habits);

      // Validate all habits before saving
      validateHabitData(habits);

      // Save habits one by one using the context
      const savedHabits = [];
      for (const habit of habits) {
        try {
          // Transform data to ensure proper types
          const habitData = {
            ...habit,
            targetValue: Number(habit.targetValue),
            currentValue: Number(habit.currentValue),
            category: habit.category.toLowerCase(),
            frequency: habit.frequency.toLowerCase()
          };

          console.log(`Saving habit "${habit.title}":`, habitData);
          const savedHabit = await addHabit(habitData);
          console.log(`Habit "${habit.title}" saved successfully:`, savedHabit);
          savedHabits.push(savedHabit);
        } catch (err) {
          console.error(`Error saving habit "${habit.title}":`, err);
          
          let errorMessage = `Error saving habit '${habit.title}'`;
          
          if (err.response?.data) {
            const { message, error, details } = err.response.data;
            
            if (details && Array.isArray(details)) {
              errorMessage += ': ' + details.map(d => `${d.field}: ${d.message}`).join(', ');
            } else if (error) {
              errorMessage += ': ' + error;
            } else if (message) {
              errorMessage += ': ' + message;
            }
          } else if (err.message) {
            errorMessage += ': ' + err.message;
          }
          
          throw new Error(errorMessage);
        }
      }

      console.log('All habits saved successfully:', savedHabits);
      setSuccess(true);
      setTimeout(() => {
        navigate(ROUTES.DASHBOARD);
      }, 1500);
    } catch (err) {
      console.error('Error saving habits:', err);
      setError(err.message || 'Failed to save habit data');
    } finally {
      setLoading(false);
    }
  };

  const handleSliderChange = (category, subcategory) => (event, newValue) => {
    setFormData(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [subcategory]: newValue
      }
    }));
  };

  const handleInputChange = (category, subcategory) => (event) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [subcategory]: value
      }
    }));
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Log Today's Habits
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Habit data saved successfully!
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={4}>
            {/* Sleep Section */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Sleep
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography gutterBottom>Hours of Sleep</Typography>
                  <Slider
                    value={formData.sleep.hours}
                    onChange={handleSliderChange('sleep', 'hours')}
                    min={0}
                    max={12}
                    step={0.5}
                    marks
                    valueLabelDisplay="auto"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography gutterBottom>Sleep Quality</Typography>
                  <Rating
                    value={formData.sleep.quality}
                    onChange={(event, newValue) => {
                      handleSliderChange('sleep', 'quality')(null, newValue);
                    }}
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* Water Section */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Water Intake
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography gutterBottom>Glasses of Water</Typography>
                  <Slider
                    value={formData.water.glasses}
                    onChange={handleSliderChange('water', 'glasses')}
                    min={0}
                    max={12}
                    step={1}
                    marks
                    valueLabelDisplay="auto"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography gutterBottom>Daily Target</Typography>
                  <Slider
                    value={formData.water.target}
                    onChange={handleSliderChange('water', 'target')}
                    min={1}
                    max={12}
                    step={1}
                    marks
                    valueLabelDisplay="auto"
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* Activity Section */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Physical Activity
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography gutterBottom>Activity Minutes</Typography>
                  <Slider
                    value={formData.activity.minutes}
                    onChange={handleSliderChange('activity', 'minutes')}
                    min={0}
                    max={180}
                    step={5}
                    marks
                    valueLabelDisplay="auto"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Activity Type</InputLabel>
                    <Select
                      value={formData.activity.type}
                      onChange={handleInputChange('activity', 'type')}
                      label="Activity Type"
                    >
                      <MenuItem value="light">Light</MenuItem>
                      <MenuItem value="moderate">Moderate</MenuItem>
                      <MenuItem value="intense">Intense</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Steps"
                    type="number"
                    value={formData.activity.steps}
                    onChange={handleInputChange('activity', 'steps')}
                    inputProps={{ min: 0 }}
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* Submit Button */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/')}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  startIcon={loading && <CircularProgress size={20} />}
                >
                  Save Habits
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default HabitForm; 