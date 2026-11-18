import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import type { Drill, DrillCategory, MealTiming } from '../types.ts';
import { BUDGET_ATHLETE_FOODS } from '../utils/hoopLogic.ts';

interface LogDrillModalProps {
  isOpen: boolean;
  onClose: () => void;
  drills: Drill[];
  onSubmit: (payload: {
    drill_id?: number | null;
    drill_title: string;
    category: string;
    duration_mins: number;
    notes: string;
  }) => Promise<void>;
}

const CATEGORIES: DrillCategory[] = [
  'Dribbling & Ball Handling',
  'Weak / Left-Hand Mastery',
  'Shooting & Mechanics',
  'Vertical Jump & Explosiveness',
  'Stamina & Court Conditioning',
];

export const LogDrillModal: React.FC<LogDrillModalProps> = ({
  isOpen,
  onClose,
  drills,
  onSubmit,
}) => {
  const [selectedDrillId, setSelectedDrillId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [durationMins, setDurationMins] = useState('20');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectPreset = (idStr: string) => {
    setSelectedDrillId(idStr);
    const found = drills.find((d) => String(d.id) === idStr);
    if (found) {
      setTitle(found.title);
      setCategory(found.category);
      setDurationMins(String(found.duration_mins));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const mins = Number(durationMins);
    if (!title.trim()) {
      setError('Please enter a drill name or pick one from the library.');
      return;
    }
    if (!Number.isFinite(mins) || mins <= 0) {
      setError('Duration must be greater than 0 minutes.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        drill_id: selectedDrillId ? Number(selectedDrillId) : null,
        drill_title: title.trim(),
        category,
        duration_mins: Math.round(mins),
        notes: notes.trim(),
      });
      setTitle('');
      setNotes('');
      setSelectedDrillId('');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to log workout.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C1917]/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="log-drill-modal-title"
    >
      <div className="bg-white rounded-2xl border border-[#E7E5E4] shadow-2xl max-w-lg w-full overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E7E5E4] flex items-center justify-between bg-[#FAF8F5]">
          <h2 id="log-drill-modal-title" className="font-display text-lg font-bold text-[#1C1917]">
            Log Basketball Drill
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#78716C] hover:text-[#1C1917] hover:bg-[#E7E5E4]/50"
            aria-label="Close drill modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="preset-drill" className="block text-xs font-semibold text-[#44403C] mb-1.5">
              Quick-Select From Drill Library (Optional)
            </label>
            <select
              id="preset-drill"
              value={selectedDrillId}
              onChange={(e) => handleSelectPreset(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E5E4] bg-white text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/25 focus:border-[#EA580C]"
            >
              <option value="">Custom workout entry...</option>
              {drills.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.category} — {d.title} ({d.duration_mins}m)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="drill-title-input" className="block text-xs font-semibold text-[#44403C] mb-1.5">
              Drill Title
            </label>
            <input
              id="drill-title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., 100 Left-Hand Mikan Finishes"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E5E4] bg-white text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/25 focus:border-[#EA580C]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="drill-category-select" className="block text-xs font-semibold text-[#44403C] mb-1.5">
                Skill Category
              </label>
              <select
                id="drill-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E5E4] bg-white text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/25 focus:border-[#EA580C]"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="drill-duration-input" className="block text-xs font-semibold text-[#44403C] mb-1.5">
                Duration (Minutes)
              </label>
              <input
                id="drill-duration-input"
                type="number"
                min={1}
                max={300}
                value={durationMins}
                onChange={(e) => setDurationMins(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E5E4] bg-white text-sm font-mono-tabular text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/25 focus:border-[#EA580C]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="drill-notes-input" className="block text-xs font-semibold text-[#44403C] mb-1.5">
              Session Notes (Optional)
            </label>
            <textarea
              id="drill-notes-input"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Made 42/50 free throws, kept off-hand tucked cleanly."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E5E4] bg-white text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/25 focus:border-[#EA580C]"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#E7E5E4]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-[#57534E] hover:bg-[#F5F0EB]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white text-sm font-semibold shadow-xs disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Workout Log'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface LogMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    meal_timing: MealTiming;
    food_name: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
  }) => Promise<void>;
}

const TIMINGS: MealTiming[] = ['Pre-Game Fuel', 'Post-Game Recovery', 'Daily Meals'];

export const LogMealModal: React.FC<LogMealModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [mealTiming, setMealTiming] = useState<MealTiming>('Pre-Game Fuel');
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [proteinG, setProteinG] = useState('');
  const [carbsG, setCarbsG] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const applyPreset = (id: string) => {
    const found = BUDGET_ATHLETE_FOODS.find((f) => f.id === id);
    if (found) {
      setMealTiming(found.defaultTiming);
      setFoodName(found.name);
      setCalories(String(found.calories));
      setProteinG(String(found.protein_g));
      setCarbsG(String(found.carbs_g));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cal = Number(calories);
    if (!foodName.trim()) {
      setError('Please enter a food name or choose a quick athlete food.');
      return;
    }
    if (!Number.isFinite(cal) || cal <= 0) {
      setError('Please enter valid calories (> 0).');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        meal_timing: mealTiming,
        food_name: foodName.trim(),
        calories: Math.round(cal),
        protein_g: Math.max(0, Math.round(Number(proteinG) || 0)),
        carbs_g: Math.max(0, Math.round(Number(carbsG) || 0)),
      });
      setFoodName('');
      setCalories('');
      setProteinG('');
      setCarbsG('');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to log meal.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C1917]/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="log-meal-modal-title"
    >
      <div className="bg-white rounded-2xl border border-[#E7E5E4] shadow-2xl max-w-lg w-full overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E7E5E4] flex items-center justify-between bg-[#FAF8F5]">
          <h2 id="log-meal-modal-title" className="font-display text-lg font-bold text-[#1C1917]">
            Log Athlete Meal
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#78716C] hover:text-[#1C1917] hover:bg-[#E7E5E4]/50"
            aria-label="Close meal modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="preset-food" className="block text-xs font-semibold text-[#44403C] mb-1.5">
              Budget Athlete Foods Quick-Fill
            </label>
            <select
              id="preset-food"
              defaultValue=""
              onChange={(e) => applyPreset(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E5E4] bg-white text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/25 focus:border-[#EA580C]"
            >
              <option value="">Custom meal entry...</option>
              {BUDGET_ATHLETE_FOODS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.calories} kcal · {f.protein_g}g P)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#44403C] mb-1.5">Meal Timing</label>
            <div className="grid grid-cols-3 gap-2">
              {TIMINGS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setMealTiming(t)}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-colors whitespace-nowrap ${
                    mealTiming === t
                      ? 'bg-[#FFF7ED] text-[#C2410C] border-[#EA580C]'
                      : 'bg-white text-[#57534E] border-[#E7E5E4] hover:bg-[#FAF8F5]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="food-name-input" className="block text-xs font-semibold text-[#44403C] mb-1.5">
              Food / Meal Name
            </label>
            <input
              id="food-name-input"
              type="text"
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
              placeholder="e.g., Chicken Breast & Steamed Rice"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E5E4] bg-white text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/25 focus:border-[#EA580C]"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="meal-calories" className="block text-xs font-semibold text-[#44403C] mb-1.5">
                Calories (kcal)
              </label>
              <input
                id="meal-calories"
                type="number"
                min={1}
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder="450"
                className="w-full px-3 py-2.5 rounded-xl border border-[#E7E5E4] bg-white text-sm font-mono-tabular text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/25 focus:border-[#EA580C]"
              />
            </div>
            <div>
              <label htmlFor="meal-protein" className="block text-xs font-semibold text-[#44403C] mb-1.5">
                Protein (g)
              </label>
              <input
                id="meal-protein"
                type="number"
                min={0}
                value={proteinG}
                onChange={(e) => setProteinG(e.target.value)}
                placeholder="38"
                className="w-full px-3 py-2.5 rounded-xl border border-[#E7E5E4] bg-white text-sm font-mono-tabular text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/25 focus:border-[#EA580C]"
              />
            </div>
            <div>
              <label htmlFor="meal-carbs" className="block text-xs font-semibold text-[#44403C] mb-1.5">
                Carbs (g)
              </label>
              <input
                id="meal-carbs"
                type="number"
                min={0}
                value={carbsG}
                onChange={(e) => setCarbsG(e.target.value)}
                placeholder="55"
                className="w-full px-3 py-2.5 rounded-xl border border-[#E7E5E4] bg-white text-sm font-mono-tabular text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/25 focus:border-[#EA580C]"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#E7E5E4]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-[#57534E] hover:bg-[#F5F0EB]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white text-sm font-semibold shadow-xs disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Meal Log'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
