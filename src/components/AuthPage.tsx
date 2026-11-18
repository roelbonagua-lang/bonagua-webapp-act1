import React, { useState } from 'react';
import {
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User as UserIcon,
  Activity,
  Flame,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { WelHoopLogo } from './WelHoopLogo.tsx';

export const AuthPage: React.FC = () => {
  const { login, register, loginDemo } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [position, setPosition] = useState('Point Guard');
  const [heightCm, setHeightCm] = useState('180');
  const [weightKg, setWeightKg] = useState('76');
  const [goal, setGoal] = useState('Game-Day Stamina');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both your email address and password.');
      return;
    }
    if (mode === 'register' && !name.trim()) {
      setErrorMsg('Please enter your athlete name.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email.trim(), password);
      } else {
        await register({
          name: name.trim(),
          email: email.trim(),
          password,
          position,
          height_cm: Number(heightCm) || 180,
          weight_kg: Number(weightKg) || 76,
          goal,
        });
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    setErrorMsg(null);
    setSubmitting(true);
    try {
      await loginDemo();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not load demo athlete.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1C1917] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Brand & Value Proposition Panel */}
        <div className="lg:col-span-5 bg-[#1C1917] text-white rounded-2xl p-8 flex flex-col justify-between relative overflow-hidden shadow-xl">
          {/* Subtle basketball seam accent lines */}
          <svg
            className="absolute -right-20 -bottom-20 w-80 h-80 text-[#EA580C]/15 pointer-events-none"
            viewBox="0 0 200 200"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="100" cy="100" r="88" stroke="currentColor" strokeWidth="3" />
            <path d="M12 100H188" stroke="currentColor" strokeWidth="3" />
            <path d="M100 12V188" stroke="currentColor" strokeWidth="3" />
            <path d="M36 36C72 68 72 132 36 164" stroke="currentColor" strokeWidth="3" />
            <path d="M164 36C128 68 128 132 164 164" stroke="currentColor" strokeWidth="3" />
          </svg>

          <div className="relative z-10">
            <WelHoopLogo size="lg" darkSurface />
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-white mt-8 leading-tight text-balance">
              Train Smarter. Fuel Every Quarter.
            </h1>
            <p className="text-sm text-[#D6D3D1] mt-3 leading-relaxed">
              Your all-in-one basketball skill development logbook, injury-prevention guide, and athlete macro fuel tracker.
            </p>
          </div>

          <div className="relative z-10 mt-10 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#292524] border border-white/10 flex items-center justify-center shrink-0 text-[#EA580C]">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">5 Skill Mastery Tracks</p>
                <p className="text-xs text-[#A8A29E]">Handles, weak-hand finishing, mechanics, vertical, and conditioning.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#292524] border border-white/10 flex items-center justify-center shrink-0 text-[#EA580C]">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Do&apos;s &amp; Don&apos;ts Injury Guard</p>
                <p className="text-xs text-[#A8A29E]">Clear red-flag warnings inside every drill and pre-game meal.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#292524] border border-white/10 flex items-center justify-center shrink-0 text-[#EA580C]">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Gemini AI Coach &amp; Macro Tracker</p>
                <p className="text-xs text-[#A8A29E]">Real SQLite history powers custom routines and weekly critiques.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Auth Card */}
        <div className="lg:col-span-7 court-card p-6 sm:p-10 flex flex-col justify-center">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="font-display text-2xl font-bold text-[#1C1917]">
                {mode === 'login' ? 'Athlete Sign In' : 'Create Athlete Profile'}
              </h2>
              <p className="text-xs text-[#78716C] mt-1">
                {mode === 'login'
                  ? 'Access your saved court sessions, macros, and hydration history.'
                  : 'Set your court specs to auto-calculate daily calorie and protein targets.'}
              </p>
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="flex p-1 bg-[#F5F0EB] rounded-xl mb-6 border border-[#E7E5E4]">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                mode === 'login'
                  ? 'bg-white text-[#1C1917] shadow-xs'
                  : 'text-[#57534E] hover:text-[#1C1917]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                mode === 'register'
                  ? 'bg-white text-[#1C1917] shadow-xs'
                  : 'text-[#57534E] hover:text-[#1C1917]'
              }`}
            >
              Create Account
            </button>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] text-xs flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="auth-name" className="block text-xs font-semibold text-[#44403C] mb-1.5">
                      Athlete Name
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-[#78716C] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="auth-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Marcus Reyes"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E7E5E4] bg-white text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/25 focus:border-[#EA580C]"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="auth-position" className="block text-xs font-semibold text-[#44403C] mb-1.5">
                      Court Position
                    </label>
                    <select
                      id="auth-position"
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
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="auth-height" className="block text-xs font-semibold text-[#44403C] mb-1.5">
                      Height (cm)
                    </label>
                    <input
                      id="auth-height"
                      type="number"
                      min={130}
                      max={235}
                      value={heightCm}
                      onChange={(e) => setHeightCm(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E5E4] bg-white text-sm font-mono-tabular text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/25 focus:border-[#EA580C]"
                    />
                  </div>
                  <div>
                    <label htmlFor="auth-weight" className="block text-xs font-semibold text-[#44403C] mb-1.5">
                      Weight (kg)
                    </label>
                    <input
                      id="auth-weight"
                      type="number"
                      min={40}
                      max={180}
                      value={weightKg}
                      onChange={(e) => setWeightKg(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E5E4] bg-white text-sm font-mono-tabular text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/25 focus:border-[#EA580C]"
                    />
                  </div>
                  <div>
                    <label htmlFor="auth-goal" className="block text-xs font-semibold text-[#44403C] mb-1.5">
                      Primary Goal
                    </label>
                    <select
                      id="auth-goal"
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#E7E5E4] bg-white text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/25 focus:border-[#EA580C]"
                    >
                      <option value="Game-Day Stamina">Game-Day Stamina</option>
                      <option value="Lean Muscle / Bulk">Lean Muscle / Bulk</option>
                      <option value="Cut Fat for Vertical & Speed">Cut Fat for Vertical &amp; Speed</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <div>
              <label htmlFor="auth-email" className="block text-xs font-semibold text-[#44403C] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#78716C] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="athlete@welhoop.app"
                  autoComplete="email"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E7E5E4] bg-white text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/25 focus:border-[#EA580C]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="auth-password" className="block text-xs font-semibold text-[#44403C] mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#78716C] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#E7E5E4] bg-white text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/25 focus:border-[#EA580C]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#78716C] hover:text-[#1C1917] p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white text-sm font-semibold shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <span>{mode === 'login' ? 'Sign In' : 'Create Athlete Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#E7E5E4]">
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={submitting}
              className="w-full py-2.5 px-4 rounded-xl bg-[#FFF7ED] hover:bg-[#FFEDD5] text-[#C2410C] border border-[#FED7AA] text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <span>Demo Athlete Login (Marcus Reyes · PG)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
