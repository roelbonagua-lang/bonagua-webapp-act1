import type { AthleteGoal, BudgetAthleteFood, DayStreakItem, NutritionLog, TrainingLog } from '../types.ts';

export interface MacroTargets {
  daily_calorie_target: number;
  daily_protein_target: number;
  daily_carbs_target: number;
}

/**
 * Computes athlete calorie, protein, and carb targets from body weight, height, and goal.
 * Uses basketball-athlete baseline energy expenditure (~35 kcal/kg maintenance) adjusted by goal.
 */
export function calculateMacroTargets(
  weightKg: number,
  heightCm: number,
  goal: AthleteGoal | string
): MacroTargets {
  const safeWeight = Math.max(40, Math.min(180, Number.isFinite(weightKg) ? weightKg : 75));
  const safeHeight = Math.max(140, Math.min(230, Number.isFinite(heightCm) ? heightCm : 180));

  // Athlete basal + court training factor
  const baseCalories = Math.round(safeWeight * 24 + safeHeight * 4.5 + 320);

  let calorieMultiplier = 1.0;
  let proteinPerKg = 1.8;
  let carbRatio = 0.5;

  if (goal === 'Lean Muscle / Bulk') {
    calorieMultiplier = 1.14;
    proteinPerKg = 2.1;
    carbRatio = 0.48;
  } else if (goal === 'Cut Fat for Vertical & Speed') {
    calorieMultiplier = 0.84;
    proteinPerKg = 2.2;
    carbRatio = 0.42;
  } else {
    // Game-Day Stamina
    calorieMultiplier = 1.04;
    proteinPerKg = 1.85;
    carbRatio = 0.54;
  }

  const daily_calorie_target = Math.round((baseCalories * calorieMultiplier) / 10) * 10;
  const daily_protein_target = Math.round(safeWeight * proteinPerKg);
  const daily_carbs_target = Math.round((daily_calorie_target * carbRatio) / 4);

  return {
    daily_calorie_target,
    daily_protein_target,
    daily_carbs_target,
  };
}

export function getLocalDateKey(dateInput: Date | string = new Date()): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (Number.isNaN(d.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function computeDailyNutritionTotals(logs: NutritionLog[], targetDateKey: string) {
  const todays = logs.filter((l) => getLocalDateKey(l.logged_at) === targetDateKey);
  return todays.reduce(
    (acc, item) => ({
      calories: acc.calories + (Number(item.calories) || 0),
      protein_g: acc.protein_g + (Number(item.protein_g) || 0),
      carbs_g: acc.carbs_g + (Number(item.carbs_g) || 0),
      count: acc.count + 1,
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, count: 0 }
  );
}

export function computeDailySkillMinutes(logs: TrainingLog[], targetDateKey: string): number {
  return logs
    .filter((l) => getLocalDateKey(l.logged_at) === targetDateKey)
    .reduce((sum, l) => sum + (Number(l.duration_mins) || 0), 0);
}

export function computeWeeklyStreak(
  logs: TrainingLog[],
  today: Date = new Date()
): { days: DayStreakItem[]; activeStreakCount: number } {
  const minutesByDay = new Map<string, number>();
  for (const log of logs) {
    const key = getLocalDateKey(log.logged_at);
    minutesByDay.set(key, (minutesByDay.get(key) || 0) + (Number(log.duration_mins) || 0));
  }

  const days: DayStreakItem[] = [];
  const weekdayFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'short' });

  for (let offset = 6; offset >= 0; offset--) {
    const d = new Date(today);
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - offset);
    const key = getLocalDateKey(d);
    const minutes = minutesByDay.get(key) || 0;
    days.push({
      date: key,
      label: weekdayFormatter.format(d),
      completed: minutes > 0,
      minutes,
    });
  }

  // Count consecutive completed days backwards from today (or yesterday if today hasn't been logged yet)
  let activeStreakCount = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].completed) {
      activeStreakCount++;
    } else if (i === days.length - 1) {
      // Today not logged yet shouldn't zero yesterday's streak
      continue;
    } else {
      break;
    }
  }

  return { days, activeStreakCount };
}

export const BUDGET_ATHLETE_FOODS: BudgetAthleteFood[] = [
  {
    id: 'boiled-eggs',
    name: 'Boiled Eggs (3 large)',
    defaultTiming: 'Daily Meals',
    serving: '3 eggs (~150g)',
    calories: 215,
    protein_g: 19,
    carbs_g: 2,
    note: 'Complete amino profile for joint & muscle repair.',
  },
  {
    id: 'chicken-rice',
    name: 'Chicken Breast & Steamed Rice',
    defaultTiming: 'Post-Game Recovery',
    serving: '150g chicken + 1.5 cups rice',
    calories: 485,
    protein_g: 42,
    carbs_g: 62,
    note: 'High-leucine protein + fast glycogen replenishment.',
  },
  {
    id: 'banana-pb',
    name: 'Banana + Peanut Butter Spoon',
    defaultTiming: 'Pre-Game Fuel',
    serving: '1 large banana + 1 tbsp PB',
    calories: 210,
    protein_g: 5,
    carbs_g: 31,
    note: 'Potassium prevents calf cramps; steady court energy.',
  },
  {
    id: 'oatmeal-milk',
    name: 'Rolled Oatmeal Bowl with Honey',
    defaultTiming: 'Pre-Game Fuel',
    serving: '1 cup cooked oats + 1 tbsp honey',
    calories: 320,
    protein_g: 10,
    carbs_g: 58,
    note: 'Slow-release complex carbs 90 mins before tip-off.',
  },
  {
    id: 'canned-tuna-rice',
    name: 'Tuna Flakes in Water & Brown Rice',
    defaultTiming: 'Post-Game Recovery',
    serving: '1 can drained + 1 cup rice',
    calories: 360,
    protein_g: 34,
    carbs_g: 46,
    note: 'Ultra-budget lean protein with zero prep.',
  },
  {
    id: 'sweet-potato',
    name: 'Steamed Sweet Potato (Kamote)',
    defaultTiming: 'Pre-Game Fuel',
    serving: '200g medium portion',
    calories: 180,
    protein_g: 4,
    carbs_g: 41,
    note: 'Clean pre-practice carbs without stomach heaviness.',
  },
  {
    id: 'sardines-toast',
    name: 'Sardines in Tomato Sauce & Whole Toast',
    defaultTiming: 'Daily Meals',
    serving: '1 small tin + 2 slices toast',
    calories: 370,
    protein_g: 26,
    carbs_g: 34,
    note: 'Omega-3 fatty acids reduce knee & ankle inflammation.',
  },
  {
    id: 'chocolate-milk',
    name: 'Low-Fat Chocolate Milk',
    defaultTiming: 'Post-Game Recovery',
    serving: '350ml bottle',
    calories: 230,
    protein_g: 12,
    carbs_g: 34,
    note: '3:1 carb-to-protein ratio within 30 mins post-game.',
  },
];

export const NUTRITION_GUIDELINES = {
  dos: [
    'Eat complex carbs (oatmeal, sweet potato/kamote, rice) 90–120 mins before practice for sustained fourth-quarter energy.',
    'Pair lean protein (eggs, chicken breast, tuna) with carbs within 45 mins post-game to rebuild muscle fibers.',
    'Sip 500ml of water 1 hour before tip-off and replenish electrolytes after heavy sweat sessions.',
    'Include potassium and magnesium sources (bananas, leafy greens) daily to prevent late-game calf cramps.',
  ],
  donts: [
    'Do NOT eat heavy, deep-fried, or greasy fast food within 2 hours of court work—fat slows gastric emptying and causes side stitches.',
    'Do NOT slam sugary sodas or energy drinks right before tip-off—blood glucose spikes trigger mid-game crashes.',
    'Do NOT skip post-workout protein when cutting weight; dropping protein sacrifices vertical jump power and muscle.',
    'Do NOT wait until you feel thirsty during full-court runs; even 2% dehydration drops shooting accuracy and reaction speed.',
  ],
};
