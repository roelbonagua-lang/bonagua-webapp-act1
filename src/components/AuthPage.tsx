import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthPage: React.FC = () => {
  const {
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInWithDemo,
    authError,
    clearAuthError,
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'freelancer' | 'client'>('freelancer');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAuthError();
    setLocalError(null);

    if (!email || !password) {
      setLocalError('Please fill in both email and password.');
      return;
    }

    if (mode === 'signup' && !displayName.trim()) {
      setLocalError('Please enter your full name or studio name.');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password, displayName.trim(), role);
      }
    } catch {
      // Error handled by AuthContext state
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    clearAuthError();
    setLocalError(null);
    setSubmitting(true);
    try {
      await signInWithGoogle();
    } catch {
      // Error handled by AuthContext
    } finally {
      setSubmitting(false);
    }
  };

  const displayErrorMessage = localError || authError;

  return (
    <div className="min-h-screen cyber-grid flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top brand */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 via-fuchsia-500 to-pink-500 p-0.5 shadow-xl shadow-cyan-500/25 mb-4">
          <div className="w-full h-full bg-[#090414] rounded-[14px] flex items-center justify-center text-cyan-300">
            <ShieldCheck className="w-9 h-9 stroke-[2.2] text-cyan-400 drop-shadow-[0_0_10px_rgba(0,240,255,0.7)]" />
          </div>
        </div>
        <h1 className="font-cyber text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-pink-400 tracking-wider uppercase drop-shadow-[0_0_12px_rgba(0,240,255,0.3)]">
          WelVault
        </h1>
        <p className="mt-2 text-xs font-mono text-fuchsia-300 uppercase tracking-widest">
          CYBERPUNK CLIENT FILE PORTAL // ZERO-TRUST VAULT
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="cyber-card py-8 px-4 sm:rounded-2xl sm:px-10 border border-fuchsia-500/30 shadow-2xl shadow-cyan-950/40">
          {/* Sign In vs Create Account Toggle */}
          <div className="flex p-1 bg-[#120826] rounded-xl mb-6 border border-fuchsia-950">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                clearAuthError();
                setLocalError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider font-mono rounded-lg transition-all ${
                mode === 'signin'
                  ? 'bg-gradient-to-r from-cyan-950 to-fuchsia-950 text-cyan-300 border border-cyan-400/60 shadow-xs shadow-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                clearAuthError();
                setLocalError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider font-mono rounded-lg transition-all ${
                mode === 'signup'
                  ? 'bg-gradient-to-r from-cyan-950 to-fuchsia-950 text-cyan-300 border border-cyan-400/60 shadow-xs shadow-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Create an Account
            </button>
          </div>

          {/* Error Banner */}
          {displayErrorMessage && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-950/80 border border-rose-500/60 text-rose-300 text-xs flex items-start gap-2.5 font-mono">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div className="leading-relaxed">
                <span>{displayErrorMessage}</span>
                {authError?.includes('Firebase Console') && (
                  <p className="mt-1 font-bold text-cyan-300">
                    💡 Tip: Click "Explore with Demo Freelancer Account" below to enter immediately!
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-[10px] font-bold text-cyan-300 uppercase tracking-widest font-mono mb-1.5">
                    Full Name or Studio Handle
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400/70" />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Neo Cyber Studio"
                      required={mode === 'signup'}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-fuchsia-900/60 bg-[#140a2c] text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-400 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-cyan-300 uppercase tracking-widest font-mono mb-1.5">
                    I am registering as:
                  </label>
                  <div className="grid grid-cols-2 gap-2 font-mono">
                    <button
                      type="button"
                      onClick={() => setRole('freelancer')}
                      className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all ${
                        role === 'freelancer'
                          ? 'bg-gradient-to-r from-cyan-950 to-fuchsia-950 text-cyan-300 border-cyan-400 shadow-xs shadow-cyan-500/30'
                          : 'bg-[#120826] text-slate-400 border-fuchsia-950 hover:border-fuchsia-800'
                      }`}
                    >
                      Freelancer / Designer
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('client')}
                      className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all ${
                        role === 'client'
                          ? 'bg-gradient-to-r from-cyan-950 to-fuchsia-950 text-cyan-300 border-cyan-400 shadow-xs shadow-cyan-500/30'
                          : 'bg-[#120826] text-slate-400 border-fuchsia-950 hover:border-fuchsia-800'
                      }`}
                    >
                      Client
                    </button>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-[10px] font-bold text-cyan-300 uppercase tracking-widest font-mono mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400/70" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hacker@welvault.cyber"
                  required
                  autoComplete="email"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-fuchsia-900/60 bg-[#140a2c] text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-400 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-cyan-300 uppercase tracking-widest font-mono mb-1.5">
                Passcode (Password)
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400/70" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter security key (6+ chars)"
                  required
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-fuchsia-900/60 bg-[#140a2c] text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-400 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-300 p-0.5"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 rounded-xl text-base font-cyber font-bold tracking-wider uppercase text-slate-950 bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-pink-500 hover:from-cyan-300 hover:via-fuchsia-400 hover:to-pink-400 disabled:opacity-50 shadow-lg shadow-cyan-500/25 border border-cyan-300/40 transition-all flex items-center justify-center gap-2 mt-2"
            >
              <span>{mode === 'signin' ? 'Access WelVault Portal' : 'Create Cyber Account'}</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </form>

          {/* Social or quick options */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-fuchsia-950" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-[#0e071e] text-slate-500 uppercase tracking-widest font-mono text-[10px]">
                  Or instant access
                </span>
              </div>
            </div>

            <div className="mt-4 space-y-2.5">
              {/* Google Sign-in */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={submitting}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold font-mono text-slate-200 bg-[#140a28] hover:bg-[#1f0f3d] border border-fuchsia-900/60 shadow-xs flex items-center justify-center gap-2.5 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* 1-Click Demo Account */}
              <button
                type="button"
                onClick={() => signInWithDemo('freelancer')}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold font-mono text-cyan-300 bg-cyan-950/40 hover:bg-cyan-950/70 border border-cyan-500/40 flex items-center justify-center gap-2 transition-colors shadow-xs shadow-cyan-500/10"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Explore with Demo Freelancer Account</span>
              </button>
            </div>
          </div>
        </div>

        {/* Value propositions */}
        <div className="mt-8 grid grid-cols-3 gap-3 text-center">
          <div className="p-3 cyber-card rounded-xl border border-cyan-500/20">
            <ShieldCheck className="w-5 h-5 text-cyan-400 mx-auto mb-1.5" />
            <p className="text-xs font-bold text-slate-200 font-cyber text-sm">Isolated Vaults</p>
            <p className="text-[10px] text-slate-400 mt-0.5 font-mono">Strict per-user data protection</p>
          </div>
          <div className="p-3 cyber-card rounded-xl border border-fuchsia-500/20">
            <FileCheck className="w-5 h-5 text-fuchsia-400 mx-auto mb-1.5" />
            <p className="text-xs font-bold text-slate-200 font-cyber text-sm">Review Status</p>
            <p className="text-[10px] text-slate-400 mt-0.5 font-mono">Track approvals & feedback</p>
          </div>
          <div className="p-3 cyber-card rounded-xl border border-purple-500/20">
            <Lock className="w-5 h-5 text-purple-400 mx-auto mb-1.5" />
            <p className="text-xs font-bold text-slate-200 font-cyber text-sm">Direct Download</p>
            <p className="text-[10px] text-slate-400 mt-0.5 font-mono">Instant asset retrieval</p>
          </div>
        </div>
      </div>
    </div>
  );
};
