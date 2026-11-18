import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateMacroTargets,
  computeDailyNutritionTotals,
  computeDailySkillMinutes,
  computeWeeklyStreak,
} from './hoopLogic.ts';
import type { NutritionLog, TrainingLog } from '../types.ts';

test('calculateMacroTargets scales calories and protein by athlete goal', () => {
  const bulk = calculateMacroTargets(80, 185, 'Lean Muscle / Bulk');
  const cut = calculateMacroTargets(80, 185, 'Cut Fat for Vertical & Speed');
  const stamina = calculateMacroTargets(80, 185, 'Game-Day Stamina');

  assert.ok(bulk.daily_calorie_target > stamina.daily_calorie_target);
  assert.ok(stamina.daily_calorie_target > cut.daily_calorie_target);
  assert.ok(cut.daily_protein_target >= 170);
  assert.ok(stamina.daily_carbs_target > cut.daily_carbs_target);
});

test('computeDailyNutritionTotals sums only logs matching target date', () => {
  const logs: NutritionLog[] = [
    {
      id: 1,
      user_id: 1,
      meal_timing: 'Pre-Game Fuel',
      food_name: 'Oatmeal',
      calories: 320,
      protein_g: 10,
      carbs_g: 58,
      logged_at: '2026-11-18T08:30:00.000Z',
    },
    {
      id: 2,
      user_id: 1,
      meal_timing: 'Post-Game Recovery',
      food_name: 'Chicken & Rice',
      calories: 485,
      protein_g: 42,
      carbs_g: 62,
      logged_at: '2026-11-18T12:15:00.000Z',
    },
    {
      id: 3,
      user_id: 1,
      meal_timing: 'Daily Meals',
      food_name: 'Yesterday Eggs',
      calories: 215,
      protein_g: 19,
      carbs_g: 2,
      logged_at: '2026-11-17T10:00:00.000Z',
    },
  ];

  const totals = computeDailyNutritionTotals(logs, '2026-11-18');
  assert.equal(totals.calories, 805);
  assert.equal(totals.protein_g, 52);
  assert.equal(totals.carbs_g, 120);
  assert.equal(totals.count, 2);
});

test('computeDailySkillMinutes and computeWeeklyStreak track 7-day consistency', () => {
  const refToday = new Date('2026-11-18T12:00:00');
  const logs: TrainingLog[] = [
    {
      id: 1,
      user_id: 1,
      drill_id: 1,
      drill_title: 'Two-Ball Pound',
      category: 'Dribbling & Ball Handling',
      duration_mins: 20,
      notes: '',
      logged_at: '2026-11-18T09:00:00',
    },
    {
      id: 2,
      user_id: 1,
      drill_id: 2,
      drill_title: 'Mikan Left-Hand',
      category: 'Weak / Left-Hand Mastery',
      duration_mins: 15,
      notes: '',
      logged_at: '2026-11-17T16:00:00',
    },
    {
      id: 3,
      user_id: 1,
      drill_id: 3,
      drill_title: 'Form Shooting',
      category: 'Shooting & Mechanics',
      duration_mins: 25,
      notes: '',
      logged_at: '2026-11-16T16:00:00',
    },
  ];

  assert.equal(computeDailySkillMinutes(logs, '2026-11-18'), 20);
  const streak = computeWeeklyStreak(logs, refToday);
  assert.equal(streak.days.length, 7);
  assert.equal(streak.activeStreakCount, 3);
});
