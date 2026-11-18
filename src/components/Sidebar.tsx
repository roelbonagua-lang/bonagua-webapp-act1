import React from 'react';
import {
  LayoutDashboard,
  Dumbbell,
  Utensils,
  Bot,
  Settings,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { WelHoopLogo } from './WelHoopLogo.tsx';

export type NavTab = 'dashboard' | 'skills' | 'nutrition' | 'coach' | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  mobileOpen,
  onCloseMobile,
}) => {
  const { user, logout } = useAuth();

  const navItems: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Athlete Dashboard', icon: LayoutDashboard },
    { id: 'skills', label: 'Skill & Drills Hub', icon: Dumbbell },
    { id: 'nutrition', label: 'Diet & Nutrition', icon: Utensils },
    { id: 'coach', label: 'AI WelHoop Coach', icon: Bot },
    { id: 'settings', label: 'Settings & DB Schema', icon: Settings },
  ];

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-[#1C1917]/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-68 bg-[#1C1917] text-[#F5F5F4] flex flex-col border-r border-[#292524] transition-transform duration-200 ease-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-18 px-5 flex items-center justify-between border-b border-[#292524]">
          <WelHoopLogo size="md" darkSurface />
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-2 rounded-lg text-[#A8A29E] hover:text-white hover:bg-[#292524]"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-5 px-3 space-y-1 overflow-y-auto" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onTabChange(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-[#EA580C] text-white font-semibold shadow-sm'
                    : 'text-[#D6D3D1] hover:bg-[#292524] hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#A8A29E]'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Active Athlete Summary */}
        {user && (
          <div className="mx-3 mb-3 p-3.5 rounded-xl bg-[#292524] border border-white/5">
            <p className="text-xs font-semibold text-white truncate">{user.name}</p>
            <p className="text-xs text-[#A8A29E] mt-0.5 truncate">
              {user.position} · {user.height_cm} cm · {user.weight_kg} kg
            </p>
            <div className="mt-2.5 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="text-[#A8A29E]">Daily Target</span>
              <span className="font-mono-tabular font-semibold text-[#FDBA74]">
                {user.daily_calorie_target} kcal
              </span>
            </div>
          </div>
        )}

        {/* Sign Out */}
        <div className="p-3 border-t border-[#292524]">
          <button
            type="button"
            onClick={() => logout()}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-[#D6D3D1] hover:text-white bg-[#292524] hover:bg-[#3F3A37] transition-colors whitespace-nowrap"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
