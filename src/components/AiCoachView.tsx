import React, { useState } from 'react';
import {
  Bot,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import type { AiCritiqueResponse, AiRoutineResponse } from '../types.ts';
import { api } from '../services/api.ts';

export const AiCoachView: React.FC = () => {
  const [focusSkill, setFocusSkill] = useState('Left Hand + Stamina');
  const [availableMins, setAvailableMins] = useState('45');
  const [equipment, setEquipment] = useState('1 basketball, outdoor hoop, 2 cones');

  const [generatingRoutine, setGeneratingRoutine] = useState(false);
  const [routine, setRoutine] = useState<AiRoutineResponse | null>(null);
  const [routineError, setRoutineError] = useState<string | null>(null);

  const [generatingCritique, setGeneratingCritique] = useState(false);
  const [critique, setCritique] = useState<AiCritiqueResponse | null>(null);
  const [critiqueError, setCritiqueError] = useState<string | null>(null);

  const handleGenerateRoutine = async (e: React.FormEvent) => {
    e.preventDefault();
    setRoutineError(null);
    setGeneratingRoutine(true);
    try {
      const data = await api.generateRoutine({
        focusSkill,
        availableMins: Number(availableMins) || 45,
        equipment,
      });
      setRoutine(data);
    } catch (err: unknown) {
      setRoutineError(err instanceof Error ? err.message : 'Could not reach AI Coach.');
    } finally {
      setGeneratingRoutine(false);
    }
  };

  const handleGenerateCritique = async () => {
    setCritiqueError(null);
    setGeneratingCritique(true);
    try {
      const data = await api.generateCritique();
      setCritique(data);
    } catch (err: unknown) {
      setCritiqueError(err instanceof Error ? err.message : 'Could not analyze weekly logs.');
    } finally {
      setGeneratingCritique(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="court-card p-6 seam-hero-accent">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EA580C] text-white flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-extrabold text-[#1C1917] tracking-tight">
              AI WelHoop Coach
            </h1>
            <p className="text-sm text-[#57534E]">
              Server-side Gemini coaching tailored to your athlete profile, equipment, and SQLite training history.
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* 1. Custom Practice & Meal Generator */}
        <section className="court-card p-6 space-y-5">
          <div>
            <h2 className="font-display text-lg font-bold text-[#1C1917]">
              Custom Practice &amp; Meal Generator
            </h2>
            <p className="text-xs text-[#78716C] mt-0.5">
              Choose your focus skill, session length, and gear to generate a complete game plan.
            </p>
          </div>

          <form onSubmit={handleGenerateRoutine} className="space-y-4">
            <div>
              <label htmlFor="coach-focus" className="block text-xs font-semibold text-[#44403C] mb-1.5">
                Focus Skill Combination
              </label>
              <select
                id="coach-focus"
                value={focusSkill}
                onChange={(e) => setFocusSkill(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E5E4] bg-white text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/25 focus:border-[#EA580C]"
              >
                <option value="Left Hand + Stamina">Left Hand + Stamina</option>
                <option value="Dribbling & Ball Handling + Shooting Mechanics">Dribbling &amp; Ball Handling + Shooting Mechanics</option>
                <option value="Vertical Jump & Explosiveness + Recovery">Vertical Jump &amp; Explosiveness + Recovery</option>
                <option value="Catch-and-Shoot + Defensive Closeouts">Catch-and-Shoot + Defensive Closeouts</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="coach-mins" className="block text-xs font-semibold text-[#44403C] mb-1.5">
                  Available Time (Minutes)
                </label>
                <input
                  id="coach-mins"
                  type="number"
                  min={15}
                  max={120}
                  value={availableMins}
                  onChange={(e) => setAvailableMins(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E5E4] bg-white text-sm font-mono-tabular text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/25 focus:border-[#EA580C]"
                />
              </div>
              <div>
                <label htmlFor="coach-equipment" className="block text-xs font-semibold text-[#44403C] mb-1.5">
                  Available Equipment
                </label>
                <input
                  id="coach-equipment"
                  type="text"
                  value={equipment}
                  onChange={(e) => setEquipment(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E5E4] bg-white text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/25 focus:border-[#EA580C]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={generatingRoutine}
              className="w-full py-2.5 px-4 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white text-sm font-semibold shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {generatingRoutine ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>{generatingRoutine ? 'Generating Practice & Fuel Plan...' : 'Generate Practice & Meal Plan'}</span>
            </button>
          </form>

          {routineError && (
            <div role="alert" className="p-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{routineError}</span>
            </div>
          )}

          {routine && (
            <div className="pt-4 border-t border-[#E7E5E4] space-y-4">
              <div>
                <h3 className="font-display text-base font-bold text-[#1C1917]">{routine.routineTitle}</h3>
                <p className="text-xs text-[#57534E] mt-1">
                  <strong className="text-[#1C1917]">Warm-up:</strong> {routine.warmup}
                </p>
              </div>

              <div className="space-y-2.5">
                {routine.drills?.map((d, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E7E5E4]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-[#1C1917]">{d.name}</span>
                      <span className="font-mono-tabular text-xs font-semibold text-[#EA580C] whitespace-nowrap">
                        {d.durationMins} mins · {d.setsReps}
                      </span>
                    </div>
                    <p className="text-xs text-[#44403C] mt-1">{d.coachingCue}</p>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-[#FFF7ED] border border-[#FED7AA] space-y-1.5 text-xs">
                <p className="font-bold text-[#C2410C]">Recommended Game Fuel</p>
                <p className="text-[#44403C]">
                  <strong>Pre-Game:</strong> {routine.mealPlan?.preGame}
                </p>
                <p className="text-[#44403C]">
                  <strong>Post-Game:</strong> {routine.mealPlan?.postGame}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA] space-y-1.5">
                <p className="text-xs font-bold text-[#B91C1C] flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" /> Mistakes to Avoid
                </p>
                <ul className="text-xs text-[#7F1D1D] space-y-1">
                  {routine.mistakesToAvoid?.map((m, idx) => (
                    <li key={idx}>· {m}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </section>

        {/* 2. Weekly Progress Critique */}
        <section className="court-card p-6 space-y-5">
          <div>
            <h2 className="font-display text-lg font-bold text-[#1C1917]">
              Weekly Progress Critique
            </h2>
            <p className="text-xs text-[#78716C] mt-0.5">
              Analyzes your actual logged drills and meals from the SQLite database for personalized coaching feedback.
            </p>
          </div>

          <button
            type="button"
            onClick={handleGenerateCritique}
            disabled={generatingCritique}
            className="w-full py-2.5 px-4 rounded-xl bg-[#1C1917] hover:bg-[#292524] text-white text-sm font-semibold shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {generatingCritique ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ClipboardList className="w-4 h-4" />
            )}
            <span>{generatingCritique ? 'Analyzing Database Logs...' : 'Run Weekly Progress Critique'}</span>
          </button>

          {critiqueError && (
            <div role="alert" className="p-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{critiqueError}</span>
            </div>
          )}

          {critique && (
            <div className="pt-4 border-t border-[#E7E5E4] space-y-4">
              <h3 className="font-display text-base font-bold text-[#1C1917]">{critique.headline}</h3>
              <div className="space-y-2 text-xs text-[#44403C] leading-relaxed">
                <p>
                  <strong className="text-[#1C1917]">Training Balance:</strong> {critique.trainingSummary}
                </p>
                <p>
                  <strong className="text-[#1C1917]">Nutrition &amp; Hydration:</strong> {critique.nutritionSummary}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0]">
                <p className="text-xs font-bold text-[#15803D] flex items-center gap-1.5 mb-1.5">
                  <CheckCircle2 className="w-4 h-4" /> What You&apos;re Doing Well
                </p>
                <ul className="text-xs text-[#14532D] space-y-1">
                  {critique.strengths?.map((s, idx) => (
                    <li key={idx}>· {s}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-[#FFF7ED] border border-[#FED7AA]">
                <p className="text-xs font-bold text-[#C2410C] mb-1.5">Priority Adjustments This Week</p>
                <ul className="text-xs text-[#7C2D12] space-y-1">
                  {critique.priorityAdjustments?.map((p, idx) => (
                    <li key={idx}>· {p}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA]">
                <p className="text-xs font-bold text-[#B91C1C] flex items-center gap-1.5 mb-1.5">
                  <AlertTriangle className="w-4 h-4" /> Habits &amp; Mistakes to Avoid
                </p>
                <ul className="text-xs text-[#7F1D1D] space-y-1">
                  {critique.mistakesToAvoid?.map((m, idx) => (
                    <li key={idx}>· {m}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
