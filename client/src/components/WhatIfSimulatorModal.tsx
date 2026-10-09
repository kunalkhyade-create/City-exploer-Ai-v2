import React, { useState } from 'react';
import {
  X,
  Sliders,
  Sparkles,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Clock,
  IndianRupee,
  Footprints,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Plus,
  Minus,
} from 'lucide-react';
import { GeneratedPlan, PlannedStop } from '../types';
import { api } from '../api/client';

interface WhatIfSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: GeneratedPlan;
  onApplySimulatedPlan: (plan: GeneratedPlan) => void;
}

export const WhatIfSimulatorModal: React.FC<WhatIfSimulatorModalProps> = ({
  isOpen,
  onClose,
  currentPlan,
  onApplySimulatedPlan,
}) => {
  // Scenario simulation parameters
  const [budgetMultiplier, setBudgetMultiplier] = useState<number>(1.0); // 0.7 = -30%, 1.3 = +30%
  const [travelMode, setTravelMode] = useState<'foot-walking' | 'cycling-regular' | 'driving-car'>(
    currentPlan.constraintsUsed.travel_mode || 'foot-walking'
  );
  const [pace, setPace] = useState<'relaxed' | 'moderate' | 'packed'>(
    currentPlan.constraintsUsed.pace || 'moderate'
  );
  const [requireStepFree, setRequireStepFree] = useState<boolean>(
    currentPlan.constraintsUsed.accessibility?.includes('step_free') || false
  );
  const [avoidCrowds, setAvoidCrowds] = useState<boolean>(false);

  // Simulation state
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedPlan, setSimulatedPlan] = useState<GeneratedPlan | null>(null);

  if (!isOpen) return null;

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    try {
      const simulatedBudget = Math.round(currentPlan.constraintsUsed.budget_inr * budgetMultiplier);
      const newConstraints = {
        ...currentPlan.constraintsUsed,
        budget_inr: simulatedBudget,
        travel_mode: travelMode,
        pace,
        accessibility: requireStepFree ? ['step_free'] : [],
      };

      const resultPlan = await api.generatePlan({
        constraints: newConstraints,
        lang: 'en',
        startTime: currentPlan.startTime || '10:00',
      });

      setSimulatedPlan(resultPlan);
    } catch (err) {
      console.error('Simulation failed:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleApply = () => {
    if (simulatedPlan) {
      onApplySimulatedPlan(simulatedPlan);
      onClose();
    }
  };

  // Diff computation between currentPlan and simulatedPlan
  const costDiff = simulatedPlan ? simulatedPlan.totalCostInr - currentPlan.totalCostInr : 0;
  const durationDiff = simulatedPlan ? simulatedPlan.totalDurationMinutes - currentPlan.totalDurationMinutes : 0;
  const currentStopIds = new Set(currentPlan.stops.map(s => s.place.id));
  const simulatedStopIds = new Set(simulatedPlan?.stops.map(s => s.place.id) || []);

  const addedStops = simulatedPlan ? simulatedPlan.stops.filter(s => !currentStopIds.has(s.place.id)) : [];
  const removedStops = currentPlan.stops.filter(s => !simulatedStopIds.has(s.place.id));
  const retainedStops = simulatedPlan ? simulatedPlan.stops.filter(s => currentStopIds.has(s.place.id)) : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl border border-cyan-500/30 bg-slate-900/95 p-5 sm:p-7 shadow-2xl shadow-cyan-950/60 custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black text-white">
                  What-If City Simulator
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                  Scenario Engine
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Test adjustments to budget, pace, transit, and crowd tolerance. Preview differences before committing.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls: Parameters to tweak */}
        <div className="my-5 p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* 1. Budget Adjustment */}
            <div>
              <label className="block text-slate-300 font-bold mb-1.5 uppercase text-[11px]">
                Budget Scenario: {budgetMultiplier === 1.0 ? 'Current' : budgetMultiplier < 1 ? `-${Math.round((1 - budgetMultiplier) * 100)}%` : `+${Math.round((budgetMultiplier - 1) * 100)}%`}
              </label>
              <div className="flex items-center gap-1.5">
                {[
                  { label: '-30%', val: 0.7 },
                  { label: 'Current', val: 1.0 },
                  { label: '+30%', val: 1.3 },
                ].map(b => (
                  <button
                    key={b.label}
                    type="button"
                    onClick={() => setBudgetMultiplier(b.val)}
                    className={`flex-1 py-1.5 rounded-lg border font-semibold text-[11px] transition ${
                      budgetMultiplier === b.val
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Mode of Travel */}
            <div>
              <label className="block text-slate-300 font-bold mb-1.5 uppercase text-[11px]">
                Travel Mode
              </label>
              <div className="flex items-center gap-1.5">
                {[
                  { id: 'foot-walking', label: 'Walk' },
                  { id: 'cycling-regular', label: 'Cycle' },
                  { id: 'driving-car', label: 'Cab' },
                ].map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setTravelMode(m.id as any)}
                    className={`flex-1 py-1.5 rounded-lg border font-semibold text-[11px] transition ${
                      travelMode === m.id
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Pace */}
            <div>
              <label className="block text-slate-300 font-bold mb-1.5 uppercase text-[11px]">
                Exploration Pace
              </label>
              <div className="flex items-center gap-1.5">
                {[
                  { id: 'relaxed', label: 'Relaxed' },
                  { id: 'moderate', label: 'Moderate' },
                  { id: 'packed', label: 'Packed' },
                ].map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPace(p.id as any)}
                    className={`flex-1 py-1.5 rounded-lg border font-semibold text-[11px] transition ${
                      pace === p.id
                        ? 'bg-teal-500/20 border-teal-400 text-teal-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={requireStepFree}
                  onChange={(e) => setRequireStepFree(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                />
                <span>Enforce 100% Step-Free Access</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={avoidCrowds}
                  onChange={(e) => setAvoidCrowds(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-teal-500 focus:ring-0"
                />
                <span>Prioritize Low-Crowd Hours</span>
              </label>
            </div>

            <button
              type="button"
              onClick={handleRunSimulation}
              disabled={isSimulating}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer shadow-md shadow-cyan-500/20"
            >
              {isSimulating ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>{isSimulating ? 'Simulating...' : 'Run What-If Simulation'}</span>
            </button>
          </div>
        </div>

        {/* Diff Result View */}
        {simulatedPlan ? (
          <div className="space-y-4">
            {/* Impact Metric Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Cost Variance</div>
                <div className={`text-base font-extrabold flex items-center gap-1 mt-0.5 ${
                  costDiff <= 0 ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {costDiff <= 0 ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                  <span>{costDiff >= 0 ? `+₹${costDiff}` : `-₹${Math.abs(costDiff)}`}</span>
                </div>
                <div className="text-[10px] text-slate-500">₹{currentPlan.totalCostInr} ➔ ₹{simulatedPlan.totalCostInr}</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Duration Variance</div>
                <div className="text-base font-extrabold text-cyan-300 mt-0.5">
                  {durationDiff >= 0 ? `+${durationDiff} min` : `${durationDiff} min`}
                </div>
                <div className="text-[10px] text-slate-500">~{Math.round(simulatedPlan.totalDurationMinutes / 60)} hrs total</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Stops Adjusted</div>
                <div className="text-base font-extrabold text-white mt-0.5">
                  <span className="text-emerald-400">+{addedStops.length}</span> / <span className="text-rose-400">-{removedStops.length}</span>
                </div>
                <div className="text-[10px] text-slate-500">{retainedStops.length} retained stops</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Transit Efficiency</div>
                <div className="text-base font-extrabold text-teal-400 mt-0.5">
                  {travelMode === 'driving-car' ? 'High Speed' : travelMode === 'cycling-regular' ? 'Active' : 'Eco-Walking'}
                </div>
                <div className="text-[10px] text-slate-500 capitalize">{pace} pace</div>
              </div>
            </div>

            {/* Changed Stops Preview */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Comparison Breakdown
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Added or Substituted Stops */}
                {addedStops.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                      <Plus className="w-3.5 h-3.5" /> Added / Replaced Stops:
                    </span>
                    {addedStops.map(s => (
                      <div key={s.place.id} className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-slate-200">
                        <div className="font-semibold text-emerald-300">{s.place.name}</div>
                        <div className="text-[10px] text-slate-400">{s.whyThis}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Removed Stops */}
                {removedStops.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-rose-400 flex items-center gap-1">
                      <Minus className="w-3.5 h-3.5" /> Omitted in this scenario:
                    </span>
                    {removedStops.map(s => (
                      <div key={s.place.id} className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-slate-300">
                        <div className="font-semibold text-rose-300">{s.place.name}</div>
                        <div className="text-[10px] text-slate-400">Omitted due to budget / pace constraints</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Apply Button */}
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setSimulatedPlan(null)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Discard Simulation
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="px-6 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 via-teal-500 to-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/25 flex items-center gap-2 cursor-pointer transition hover:opacity-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Apply Simulation to Active Plan</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-slate-400 space-y-2">
            <p>Select your scenario adjustments above and click <strong>"Run What-If Simulation"</strong> to evaluate the projected outcome.</p>
          </div>
        )}
      </div>
    </div>
  );
};
