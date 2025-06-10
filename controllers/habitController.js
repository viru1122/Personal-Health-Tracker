const Habit = require('../models/Habit');

// Get weekly data for habits
exports.getWeeklyData = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get all habits for the user
    const habits = await Habit.find({ user: userId });

    // Initialize daily data for the past week
    const weeklyData = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const dayData = {
        date: date,
        completion: 0,
        score: {
          health: 0,
          fitness: 0,
          mindfulness: 0,
          productivity: 0
        }
      };

      // Calculate completion rate and category scores for each day
      const dayCompletions = habits.filter(habit => {
        return habit.completions.some(completion => {
          const completionDate = new Date(completion);
          completionDate.setHours(0, 0, 0, 0);
          return completionDate.getTime() === date.getTime();
        });
      });

      // Calculate overall completion rate
      dayData.completion = habits.length > 0 
        ? (dayCompletions.length / habits.length) * 100 
        : 0;

      // Calculate category scores
      const categoryHabits = {
        health: habits.filter(h => h.category === 'health'),
        fitness: habits.filter(h => h.category === 'fitness'),
        mindfulness: habits.filter(h => h.category === 'mindfulness'),
        productivity: habits.filter(h => h.category === 'productivity')
      };

      Object.entries(categoryHabits).forEach(([category, habitsInCategory]) => {
        if (habitsInCategory.length > 0) {
          const completedInCategory = dayCompletions.filter(h => 
            habitsInCategory.some(ch => ch._id.toString() === h._id.toString())
          );
          dayData.score[category] = (completedInCategory.length / habitsInCategory.length) * 100;
        }
      });

      weeklyData.push(dayData);
    }

    res.json(weeklyData);
  } catch (error) {
    console.error('Error getting weekly data:', error);
    res.status(500).json({ message: 'Error fetching weekly data' });
  }
};

// Get all habits
exports.getHabits = async (req, res) => {
  try {
    const habits = await Habit.find({ user: req.user.id });
    res.json(habits);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching habits' });
  }
};

// Create new habit
exports.createHabit = async (req, res) => {
  try {
    const { name, description, category, frequency } = req.body;
    const habit = new Habit({
      user: req.user.id,
      name,
      description,
      category,
      frequency,
      completions: []
    });
    await habit.save();
    res.status(201).json(habit);
  } catch (error) {
    res.status(400).json({ message: 'Error creating habit' });
  }
};

// Update habit
exports.updateHabit = async (req, res) => {
  try {
    const habit = await Habit.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true }
    );
    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }
    res.json(habit);
  } catch (error) {
    res.status(400).json({ message: 'Error updating habit' });
  }
};

// Delete habit
exports.deleteHabit = async (req, res) => {
  try {
    const habit = await Habit.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });
    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }
    res.json({ message: 'Habit deleted' });
  } catch (error) {
    res.status(400).json({ message: 'Error deleting habit' });
  }
};

// Mark habit as complete for today
exports.completeHabit = async (req, res) => {
  try {
    const habit = await Habit.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already completed today
    const completedToday = habit.completions.some(date => {
      const completionDate = new Date(date);
      completionDate.setHours(0, 0, 0, 0);
      return completionDate.getTime() === today.getTime();
    });

    if (!completedToday) {
      habit.completions.push(today);
      await habit.save();
    }

    res.json(habit);
  } catch (error) {
    res.status(400).json({ message: 'Error completing habit' });
  }
};

// Get habit statistics
exports.getHabitStats = async (req, res) => {
  try {
    const habits = await Habit.find({ user: req.user.id });
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = {
      total: habits.length,
      completedToday: 0,
      streaks: {},
      categoryBreakdown: {}
    };

    habits.forEach(habit => {
      // Count habits completed today
      const completedToday = habit.completions.some(date => {
        const completionDate = new Date(date);
        completionDate.setHours(0, 0, 0, 0);
        return completionDate.getTime() === today.getTime();
      });
      if (completedToday) {
        stats.completedToday++;
      }

      // Category breakdown
      if (!stats.categoryBreakdown[habit.category]) {
        stats.categoryBreakdown[habit.category] = {
          total: 0,
          completed: 0
        };
      }
      stats.categoryBreakdown[habit.category].total++;
      if (completedToday) {
        stats.categoryBreakdown[habit.category].completed++;
      }
    });

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching habit statistics' });
  }
}; 