import React, { useState, useEffect } from 'react';
import {
    Container,
    Grid,
    Paper,
    Typography,
    Avatar,
    Box,
    Button,
    TextField,
    Divider,
    CircularProgress,
    Alert,
    Card,
    CardContent,
    List,
    ListItem,
    ListItemText,
    ListItemIcon
} from '@mui/material';
import {
    Person,
    Email,
    DateRange,
    EmojiEvents,
    Star,
    Timeline,
    Edit,
    Save,
    Cancel,
    PhotoCamera
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../utils/axios';
import { ENDPOINTS } from '../config';

const Profile = () => {
    const { user, updateUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [stats, setStats] = useState(null);
    const [profileData, setProfileData] = useState({
        name: '',
        email: '',
        bio: '',
        joinedDate: '',
        avatar: '',
        preferences: {
            emailNotifications: true,
            dailyReminder: true,
            weeklyReport: true
        }
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);
                const [userResponse, statsResponse] = await Promise.all([
                    axiosInstance.get(ENDPOINTS.USERS.PROFILE),
                    axiosInstance.get(ENDPOINTS.USERS.STATS)
                ]);

                setProfileData(userResponse.data);
                setStats(statsResponse.data);
            } catch (err) {
                setError('Failed to load profile data');
                console.error('Error fetching profile:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleEdit = () => {
        setIsEditing(true);
        setError(null);
        setSuccess(null);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setError(null);
        setSuccess(null);
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await axiosInstance.put(ENDPOINTS.USERS.PROFILE, profileData);
            setProfileData(response.data);
            setIsEditing(false);
            setSuccess('Profile updated successfully');
            updateUser(response.data);
        } catch (err) {
            setError('Failed to update profile');
            console.error('Error updating profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    if (loading && !isEditing) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Paper sx={{ p: 4, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                    <Typography variant="h4" component="h1">
                        Profile Settings
                    </Typography>
                    {!isEditing ? (
                        <Button
                            startIcon={<Edit />}
                            onClick={handleEdit}
                            sx={{ ml: 'auto' }}
                        >
                            Edit Profile
                        </Button>
                    ) : (
                        <Box sx={{ ml: 'auto' }}>
                            <Button
                                color="error"
                                startIcon={<Cancel />}
                                onClick={handleCancel}
                                sx={{ mr: 1 }}
                            >
                                Cancel
                            </Button>
                            <Button
                                color="primary"
                                startIcon={<Save />}
                                onClick={handleSave}
                                disabled={loading}
                            >
                                Save Changes
                            </Button>
                        </Box>
                    )}
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert severity="success" sx={{ mb: 3 }}>
                        {success}
                    </Alert>
                )}

                <Grid container spacing={4}>
                    <Grid item xs={12} md={4}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Avatar
                                sx={{
                                    width: 120,
                                    height: 120,
                                    mb: 2
                                }}
                                src={profileData.avatar}
                            >
                                {profileData.name?.charAt(0) || user?.email?.charAt(0)}
                            </Avatar>
                            {isEditing && (
                                <Button
                                    variant="outlined"
                                    component="label"
                                    startIcon={<PhotoCamera />}
                                    size="small"
                                >
                                    Change Photo
                                    <input
                                        type="file"
                                        hidden
                                        accept="image/*"
                                        onChange={(e) => {
                                            // Handle photo upload
                                            console.log('Photo upload:', e.target.files[0]);
                                        }}
                                    />
                                </Button>
                            )}
                        </Box>
                    </Grid>

                    <Grid item xs={12} md={8}>
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Name"
                                    name="name"
                                    value={profileData.name}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Email"
                                    name="email"
                                    value={profileData.email}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    type="email"
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Bio"
                                    name="bio"
                                    value={profileData.bio}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    multiline
                                    rows={4}
                                    placeholder="Tell us about yourself..."
                                />
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>

                <Divider sx={{ my: 4 }} />

                <Typography variant="h6" sx={{ mb: 3 }}>
                    Notification Preferences
                </Typography>

                <Grid container spacing={2}>
                    {Object.entries(profileData.preferences || {}).map(([key, value]) => (
                        <Grid item xs={12} key={key}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Typography sx={{ textTransform: 'capitalize' }}>
                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                </Typography>
                                <Button
                                    variant={value ? 'contained' : 'outlined'}
                                    color={value ? 'primary' : 'inherit'}
                                    onClick={() => {
                                        if (isEditing) {
                                            setProfileData(prev => ({
                                                ...prev,
                                                preferences: {
                                                    ...prev.preferences,
                                                    [key]: !value
                                                }
                                            }));
                                        }
                                    }}
                                    disabled={!isEditing}
                                >
                                    {value ? 'Enabled' : 'Disabled'}
                                </Button>
                            </Box>
                        </Grid>
                    ))}
                </Grid>
            </Paper>
        </Container>
    );
};

export default Profile; 