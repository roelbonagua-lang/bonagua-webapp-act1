import React from 'react';
import { Files, HardDrive, Users, Clock3 } from 'lucide-react';
import { StorageMetrics, VaultFile } from '../types';

interface StorageStatsProps {
  metrics: StorageMetrics;
  files: VaultFile[];
  onFilterStatus?: (status: string) => void;
}

export const StorageStats: React.FC<StorageStatsProps> = ({ metrics, files }) => {
  const inReviewCount = files.filter((f) => f.status === 'in_review').length;
  const approvedCount = files.filter((f) => f.status === 'approved').length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Files */}
      <div className="cyber-card rounded-2xl p-4.5 relative overflow-hidden group hover:border-cyan-400/40 transition-all">
        <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest font-mono">
            Total Vault Assets
          </span>
          <div className="w-8 h-8 rounded-xl bg-cyan-950/80 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shadow-xs shadow-cyan-500/20">
            <Files className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-cyber text-3xl font-bold text-cyan-300 tracking-wider drop-shadow-[0_0_8px_rgba(0,240,255,0.4)]">
            {metrics.totalFiles}
          </span>
          <span className="text-xs text-slate-400 font-mono">managed files</span>
        </div>
      </div>

      {/* Storage Used */}
      <div className="cyber-card-fuchsia rounded-2xl p-4.5 relative overflow-hidden group hover:border-fuchsia-400/40 transition-all">
        <div className="absolute top-0 right-0 w-24 h-24 bg-fuchsia-500/5 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest font-mono">
            Storage Matrix
          </span>
          <div className="w-8 h-8 rounded-xl bg-fuchsia-950/80 text-fuchsia-400 border border-fuchsia-500/30 flex items-center justify-center shadow-xs shadow-fuchsia-500/20">
            <HardDrive className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-cyber text-3xl font-bold text-fuchsia-300 tracking-wider drop-shadow-[0_0_8px_rgba(236,72,153,0.4)]">
            {metrics.formattedBytes}
          </span>
          <span className="text-xs text-slate-400 font-mono">/ 50 MB spark node</span>
        </div>
      </div>

      {/* Active Clients */}
      <div className="cyber-card rounded-2xl p-4.5 relative overflow-hidden group hover:border-cyan-400/40 transition-all">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest font-mono">
            Client Sectors
          </span>
          <div className="w-8 h-8 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-xs shadow-emerald-500/20">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-cyber text-3xl font-bold text-emerald-300 tracking-wider drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]">
            {metrics.clientCount}
          </span>
          <span className="text-xs text-slate-400 font-mono">unique folders</span>
        </div>
      </div>

      {/* Pending Reviews */}
      <div className="cyber-card-fuchsia rounded-2xl p-4.5 relative overflow-hidden group hover:border-amber-400/40 transition-all">
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest font-mono">
            Review Status
          </span>
          <div className="w-8 h-8 rounded-xl bg-amber-950/80 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-xs shadow-amber-500/20">
            <Clock3 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-cyber text-3xl font-bold text-amber-300 tracking-wider drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]">
            {inReviewCount}
          </span>
          <span className="text-xs text-slate-400 font-mono">
            {approvedCount > 0 ? `(${approvedCount} approved)` : 'awaiting audit'}
          </span>
        </div>
      </div>
    </div>
  );
};
