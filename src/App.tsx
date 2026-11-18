/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Menu,
  Plus,
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { AuthPage } from './components/AuthPage.tsx';
import { Sidebar, type NavTab } from './components/Sidebar.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { SkillHubView } from './components/SkillHubView.tsx';
import { NutritionView } from './components/NutritionView.tsx';
import { AiCoachView } from './components/AiCoachView.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import { LogDrillModal, LogMealModal } from './components/QuickLogModals.tsx';
import { WelHoopLogo } from './components/WelHoopLogo.tsx';
import { api } from './services/api.ts';
import type {
  AthleteGoal,
  Drill,
  MealTiming,
  NutritionLog,
  TrainingLog,
  User,
} from './types.ts';
import { getLocalDateKey } from './utils/hoopLogic.ts';

const WelHoopWorkspace: React.FC = () => {
  const { user, updateProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);

  const [drills, setDrills] = useState<Drill[]>([]);
  const [loadingDrills, setLoadingDrills] = useState(true);
  const [trainingLogs, setTrainingLogs] = useState<TrainingLog[]>([]);
  const [nutritionLogs, setNutritionLogs] = useState<NutritionLog[]>([]);
  const [hydrationGlasses, setHydrationGlasses] = useState<number>(0);
  const [loadingWorkspace, setLoadingWorkspace] = useState(true);

  const [drillModalOpen, setDrillModalOpen] = useState(false);
  const [mealModalOpen, setMealModalOpen] = useState(false);

  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    window.setTimeout(() => {
      setToast((prev) => (prev?.text === text ? null : prev));
    }, 3600);
  }, []);

  const loadWorkspaceData = useCallback(async () => {
    if (!user) return;
    setLoadingWorkspace(true);
    setLoadingDrills(true);
    try {
      const todayKey = getLocalDateKey();
      const [fetchedDrills, fetchedTraining, fetchedNutrition, fetchedHydration] = await Promise.all([
        api.getDrills(),
        api.getTrainingLogs(),
        api.getNutritionLogs(),
        api.getHydration(todayKey),
      ]);
      setDrills(fetchedDrills);
      setTrainingLogs(fetchedTraining);
      setNutritionLogs(fetchedNutrition);
      setHydrationGlasses(fetchedHydration.glasses_count);
    } catch (err: unknown) {
      showToast(
        err instanceof Error ? err.message : 'Failed to load athlete data.',
        'error'
      );
    } finally {
      setLoadingDrills(false);
      setLoadingWorkspace(false);
    }
  }, [user, showToast]);

  useEffect(() => {
    loadWorkspaceData();
  }, [loadWorkspaceData]);

  if (!user) return null;

  const handleUpdateHydration = async (glasses: number) => {
    const clamped = Math.max(0, Math.min(8, glasses));
    const prev = hydrationGlasses;
    setHydrationGlasses(clamped);
    try {
      const todayKey = getLocalDateKey();
      const updated = await api.setHydration(clamped, todayKey);
      setHydrationGlasses(updated.glasses_count);
    } catch (err: unknown) {
      setHydrationGlasses(prev);
      showToast(err instanceof Error ? err.message : 'Could not update hydration.', 'error');
    }
  };

  const handleLogDrill = async (payload: {
    drill_id?: number | null;
    drill_title: string;
    category: string;
    duration_mins: number;
    notes: string;
  }) => {
    const created = await api.createTrainingLog(payload);
    setTrainingLogs((prev) => [created, ...prev]);
    showToast(`Logged "${created.drill_title}" (${created.duration_mins} mins).`);
  };

  const handleCompleteDrill = async (drill: Drill) => {
    try {
      const created = await api.createTrainingLog({
        drill_id: drill.id,
        drill_title: drill.title,
        category: drill.category,
        duration_mins: drill.duration_mins,
        notes: `Completed ${drill.sets_reps}`,
      });
      setTrainingLogs((prev) => [created, ...prev]);
      showToast(`Logged "${drill.title}" (+${drill.duration_mins} mins).`);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Could not log drill.', 'error');
    }
  };

  const handleDeleteTrainingLog = async (id: number) => {
    try {
      await api.deleteTrainingLog(id);
      setTrainingLogs((prev) => prev.filter((item) => item.id !== id));
      showToast('Workout log removed.');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to remove workout log.', 'error');
    }
  };

  const handleAddMeal = async (payload: {
    meal_timing: MealTiming;
    food_name: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
  }) => {
    const created = await api.createNutritionLog(payload);
    setNutritionLogs((prev) => [created, ...prev]);
    showToast(`Logged "${created.food_name}" (${created.calories} kcal).`);
  };

  const handleDeleteNutritionLog = async (id: number) => {
    try {
      await api.deleteNutritionLog(id);
      setNutritionLogs((prev) => prev.filter((item) => item.id !== id));
      showToast('Meal entry removed.');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to remove meal entry.', 'error');
    }
  };

  const handleUpdateMacroProfile = async (payload: { weight_kg: number; goal: AthleteGoal }) => {
    try {
      await updateProfile(payload);
      showToast('Daily calorie and protein targets recalculated.');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to update targets.', 'error');
    }
  };

  const handleSaveProfile = async (payload: Partial<User>) => {
    try {
      await updateProfile(payload);
      showToast('Athlete profile & daily targets saved.');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to save profile.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1C1917] flex">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="flex-1 lg:pl-68 flex flex-col min-w-0 min-h-screen">
        {/* Top Mobile & Quick-Action Bar */}
        <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-xs border-b border-[#E7E5E4] px-4 sm:px-6 flex items-center justify-between gap-3 lg:hidden">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="p-2 rounded-xl border border-[#E7E5E4] text-[#44403C] hover:bg-[#FAF8F5]"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <WelHoopLogo size="sm" />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDrillModalOpen(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-semibold whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Drill</span>
            </button>
            <button
              type="button"
              onClick={() => setMealModalOpen(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#1C1917] hover:bg-[#292524] text-white text-xs font-semibold whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Meal</span>
            </button>
          </div>
        </header>

        {/* Main Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {loadingWorkspace ? (
            <div className="court-card p-16 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#EA580C] mx-auto mb-3" />
              <p className="text-sm font-medium text-[#57534E]">
                Loading athlete metrics and court logs...
              </p>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardView
                  user={user}
                  trainingLogs={trainingLogs}
                  nutritionLogs={nutritionLogs}
                  hydrationGlasses={hydrationGlasses}
                  onUpdateHydration={handleUpdateHydration}
                  onOpenLogDrill={() => setDrillModalOpen(true)}
                  onOpenLogMeal={() => setMealModalOpen(true)}
                  onDeleteTrainingLog={handleDeleteTrainingLog}
                  onDeleteNutritionLog={handleDeleteNutritionLog}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                />
              )}

              {activeTab === 'skills' && (
                <SkillHubView
                  drills={drills}
                  loading={loadingDrills}
                  onCompleteDrill={handleCompleteDrill}
                />
              )}

              {activeTab === 'nutrition' && (
                <NutritionView
                  user={user}
                  nutritionLogs={nutritionLogs}
                  onUpdateMacroProfile={handleUpdateMacroProfile}
                  onAddMeal={handleAddMeal}
                  onDeleteMeal={handleDeleteNutritionLog}
                />
              )}

              {activeTab === 'coach' && <AiCoachView />}

              {activeTab === 'settings' && (
                <SettingsView user={user} onSaveProfile={handleSaveProfile} />
              )}
            </>
          )}
        </main>
      </div>

      {/* Quick-Log Modals */}
      <LogDrillModal
        isOpen={drillModalOpen}
        onClose={() => setDrillModalOpen(false)}
        drills={drills}
        onSubmit={handleLogDrill}
      />

      <LogMealModal
        isOpen={mealModalOpen}
        onClose={() => setMealModalOpen(false)}
        onSubmit={handleAddMeal}
      />

      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg border flex items-center gap-2.5 text-xs font-semibold ${
            toast.type === 'success'
              ? 'bg-[#1C1917] text-white border-[#292524]'
              : 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-[#EA580C] shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-[#B91C1C] shrink-0" />
          )}
          <span>{toast.text}</span>
        </div>
      )}
    </div>
  );
};

const RootApp: React.FC = () => {
  const { user, loading, loginDemo } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1' && !user && !loading) {
      loginDemo().catch(() => {
        // user stays on AuthPage if demo login fails
      });
    }
  }, [user, loading, loginDemo]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-6">
        <WelHoopLogo size="lg" />
        <p className="mt-4 text-xs font-medium text-[#57534E] flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-[#EA580C]" />
          Loading WelHoop athlete hub...
        </p>
      </div>
    );
  }

  return user ? <WelHoopWorkspace /> : <AuthPage />;
};

export default function App() {
  return (
    <AuthProvider>
      <RootApp />
    </AuthProvider>
  );
}
