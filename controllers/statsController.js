const Habit = require('../models/Habit');
const User = require('../models/User');
const { calculateStreak } = require('../utils/streakCalculator');

// Get user stats
exports.getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all habits for the user
    const habits = await Habit.find({ user: userId });
    
    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calculate today's stats
    const todayHabits = habits.filter(habit => {
      const lastCompletion = habit.completions[habit.completions.length - 1];
      return lastCompletion && new Date(lastCompletion).setHours(0,0,0,0) === today.getTime();
    });

    // Calculate completion rate
    const completionRate = habits.length > 0 
      ? (todayHabits.length / habits.length) * 100 
      : 0;

    // Calculate streaks
    const { currentStreak, longestStreak } = calculateStreak(habits);

    // Calculate weekly average
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    let weeklyTotal = 0;
    let lastWeekTotal = 0;
    
    habits.forEach(habit => {
      const thisWeekCompletions = habit.completions.filter(date => {
        const completionDate = new Date(date);
        return completionDate >= sevenDaysAgo && completionDate <= today;
      }).length;
      
      weeklyTotal += thisWeekCompletions;
      
      // Calculate last week's completions
      const twoWeeksAgo = new Date(sevenDaysAgo);
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 7);
      const lastWeekCompletions = habit.completions.filter(date => {
        const completionDate = new Date(date);
        return completionDate >= twoWeeksAgo && completionDate < sevenDaysAgo;
      }).length;
      
      lastWeekTotal += lastWeekCompletions;
    });

    const weeklyAverage = (weeklyTotal / (habits.length * 7)) * 100;
    const lastWeekAverage = (lastWeekTotal / (habits.length * 7)) * 100;
    const improvement = weeklyAverage - lastWeekAverage;

    // Calculate category breakdown
    const categoryBreakdown = {};
    habits.forEach(habit => {
      if (!categoryBreakdown[habit.category]) {
        categoryBreakdown[habit.category] = {
          habitCount: 0,
          completedToday: 0,
          score: 0
        };
      }
      
      categoryBreakdown[habit.category].habitCount++;
      if (todayHabits.some(h => h._id.toString() === habit._id.toString())) {
        categoryBreakdown[habit.category].completedToday++;
      }
    });

    // Calculate score for each category
    Object.keys(categoryBreakdown).forEach(category => {
      const { habitCount, completedToday } = categoryBreakdown[category];
      categoryBreakdown[category].score = Math.round((completedToday / habitCount) * 100);
    });

    // Calculate today's score (weighted average based on habit importance)
    const todayScore = Math.round(
      habits.reduce((score, habit) => {
        const isCompletedToday = todayHabits.some(h => h._id.toString() === habit._id.toString());
        return score + (isCompletedToday ? (habit.importance || 1) : 0);
      }, 0) / habits.reduce((total, habit) => total + (habit.importance || 1), 0) * 100
    );

    const stats = {
      todayScore,
      todayHabits: todayHabits.length,
      completionRate: Math.round(completionRate),
      currentStreak,
      longestStreak,
      weeklyAverage: Math.round(weeklyAverage),
      categoryBreakdown,
      progressTrend: {
        daily: Math.round(completionRate),
        weekly: Math.round(weeklyAverage),
        improvement: Math.round(improvement)
      }
    };

    res.json(stats);
  } catch (error) {
    console.error('Error getting user stats:', error);
    res.status(500).json({ message: 'Error fetching user statistics' });
  }
}; 