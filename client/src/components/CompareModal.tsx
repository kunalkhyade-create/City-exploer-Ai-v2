import React, { useState } from 'react';
import { X, Scale, IndianRupee, Users, Accessibility, Sparkles } from 'lucide-react';
import { Place } from '../types';
import { api } from '../api/client';

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  places: Place[];
}

export const CompareModal: React.FC<CompareModalProps> = ({
  isOpen,
  onClose,
  places,
}) => {
  const [placeAId, setPlaceAId] = useState(places[0]?.id || '');
  const [placeBId, setPlaceBId] = useState(places[1]?.id || '');
  const [hour, setHour] = useState(14);
  const [comparison, setComparison] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleCompare = async () => {
    if (!placeAId || !placeBId) return;
    setIsLoading(true);
    try {
      const res = await api.comparePlaces(placeAId, placeBId, hour);
      setComparison(res.comparison);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-orange-400" />
            <h3 className="text-base font-bold text-white">Compare Two Places Side-by-Side</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Controls */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Place 1</label>
              <select
                value={placeAId}
                onChange={(e) => setPlaceAId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200"
              >
                {places.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Place 2</label>
              <select
                value={placeBId}
                onChange={(e) => setPlaceBId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200"
              >
                {places.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Planned Hour ({hour}:00)</label>
              <input
                type="range"
                min="6"
                max="23"
                value={hour}
                onChange={(e) => setHour(Number(e.target.value))}
                className="w-full accent-orange-500 mt-2"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleCompare}
              disabled={isLoading}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-xl transition"
            >
              {isLoading ? 'Comparing...' : 'Run Pulse Comparison'}
            </button>
          </div>

          {/* Comparison Results */}
          {comparison && (
            <div className="mt-4 space-y-3 pt-3 border-t border-slate-800">
              <div className="bg-orange-500/10 border border-orange-500/30 p-3 rounded-xl text-orange-300 text-xs flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-400 shrink-0" />
                <span>{comparison.recommendation}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Place A Card */}
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                  <h4 className="font-bold text-slate-200 text-sm">{comparison.placeA.name}</h4>
                  <p className="text-slate-400 capitalize">{comparison.placeA.category}</p>
                  <div className="text-orange-400 font-bold">₹{comparison.placeA.indicative_price_inr}</div>
                  <div className="text-slate-300">
                    Crowd at {hour}:00:{' '}
                    <strong className="text-slate-100">{comparison.placeA.crowdStatus}</strong> ({Math.round(comparison.placeA.currentHourCrowd * 100)}%)
                  </div>
                  <div className="text-slate-400">
                    ♿ {comparison.placeA.step_free ? 'Step-Free' : 'Steps involved'}
                  </div>
                </div>

                {/* Place B Card */}
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                  <h4 className="font-bold text-slate-200 text-sm">{comparison.placeB.name}</h4>
                  <p className="text-slate-400 capitalize">{comparison.placeB.category}</p>
                  <div className="text-orange-400 font-bold">₹{comparison.placeB.indicative_price_inr}</div>
                  <div className="text-slate-300">
                    Crowd at {hour}:00:{' '}
                    <strong className="text-slate-100">{comparison.placeB.crowdStatus}</strong> ({Math.round(comparison.placeB.currentHourCrowd * 100)}%)
                  </div>
                  <div className="text-slate-400">
                    ♿ {comparison.placeB.step_free ? 'Step-Free' : 'Steps involved'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
