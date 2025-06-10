import React, { useState, useEffect } from 'react';
import {
    Container,
    Grid,
    Card,
    CardContent,
    Typography,
    LinearProgress,
    Box,
    Chip,
    CircularProgress,
    IconButton,
    Tooltip,
    Tab,
    Tabs,
    Button
} from '@mui/material';
import {
    EmojiEvents,
    LocalDrink,
    DirectionsRun,
    Bedtime,
    Restaurant,
    Star,
    EmojiFlags,
    Lock
} from '@mui/icons-material';
import axiosInstance from '../utils/axios';
import { ENDPOINTS } from '../config';
import { format } from 'date-fns';

const categoryIcons = {
    sleep: <Bedtime />,
    water: <LocalDrink />,
    activity: <DirectionsRun />,
    nutrition: <Restaurant />,
    overall: <Star />,
    achievement: <EmojiFlags />
};

const tierColors = {
    bronze: '#CD7F32',
    silver: '#C0C0C0',
    gold: '#FFD700',
    platinum: '#E5E4E2'
};

const badgeInfo = {
    early_bird: {
        category: 'sleep',
        description: 'Wake up early and maintain a consistent sleep schedule',
        challenge: 'Early Bird Week'
    },
    night_owl: {
        category: 'sleep',
        description: 'Track your sleep consistently for a week',
        challenge: 'Sleep Master'
    },
    healthy_eater: {
        category: 'nutrition',
        description: 'Log healthy meals consistently',
        challenge: 'Healthy Eating Streak'
    },
    exercise_master: {
        category: 'activity',
        description: 'Exercise regularly and maintain an active lifestyle',
        challenge: 'Exercise Champion'
    },
    hydration_hero: {
        category: 'water',
        description: 'Stay hydrated by drinking enough water daily',
        challenge: 'Hydration Challenge'
    }
};

const BadgeCard = ({ badge, isEarned }) => {
    const info = badgeInfo[badge];
    if (!info) return null;

    return (
        <Card sx={{ 
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'background.paper'
        }}>
            <CardContent sx={{ 
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                p: 2
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <IconButton 
                        sx={{ 
                            mr: 1,
                            backgroundColor: isEarned ? tierColors.gold : tierColors.silver,
                            '&:hover': {
                                backgroundColor: isEarned ? tierColors.gold : tierColors.silver
                            }
                        }}
                    >
                        {isEarned ? categoryIcons[info.category] : <Lock />}
                    </IconButton>
                    <Box>
                        <Typography variant="h6" component="div">
                            {badge.split('_').map(word => 
                                word.charAt(0).toUpperCase() + word.slice(1)
                            ).join(' ')}
                        </Typography>
                        <Chip
                            label={isEarned ? 'EARNED' : 'LOCKED'}
                            size="small"
                            sx={{
                                backgroundColor: isEarned ? tierColors.gold : tierColors.silver,
                                color: 'black'
                            }}
                        />
                    </Box>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {info.description}
                </Typography>

                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip
                        label={info.category}
                        size="small"
                        icon={categoryIcons[info.category]}
                    />
                </Box>

                <Box sx={{ mt: 'auto' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <EmojiEvents sx={{ mr: 1, color: isEarned ? tierColors.gold : tierColors.silver }} />
                        <Typography variant="body2">
                            {isEarned 
                                ? "Achievement Unlocked!" 
                                : `Complete "${info.challenge}" to earn`}
                        </Typography>
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
};

const Badges = () => {
    const [badges, setBadges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState(0);

    useEffect(() => {
        const fetchBadges = async () => {
            try {
                setLoading(true);
                const response = await axiosInstance.get(ENDPOINTS.BADGES.BASE);
                setBadges(response.data);
            } catch (error) {
                console.error('Error fetching badges:', error);
                setError('Failed to load badges. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchBadges();
    }, []);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const allBadges = Object.keys(badgeInfo);
    const earnedBadges = badges;

    // Determine which badges to display based on active tab
    const displayBadges = activeTab === 0 
        ? allBadges // Show all badges in All Badges tab
        : earnedBadges; // Show only earned badges in My Badges tab

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" gutterBottom>
                    Badges
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Earn badges by completing challenges and maintaining good habits!
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Progress: {earnedBadges.length}/{allBadges.length} badges earned
                </Typography>
            </Box>

            {error && (
                <Box sx={{ mb: 3 }}>
                    <Typography color="error">{error}</Typography>
                </Box>
            )}

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={activeTab} onChange={handleTabChange}>
                    <Tab label="All Badges" />
                    <Tab label="My Badges" />
                </Tabs>
            </Box>

            <Box sx={{ minHeight: 400 }}>
                <Grid container spacing={3}>
                    {displayBadges.map((badgeName, index) => (
                        <Grid item xs={12} sm={6} md={4} key={`${activeTab}-${badgeName}-${index}`}>
                            <Box sx={{ 
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                <BadgeCard 
                                    badge={badgeName}
                                    isEarned={earnedBadges.includes(badgeName)}
                                />
                            </Box>
                        </Grid>
                    ))}
                    {activeTab === 1 && earnedBadges.length === 0 && (
                        <Grid item xs={12}>
                            <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'center', 
                                alignItems: 'center',
                                minHeight: 200 
                            }}>
                                <Typography variant="body1" color="text.secondary" align="center">
                                    You haven't earned any badges yet. Complete challenges to earn badges!
                                </Typography>
                            </Box>
                        </Grid>
                    )}
                </Grid>
            </Box>
        </Container>
    );
};

export default Badges; 