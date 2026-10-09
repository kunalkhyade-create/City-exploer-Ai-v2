import React from 'react';
import {
  Scale,
  DollarSign,
  Compass,
  Footprints,
  Accessibility,
  Store,
  Sparkles,
  Info,
} from 'lucide-react';
import { GeneratedPlan } from '../types';

interface PulseBalanceCardProps {
  plan: GeneratedPlan;
}

export const PulseBalanceCard: React.FC<PulseBalanceCardProps> = ({ plan }) => {
  const stops = plan.stops || [];
  const stopCount = stops.length || 1;

  // 1. Affordability: Budget utilization efficiency
  const budgetRatio = plan.constraintsUsed.budget_inr > 0
    ? Math.min(100, Math.round((plan.totalCostInr / plan.constraintsUsed.budget_inr) * 100))
    : 70;
  const affordabilityScore = budgetRatio <= 90 ? 95 : Math.max(40, 100 - (budgetRatio - 90) * 2);

  // 2. Cultural Variety: Unique categories represented
  const categories = new Set(stops.map(s => s.place.category));
  const varietyScore = Math.min(100, Math.round((categories.size / Math.max(1, Math.min(4, stopCount))) * 100));

  // 3. Travel Effort: Transit time vs total time
  const totalTravelMinutes = stops.reduce((acc, s) => acc + (s.travelFromPrev?.durationMinutes || 0), 0);
  const travelEffortRatio = plan.totalDurationMinutes > 0
    ? Math.round((totalTravelMinutes / plan.totalDurationMinutes) * 100)
    : 25;
  // Lower travel ratio is usually more relaxed/efficient
  const travelEffortScore = Math.max(30, 100 - travelEffortRatio);

  // 4. Accessibility: Ratio of step-free places
  const stepFreeCount = stops.filter(s => s.place.step_free).length;
  const accessibilityScore = Math.round((stepFreeCount / stopCount) * 100);

  // 5. Local Business Contribution: Street food, shopping bazaars, local markets
  const localBizCount = stops.filter(s =>
    s.place.category === 'street food' || s.place.category === 'shopping' || s.place.category === 'culture'
  ).length;
  const localBizScore = Math.min(100, Math.round((localBizCount / stopCount) * 100) + 20);

  // 6. Popular vs Hidden Gems ratio
  const hiddenGemsCount = stops.filter(s => s.place.hourly_crowd.every(c => c < 60)).length;
  const hiddenGemRatio = Math.round((hiddenGemsCount / stopCount) * 100);

  const metrics = [
    {
      label: 'Affordability',
      score: affordabilityScore,
      value: `₹${plan.totalCostInr} / ₹${plan.constraintsUsed.budget_inr}`,
      color: 'bg-emerald-500',
      icon: '💰',
      detail: 'Budget adherence without unnecessary markup',
    },
    {
      label: 'Cultural Variety',
      score: varietyScore,
      value: `${categories.size} themes`,
      color: 'bg-cyan-500',
      icon: '🎨',
      detail: `${Array.from(categories).join(', ')}`,
    },
    {
      label: 'Travel Effort',
      score: travelEffortScore,
      value: `~${totalTravelMinutes}m transit`,
      color: 'bg-amber-500',
      icon: '🚶',
      detail: `${travelEffortRatio}% of trip spent in transit`,
    },
    {
      label: 'Accessibility Fit',
      score: accessibilityScore,
      value: `${stepFreeCount}/${stopCount} step-free`,
      color: 'bg-blue-500',
      icon: '♿',
      detail: accessibilityScore >= 75 ? 'Excellent step-free access' : 'Mixed terrain with steps',
    },
    {
      label: 'Local Business Impact',
      score: localBizScore,
      value: `${localBizScore}%`,
      color: 'bg-teal-500',
      icon: '🏪',
      detail: 'Supports independent stalls, artisans & heritage trusts',
    },
    {
      label: 'Hidden Gem Ratio',
      score: hiddenGemRatio,
      value: `${hiddenGemRatio}% quiet`,
      color: 'bg-violet-500',
      icon: '✨',
      detail: hiddenGemRatio >= 50 ? 'Tranquil & uncrowded spots' : 'Mix of iconic landmarks',
    },
  ];

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-100">
              Pulse Balance Index
            </h4>
            <p className="text-[10px] text-slate-400">
              Holistic equilibrium of comfort, variety, impact, and cost
            </p>
          </div>
        </div>
        <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
          Balanced Plan
        </span>
      </div>

      {/* Grid of indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {metrics.map(m => (
          <div
            key={m.label}
            className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5"
          >
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1 font-semibold text-slate-300">
                <span>{m.icon}</span>
                <span>{m.label}</span>
              </span>
              <span className="font-bold text-slate-200 text-[10px]">{m.value}</span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full ${m.color} rounded-full transition-all duration-500`}
                style={{ width: `${Math.max(15, Math.min(100, m.score))}%` }}
              />
            </div>

            <p className="text-[9px] text-slate-400 truncate" title={m.detail}>
              {m.detail}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
