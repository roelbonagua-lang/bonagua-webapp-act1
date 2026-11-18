import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Repeat,
  Loader2,
} from 'lucide-react';
import type { Drill, DrillCategory } from '../types.ts';

interface SkillHubViewProps {
  drills: Drill[];
  loading: boolean;
  onCompleteDrill: (drill: Drill) => Promise<void>;
}

const CATEGORIES: ('All' | DrillCategory)[] = [
  'All',
  'Dribbling & Ball Handling',
  'Weak / Left-Hand Mastery',
  'Shooting & Mechanics',
  'Vertical Jump & Explosiveness',
  'Stamina & Court Conditioning',
];

export const SkillHubView: React.FC<SkillHubViewProps> = ({
  drills,
  loading,
  onCompleteDrill,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'All' | DrillCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loggingId, setLoggingId] = useState<number | null>(null);

  const filteredDrills = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return drills.filter((d) => {
      if (selectedCategory !== 'All' && d.category !== selectedCategory) return false;
      if (q) {
        return (
          d.title.toLowerCase().includes(q) ||
          d.instructions.toLowerCase().includes(q) ||
          d.donts_warning.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [drills, selectedCategory, searchQuery]);

  const handleLog = async (drill: Drill) => {
    setLoggingId(drill.id);
    try {
      await onCompleteDrill(drill);
    } finally {
      setLoggingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <section className="court-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-[#1C1917] tracking-tight">
            Basketball Skill &amp; Conditioning Hub
          </h1>
          <p className="text-sm text-[#57534E] mt-1">
            Structured court drills paired with strict injury-prevention and mechanics Don&apos;ts.
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-[#78716C] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search drills or warnings..."
            aria-label="Search drills"
            className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-[#E7E5E4] bg-[#FAF8F5] text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/25 focus:border-[#EA580C]"
          />
        </div>
      </section>

      {/* Interactive Category Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Skill categories">
        {CATEGORIES.map((cat) => {
          const active = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 ${
                active
                  ? 'bg-[#EA580C] text-white border-[#EA580C] shadow-xs'
                  : 'bg-white text-[#44403C] border-[#E7E5E4] hover:bg-[#FFF7ED] hover:border-[#FED7AA]'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Drills Grid */}
      {loading ? (
        <div className="court-card p-12 text-center">
          <Loader2 className="w-7 h-7 animate-spin text-[#EA580C] mx-auto mb-3" />
          <p className="text-sm text-[#57534E]">Loading skill drills from database...</p>
        </div>
      ) : filteredDrills.length === 0 ? (
        <div className="court-card p-12 text-center">
          <p className="text-base font-semibold text-[#1C1917]">No matching drills found</p>
          <p className="text-sm text-[#78716C] mt-1">Try clearing your search or selecting &ldquo;All&rdquo;.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredDrills.map((drill) => (
            <article
              key={drill.id}
              className="court-card court-card-interactive p-6 flex flex-col justify-between gap-5"
            >
              <div className="space-y-4">
                {/* Clean unboxed metadata row + Difficulty indicator */}
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-[#EA580C]">{drill.category}</span>
                  <span
                    className={`font-semibold ${
                      drill.difficulty === 'Pro'
                        ? 'text-[#B91C1C]'
                        : drill.difficulty === 'Intermediate'
                        ? 'text-[#D97706]'
                        : 'text-[#15803D]'
                    }`}
                  >
                    {drill.difficulty} Level
                  </span>
                </div>

                <div>
                  <h2 className="font-display text-xl font-bold text-[#1C1917] leading-snug">
                    {drill.title}
                  </h2>
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-[#57534E] font-mono-tabular">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#78716C]" />
                      {drill.duration_mins} mins
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Repeat className="w-3.5 h-3.5 text-[#78716C]" />
                      {drill.sets_reps}
                    </span>
                  </div>
                </div>

                {/* Step-by-step instructions */}
                <p className="text-sm text-[#44403C] leading-relaxed">{drill.instructions}</p>

                {/* Distinct "What NOT to Do" Alert Box */}
                <div className="p-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#7F1D1D]">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#B91C1C] uppercase tracking-wider mb-1">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>What NOT to Do (Mistakes &amp; Injury Prevention)</span>
                  </div>
                  <p className="text-xs leading-relaxed text-[#991B1B]">{drill.donts_warning}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-[#E7E5E4] flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => handleLog(drill)}
                  disabled={loggingId === drill.id}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white text-sm font-semibold shadow-xs transition-colors disabled:opacity-60"
                >
                  {loggingId === drill.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>{loggingId === drill.id ? 'Logging...' : 'Complete & Log Drill'}</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
