import React, { useEffect, useState } from 'react';
import {
  Calculator,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Loader2,
} from 'lucide-react';
import type { AthleteGoal, MealTiming, NutritionLog, User } from '../types.ts';
import {
  BUDGET_ATHLETE_FOODS,
  NUTRITION_GUIDELINES,
  calculateMacroTargets,
  computeDailyNutritionTotals,
  getLocalDateKey,
} from '../utils/hoopLogic.ts';

interface NutritionViewProps {
  user: User;
  nutritionLogs: NutritionLog[];
  onUpdateMacroProfile: (payload: { weight_kg: number; goal: AthleteGoal }) => Promise<void>;
  onAddMeal: (payload: {
    meal_timing: MealTiming;
    food_name: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
  }) => Promise<void>;
  onDeleteMeal: (id: number) => Promise<void>;
}

const TIMINGS: MealTiming[] = ['Pre-Game Fuel', 'Post-Game Recovery', 'Daily Meals'];
const GOALS: AthleteGoal[] = [
  'Lean Muscle / Bulk',
  'Cut Fat for Vertical & Speed',
  'Game-Day Stamina',
];

export const NutritionView: React.FC<NutritionViewProps> = ({
  user,
  nutritionLogs,
  onUpdateMacroProfile,
  onAddMeal,
  onDeleteMeal,
}) => {
  // Macro calculator state
  const [weightKg, setWeightKg] = useState(String(user.weight_kg));
  const [goal, setGoal] = useState<AthleteGoal>(user.goal);
  const [savingMacros, setSavingMacros] = useState(false);

  useEffect(() => {
    setWeightKg(String(user.weight_kg));
    setGoal(user.goal);
  }, [user.weight_kg, user.goal]);

  // Meal logger state
  const [activeTiming, setActiveTiming] = useState<MealTiming>('Pre-Game Fuel');
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [proteinG, setProteinG] = useState('');
  const [carbsG, setCarbsG] = useState('');
  const [addingMeal, setAddingMeal] = useState(false);
  const [quickAddingId, setQuickAddingId] = useState<string | null>(null);
  const [mealError, setMealError] = useState<string | null>(null);

  const previewTargets = calculateMacroTargets(Number(weightKg) || user.weight_kg, user.height_cm, goal);
  const todayKey = getLocalDateKey();
  const totals = computeDailyNutritionTotals(nutritionLogs, todayKey);
  const todaysMeals = nutritionLogs.filter((l) => getLocalDateKey(l.logged_at) === todayKey);

  const handleSaveMacros = async (e: React.FormEvent) => {
    e.preventDefault();
    const w = Number(weightKg);
    if (!Number.isFinite(w) || w < 40 || w > 180) return;
    setSavingMacros(true);
    try {
      await onUpdateMacroProfile({ weight_kg: w, goal });
    } finally {
      setSavingMacros(false);
    }
  };

  const handleQuickAddFood = async (foodId: string) => {
    const food = BUDGET_ATHLETE_FOODS.find((f) => f.id === foodId);
    if (!food) return;
    setQuickAddingId(foodId);
    try {
      await onAddMeal({
        meal_timing: activeTiming,
        food_name: food.name,
        calories: food.calories,
        protein_g: food.protein_g,
        carbs_g: food.carbs_g,
      });
    } finally {
      setQuickAddingId(null);
    }
  };

  const handleCustomMealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMealError(null);
    const cal = Number(calories);
    if (!foodName.trim()) {
      setMealError('Enter a food name.');
      return;
    }
    if (!Number.isFinite(cal) || cal <= 0) {
      setMealError('Enter valid calories (> 0).');
      return;
    }
    setAddingMeal(true);
    try {
      await onAddMeal({
        meal_timing: activeTiming,
        food_name: foodName.trim(),
        calories: Math.round(cal),
        protein_g: Math.max(0, Math.round(Number(proteinG) || 0)),
        carbs_g: Math.max(0, Math.round(Number(carbsG) || 0)),
      });
      setFoodName('');
      setCalories('');
      setProteinG('');
      setCarbsG('');
    } catch (err: unknown) {
      setMealError(err instanceof Error ? err.message : 'Failed to log meal.');
    } finally {
      setAddingMeal(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <section className="court-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-[#1C1917] tracking-tight">
            Athlete Diet &amp; Macro Fuel Tracker
          </h1>
          <p className="text-sm text-[#57534E] mt-1">
            Auto-calibrate daily calorie &amp; protein targets and log pre-game, recovery, and budget meals.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-6 font-mono-tabular text-sm">
          <div>
            <span className="block text-xs text-[#78716C] font-sans">Today&apos;s Intake</span>
            <span className="font-bold text-[#1C1917]">
              {totals.calories} / {user.daily_calorie_target} kcal
            </span>
          </div>
          <div>
            <span className="block text-xs text-[#78716C] font-sans">Protein</span>
            <span className="font-bold text-[#15803D]">
              {totals.protein_g}g / {user.daily_protein_target}g
            </span>
          </div>
          <div>
            <span className="block text-xs text-[#78716C] font-sans">Carbs</span>
            <span className="font-bold text-[#EA580C]">
              {totals.carbs_g}g / {previewTargets.daily_carbs_target}g
            </span>
          </div>
        </div>
      </section>

      {/* Top Grid: Dynamic Macro Calculator + Meal Logger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Dynamic Macro Calculator (5 cols) */}
        <section className="lg:col-span-5 court-card p-6">
          <div className="flex items-center gap-2.5 mb-4">
            <Calculator className="w-5 h-5 text-[#EA580C]" />
            <h2 className="font-display text-lg font-bold text-[#1C1917]">Dynamic Macro Calculator</h2>
          </div>

          <form onSubmit={handleSaveMacros} className="space-y-4">
            <div>
              <label htmlFor="calc-weight" className="block text-xs font-semibold text-[#44403C] mb-1.5">
                Current Body Weight (kg)
              </label>
              <input
                id="calc-weight"
                type="number"
                step="0.5"
                min={40}
                max={180}
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E5E4] bg-white text-sm font-mono-tabular text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/25 focus:border-[#EA580C]"
              />
            </div>

            <div>
              <label htmlFor="calc-goal" className="block text-xs font-semibold text-[#44403C] mb-1.5">
                Training &amp; Body Composition Goal
              </label>
              <select
                id="calc-goal"
                value={goal}
                onChange={(e) => setGoal(e.target.value as AthleteGoal)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E5E4] bg-white text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/25 focus:border-[#EA580C]"
              >
                {GOALS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            {/* Live Preview Strip */}
            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E7E5E4] grid grid-cols-3 gap-3 text-center">
              <div>
                <span className="block text-[11px] text-[#78716C]">Calories</span>
                <span className="font-mono-tabular text-base font-bold text-[#1C1917]">
                  {previewTargets.daily_calorie_target}
                </span>
              </div>
              <div>
                <span className="block text-[11px] text-[#78716C]">Protein</span>
                <span className="font-mono-tabular text-base font-bold text-[#15803D]">
                  {previewTargets.daily_protein_target}g
                </span>
              </div>
              <div>
                <span className="block text-[11px] text-[#78716C]">Carbs</span>
                <span className="font-mono-tabular text-base font-bold text-[#EA580C]">
                  {previewTargets.daily_carbs_target}g
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={savingMacros}
              className="w-full py-2.5 px-4 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white text-sm font-semibold shadow-xs transition-colors disabled:opacity-60"
            >
              {savingMacros ? 'Updating Targets...' : 'Update & Save Targets to Profile'}
            </button>
          </form>
        </section>

        {/* Meal Logger by Timing (7 cols) */}
        <section className="lg:col-span-7 court-card p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="font-display text-lg font-bold text-[#1C1917]">Meal Logger by Timing</h2>
            <div className="flex p-1 bg-[#F5F0EB] rounded-xl border border-[#E7E5E4]">
              {TIMINGS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setActiveTiming(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                    activeTiming === t
                      ? 'bg-[#EA580C] text-white shadow-xs'
                      : 'text-[#57534E] hover:text-[#1C1917]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Pre-loaded Budget Athlete Foods */}
          <div>
            <p className="text-xs font-semibold text-[#78716C] uppercase tracking-wider mb-2.5">
              Budget-Friendly Athlete Foods (1-Click Log into {activeTiming})
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {BUDGET_ATHLETE_FOODS.map((food) => (
                <div
                  key={food.id}
                  className="p-3 rounded-xl border border-[#E7E5E4] bg-[#FAF8F5] flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#1C1917] truncate">{food.name}</p>
                    <p className="text-[11px] text-[#57534E] font-mono-tabular mt-0.5">
                      {food.calories} kcal · {food.protein_g}g P · {food.carbs_g}g C
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleQuickAddFood(food.id)}
                    disabled={quickAddingId === food.id}
                    className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#FFF7ED] border border-[#E7E5E4] hover:border-[#EA580C] text-[#C2410C] text-xs font-semibold shrink-0 flex items-center gap-1 transition-colors"
                    aria-label={`Add ${food.name}`}
                  >
                    {quickAddingId === food.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                    <span>Add</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Meal Entry */}
          <form onSubmit={handleCustomMealSubmit} className="pt-4 border-t border-[#E7E5E4] space-y-3">
            <p className="text-xs font-semibold text-[#78716C] uppercase tracking-wider">
              Custom Food Entry ({activeTiming})
            </p>
            {mealError && <p className="text-xs text-[#B91C1C] font-medium">{mealError}</p>}
            <div className="space-y-2.5">
              <input
                type="text"
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
                placeholder="Food name (e.g., Grilled Tilapia & Rice)"
                aria-label="Custom food name"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E5E4] bg-white text-xs text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/25 focus:border-[#EA580C]"
              />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <input
                  type="number"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  placeholder="Calories (kcal)"
                  aria-label="Custom calories"
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E7E5E4] bg-white text-xs font-mono-tabular text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/25 focus:border-[#EA580C]"
                />
                <input
                  type="number"
                  value={proteinG}
                  onChange={(e) => setProteinG(e.target.value)}
                  placeholder="Protein (g)"
                  aria-label="Custom protein grams"
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E7E5E4] bg-white text-xs font-mono-tabular text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/25 focus:border-[#EA580C]"
                />
                <input
                  type="number"
                  value={carbsG}
                  onChange={(e) => setCarbsG(e.target.value)}
                  placeholder="Carbs (g)"
                  aria-label="Custom carbs grams"
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E7E5E4] bg-white text-xs font-mono-tabular text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/25 focus:border-[#EA580C]"
                />
                <button
                  type="submit"
                  disabled={addingMeal}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#1C1917] hover:bg-[#292524] text-white text-xs font-semibold transition-colors whitespace-nowrap"
                >
                  {addingMeal ? 'Adding...' : 'Log Food'}
                </button>
              </div>
            </div>
          </form>
        </section>
      </div>

      {/* Today's Logged Meals by Timing */}
      <section className="court-card p-6">
        <h2 className="font-display text-lg font-bold text-[#1C1917] mb-4">
          Today&apos;s Nutrition Log ({todaysMeals.length} entries)
        </h2>
        {todaysMeals.length === 0 ? (
          <p className="text-sm text-[#78716C]">No meals logged today yet. Use the quick-add foods above to start tracking.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#E7E5E4] text-xs font-semibold text-[#78716C] uppercase tracking-wider">
                  <th className="py-2.5 pr-4">Timing</th>
                  <th className="py-2.5 px-4">Food</th>
                  <th className="py-2.5 px-4 text-right">Calories</th>
                  <th className="py-2.5 px-4 text-right">Protein</th>
                  <th className="py-2.5 px-4 text-right">Carbs</th>
                  <th className="py-2.5 pl-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E5E4]">
                {todaysMeals.map((meal) => (
                  <tr key={meal.id} className="hover:bg-[#FAF8F5]">
                    <td className="py-3 pr-4 text-xs font-semibold text-[#EA580C] whitespace-nowrap">{meal.meal_timing}</td>
                    <td className="py-3 px-4 font-medium text-[#1C1917]">{meal.food_name}</td>
                    <td className="py-3 px-4 text-right font-mono-tabular">{meal.calories} kcal</td>
                    <td className="py-3 px-4 text-right font-mono-tabular text-[#15803D] font-semibold">{meal.protein_g}g</td>
                    <td className="py-3 px-4 text-right font-mono-tabular">{meal.carbs_g}g</td>
                    <td className="py-3 pl-4 text-right">
                      <button
                        type="button"
                        onClick={() => onDeleteMeal(meal.id)}
                        className="p-1.5 rounded-lg text-[#78716C] hover:text-[#B91C1C] hover:bg-[#FEF2F2]"
                        aria-label={`Remove ${meal.food_name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Nutrition Do's & Don'ts Panel */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="court-card p-6 bg-[#F0FDF4] border-[#BBF7D0]">
          <div className="flex items-center gap-2 text-sm font-bold text-[#15803D] mb-3">
            <CheckCircle2 className="w-4 h-4" />
            <span>Hooper Nutrition Do&apos;s</span>
          </div>
          <ul className="space-y-2.5 text-xs text-[#14532D] leading-relaxed">
            {NUTRITION_GUIDELINES.dos.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="font-bold mt-0.5">·</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="court-card p-6 bg-[#FEF2F2] border-[#FECACA]">
          <div className="flex items-center gap-2 text-sm font-bold text-[#B91C1C] mb-3">
            <AlertTriangle className="w-4 h-4" />
            <span>What NOT to Do (Court Fueling Mistakes)</span>
          </div>
          <ul className="space-y-2.5 text-xs text-[#7F1D1D] leading-relaxed">
            {NUTRITION_GUIDELINES.donts.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="font-bold mt-0.5">·</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
};
