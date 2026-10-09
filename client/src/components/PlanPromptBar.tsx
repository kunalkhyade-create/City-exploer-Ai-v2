import React, { useState } from 'react';
import { Sparkles, SlidersHorizontal, ArrowRight, Zap, Navigation, Clock, IndianRupee, Accessibility } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { GeneratedPlan } from '../types';

interface PlanPromptBarProps {
  onGeneratePlan: (prompt: string, customConstraints?: Partial<GeneratedPlan['constraintsUsed']>) => void;
  isLoading: boolean;
  aiSource: 'gemini' | 'local';
  cityName?: string;
}

export const PlanPromptBar: React.FC<PlanPromptBarProps> = ({
  onGeneratePlan,
  isLoading,
  aiSource,
  cityName = 'Pune',
}) => {
  const { t } = useTranslation();
  const [promptText, setPromptText] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Manual fine-tune constraints
  const [budget, setBudget] = useState(600);
  const [hours, setHours] = useState(4);
  const [interests, setInterests] = useState<string[]>(['heritage', 'street food']);
  const [travelMode, setTravelMode] = useState<'foot-walking' | 'cycling-regular' | 'driving-car'>('foot-walking');
  const [pace, setPace] = useState<'relaxed' | 'moderate' | 'packed'>('moderate');
  const [stepFree, setStepFree] = useState(false);
  const [startLocation, setStartLocation] = useState('Central Downtown');

  const handleQuickPrompt = (text: string) => {
    setPromptText(text);
    onGeneratePlan(text);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const effectivePrompt = promptText.trim() || `Explore best of ${cityName}`;

    if (showFilters) {
      onGeneratePlan(effectivePrompt, {
        budget_inr: budget,
        hours,
        interests,
        travel_mode: travelMode,
        pace,
        accessibility: stepFree ? ['step_free'] : [],
        start_location: startLocation,
      });
    } else {
      onGeneratePlan(effectivePrompt);
    }
  };

  const toggleInterest = (cat: string) => {
    setInterests(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  return (
    <div className="w-full glass-panel-elevated rounded-2xl p-4 sm:p-5 border border-slate-700/60 shadow-2xl">
      {/* Engine Status Badge */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Intelligent {cityName} Engine
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          {aiSource === 'gemini' ? (
            <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full flex items-center gap-1 text-[11px] font-medium">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              {t('prompt.ai_live')}
            </span>
          ) : (
            <span className="bg-amber-500/15 border border-amber-500/30 text-amber-400 px-2 py-0.5 rounded-full flex items-center gap-1 text-[11px] font-medium">
              <Zap className="w-3 h-3 text-amber-400" />
              {t('prompt.ai_local')}
            </span>
          )}
        </div>
      </div>

      {/* Main Natural Language Search Bar */}
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <input
          type="text"
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          placeholder={`Explore ${cityName} by the hour... e.g. "Afternoon heritage walk under ₹400"`}
          className="w-full bg-slate-900/90 text-slate-100 text-sm sm:text-base pl-4 pr-28 sm:pr-32 py-3.5 rounded-xl border border-slate-700 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none placeholder:text-slate-500 shadow-inner"
        />
        <div className="absolute right-1.5 flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg border transition ${
              showFilters
                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle fine-tuning filters"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-semibold text-xs sm:text-sm shadow-md transition disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <span className="inline-block animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <>
                <span className="hidden sm:inline">{t('prompt.btn_generate')}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Quick Prompt Suggestions */}
      <div className="flex flex-wrap items-center gap-2 mt-3 pt-2 text-xs">
        <span className="text-slate-400 font-medium">Quick Pulses:</span>
        <button
          type="button"
          onClick={() => handleQuickPrompt(`Heritage walk in ${cityName} under ₹400`)}
          className="bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white px-2.5 py-1 rounded-full border border-slate-700 transition"
        >
          {`Heritage walk in ${cityName}`}
        </button>
        <button
          type="button"
          onClick={() => handleQuickPrompt(`Evening street food crawl in ${cityName} for ₹500`)}
          className="bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white px-2.5 py-1 rounded-full border border-slate-700 transition"
        >
          {`Evening food crawl in ${cityName}`}
        </button>
        <button
          type="button"
          onClick={() => handleQuickPrompt(`Peaceful afternoon nature & gardens in ${cityName}`)}
          className="bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white px-2.5 py-1 rounded-full border border-slate-700 transition"
        >
          {`Peaceful nature in ${cityName}`}
        </button>
      </div>

      {/* Expandable Fine-Tuning Drawer */}
      {showFilters && (
        <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Budget */}
          <div>
            <label className="text-slate-300 font-semibold mb-1 flex items-center gap-1">
              <IndianRupee className="w-3.5 h-3.5 text-orange-400" />
              {t('filters.budget')}: ₹{budget}
            </label>
            <input
              type="range"
              min="0"
              max="3000"
              step="50"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-full accent-orange-500 cursor-pointer"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="text-slate-300 font-semibold mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              {t('filters.hours')}: {hours} hrs
            </label>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              className="w-full accent-orange-500 cursor-pointer"
            />
          </div>

          {/* Transit Mode */}
          <div>
            <label className="text-slate-300 font-semibold mb-1 flex items-center gap-1">
              <Navigation className="w-3.5 h-3.5 text-sky-400" />
              {t('filters.travel_mode')}
            </label>
            <select
              value={travelMode}
              onChange={(e) => setTravelMode(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-orange-500"
            >
              <option value="foot-walking">{t('filters.walking')}</option>
              <option value="cycling-regular">{t('filters.cycling')}</option>
              <option value="driving-car">{t('filters.driving')}</option>
            </select>
          </div>

          {/* Pace */}
          <div>
            <label className="text-slate-300 font-semibold mb-1 block">
              {t('filters.pace')}
            </label>
            <select
              value={pace}
              onChange={(e) => setPace(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-orange-500"
            >
              <option value="relaxed">{t('filters.relaxed')}</option>
              <option value="moderate">{t('filters.moderate')}</option>
              <option value="packed">{t('filters.packed')}</option>
            </select>
          </div>

          {/* Interests Tags */}
          <div className="sm:col-span-2 lg:col-span-3">
            <span className="text-slate-300 font-semibold mb-1.5 block">Interests</span>
            <div className="flex flex-wrap gap-1.5">
              {['heritage', 'street food', 'nature', 'shopping', 'culture'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleInterest(cat)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize border transition ${
                    interests.includes(cat)
                      ? 'bg-orange-600 text-white border-orange-500'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Accessibility */}
          <div className="flex items-center gap-2 pt-4">
            <input
              type="checkbox"
              id="stepFree"
              checked={stepFree}
              onChange={(e) => setStepFree(e.target.checked)}
              className="rounded accent-orange-500 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="stepFree" className="text-slate-300 font-medium cursor-pointer flex items-center gap-1">
              <Accessibility className="w-3.5 h-3.5 text-emerald-400" />
              {t('filters.step_free')}
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
