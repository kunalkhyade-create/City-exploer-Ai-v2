import React, { useState } from 'react';
import {
  Clock,
  IndianRupee,
  Navigation,
  Sparkles,
  Share2,
  RefreshCw,
  Bookmark,
  ChevronDown,
  ChevronUp,
  MapPin,
  Check,
  Split,
  Sliders,
  AlertTriangle,
  ShieldCheck,
  Leaf,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { GeneratedPlan, PlannedStop } from '../types';
import { ConfidenceMeter } from './ConfidenceMeter';
import { CrowdChart } from './CrowdChart';
import { PulseBalanceCard } from './PulseBalanceCard';

interface ItineraryViewProps {
  plan: GeneratedPlan;
  onReplan: (strategy: 'avoid_crowds' | 'budget_saver' | 'alternative_stops') => void;
  onSavePlace: (placeId: string) => void;
  onShareWhatsApp: () => void;
  onSelectStop: (stop: PlannedStop) => void;
  onOpenWhatIf?: () => void;
  isReplanning?: boolean;
}

export const ItineraryView: React.FC<ItineraryViewProps> = ({
  plan,
  onReplan,
  onSavePlace,
  onShareWhatsApp,
  onSelectStop,
  onOpenWhatIf,
  isReplanning = false,
}) => {
  const { t } = useTranslation();
  const [expandedStop, setExpandedStop] = useState<number | null>(1);
  const [replanStrategy, setReplanStrategy] = useState<'avoid_crowds' | 'budget_saver' | 'alternative_stops'>('avoid_crowds');

  return (
    <div className="space-y-4">
      {/* Plan Header Card */}
      <div className="glass-panel-elevated rounded-2xl p-4 sm:p-5 border border-slate-700/60 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-extrabold text-white">
                {plan.title}
              </h2>
              <span className="text-xs bg-orange-500/20 text-orange-300 font-semibold px-2 py-0.5 rounded-full border border-orange-500/30">
                {plan.city}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Window: <span className="text-slate-200 font-medium">{plan.startTime} — {plan.endTime}</span> (~{plan.totalDurationMinutes} mins)
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Total Cost Badge */}
            <div className="bg-slate-900/90 border border-slate-700/80 px-3 py-1.5 rounded-xl text-right">
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Est. Budget</div>
              <div className="text-sm sm:text-base font-extrabold text-orange-400">
                ₹{plan.totalCostInr}{' '}
                <span className="text-[11px] font-normal text-slate-400">/ ₹{plan.constraintsUsed.budget_inr}</span>
              </div>
            </div>

            {/* WhatsApp Share Button */}
            <button
              onClick={onShareWhatsApp}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-md transition"
              title="Share formatted itinerary on WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
          </div>
        </div>

        {/* Replan Controls & What-If Simulator Bar */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <Split className="w-3.5 h-3.5 text-amber-400" />
              Plan B:
            </span>
            <select
              value={replanStrategy}
              onChange={(e) => setReplanStrategy(e.target.value as any)}
              className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-cyan-500"
            >
              <option value="avoid_crowds">Avoid Peak Crowds</option>
              <option value="budget_saver">Budget Saver Alternative</option>
              <option value="alternative_stops">Explore Hidden Gems</option>
            </select>
            <button
              onClick={() => onReplan(replanStrategy)}
              disabled={isReplanning}
              className="flex items-center gap-1 px-3 py-1 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 text-xs font-semibold rounded-lg transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isReplanning ? 'animate-spin' : ''}`} />
              <span>Generate Plan B</span>
            </button>
          </div>

          {onOpenWhatIf && (
            <button
              type="button"
              onClick={onOpenWhatIf}
              className="flex items-center gap-1.5 px-3 py-1 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 text-xs font-semibold rounded-lg transition shadow-sm"
              title="Compare budget, time, or transit scenarios before applying"
            >
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>What-If Simulator</span>
            </button>
          )}
        </div>

        {/* Responsible Exploration Advisory if crowded stops detected */}
        {plan.stops.some(s => s.place.hourly_crowd.some(c => c >= 75)) && (
          <div className="mt-3 p-3 rounded-xl bg-teal-950/40 border border-teal-500/30 flex items-start gap-2.5 text-xs text-teal-200">
            <Leaf className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-teal-300 font-bold block mb-0.5">
                Responsible Exploration Notice
              </strong>
              <p className="text-[11px] text-teal-200/90 leading-relaxed">
                Some locations in this itinerary experience peak congestion during selected hours. CityPulse AI recommends prioritizing off-peak visits or using <em>Plan B: Avoid Peak Crowds</em> to disperse urban pressure and support local independent businesses.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Pulse Balance Index Dashboard */}
      <PulseBalanceCard plan={plan} />

      {/* Planned Stops Timeline */}
      <div className="space-y-3">
        {plan.stops.map((stop, index) => {
          const isExpanded = expandedStop === stop.stopOrder;

          return (
            <div
              key={stop.place.id}
              className="glass-card rounded-xl border border-slate-800/90 hover:border-slate-700/80 transition shadow-lg overflow-hidden"
            >
              {/* Transit Leg Info between stops */}
              {stop.travelFromPrev && index > 0 && (
                <div className="bg-slate-950/60 px-4 py-2 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <Navigation className="w-3.5 h-3.5 text-sky-400" />
                    <span>
                      {stop.travelFromPrev.mode.replace('-', ' ')} • ~{stop.travelFromPrev.durationMinutes} min ({(stop.travelFromPrev.distanceMeters / 1000).toFixed(1)} km)
                    </span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                    stop.travelFromPrev.routeLabel.includes('Estimated')
                      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}>
                    {stop.travelFromPrev.routeLabel}
                  </span>
                </div>
              )}

              {/* Stop Card Header */}
              <div
                onClick={() => {
                  setExpandedStop(isExpanded ? null : stop.stopOrder);
                  onSelectStop(stop);
                }}
                className="p-3.5 sm:p-4 cursor-pointer flex items-center justify-between hover:bg-slate-800/30 transition"
              >
                <div className="flex items-center gap-3">
                  {/* Order Pin */}
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 text-white font-bold text-xs flex items-center justify-center shadow-md">
                    {stop.stopOrder}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm sm:text-base text-slate-100 hover:text-orange-400 transition">
                        {stop.place.name}
                      </h3>
                      <span className="text-[10px] uppercase font-semibold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                        {stop.place.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                      <span className="flex items-center gap-1 text-slate-300">
                        <Clock className="w-3 h-3 text-amber-400" />
                        {stop.arrivalTime} — {stop.departureTime} (~{stop.durationMinutes}m)
                      </span>
                      <span>•</span>
                      <span className="font-semibold text-orange-400">
                        ₹{stop.costInr}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSavePlace(stop.place.id);
                    }}
                    className="p-1.5 text-slate-400 hover:text-orange-400 hover:bg-slate-800 rounded-lg transition"
                    title="Bookmark this place"
                  >
                    <Bookmark className="w-4 h-4" />
                  </button>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="p-4 pt-0 border-t border-slate-800/50 space-y-3 bg-slate-950/30">
                  {/* Why this explanation card */}
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 text-xs text-orange-200">
                    <div className="flex items-center gap-1.5 font-bold text-orange-400 mb-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{t('itinerary.why_this')}</span>
                    </div>
                    <p className="leading-relaxed">{stop.whyThis}</p>
                  </div>

                  {/* Description & metadata */}
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {stop.place.description}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                    <div className="flex items-center gap-2">
                      <ConfidenceMeter
                        source={stop.place.source_tag || 'Demo'}
                        confidence={stop.score}
                        size="sm"
                      />
                      <span className="text-[11px] text-slate-400">
                        ♿ {stop.place.step_free ? 'Step-Free' : 'Steps involved'}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400">
                      Opening: {stop.place.opening_hours || 'Open / Unverified'}
                    </div>
                  </div>

                  {/* Hourly Crowd Profile Chart for this place */}
                  <CrowdChart
                    hourlyCrowd={stop.place.hourly_crowd}
                    placeName={stop.place.name}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
