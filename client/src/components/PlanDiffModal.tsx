import React from 'react';
import { X, Check, ArrowRight, PlusCircle, MinusCircle, Clock, IndianRupee, Split } from 'lucide-react';
import { ReplanResult } from '../types';

interface PlanDiffModalProps {
  replanData: ReplanResult | null;
  onClose: () => void;
  onApplyPlanB: () => void;
}

export const PlanDiffModal: React.FC<PlanDiffModalProps> = ({
  replanData,
  onClose,
  onApplyPlanB,
}) => {
  if (!replanData) return null;

  const { originalPlan, planB, diff } = replanData;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Split className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Plan B Comparison & Diff
              </h3>
              <p className="text-xs text-slate-400">{diff.reason}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Diff Metrics Banner */}
        <div className="grid grid-cols-2 gap-3 p-4 bg-slate-950/40 border-b border-slate-800 text-xs">
          <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60 flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1">
              <IndianRupee className="w-3.5 h-3.5 text-orange-400" />
              Cost Impact:
            </span>
            <span className={`font-bold ${diff.costDifferenceInr <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {diff.costDifferenceInr <= 0 ? `-₹${Math.abs(diff.costDifferenceInr)} (Saves money)` : `+₹${diff.costDifferenceInr}`}
            </span>
          </div>

          <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60 flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              Duration Delta:
            </span>
            <span className="font-bold text-slate-200">
              {diff.durationDifferenceMinutes > 0 ? `+${diff.durationDifferenceMinutes} min` : `${diff.durationDifferenceMinutes} min`}
            </span>
          </div>
        </div>

        {/* Added & Removed Stops Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {/* Added in Plan B */}
          <div>
            <h4 className="font-bold text-emerald-400 flex items-center gap-1.5 mb-2 uppercase tracking-wider text-[11px]">
              <PlusCircle className="w-4 h-4" />
              Added in Plan B ({diff.addedStops.length})
            </h4>
            {diff.addedStops.length === 0 ? (
              <p className="text-slate-500 italic pl-5">No new stops introduced.</p>
            ) : (
              <div className="space-y-2">
                {diff.addedStops.map(s => (
                  <div
                    key={s.place.id}
                    className="bg-emerald-950/20 border border-emerald-500/30 p-2.5 rounded-lg flex items-center justify-between"
                  >
                    <div>
                      <strong className="text-emerald-300 font-semibold">{s.place.name}</strong>
                      <p className="text-[11px] text-slate-400 capitalize">{s.place.category} • ₹{s.costInr}</p>
                    </div>
                    <span className="text-emerald-400 text-[11px] font-medium">{s.arrivalTime}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Removed from Plan A */}
          <div>
            <h4 className="font-bold text-rose-400 flex items-center gap-1.5 mb-2 uppercase tracking-wider text-[11px]">
              <MinusCircle className="w-4 h-4" />
              Swapped Out from Plan A ({diff.removedStops.length})
            </h4>
            {diff.removedStops.length === 0 ? (
              <p className="text-slate-500 italic pl-5">All previous stops retained with schedule adjustments.</p>
            ) : (
              <div className="space-y-2">
                {diff.removedStops.map(s => (
                  <div
                    key={s.place.id}
                    className="bg-rose-950/20 border border-rose-500/30 p-2.5 rounded-lg flex items-center justify-between"
                  >
                    <div>
                      <strong className="text-rose-300 font-semibold">{s.place.name}</strong>
                      <p className="text-[11px] text-slate-400 capitalize">{s.place.category} • ₹{s.costInr}</p>
                    </div>
                    <span className="text-rose-400 text-[11px] line-through">{s.arrivalTime}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
          >
            Keep Plan A
          </button>
          <button
            onClick={onApplyPlanB}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 shadow-md flex items-center gap-1.5 transition"
          >
            <Check className="w-4 h-4" />
            <span>Switch to Plan B</span>
          </button>
        </div>
      </div>
    </div>
  );
};
