import React from 'react';
import {
  FolderArchive,
  Clock,
  Users,
  CheckCircle2,
  HardDrive,
  LogOut,
  ShieldCheck,
  X,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { StorageMetrics } from '../types';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  metrics: StorageMetrics;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  metrics,
  mobileOpen,
  onCloseMobile,
}) => {
  const { userProfile, signOutUser, isDemoUser } = useAuth();

  const navItems = [
    { id: 'all', label: 'All Files', icon: FolderArchive, count: metrics.totalFiles },
    { id: 'recent', label: 'Recent Uploads', icon: Clock },
    { id: 'clients', label: 'Clients & Folders', icon: Users, count: metrics.clientCount },
    { id: 'approvals', label: 'Reviews & Approvals', icon: CheckCircle2 },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#090414] text-slate-200 flex flex-col border-r border-fuchsia-900/40 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="h-20 px-6 flex items-center justify-between border-b border-fuchsia-950/80 bg-[#070311]/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 via-fuchsia-500 to-pink-500 p-0.5 shadow-lg shadow-cyan-500/25">
              <div className="w-full h-full bg-[#090414] rounded-[10px] flex items-center justify-center text-cyan-300">
                <ShieldCheck className="w-6 h-6 stroke-[2.2] text-cyan-400 drop-shadow-[0_0_8px_rgba(0,240,255,0.7)]" />
              </div>
            </div>
            <div>
              <span className="font-cyber text-2xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-pink-400 flex items-center gap-1.5 uppercase">
                WelVault
              </span>
              <p className="text-[10px] font-semibold text-fuchsia-400 tracking-widest uppercase">
                CYBER CLIENT PORTAL
              </p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-900"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Demo banner indicator */}
        {isDemoUser && (
          <div className="mx-4 mt-3 px-3 py-1.5 rounded-lg bg-gradient-to-r from-fuchsia-950/60 to-purple-950/60 border border-fuchsia-500/30 text-fuchsia-300 text-xs flex items-center justify-between shadow-xs shadow-fuchsia-500/10">
            <span className="font-medium flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Demo Node Active
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-fuchsia-900/80 text-fuchsia-200 uppercase font-mono tracking-wider border border-fuchsia-400/30">
              Live
            </span>
          </div>
        )}

        {/* Navigation list */}
        <div className="flex-1 py-5 px-3 space-y-1 overflow-y-auto">
          <p className="px-3 pb-2 text-[10px] font-bold tracking-widest text-slate-500 uppercase font-mono">
            Navigation // Main
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-950/70 to-fuchsia-950/40 text-cyan-300 font-semibold border border-cyan-500/50 shadow-sm shadow-cyan-500/20'
                    : 'text-slate-300 hover:bg-fuchsia-950/20 hover:text-cyan-200 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-cyan-400 drop-shadow-[0_0_6px_rgba(0,240,255,0.6)]' : 'text-slate-400'
                    }`}
                  />
                  <span className={isActive ? 'font-cyber tracking-wide text-base' : ''}>{item.label}</span>
                </div>
                {item.count !== undefined && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Storage capacity indicator */}
        <div className="mx-4 my-2 p-3.5 rounded-xl bg-[#0f071f] border border-fuchsia-900/50 shadow-inner">
          <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5">
            <span className="flex items-center gap-1.5 font-medium text-cyan-300">
              <HardDrive className="w-3.5 h-3.5 text-cyan-400" /> Vault Storage
            </span>
            <span className="text-fuchsia-300 font-mono text-[11px] font-bold">{metrics.formattedBytes}</span>
          </div>
          <div className="w-full bg-[#1c0d38] rounded-full h-2 overflow-hidden border border-fuchsia-950">
            <div
              className="bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-pink-500 h-2 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(0,240,255,0.6)]"
              style={{ width: `${Math.max(5, metrics.percentageUsed)}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-2 flex justify-between font-mono">
            <span>{metrics.totalFiles} secured files</span>
            <span className="text-cyan-300 font-semibold">{metrics.percentageUsed}%</span>
          </p>
        </div>

        {/* User profile & Sign out */}
        <div className="p-4 border-t border-fuchsia-950/80 bg-[#070311]/90">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-500 to-fuchsia-500 p-0.5 shadow-md shadow-cyan-500/20">
              <div className="w-full h-full bg-[#090414] rounded-full flex items-center justify-center font-bold text-cyan-300 text-sm">
                {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'U'}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {userProfile?.displayName || 'User'}
              </p>
              <p className="text-xs text-slate-400 truncate">{userProfile?.email || 'Logged In'}</p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-fuchsia-950/80 text-fuchsia-300 border border-fuchsia-700/60 font-mono">
              {userProfile?.role || 'User'}
            </span>
          </div>

          <button
            onClick={() => signOutUser()}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-900/80 hover:bg-rose-950/50 border border-slate-800 hover:border-rose-500/50 transition-all shadow-xs"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
