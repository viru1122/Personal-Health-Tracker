// Helper function to check if two dates are consecutive
const areConsecutiveDays = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);
  
  const diffTime = Math.abs(d2 - d1);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays === 1;
};

// Helper function to check if a date is today
const isToday = (date) => {
  const today = new Date();
  const checkDate = new Date(date);
  return (
    checkDate.getDate() === today.getDate() &&
    checkDate.getMonth() === today.getMonth() &&
    checkDate.getFullYear() === today.getFullYear()
  );
};

// Helper function to check if a date is yesterday
const isYesterday = (date) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const checkDate = new Date(date);
  return (
    checkDate.getDate() === yesterday.getDate() &&
    checkDate.getMonth() === yesterday.getMonth() &&
    checkDate.getFullYear() === yesterday.getFullYear()
  );
};

exports.calculateStreak = (habits) => {
  if (!habits || habits.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Get all completion dates across all habits
  let allCompletions = habits.reduce((dates, habit) => {
    return [...dates, ...habit.completions];
  }, []);

  // Sort dates in descending order
  allCompletions = allCompletions
    .map(date => new Date(date))
    .sort((a, b) => b - a);

  if (allCompletions.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Remove duplicate dates (if multiple habits were completed on the same day)
  allCompletions = allCompletions.filter((date, index, array) => {
    if (index === 0) return true;
    const prevDate = array[index - 1];
    return date.getDate() !== prevDate.getDate() ||
           date.getMonth() !== prevDate.getMonth() ||
           date.getFullYear() !== prevDate.getFullYear();
  });

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  // Calculate current streak
  const lastCompletion = allCompletions[0];
  if (isToday(lastCompletion) || isYesterday(lastCompletion)) {
    currentStreak = 1;
    for (let i = 1; i < allCompletions.length; i++) {
      if (areConsecutiveDays(allCompletions[i], allCompletions[i-1])) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  // Calculate longest streak
  for (let i = 0; i < allCompletions.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else if (areConsecutiveDays(allCompletions[i], allCompletions[i-1])) {
      tempStreak++;
    } else {
      tempStreak = 1;
    }
    longestStreak = Math.max(longestStreak, tempStreak);
  }

  return { currentStreak, longestStreak };
}; 