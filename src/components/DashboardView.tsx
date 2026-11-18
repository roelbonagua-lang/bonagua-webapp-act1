import React from 'react';
import {
  Plus,
  Droplets,
  Check,
  Trash2,
  Flame,
  Clock,
  Utensils,
  Dumbbell,
} from 'lucide-react';
import type { NutritionLog, TrainingLog, User } from '../types.ts';
import { CircularProgressRing } from './CircularProgressRing.tsx';
import {
  calculateMacroTargets,
  computeDailyNutritionTotals,
  computeDailySkillMinutes,
  computeWeeklyStreak,
  getLocalDateKey,
} from '../utils/hoopLogic.ts';

interface DashboardViewProps {
  user: User;
  trainingLogs: TrainingLog[];
  nutritionLogs: NutritionLog[];
  hydrationGlasses: number;
  onUpdateHydration: (glasses: number) => void;
  onOpenLogDrill: () => void;
  onOpenLogMeal: () => void;
  onDeleteTrainingLog: (id: number) => void;
  onDeleteNutritionLog: (id: number) => void;
  onNavigateTab: (tab: 'skills' | 'nutrition' | 'coach') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  trainingLogs,
  nutritionLogs,
  hydrationGlasses,
  onUpdateHydration,
  onOpenLogDrill,
  onOpenLogMeal,
  onDeleteTrainingLog,
  onDeleteNutritionLog,
  onNavigateTab,
}) => {
  const todayKey = getLocalDateKey();
  const todaySkillMins = computeDailySkillMinutes(trainingLogs, todayKey);
  const nutritionTotals = computeDailyNutritionTotals(nutritionLogs, todayKey);
  const { daily_carbs_target } = calculateMacroTargets(user.weight_kg, user.height_cm, user.goal);
  const { days: streakDays, activeStreakCount } = computeWeeklyStreak(trainingLogs);

  const todaysTraining = trainingLogs.filter((l) => getLocalDateKey(l.logged_at) === todayKey);
  const todaysMeals = nutritionLogs.filter((l) => getLocalDateKey(l.logged_at) === todayKey);

  const proteinPct = Math.min(100, Math.round((nutritionTotals.protein_g / Math.max(1, user.daily_protein_target)) * 100));
  const carbsPct = Math.min(100, Math.round((nutritionTotals.carbs_g / Math.max(1, daily_carbs_target)) * 100));

  return (
    <div className="space-y-6">
      {/* Hero Banner with Basketball Seam Accents & Quick-Log Actions */}
      <section className="court-card seam-hero-accent p-6 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div>
          <p className="text-xs font-semibold text-[#EA580C]">
            {user.position} · {user.goal}
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#1C1917] tracking-tight mt-1 text-balance">
            Court &amp; Fuel Overview for {user.name}
          </h1>
          <p className="text-sm text-[#57534E] mt-1.5 max-w-2xl">
            Track daily skill work, stay hydrated, and hit your protein and carb targets before tip-off.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenLogDrill}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white text-sm font-semibold shadow-sm transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Log Basketball Drill</span>
          </button>
          <button
            type="button"
            onClick={onOpenLogMeal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1C1917] hover:bg-[#292524] text-white text-sm font-semibold shadow-xs transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Log Meal</span>
          </button>
        </div>
      </section>

      {/* 4 Core Metric Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* 1. Skill Training Ring */}
        <div className="court-card p-5 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-xs font-semibold text-[#78716C] uppercase tracking-wider">
              Skill Training
            </h2>
            <p className="font-mono-tabular text-2xl font-bold text-[#1C1917] mt-1.5">
              {todaySkillMins} <span className="text-sm font-normal text-[#78716C]">/ {user.daily_skill_mins_target} min</span>
            </p>
            <p className="text-xs text-[#57534E] mt-2">
              {todaySkillMins >= user.daily_skill_mins_target ? (
                <span className="text-[#15803D] font-semibold">Daily court goal reached</span>
              ) : (
                <span>{user.daily_skill_mins_target - todaySkillMins} mins remaining today</span>
              )}
            </p>
          </div>
          <CircularProgressRing
            value={todaySkillMins}
            max={user.daily_skill_mins_target}
            size={92}
            color={todaySkillMins >= user.daily_skill_mins_target ? '#15803D' : '#EA580C'}
            centerPrimary={`${Math.min(100, Math.round((todaySkillMins / Math.max(1, user.daily_skill_mins_target)) * 100))}%`}
            centerSecondary="court"
            ariaLabel={`Skill training progress: ${todaySkillMins} of ${user.daily_skill_mins_target} minutes`}
          />
        </div>

        {/* 2. Calorie & Macro Fuel Ring */}
        <div className="court-card p-5 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-xs font-semibold text-[#78716C] uppercase tracking-wider">
                Calorie &amp; Macro Fuel
              </h2>
              <p className="font-mono-tabular text-2xl font-bold text-[#1C1917] mt-1">
                {nutritionTotals.calories}{' '}
                <span className="text-sm font-normal text-[#78716C]">/ {user.daily_calorie_target}</span>
              </p>
            </div>
            <CircularProgressRing
              value={nutritionTotals.calories}
              max={user.daily_calorie_target}
              size={76}
              strokeWidth={8}
              color="#EA580C"
              centerPrimary={`${Math.round((nutritionTotals.calories / Math.max(1, user.daily_calorie_target)) * 100)}%`}
              centerSecondary="kcal"
              ariaLabel={`Calorie intake: ${nutritionTotals.calories} of ${user.daily_calorie_target} kcal`}
            />
          </div>

          {/* Protein & Carbs Progress Bars */}
          <div className="space-y-2 pt-1">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-[#44403C]">Protein</span>
                <span className="font-mono-tabular text-[#57534E]">
                  {nutritionTotals.protein_g}g / {user.daily_protein_target}g
                </span>
              </div>
              <div className="h-1.5 w-full bg-[#F5F0EB] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#15803D] rounded-full transition-all duration-300"
                  style={{ width: `${proteinPct}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-[#44403C]">Carbs</span>
                <span className="font-mono-tabular text-[#57534E]">
                  {nutritionTotals.carbs_g}g / {daily_carbs_target}g
                </span>
              </div>
              <div className="h-1.5 w-full bg-[#F5F0EB] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#EA580C] rounded-full transition-all duration-300"
                  style={{ width: `${carbsPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. Interactive 8-Glass Hydration Tracker */}
        <div className="court-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-semibold text-[#78716C] uppercase tracking-wider">
                Hydration Tracker
              </h2>
              <p className="font-mono-tabular text-2xl font-bold text-[#1C1917] mt-1">
                {hydrationGlasses} <span className="text-sm font-normal text-[#78716C]">/ 8 glasses</span>
              </p>
            </div>
            <Droplets className="w-5 h-5 text-[#EA580C]" />
          </div>

          <div className="grid grid-cols-4 gap-2 mt-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((glassNum) => {
              const filled = glassNum <= hydrationGlasses;
              return (
                <button
                  key={glassNum}
                  type="button"
                  onClick={() =>
                    onUpdateHydration(glassNum === hydrationGlasses ? glassNum - 1 : glassNum)
                  }
                  aria-label={`Set hydration to ${glassNum} glasses`}
                  aria-pressed={filled}
                  className={`h-9 rounded-lg border text-xs font-mono-tabular font-semibold transition-all flex items-center justify-center ${
                    filled
                      ? 'bg-[#FFF7ED] border-[#EA580C] text-[#C2410C] shadow-xs'
                      : 'bg-[#FAF8F5] border-[#E7E5E4] text-[#78716C] hover:border-[#D6D3D1]'
                  }`}
                >
                  {glassNum}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Weekly Consistency Streak */}
        <div className="court-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-semibold text-[#78716C] uppercase tracking-wider">
                Court Consistency
              </h2>
              <p className="font-mono-tabular text-2xl font-bold text-[#1C1917] mt-1">
                {activeStreakCount} <span className="text-sm font-normal text-[#78716C]">day streak</span>
              </p>
            </div>
            <Flame className="w-5 h-5 text-[#EA580C]" />
          </div>

          <div className="grid grid-cols-7 gap-1.5 mt-4">
            {streakDays.map((day) => (
              <div key={day.date} className="flex flex-col items-center gap-1.5">
                <div
                  title={`${day.date}: ${day.minutes} mins`}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center border text-xs transition-colors ${
                    day.completed
                      ? 'bg-[#15803D] border-[#15803D] text-white'
                      : 'bg-[#FAF8F5] border-[#E7E5E4] text-[#A8A29E]'
                  }`}
                >
                  {day.completed ? <Check className="w-4 h-4" /> : '–'}
                </div>
                <span className="text-[11px] font-medium text-[#57534E]">{day.label.slice(0, 2)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Today's Activity Lists */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Skill Sessions */}
        <div className="court-card p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <Dumbbell className="w-4 h-4 text-[#EA580C]" />
              <h2 className="font-display text-lg font-bold text-[#1C1917]">
                Today&apos;s Skill Workouts
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('skills')}
              className="text-xs font-semibold text-[#EA580C] hover:text-[#C2410C] whitespace-nowrap"
            >
              Browse Drills
            </button>
          </div>

          {todaysTraining.length === 0 ? (
            <div className="py-8 px-4 text-center rounded-xl bg-[#FAF8F5] border border-dashed border-[#E7E5E4]">
              <p className="text-sm font-medium text-[#44403C]">No drills logged today yet.</p>
              <p className="text-xs text-[#78716C] mt-1">
                Hit the court or choose a drill from the Skill Hub to start your daily ring.
              </p>
              <button
                type="button"
                onClick={onOpenLogDrill}
                className="mt-3 px-4 py-2 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-semibold"
              >
                Log First Drill
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-[#E7E5E4]">
              {todaysTraining.map((log) => (
                <li key={log.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#1C1917] truncate">{log.drill_title}</p>
                    <p className="text-xs text-[#78716C] mt-0.5">
                      {log.category} · <span className="font-mono-tabular font-semibold text-[#EA580C]">{log.duration_mins} mins</span>
                    </p>
                    {log.notes && <p className="text-xs text-[#57534E] mt-1">{log.notes}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteTrainingLog(log.id)}
                    className="p-1.5 rounded-lg text-[#78716C] hover:text-[#B91C1C] hover:bg-[#FEF2F2] shrink-0"
                    aria-label={`Delete training log ${log.drill_title}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Today's Fuel & Meals */}
        <div className="court-card p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <Utensils className="w-4 h-4 text-[#EA580C]" />
              <h2 className="font-display text-lg font-bold text-[#1C1917]">
                Today&apos;s Athlete Fuel
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('nutrition')}
              className="text-xs font-semibold text-[#EA580C] hover:text-[#C2410C] whitespace-nowrap"
            >
              Open Macro Planner
            </button>
          </div>

          {todaysMeals.length === 0 ? (
            <div className="py-8 px-4 text-center rounded-xl bg-[#FAF8F5] border border-dashed border-[#E7E5E4]">
              <p className="text-sm font-medium text-[#44403C]">No meals logged today yet.</p>
              <p className="text-xs text-[#78716C] mt-1">
                Log your pre-game carbs or post-game recovery protein to track daily macros.
              </p>
              <button
                type="button"
                onClick={onOpenLogMeal}
                className="mt-3 px-4 py-2 rounded-xl bg-[#1C1917] hover:bg-[#292524] text-white text-xs font-semibold"
              >
                Log First Meal
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-[#E7E5E4]">
              {todaysMeals.map((meal) => (
                <li key={meal.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#1C1917] truncate">{meal.food_name}</p>
                    <p className="text-xs text-[#78716C] mt-0.5 font-mono-tabular">
                      {meal.meal_timing} · <span className="font-semibold text-[#1C1917]">{meal.calories} kcal</span> · {meal.protein_g}g P · {meal.carbs_g}g C
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteNutritionLog(meal.id)}
                    className="p-1.5 rounded-lg text-[#78716C] hover:text-[#B91C1C] hover:bg-[#FEF2F2] shrink-0"
                    aria-label={`Delete meal log ${meal.food_name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Quick Coach Callout */}
      <section className="court-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#FFF7ED] border-[#FED7AA]">
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-[#EA580C] shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-[#1C1917]">Need a tailored practice &amp; meal game plan?</h3>
            <p className="text-xs text-[#57534E] mt-0.5">
              Ask the AI WelHoop Coach to critique your weekly SQLite logs or generate a custom drill session.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onNavigateTab('coach')}
          className="px-4 py-2 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-semibold whitespace-nowrap shrink-0"
        >
          Launch AI Coach
        </button>
      </section>
    </div>
  );
};
