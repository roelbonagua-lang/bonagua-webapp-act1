import React, { useEffect, useState } from 'react';
import { Database, Save, Loader2, RefreshCw } from 'lucide-react';
import type { AthleteGoal, SchemaTableInfo, User } from '../types.ts';
import { api } from '../services/api.ts';

interface SettingsViewProps {
  user: User;
  onSaveProfile: (payload: Partial<User>) => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ user, onSaveProfile }) => {
  const [name, setName] = useState(user.name);
  const [position, setPosition] = useState(user.position);
  const [heightCm, setHeightCm] = useState(String(user.height_cm));
  const [weightKg, setWeightKg] = useState(String(user.weight_kg));
  const [goal, setGoal] = useState<AthleteGoal>(user.goal);
  const [skillTarget, setSkillTarget] = useState(String(user.daily_skill_mins_target));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(user.name);
    setPosition(user.position);
    setHeightCm(String(user.height_cm));
    setWeightKg(String(user.weight_kg));
    setGoal(user.goal);
    setSkillTarget(String(user.daily_skill_mins_target));
  }, [user]);

  const [schemaData, setSchemaData] = useState<{
    engine: string;
    databaseFile: string;
    tables: SchemaTableInfo[];
  } | null>(null);
  const [loadingSchema, setLoadingSchema] = useState(true);
  const [schemaError, setSchemaError] = useState<string | null>(null);

  const loadSchema = async () => {
    setLoadingSchema(true);
    setSchemaError(null);
    try {
      const res = await api.getSchema();
      setSchemaData(res);
    } catch (err: unknown) {
      setSchemaError(err instanceof Error ? err.message : 'Could not load database schema.');
    } finally {
      setLoadingSchema(false);
    }
  };

  useEffect(() => {
    loadSchema();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSaveProfile({
        name: name.trim(),
        position,
        height_cm: Number(heightCm) || user.height_cm,
        weight_kg: Number(weightKg) || user.weight_kg,
        goal,
        daily_skill_mins_target: Number(skillTarget) || 60,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="court-card p-6">
        <h1 className="font-display text-2xl font-extrabold text-[#1C1917] tracking-tight">
          Athlete Settings &amp; Database Inspector
        </h1>
        <p className="text-sm text-[#57534E] mt-1">
          Configure your basketball profile targets and inspect the live SQLite schema.
        </p>
      </section>

      {/* Profile Editor */}
      <section className="court-card p-6">
        <h2 className="font-display text-lg font-bold text-[#1C1917] mb-4">
          Athlete Profile &amp; Daily Targets
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label htmlFor="set-name" className="block text-xs font-semibold text-[#44403C] mb-1.5">
              Athlete Name
            </label>
            <input
              id="set-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E5E4] bg-white text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/25 focus:border-[#EA580C]"
            />
          </div>

          <div>
            <label htmlFor="set-position" className="block text-xs font-semibold text-[#44403C] mb-1.5">
              Court Position
            </label>
            <select
              id="set-position"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E5E4] bg-white text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/25 focus:border-[#EA580C]"
            >
              <option value="Point Guard">Point Guard</option>
              <option value="Shooting Guard">Shooting Guard</option>
              <option value="Small Forward">Small Forward</option>
              <option value="Power Forward">Power Forward</option>
              <option value="Center">Center</option>
            </select>
          </div>

          <div>
            <label htmlFor="set-goal" className="block text-xs font-semibold text-[#44403C] mb-1.5">
              Athlete Goal
            </label>
            <select
              id="set-goal"
              value={goal}
              onChange={(e) => setGoal(e.target.value as AthleteGoal)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E5E4] bg-white text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/25 focus:border-[#EA580C]"
            >
              <option value="Game-Day Stamina">Game-Day Stamina</option>
              <option value="Lean Muscle / Bulk">Lean Muscle / Bulk</option>
              <option value="Cut Fat for Vertical & Speed">Cut Fat for Vertical &amp; Speed</option>
            </select>
          </div>

          <div>
            <label htmlFor="set-height" className="block text-xs font-semibold text-[#44403C] mb-1.5">
              Height (cm)
            </label>
            <input
              id="set-height"
              type="number"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E5E4] bg-white text-sm font-mono-tabular text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/25 focus:border-[#EA580C]"
            />
          </div>

          <div>
            <label htmlFor="set-weight" className="block text-xs font-semibold text-[#44403C] mb-1.5">
              Weight (kg)
            </label>
            <input
              id="set-weight"
              type="number"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E5E4] bg-white text-sm font-mono-tabular text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/25 focus:border-[#EA580C]"
            />
          </div>

          <div>
            <label htmlFor="set-mins" className="block text-xs font-semibold text-[#44403C] mb-1.5">
              Daily Skill Training Target (mins)
            </label>
            <input
              id="set-mins"
              type="number"
              min={10}
              max={240}
              value={skillTarget}
              onChange={(e) => setSkillTarget(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E5E4] bg-white text-sm font-mono-tabular text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/25 focus:border-[#EA580C]"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <p className="text-xs text-[#78716C] font-mono-tabular">
              Active Targets: {user.daily_calorie_target} kcal · {user.daily_protein_target}g protein · {user.daily_skill_mins_target} mins/day
            </p>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white text-sm font-semibold shadow-xs disabled:opacity-60 shrink-0"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saving ? 'Saving...' : 'Save Athlete Profile'}</span>
            </button>
          </div>
        </form>
      </section>

      {/* Live SQLite Database Schema Viewer */}
      <section className="court-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-[#EA580C]" />
            <div>
              <h2 className="font-display text-lg font-bold text-[#1C1917]">
                Database Schema Viewer
              </h2>
              {schemaData && (
                <p className="text-xs text-[#78716C] font-mono-tabular">
                  {schemaData.engine} · {schemaData.databaseFile} · {schemaData.tables.length} relational tables
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={loadSchema}
            disabled={loadingSchema}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E7E5E4] bg-[#FAF8F5] hover:bg-white text-xs font-semibold text-[#44403C]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingSchema ? 'animate-spin' : ''}`} />
            <span>Refresh Schema</span>
          </button>
        </div>

        {schemaError && (
          <p className="text-xs text-[#B91C1C] font-medium">{schemaError}</p>
        )}

        {loadingSchema ? (
          <div className="py-10 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#EA580C] mx-auto" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {schemaData?.tables.map((table) => (
              <div
                key={table.name}
                className="rounded-xl border border-[#E7E5E4] bg-[#FAF8F5] p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-mono-tabular text-sm font-bold text-[#1C1917]">{table.name}</h3>
                  <span className="font-mono-tabular text-xs font-semibold text-[#EA580C]">
                    {table.rowCount} rows
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono-tabular">
                    <thead>
                      <tr className="border-b border-[#E7E5E4] text-[#78716C]">
                        <th className="py-1.5 pr-3">Column</th>
                        <th className="py-1.5 px-3">Type</th>
                        <th className="py-1.5 pl-3 text-right">Constraint</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E7E5E4]/60">
                      {table.columns.map((col) => (
                        <tr key={col.cid}>
                          <td className="py-1.5 pr-3 font-semibold text-[#1C1917]">{col.name}</td>
                          <td className="py-1.5 px-3 text-[#57534E]">{col.type || 'TEXT'}</td>
                          <td className="py-1.5 pl-3 text-right text-[#78716C]">
                            {col.pk ? 'PRIMARY KEY' : col.notnull ? 'NOT NULL' : 'NULLABLE'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
