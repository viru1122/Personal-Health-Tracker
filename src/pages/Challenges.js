import React, { useState, useEffect } from 'react';
import {
    Container,
    Grid,
    Card,
    CardContent,
    Typography,
    Button,
    LinearProgress,
    Box,
    Tabs,
    Tab,
    Alert,
    Chip,
    CircularProgress,
    IconButton
} from '@mui/material';
import {
    EmojiEvents,
    LocalDrink,
    DirectionsRun,
    Bedtime,
    Restaurant,
    Star,
    Timer,
    CheckCircle
} from '@mui/icons-material';
import axiosInstance from '../utils/axios';
import { ENDPOINTS } from '../config';

const categoryIcons = {
    sleep: <Bedtime />,
    water: <LocalDrink />,
    activity: <DirectionsRun />,
    nutrition: <Restaurant />,
    overall: <Star />
};

const ChallengeCard = ({ challenge, onStart }) => {
    const isActive = challenge.isActive;
    const isCompleted = challenge.completed;
    
    return (
        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <IconButton color="primary" sx={{ mr: 1 }}>
                        {categoryIcons[challenge.category]}
                    </IconButton>
                    <Typography variant="h6" component="div">
                        {challenge.name}
                    </Typography>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {challenge.description}
                </Typography>

                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip
                        label={challenge.category}
                        size="small"
                        icon={categoryIcons[challenge.category]}
                    />
                    {isActive && (
                        <Chip
                            label="ACTIVE"
                            size="small"
                            color="primary"
                        />
                    )}
                    {isCompleted && (
                        <Chip
                            label="COMPLETED"
                            size="small"
                            color="success"
                            icon={<CheckCircle />}
                        />
                    )}
                </Box>

                <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        Duration: {challenge.duration} days
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Required Score: {challenge.requiredScore}%
                    </Typography>
                </Box>

                {isActive && (
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Progress
                        </Typography>
                        <LinearProgress
                            variant="determinate"
                            value={challenge.progress || 0}
                            sx={{ height: 8, borderRadius: 4 }}
                        />
                        <Typography variant="body2" color="text.secondary" align="right" sx={{ mt: 0.5 }}>
                            {Math.round(challenge.progress || 0)}%
                        </Typography>
                    </Box>
                )}

                <Box sx={{ mt: 'auto' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <EmojiEvents color="primary" sx={{ mr: 1 }} />
                        <Typography variant="body2">
                            Reward: {challenge.badgeReward.split('_').map(word => 
                                word.charAt(0).toUpperCase() + word.slice(1)
                            ).join(' ')} Badge
                        </Typography>
                    </Box>

                    {!isActive && !isCompleted && (
                        <Button 
                            variant="contained" 
                            color="primary"
                            fullWidth
                            sx={{ mt: 2 }}
                            onClick={() => onStart(challenge.name)}
                        >
                            Start Challenge
                        </Button>
                    )}
                </Box>
            </CardContent>
        </Card>
    );
};

const Challenges = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [challenges, setChallenges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchChallenges();
        // Set up an interval to update challenge progress
        const interval = setInterval(() => {
            updateChallengeProgress();
        }, 60000); // Update every minute

        return () => clearInterval(interval);
    }, []);

    const fetchChallenges = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get(ENDPOINTS.CHALLENGES.BASE);
            setChallenges(response.data);
            setError('');
        } catch (err) {
            console.error('Error fetching challenges:', err);
            setError('Failed to fetch challenges. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const updateChallengeProgress = async () => {
        try {
            await axiosInstance.put(`${ENDPOINTS.CHALLENGES.BASE}/update-progress`);
            fetchChallenges(); // Refresh challenges after updating progress
        } catch (err) {
            console.error('Error updating challenge progress:', err);
        }
    };

    const handleStartChallenge = async (challengeName) => {
        try {
            await axiosInstance.post(`${ENDPOINTS.CHALLENGES.BASE}/${challengeName}/start`);
            fetchChallenges(); // Refresh challenges
            setError('');
        } catch (err) {
            console.error('Error starting challenge:', err);
            setError('Failed to start challenge. Please try again.');
        }
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    const activeChallenges = challenges.filter(c => c.isActive);
    const completedChallenges = challenges.filter(c => c.completed);
    const availableChallenges = challenges.filter(c => !c.isActive && !c.completed);

    const displayChallenges = activeTab === 0 ? availableChallenges :
                             activeTab === 1 ? activeChallenges :
                             completedChallenges;

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom>
                Challenges
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
                Complete challenges to earn badges and improve your habits!
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={activeTab} onChange={handleTabChange}>
                    <Tab label={`Available (${availableChallenges.length})`} />
                    <Tab label={`Active (${activeChallenges.length})`} />
                    <Tab label={`Completed (${completedChallenges.length})`} />
                </Tabs>
            </Box>

            <Grid container spacing={3}>
                {displayChallenges.map((challenge) => (
                    <Grid item xs={12} sm={6} md={4} key={challenge.name}>
                        <ChallengeCard 
                            challenge={challenge}
                            onStart={handleStartChallenge}
                        />
                    </Grid>
                ))}
                {displayChallenges.length === 0 && (
                    <Grid item xs={12}>
                        <Typography variant="body1" color="text.secondary" align="center">
                            No challenges found in this category.
                        </Typography>
                    </Grid>
                )}
            </Grid>
        </Container>
    );
};

export default Challenges; 