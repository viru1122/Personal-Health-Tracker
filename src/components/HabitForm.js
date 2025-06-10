import React, { useState } from 'react';
import {
    Box,
    TextField,
    Button,
    Grid,
    Typography,
    Paper,
    Alert,
    Slider,
    InputAdornment,
    FormControl,
    FormLabel,
    RadioGroup,
    FormControlLabel,
    Radio,
    Switch,
    MenuItem,
    Select
} from '@mui/material';
import { useHabit } from '../context/HabitContext';
import {
    LocalDrink as WaterIcon,
    DirectionsRun as ExerciseIcon,
    Bedtime as SleepIcon,
    Restaurant as MealIcon,
    EmojiEmotions as MoodIcon,
    TrendingUp as ProductivityIcon,
    Note as JournalIcon
} from '@mui/icons-material';

const MOOD_OPTIONS = [
    { emoji: '😴', label: 'Tired', value: 'tired' },
    { emoji: '😢', label: 'Sad', value: 'sad' },
    { emoji: '😡', label: 'Angry', value: 'angry' },
    { emoji: '🙂', label: 'Good', value: 'good' },
    { emoji: '😍', label: 'Great', value: 'great' }
];

const PRODUCTIVITY_LEVELS = [
    { value: 'low', label: 'Low', score: 0 },
    { value: 'medium', label: 'Medium', score: 10 },
    { value: 'high', label: 'High', score: 20 }
];

const calculateScore = (data) => {
    let score = 0;
    
    // Sleep score (6-8 hours is optimal)
    if (data.sleepHours >= 6 && data.sleepHours <= 8) score += 20;
    else if (data.sleepHours >= 5 && data.sleepHours <= 9) score += 10;
    
    // Water score (2-3 liters is optimal)
    if (data.waterIntake >= 2 && data.waterIntake <= 3) score += 20;
    else if (data.waterIntake >= 1.5) score += 10;
    
    // Exercise score
    if (data.exerciseDone) score += 20;
    
    // Healthy meals score
    score += data.healthyMeals * 10;
    
    // Mood score
    if (data.mood === 'great') score += 20;
    else if (data.mood === 'good') score += 15;
    else if (data.mood === 'tired') score += 5;
    
    // Productivity score
    const productivityScore = PRODUCTIVITY_LEVELS.find(level => level.value === data.productivityLevel)?.score || 0;
    score += productivityScore;

    return score;
};

const getScoreStatus = (score) => {
    if (score >= 80) return { status: 'Great', color: 'success.main' };
    if (score >= 60) return { status: 'Good', color: 'info.main' };
    if (score >= 40) return { status: 'Moderate', color: 'warning.main' };
    return { status: 'Needs Improvement', color: 'error.main' };
};

const HabitForm = ({ onClose }) => {
    const { addHabit } = useHabit();
    const [error, setError] = useState('');
    const [score, setScore] = useState(null);
    const [formData, setFormData] = useState({
        sleepHours: 7,
        waterIntake: 2,
        exerciseDone: false,
        healthyMeals: 2,
        mood: 'good',
        productivityLevel: 'medium',
        notes: ''
    });

    const handleChange = (field) => (event) => {
        const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const calculatedScore = calculateScore(formData);
            const habitData = {
                ...formData,
                date: new Date(),
                score: calculatedScore
            };
            
            await addHabit(habitData);
            setScore(calculatedScore);
            
            // Don't close the form immediately so user can see the score
            setTimeout(() => {
                if (onClose) onClose();
            }, 2000);
        } catch (err) {
            setError(err.message || 'Failed to save daily habits');
        }
    };

    const scoreStatus = score ? getScoreStatus(score) : null;

    return (
        <Paper elevation={3} sx={{ p: 3, maxWidth: 600, margin: 'auto' }}>
            <Typography variant="h5" gutterBottom align="center">
                Daily Lifestyle Tracker
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {score !== null && (
                <Alert 
                    severity="success" 
                    sx={{ mb: 2, backgroundColor: scoreStatus.color, color: 'white' }}
                >
                    Your lifestyle score: {score} - {scoreStatus.status}
                </Alert>
            )}

            <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                    {/* Sleep Duration */}
                    <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <SleepIcon color="primary" sx={{ mr: 1 }} />
                            <Typography>Sleep Duration</Typography>
                        </Box>
                        <TextField
                            fullWidth
                            type="number"
                            label="Hours of Sleep"
                            value={formData.sleepHours}
                            onChange={handleChange('sleepHours')}
                            InputProps={{
                                inputProps: { min: 0, max: 24, step: 0.5 },
                                endAdornment: <InputAdornment position="end">hrs</InputAdornment>
                            }}
                        />
                    </Grid>

                    {/* Water Intake */}
                    <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <WaterIcon color="primary" sx={{ mr: 1 }} />
                            <Typography>Water Intake</Typography>
                        </Box>
                        <TextField
                            fullWidth
                            type="number"
                            label="Liters of Water"
                            value={formData.waterIntake}
                            onChange={handleChange('waterIntake')}
                            InputProps={{
                                inputProps: { min: 0, max: 10, step: 0.1 },
                                endAdornment: <InputAdornment position="end">L</InputAdornment>
                            }}
                        />
                    </Grid>

                    {/* Exercise Done */}
                    <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <ExerciseIcon color="primary" sx={{ mr: 1 }} />
                            <Typography>Exercise Today?</Typography>
                            <Switch
                                checked={formData.exerciseDone}
                                onChange={handleChange('exerciseDone')}
                                color="primary"
                                sx={{ ml: 2 }}
                            />
                        </Box>
                    </Grid>

                    {/* Healthy Meals */}
                    <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <MealIcon color="primary" sx={{ mr: 1 }} />
                            <Typography>Healthy Meals</Typography>
                        </Box>
                        <RadioGroup
                            row
                            value={formData.healthyMeals}
                            onChange={handleChange('healthyMeals')}
                        >
                            {[0, 1, 2, 3].map((value) => (
                                <FormControlLabel
                                    key={value}
                                    value={value}
                                    control={<Radio />}
                                    label={value}
                                />
                            ))}
                        </RadioGroup>
                    </Grid>

                    {/* Mood */}
                    <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <MoodIcon color="primary" sx={{ mr: 1 }} />
                            <Typography>Mood</Typography>
                        </Box>
                        <Select
                            fullWidth
                            value={formData.mood}
                            onChange={handleChange('mood')}
                        >
                            {MOOD_OPTIONS.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <span style={{ marginRight: 8 }}>{option.emoji}</span>
                                        {option.label}
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                    </Grid>

                    {/* Productivity Level */}
                    <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <ProductivityIcon color="primary" sx={{ mr: 1 }} />
                            <Typography>Productivity Level</Typography>
                        </Box>
                        <Select
                            fullWidth
                            value={formData.productivityLevel}
                            onChange={handleChange('productivityLevel')}
                        >
                            {PRODUCTIVITY_LEVELS.map((level) => (
                                <MenuItem key={level.value} value={level.value}>
                                    {level.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </Grid>

                    {/* Notes */}
                    <Grid item xs={12}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <JournalIcon color="primary" sx={{ mr: 1 }} />
                            <Typography>Daily Notes (Optional)</Typography>
                        </Box>
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="How was your day?"
                            value={formData.notes}
                            onChange={handleChange('notes')}
                            placeholder="Share your thoughts, achievements, or areas for improvement..."
                        />
                    </Grid>

                    {/* Submit Button */}
                    <Grid item xs={12}>
                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                            {onClose && (
                                <Button onClick={onClose} color="inherit">
                                    Cancel
                                </Button>
                            )}
                            <Button type="submit" variant="contained" color="primary">
                                Save Daily Entry
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
            </form>
        </Paper>
    );
};

export default HabitForm; 