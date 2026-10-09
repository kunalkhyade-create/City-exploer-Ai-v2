import React, { useState, useEffect } from 'react';
import {
  X,
  Compass,
  Check,
  Sparkles,
  Heart,
  Sliders,
  Accessibility,
  Users,
  Sun,
  Globe2,
  Navigation,
  IndianRupee,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { UserPassport, CityInfo } from '../types';
import { api } from '../api/client';

interface PassportModalProps {
  isOpen: boolean;
  onClose: () => void;
  passport: UserPassport | null;
  onSave: (passport: UserPassport) => void;
  availableCities?: CityInfo[];
  isOnboarding?: boolean;
}

const INTEREST_OPTIONS = [
  { id: 'heritage', label: 'Heritage & History', icon: '🏛️' },
  { id: 'street food', label: 'Food & Local Markets', icon: '🍛' },
  { id: 'nature', label: 'Nature & Greenery', icon: '🌿' },
  { id: 'culture', label: 'Art, Temples & Culture', icon: '🎨' },
  { id: 'shopping', label: 'Bazaars & Local Shops', icon: '🛍️' },
  { id: 'hidden gems', label: 'Hidden Gems & Alleys', icon: '✨' },
];

export const PassportModal: React.FC<PassportModalProps> = ({
  isOpen,
  onClose,
  passport,
  onSave,
  availableCities = [],
  isOnboarding = false,
}) => {
  const [interests, setInterests] = useState<string[]>(['heritage', 'street food']);
  const [budget, setBudget] = useState<number>(600);
  const [travelMode, setTravelMode] = useState<'foot-walking' | 'cycling-regular' | 'driving-car'>('foot-walking');
  const [pace, setPace] = useState<'relaxed' | 'moderate' | 'packed'>('moderate');
  const [accessibility, setAccessibility] = useState<string[]>([]);
  const [crowdPref, setCrowdPref] = useState<'peaceful' | 'balanced' | 'buzzing'>('balanced');
  const [indoorOutdoor, setIndoorOutdoor] = useState<'all' | 'indoor' | 'outdoor'>('all');
  const [preferredLanguage, setPreferredLanguage] = useState<'en' | 'hi' | 'mr'>('en');
  const [defaultCity, setDefaultCity] = useState<string>('Pune');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (passport) {
      if (passport.interests) setInterests(passport.interests);
      if (passport.budget_inr) setBudget(passport.budget_inr);
      if (passport.travel_mode) setTravelMode(passport.travel_mode);
      if (passport.pace) setPace(passport.pace);
      if (passport.accessibility) setAccessibility(passport.accessibility);
      if (passport.crowd_preference) setCrowdPref(passport.crowd_preference);
      if (passport.indoor_outdoor) setIndoorOutdoor(passport.indoor_outdoor);
      if (passport.preferred_language) setPreferredLanguage(passport.preferred_language);
      if (passport.default_city) setDefaultCity(passport.default_city);
    }
  }, [passport, isOpen]);

  if (!isOpen) return null;

  const toggleInterest = (id: string) => {
    setInterests(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleAccessibility = (item: string) => {
    setAccessibility(prev =>
      prev.includes(item) ? prev.filter(a => a !== item) : [...prev, item]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload: Partial<UserPassport> = {
        interests,
        budget_inr: budget,
        travel_mode: travelMode,
        pace,
        accessibility,
        crowd_preference: crowdPref,
        indoor_outdoor: indoorOutdoor,
        preferred_language: preferredLanguage,
        default_city: defaultCity,
      };
      const res = await api.savePassport(payload);
      onSave(res.passport);
      onClose();
    } catch (err) {
      console.error('Failed to save passport:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-cyan-500/30 bg-slate-900/95 p-5 sm:p-7 shadow-2xl shadow-cyan-950/60 custom-scrollbar">
        {/* Decorative ambient lights */}
        <div className="pointer-events-none absolute -top-20 -right-20 h-44 w-44 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-44 w-44 rounded-full bg-teal-500/15 blur-3xl" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 rounded-full p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white shrink-0">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Urban Pulse Passport
              </h2>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                {isOnboarding ? 'Welcome Setup' : 'Custom Preferences'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Personalize your exploration style across every city. Saved to your profile & syncs with your itineraries.
            </p>
          </div>
        </div>

        {/* Form Body */}
        <div className="space-y-6 text-xs text-slate-200">
          {/* Section 1: Interests */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              1. What excites you most? (Select interests)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {INTEREST_OPTIONS.map(opt => {
                const active = interests.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleInterest(opt.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition ${
                      active
                        ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-base">{opt.icon}</span>
                    <span className="font-semibold text-xs leading-tight">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Default City & Budget */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Default / Home Destination
              </label>
              <select
                value={defaultCity}
                onChange={(e) => setDefaultCity(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-cyan-400 focus:outline-none"
              >
                <option value="Pune">Pune (Maharashtra)</option>
                <option value="Mumbai">Mumbai (Maharashtra)</option>
                <option value="Delhi">Delhi (NCR)</option>
                <option value="Bengaluru">Bengaluru (Karnataka)</option>
                <option value="Jaipur">Jaipur (Rajasthan)</option>
                <option value="Goa">Goa (Coastal)</option>
                <option value="London">London (United Kingdom)</option>
                <option value="Tokyo">Tokyo (Japan)</option>
                <option value="Paris">Paris (France)</option>
                <option value="New York">New York (USA)</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Typical Daily Budget (INR)
                </label>
                <span className="text-cyan-400 font-extrabold text-xs">
                  ₹{budget.toLocaleString('en-IN')}
                </span>
              </div>
              <input
                type="range"
                min="200"
                max="5000"
                step="100"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>₹200 (Budget)</span>
                <span>₹2,500</span>
                <span>₹5,000+ (Luxury)</span>
              </div>
            </div>
          </div>

          {/* Section 3: Travel Mode & Pace */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Preferred Travel Mode
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'foot-walking', label: 'Walking', icon: '🚶' },
                  { id: 'cycling-regular', label: 'Cycling', icon: '🚴' },
                  { id: 'driving-car', label: 'Cab/Car', icon: '🚗' },
                ].map(mode => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setTravelMode(mode.id as any)}
                    className={`py-2 px-2 text-center rounded-xl border transition ${
                      travelMode === mode.id
                        ? 'bg-cyan-500/15 border-cyan-400 text-white font-bold'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-sm">{mode.icon}</div>
                    <div className="text-[11px] mt-0.5">{mode.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Exploration Pace
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'relaxed', label: 'Relaxed', desc: 'Fewer stops' },
                  { id: 'moderate', label: 'Balanced', desc: 'Standard' },
                  { id: 'packed', label: 'High Energy', desc: 'Max sights' },
                ].map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPace(p.id as any)}
                    className={`py-2 px-2 text-center rounded-xl border transition ${
                      pace === p.id
                        ? 'bg-teal-500/15 border-teal-400 text-white font-bold'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-[11px] font-bold">{p.label}</div>
                    <div className="text-[9px] text-slate-400">{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 4: Crowd Tolerance & Indoor/Outdoor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Crowd Preference
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'peaceful', label: 'Peaceful', icon: '🌿' },
                  { id: 'balanced', label: 'Balanced', icon: '⚖️' },
                  { id: 'buzzing', label: 'Buzzing', icon: '⚡' },
                ].map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCrowdPref(c.id as any)}
                    className={`py-2 px-2 text-center rounded-xl border transition ${
                      crowdPref === c.id
                        ? 'bg-cyan-500/15 border-cyan-400 text-white font-bold'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-sm">{c.icon}</div>
                    <div className="text-[11px] mt-0.5">{c.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Activity Atmosphere
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'all', label: 'Any Mix', icon: '🌤️' },
                  { id: 'outdoor', label: 'Outdoors', icon: '🌳' },
                  { id: 'indoor', label: 'Indoor Only', icon: '🏛️' },
                ].map(a => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setIndoorOutdoor(a.id as any)}
                    className={`py-2 px-2 text-center rounded-xl border transition ${
                      indoorOutdoor === a.id
                        ? 'bg-teal-500/15 border-teal-400 text-white font-bold'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-sm">{a.icon}</div>
                    <div className="text-[11px] mt-0.5">{a.label}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 5: Accessibility Needs */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Accessibility & Comfort Requirements
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'step_free', label: 'Wheelchair / Step-Free Access' },
                { id: 'seating', label: 'Dedicated Rest Seating' },
                { id: 'restroom', label: 'Verified Restroom Facilities' },
              ].map(acc => {
                const checked = accessibility.includes(acc.id);
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => toggleAccessibility(acc.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition ${
                      checked
                        ? 'bg-emerald-500/15 border-emerald-400 text-emerald-300 font-semibold'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full border border-current inline-block flex items-center justify-center">
                      {checked && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                    </span>
                    <span>{acc.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="mt-8 pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 transition"
          >
            {isOnboarding ? 'Skip for now' : 'Cancel'}
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 via-teal-500 to-cyan-400 hover:from-cyan-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-cyan-500/25 transition flex items-center gap-2 cursor-pointer"
          >
            {isSaving ? (
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-slate-950 border-t-transparent" />
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Passport & Apply</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
