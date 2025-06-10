import React, { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  CircularProgress,
  Button,
  Alert,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  LinearProgress,
  Avatar,
  Chip,
  useTheme
} from '@mui/material';
import { format, parseISO, isToday, startOfDay } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../config';
import { useHabit } from '../context/HabitContext';
import { useChallenge } from '../context/ChallengeContext';
import { useBadge } from '../context/BadgeContext';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';

const WeeklyLog = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [weeklyData, setWeeklyData] = useState([]);
  const { loading: habitLoading, error: habitError, getWeeklyHabits } = useHabit();
  const { loading: challengeLoading, getActiveChallenges } = useChallenge();
  const { loading: badgeLoading, getEarnedBadges } = useBadge();

  const [activeChallenges, setActiveChallenges] = useState([]);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch weekly habits data
      const weeklyHabits = await getWeeklyHabits();
      setWeeklyData(weeklyHabits);

      // Fetch active challenges
      const challenges = getActiveChallenges();
      setActiveChallenges(challenges);

      // Fetch earned badges
      const badges = getEarnedBadges();
      setEarnedBadges(badges);
    } catch (err) {
      console.error('Error fetching weekly data:', err);
      setError('Failed to load weekly data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Set up auto-refresh every 30 seconds
    const intervalId = setInterval(fetchData, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const handleRefresh = () => {
    fetchData();
  };

  if (loading && weeklyData.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Check if we have data for today
  const today = startOfDay(new Date());
  const hasLatestDate = weeklyData.some(day => {
    const dayDate = parseISO(day.date);
    return startOfDay(dayDate).getTime() === today.getTime();
  });

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Weekly Log</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined" 
            onClick={handleRefresh}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </Button>
          <Button 
            variant="contained" 
            onClick={() => navigate(ROUTES.DASHBOARD)}
            color={!hasLatestDate ? "primary" : "secondary"}
          >
            {!hasLatestDate ? "Add Today's Entry" : "Update Today's Entry"}
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!hasLatestDate && (
        <Alert severity="info" sx={{ mb: 3 }}>
          You haven't logged any habits for today yet. Click "Add Today's Entry" to get started!
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Weekly Data Table */}
        <Grid item xs={12}>
          {weeklyData.length === 0 ? (
            <Alert severity="info">
              No habit data available for this week. Start by adding some habits!
            </Alert>
          ) : (
            <TableContainer component={Paper} sx={{ mb: 4 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell align="center">Overall Score</TableCell>
                    <TableCell align="center">Health</TableCell>
                    <TableCell align="center">Fitness</TableCell>
                    <TableCell align="center">Mindfulness</TableCell>
                    <TableCell align="center">Productivity</TableCell>
                    <TableCell align="center">Daily Habits</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {weeklyData.map((day) => {
                    const date = parseISO(day.date);
                    const isCurrentDay = isToday(date);
                    return (
                      <TableRow
                        key={day.date}
                        sx={{
                          '&:last-child td, &:last-child th': { border: 0 },
                          backgroundColor: isCurrentDay ? 'action.hover' : 'inherit'
                        }}
                      >
                        <TableCell component="th" scope="row">
                          <Typography variant="body1" fontWeight={isCurrentDay ? 'bold' : 'normal'}>
                            {format(date, 'EEE, MMM d')}
                            {isCurrentDay && " (Today)"}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CircularProgress
                              variant="determinate"
                              value={day.totalScore}
                              size={40}
                              thickness={4}
                              sx={{
                                color: theme => {
                                  if (day.totalScore >= 80) return '#4caf50';
                                  if (day.totalScore >= 60) return '#ff9800';
                                  return '#f44336';
                                }
                              }}
                            />
                            <Typography variant="body2" sx={{ ml: 1 }}>
                              {day.totalScore}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <LinearProgress
                            variant="determinate"
                            value={day.score.health}
                            sx={{ 
                              height: 10, 
                              borderRadius: 5,
                              backgroundColor: '#ffcdd2',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: '#f44336'
                              }
                            }}
                          />
                          <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                            {day.score.health}%
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <LinearProgress
                            variant="determinate"
                            value={day.score.fitness}
                            sx={{ 
                              height: 10, 
                              borderRadius: 5,
                              backgroundColor: '#c8e6c9',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: '#4caf50'
                              }
                            }}
                          />
                          <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                            {day.score.fitness}%
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <LinearProgress
                            variant="determinate"
                            value={day.score.mindfulness}
                            sx={{ 
                              height: 10, 
                              borderRadius: 5,
                              backgroundColor: '#bbdefb',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: '#2196f3'
                              }
                            }}
                          />
                          <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                            {day.score.mindfulness}%
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <LinearProgress
                            variant="determinate"
                            value={day.score.productivity}
                            sx={{ 
                              height: 10, 
                              borderRadius: 5,
                              backgroundColor: '#ffe0b2',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: '#ff9800'
                              }
                            }}
                          />
                          <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                            {day.score.productivity}%
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            {day.habits.map((habit, index) => (
                              <Chip
                                key={index}
                                size="small"
                                label={`${habit.sleepHours}h sleep, ${habit.waterIntake}L water${habit.exerciseDone ? ', Exercise' : ''}`}
                                sx={{ 
                                  maxWidth: '100%',
                                  fontSize: '0.75rem'
                                }}
                              />
                            ))}
                            {day.habits.length === 0 && (
                              <Typography variant="caption" color="text.secondary">
                                No habits logged
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Grid>

        {/* Challenges Section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Active Challenges
            </Typography>
            {challengeLoading ? (
              <CircularProgress size={20} />
            ) : activeChallenges.length === 0 ? (
              <Typography color="textSecondary">
                No active challenges. Join a challenge to get started!
              </Typography>
            ) : (
              <List>
                {activeChallenges.map((challenge) => (
                  <ListItem key={challenge._id}>
                    <ListItemIcon>
                      <EmojiEventsIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={challenge.title}
                      secondary={
                        <Box sx={{ width: '100%' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2">{challenge.description}</Typography>
                            <Typography variant="body2">{challenge.progress}%</Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={challenge.progress} 
                            sx={{ mt: 1 }}
                          />
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Badges Section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Earned Badges
            </Typography>
            {badgeLoading ? (
              <CircularProgress size={20} />
            ) : earnedBadges.length === 0 ? (
              <Typography color="textSecondary">
                No badges earned yet. Keep up with your habits to earn badges!
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {earnedBadges.map((badge) => (
                  <Chip
                    key={badge._id}
                    icon={<WorkspacePremiumIcon />}
                    label={badge.title}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default WeeklyLog; 