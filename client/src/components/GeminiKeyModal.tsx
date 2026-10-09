import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Zap,
} from 'lucide-react';
import { api } from '../api/client';

interface GeminiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const GeminiKeyModal: React.FC<GeminiKeyModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gemini-2.0-flash');
  const [isConfigured, setIsConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      api.getGeminiStatus()
        .then(res => {
          setIsConfigured(res.isConfigured);
          if (res.model) setModel(res.model);
        })
        .catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!apiKey.trim()) {
      setError('Please paste your Google Gemini API key.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.saveGeminiKey(apiKey.trim(), model);
      setSuccessMessage(res.message || 'Gemini AI successfully activated!');
      setIsConfigured(true);
      setApiKey('');
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to verify API key with Google Gemini.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-cyan-500/40 bg-gradient-to-b from-slate-900 via-[#0a1526] to-slate-950 p-6 sm:p-7 shadow-2xl shadow-cyan-950/60">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-600 via-teal-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">
              Gemini AI Integration
            </h3>
            <p className="text-xs text-slate-400">
              Live AI-powered itinerary curation & constraint synthesis
            </p>
          </div>
        </div>

        {/* Current Status Pill */}
        <div className="mb-4 p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">Status:</span>
          {isConfigured ? (
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Active & Verified</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              <Zap className="w-3.5 h-3.5" />
              <span>Deterministic Local Mode</span>
            </span>
          )}
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 flex items-center gap-2 p-3 text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="gemini-key-input">
              Google Gemini API Key
            </label>
            <div className="relative">
              <Key className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                id="gemini-key-input"
                type="password"
                required
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-10 pr-3 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Keys are strictly validated on the backend and saved to your project .env. Never exposed to browser scripts.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Model Selection
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-cyan-400 focus:outline-none"
            >
              <option value="gemini-2.0-flash">gemini-2.0-flash (Recommended, Fast & Responsive)</option>
              <option value="gemini-1.5-flash">gemini-1.5-flash</option>
              <option value="gemini-1.5-pro">gemini-1.5-pro</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-2.5 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 via-teal-500 to-cyan-400 hover:from-cyan-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-cyan-500/25 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-slate-950 border-t-transparent" />
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Verify & Activate Gemini AI</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            <span>Encrypted local storage</span>
          </span>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noreferrer"
            className="text-cyan-400 hover:underline flex items-center gap-1"
          >
            <span>Get a free key</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
