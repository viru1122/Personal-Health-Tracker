import React, { useState, useEffect } from 'react';
import {
    Container,
    Grid,
    Typography,
    Button,
    Box,
    CircularProgress,
    Paper,
    IconButton,
    Dialog,
    Alert,
    Snackbar
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    LocalDrink as WaterIcon,
    DirectionsRun as ExerciseIcon,
    Bedtime as SleepIcon,
    Restaurant as MealIcon,
    EmojiEmotions as MoodIcon,
    TrendingUp as ProductivityIcon
} from '@mui/icons-material';
import { useHabit } from '../context/HabitContext';
import HabitForm from '../components/HabitForm';
import { format } from 'date-fns';

const Habits = () => {
    const { habits, loading, error, fetchHabits, deleteHabit } = useHabit();
    const [openForm, setOpenForm] = useState(false);
    const [selectedHabit, setSelectedHabit] = useState(null);
    const [deleteError, setDeleteError] = useState(null);
    const [deleteSuccess, setDeleteSuccess] = useState(false);

    useEffect(() => {
        fetchHabits();
    }, [fetchHabits]);

    const handleDelete = async (habitId) => {
        if (window.confirm('Are you sure you want to delete this habit?')) {
            try {
                await deleteHabit(habitId);
                setDeleteSuccess(true);
                await fetchHabits(); // Refresh the habits list
            } catch (err) {
                console.error('Failed to delete habit:', err);
                setDeleteError('Failed to delete habit. Please try again.');
            }
        }
    };

    const handleEdit = (habit) => {
        setSelectedHabit(habit);
        setOpenForm(true);
    };

    const handleCloseSnackbar = () => {
        setDeleteError(null);
        setDeleteSuccess(false);
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        );
    }

    const getHabitIcon = (habit) => {
        if (habit.exercise) return <ExerciseIcon />;
        if (habit.sleepHours) return <SleepIcon />;
        if (habit.waterIntake) return <WaterIcon />;
        if (habit.healthyMeals) return <MealIcon />;
        if (habit.mood) return <MoodIcon />;
        return <ProductivityIcon />;
    };

    const formatHabitDetails = (habit) => {
        const details = [];
        if (habit.sleepHours) details.push(`Sleep: ${habit.sleepHours} hours`);
        if (habit.waterIntake) details.push(`Water: ${habit.waterIntake}L`);
        if (habit.exercise) details.push('Exercise: Done');
        if (habit.healthyMeals) details.push(`Healthy Meals: ${habit.healthyMeals}`);
        if (habit.mood) details.push(`Mood: ${habit.mood}`);
        if (habit.productivityLevel) details.push(`Productivity: ${habit.productivityLevel}`);
        return details.join(' • ');
    };

    return (
        <Container maxWidth="lg">
            <Box sx={{ mb: 4 }}>
                <Grid container justifyContent="space-between" alignItems="center">
                    <Grid item>
                        <Typography variant="h4" component="h1" gutterBottom>
                            My Habits
                        </Typography>
                    </Grid>
                    <Grid item>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<AddIcon />}
                            onClick={() => setOpenForm(true)}
                        >
                            Add New Habit
                        </Button>
                    </Grid>
                </Grid>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Grid container spacing={3}>
                {habits.map((habit) => (
                    <Grid item xs={12} sm={6} md={4} key={habit._id}>
                        <Paper
                            sx={{
                                p: 2,
                                display: 'flex',
                                flexDirection: 'column',
                                height: '100%'
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <Box sx={{ mr: 1, color: 'primary.main' }}>
                                    {getHabitIcon(habit)}
                                </Box>
                                <Typography variant="h6" component="div">
                                    {format(new Date(habit.date), 'MMM d, yyyy')}
                                </Typography>
                            </Box>

                            <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    {formatHabitDetails(habit)}
                                </Typography>
                                {habit.notes && (
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                        Notes: {habit.notes}
                                    </Typography>
                                )}
                            </Box>

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                                <Typography variant="body1" color="primary" fontWeight="bold">
                                    Score: {habit.score}/100
                                </Typography>
                                <Box>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleEdit(habit)}
                                        sx={{ mr: 1 }}
                                    >
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleDelete(habit._id)}
                                        color="error"
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </Box>
                            </Box>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            <Dialog
                open={openForm}
                onClose={() => {
                    setOpenForm(false);
                    setSelectedHabit(null);
                }}
                maxWidth="sm"
                fullWidth
            >
                <HabitForm
                    habit={selectedHabit}
                    onClose={() => {
                        setOpenForm(false);
                        setSelectedHabit(null);
                        fetchHabits(); // Refresh habits after form closes
                    }}
                />
            </Dialog>

            <Snackbar
                open={Boolean(deleteError)}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
            >
                <Alert onClose={handleCloseSnackbar} severity="error">
                    {deleteError}
                </Alert>
            </Snackbar>

            <Snackbar
                open={deleteSuccess}
                autoHideDuration={3000}
                onClose={handleCloseSnackbar}
            >
                <Alert onClose={handleCloseSnackbar} severity="success">
                    Habit deleted successfully
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default Habits; 