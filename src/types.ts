export type AthleteGoal =
  | 'Lean Muscle / Bulk'
  | 'Cut Fat for Vertical & Speed'
  | 'Game-Day Stamina';

export type DrillCategory =
  | 'Dribbling & Ball Handling'
  | 'Weak / Left-Hand Mastery'
  | 'Shooting & Mechanics'
  | 'Vertical Jump & Explosiveness'
  | 'Stamina & Court Conditioning';

export type MealTiming = 'Pre-Game Fuel' | 'Post-Game Recovery' | 'Daily Meals';

export interface User {
  id: number;
  name: string;
  email: string;
  position: string;
  height_cm: number;
  weight_kg: number;
  goal: AthleteGoal;
  daily_calorie_target: number;
  daily_protein_target: number;
  daily_skill_mins_target: number;
}

export interface Drill {
  id: number;
  category: DrillCategory;
  title: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Pro';
  duration_mins: number;
  sets_reps: string;
  instructions: string;
  donts_warning: string;
}

export interface TrainingLog {
  id: number;
  user_id: number;
  drill_id: number | null;
  drill_title: string;
  category: string;
  duration_mins: number;
  notes: string;
  logged_at: string;
}

export interface NutritionLog {
  id: number;
  user_id: number;
  meal_timing: MealTiming;
  food_name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  logged_at: string;
}

export interface DailyHydration {
  id: number;
  user_id: number;
  glasses_count: number;
  date: string;
}

export interface DayStreakItem {
  date: string;
  label: string;
  completed: boolean;
  minutes: number;
}

export interface BudgetAthleteFood {
  id: string;
  name: string;
  defaultTiming: MealTiming;
  serving: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  note: string;
}

export interface AiRoutineResponse {
  routineTitle: string;
  warmup: string;
  drills: {
    name: string;
    durationMins: number;
    setsReps: string;
    coachingCue: string;
  }[];
  mealPlan: {
    preGame: string;
    postGame: string;
  };
  mistakesToAvoid: string[];
}

export interface AiCritiqueResponse {
  headline: string;
  trainingSummary: string;
  nutritionSummary: string;
  strengths: string[];
  priorityAdjustments: string[];
  mistakesToAvoid: string[];
}

export interface SchemaColumnInfo {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  pk: number;
}

export interface SchemaTableInfo {
  name: string;
  sql: string;
  rowCount: number;
  columns: SchemaColumnInfo[];
}
