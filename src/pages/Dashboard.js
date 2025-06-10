import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Typography,
  Button,
  Box,
  CircularProgress,
  Paper,
  useTheme
} from '@mui/material';
import {
  Add as AddIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  Star as StarIcon,
  EmojiEvents as EmojiEventsIcon,
  Favorite as FavoriteIcon,
  FitnessCenter as FitnessCenterIcon,
  Psychology as PsychologyIcon,
  Work as WorkIcon
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import { format } from 'date-fns';
import axiosInstance from '../utils/axios';
import { useAuth } from '../context/AuthContext';
import { ROUTES, ENDPOINTS } from '../config';
import StatCard from '../components/StatCard';

// Import Chart.js components
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const chartRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [weeklyData, setWeeklyData] = useState([]);
  const [stats, setStats] = useState({
    totalPoints: 0,
    weeklyAverage: 0,
    todayScore: 0,
    todayHabits: 0,
    completionRate: 0,
    currentStreak: 0,
    longestStreak: 0,
    completedChallenges: 0,
    badgesEarned: 0,
    categoryBreakdown: {},
    progressTrend: {
      daily: 0,
      weekly: 0,
      improvement: 0
    }
  });

  const categoryIcons = {
    health: <FavoriteIcon />,
    fitness: <FitnessCenterIcon />,
    mindfulness: <PsychologyIcon />,
    productivity: <WorkIcon />
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: value => `${value}%`
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (context) => `${context.dataset.label}: ${context.parsed.y}%`
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  // Safe access function for nested objects
  const safeGet = (obj, path, defaultValue = 0) => {
    try {
      return path.split('.').reduce((acc, part) => acc && acc[part], obj) ?? defaultValue;
    } catch (e) {
      return defaultValue;
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching dashboard data...');

        // Fetch both stats and weekly data
        const [statsResponse, weeklyResponse] = await Promise.all([
          axiosInstance.get(ENDPOINTS.USERS.STATS),
          axiosInstance.get(ENDPOINTS.HABITS.WEEKLY)
        ]);

        console.log('Stats response:', statsResponse.data);
        console.log('Weekly response:', weeklyResponse.data);

        // Process stats data
        const safeStats = {
          totalPoints: safeGet(statsResponse.data, 'totalPoints', 0),
          weeklyAverage: safeGet(statsResponse.data, 'weeklyAverage', 0),
          todayScore: safeGet(statsResponse.data, 'todayScore', 0),
          todayHabits: safeGet(statsResponse.data, 'todayHabits', 0),
          completionRate: safeGet(statsResponse.data, 'completionRate', 0),
          currentStreak: safeGet(statsResponse.data, 'currentStreak', 0),
          longestStreak: safeGet(statsResponse.data, 'longestStreak', 0),
          completedChallenges: safeGet(statsResponse.data, 'completedChallenges', 0),
          badgesEarned: safeGet(statsResponse.data, 'badgesEarned', 0),
          categoryBreakdown: statsResponse.data.categoryBreakdown || {},
          progressTrend: {
            daily: safeGet(statsResponse.data, 'progressTrend.daily', 0),
            weekly: safeGet(statsResponse.data, 'progressTrend.weekly', 0),
            improvement: safeGet(statsResponse.data, 'progressTrend.improvement', 0)
          }
        };

        setStats(safeStats);

        // Process weekly data for chart
        if (Array.isArray(weeklyResponse.data) && weeklyResponse.data.length > 0) {
          console.log('Processing weekly data for chart...');
          const sortedData = weeklyResponse.data.sort((a, b) => new Date(a.date) - new Date(b.date));
          setWeeklyData(sortedData);
        } else {
          console.log('No weekly data available');
          setWeeklyData([]);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleAddHabit = () => {
    navigate(ROUTES.HABITS);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error}</Typography>
        <Button variant="contained" onClick={() => window.location.reload()} sx={{ mt: 2 }}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">
          Dashboard Overview
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddHabit}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            px: 3
          }}
        >
          Add New Habit
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Today's Score */}
        <Grid item xs={12} md={3}>
          <StatCard
            title="Today's Score"
            value={`${stats.todayScore}/100`}
            subValue={`${stats.todayHabits} habits tracked`}
            icon={<TrendingUpIcon />}
            color="#2196f3"
            progress={stats.todayScore}
            tooltip="Overall score based on completed habits today"
          />
        </Grid>

        {/* Weekly Average */}
        <Grid item xs={12} md={3}>
          <StatCard
            title="Weekly Average"
            value={`${stats.weeklyAverage}%`}
            subValue={`${stats.progressTrend.improvement >= 0 ? '+' : ''}${stats.progressTrend.improvement}% vs last week`}
            icon={<TimelineIcon />}
            color="#4caf50"
            progress={stats.weeklyAverage}
            tooltip="Average completion rate for the past week"
          />
        </Grid>

        {/* Current Streak */}
        <Grid item xs={12} md={3}>
          <StatCard
            title="Current Streak"
            value={`${stats.currentStreak} days`}
            subValue={`Longest: ${stats.longestStreak} days`}
            icon={<StarIcon />}
            color="#ff9800"
            progress={(stats.currentStreak / stats.longestStreak) * 100}
            tooltip="Current consecutive days with completed habits"
          />
        </Grid>

        {/* Completion Rate */}
        <Grid item xs={12} md={3}>
          <StatCard
            title="Completion Rate"
            value={`${stats.completionRate}%`}
            subValue="Today's habits"
            icon={<EmojiEventsIcon />}
            color="#f44336"
            progress={stats.completionRate}
            tooltip="Percentage of habits completed today"
          />
        </Grid>

        {/* Category Breakdown */}
        {Object.entries(stats.categoryBreakdown).map(([category, data]) => (
          <Grid item xs={12} md={3} key={category}>
            <StatCard
              title={category.charAt(0).toUpperCase() + category.slice(1)}
              value={`${data.score}%`}
              subValue={`${data.habitCount} habits`}
              icon={categoryIcons[category] || <StarIcon />}
              color={
                category === 'health' ? '#f44336' :
                category === 'fitness' ? '#4caf50' :
                category === 'mindfulness' ? '#2196f3' :
                category === 'productivity' ? '#ff9800' :
                '#9e9e9e'
              }
              progress={data.score}
              tooltip={`${category} habits completion rate`}
            />
          </Grid>
        ))}

        {/* Weekly Progress Chart */}
        <Grid item xs={12}>
          <Paper
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              height: 400,
              bgcolor: 'background.paper',
              borderRadius: 2,
              boxShadow: 3
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Weekly Progress
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {weeklyData.length > 0 && (
                  <Typography variant="body2" color="text.secondary">
                    Average Completion: {Math.round(weeklyData.reduce((acc, day) => acc + day.completion, 0) / weeklyData.length)}%
                  </Typography>
                )}
              </Box>
            </Box>
            {weeklyData.length > 0 ? (
              <Box sx={{ flex: 1, minHeight: 300, position: 'relative' }}>
                <Line
                  ref={chartRef}
                  options={chartOptions}
                  data={{
                    labels: weeklyData.map(day => format(new Date(day.date), 'EEE, MMM d')),
                    datasets: [
                      {
                        label: 'Overall',
                        data: weeklyData.map(day => day.totalScore),
                        borderColor: theme.palette.primary.main,
                        backgroundColor: `${theme.palette.primary.main}20`,
                        fill: true,
                        tension: 0.4,
                        borderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6
                      },
                      {
                        label: 'Health',
                        data: weeklyData.map(day => day.score.health),
                        borderColor: '#f44336',
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        tension: 0.4
                      },
                      {
                        label: 'Fitness',
                        data: weeklyData.map(day => day.score.fitness),
                        borderColor: '#4caf50',
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        tension: 0.4
                      },
                      {
                        label: 'Mindfulness',
                        data: weeklyData.map(day => day.score.mindfulness),
                        borderColor: '#2196f3',
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        tension: 0.4
                      },
                      {
                        label: 'Productivity',
                        data: weeklyData.map(day => day.score.productivity),
                        borderColor: '#ff9800',
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        tension: 0.4
                      }
                    ]
                  }}
                />
              </Box>
            ) : (
              <Box sx={{ 
                flex: 1, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'text.secondary'
              }}>
                <Typography variant="body1">
                  No data available for the past week. Start tracking your habits!
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard; 