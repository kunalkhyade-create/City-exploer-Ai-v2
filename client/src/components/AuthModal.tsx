import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  Compass,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Activity,
} from 'lucide-react';
import { api } from '../api/client';
import { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User, isNewRegistration?: boolean) => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'register') {
        const res = await api.register(email.trim(), password, name.trim() || undefined);
        onAuthSuccess(res.user, true);
        onClose();
      } else {
        const res = await api.login(email.trim(), password);
        onAuthSuccess(res.user, false);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-cyan-500/30 bg-gradient-to-b from-slate-900 via-[#0a1526] to-slate-950 p-6 sm:p-8 shadow-2xl shadow-cyan-950/50">
        {/* Subtle decorative glowing background */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-teal-500/15 blur-3xl" />

        {/* Cityscape Silhouette SVG Header Accent */}
        <div className="pointer-events-none absolute top-0 left-0 right-0 h-28 opacity-15 overflow-hidden">
          <svg
            viewBox="0 0 500 120"
            preserveAspectRatio="none"
            className="w-full h-full text-cyan-400 fill-current"
          >
            <path d="M0,120 L0,80 L20,80 L20,60 L35,60 L35,80 L55,80 L55,40 L70,40 L70,30 L85,30 L85,80 L100,80 L100,50 L120,50 L120,80 L150,80 L150,20 L165,20 L165,80 L190,80 L190,70 L210,70 L210,80 L240,80 L240,35 L260,35 L260,80 L280,80 L280,45 L300,45 L300,80 L330,80 L330,15 L350,15 L350,80 L370,80 L370,55 L390,55 L390,80 L420,80 L420,60 L440,60 L440,80 L470,80 L470,40 L490,40 L490,80 L500,80 L500,120 Z" />
          </svg>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full p-2 text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="relative text-center mb-6 pt-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 via-teal-500 to-cyan-400 shadow-lg shadow-cyan-500/25 mb-3">
            <Activity className="w-6 h-6 text-white stroke-[2.5]" />
          </div>
          <h2
            id="auth-modal-title"
            className="text-2xl font-black tracking-tight bg-gradient-to-r from-cyan-300 via-teal-200 to-white bg-clip-text text-transparent"
          >
            CITYPULSE AI
          </h2>
          <p className="text-xs font-medium text-cyan-400/90 tracking-wide mt-1">
            Explore Freely. Move Smartly. Stay Aware.
          </p>
        </div>

        {/* Tabs: Sign In / Register */}
        <div className="relative flex rounded-xl bg-slate-950/80 p-1 border border-slate-800 mb-5">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              mode === 'login'
                ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-md shadow-cyan-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              mode === 'register'
                ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-md shadow-cyan-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1" htmlFor="auth-name">
                Full Name (Optional)
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  id="auth-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Maya Deshmukh"
                  className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl pl-10 pr-3 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1" htmlFor="auth-email">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                id="auth-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl pl-10 pr-3 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-slate-300" htmlFor="auth-password">
                Password
              </label>
              {mode === 'login' && (
                <span className="text-[11px] text-cyan-400/80">
                  Min. 6 characters
                </span>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 transition"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 via-teal-500 to-cyan-400 hover:from-cyan-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-cyan-500/25 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-slate-950 border-t-transparent" />
            ) : (
              <>
                <span>{mode === 'login' ? 'Sign In to Urban Pulse' : 'Create My City Passport'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Footer info: anonymous sessions & security */}
        <div className="mt-5 pt-4 border-t border-slate-800 text-center space-y-2">
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-teal-400/90 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            <span>Secure scrypt crypto-hashing & scoped sessions</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Guest explorer? Your saved bookmarks & itineraries are automatically preserved without needing to log in.
          </p>
        </div>
      </div>
    </div>
  );
};
