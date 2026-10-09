import React from 'react';
import { X, Layers, CheckCircle2, AlertTriangle, ShieldCheck, Database, Radio } from 'lucide-react';
import { DataSourceStatus } from '../types';

interface DataSourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
  sources: DataSourceStatus[];
}

export const DataSourcesModal: React.FC<DataSourcesModalProps> = ({
  isOpen,
  onClose,
  sources,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Live Data Sources & Confidence Registry
              </h3>
              <p className="text-xs text-slate-400">
                Transparent Provider Monitoring & Automatic Demo Fallback Registry
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 text-xs">
          <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800 text-slate-400 leading-relaxed">
            CITYPULSE AI maintains a real-time registry of all providers. Every recommendation, route, weather forecast, and geocoded coordinate tracks its data origin, freshness timestamp, and confidence rating.
          </div>

          <div className="space-y-2.5">
            {sources.map((src) => {
              const isLive = src.provider_type === 'live';
              const isHealthy = src.status === 'operational';

              return (
                <div
                  key={src.name}
                  className="bg-slate-950/40 border border-slate-800 p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                      <h4 className="font-bold text-slate-200 text-sm">{src.name}</h4>
                      <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                        isLive
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {src.provider_type}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs">{src.description}</p>
                    {src.last_error && (
                      <p className="text-[11px] text-rose-400">Error: {src.last_error}</p>
                    )}
                  </div>

                  <div className="sm:text-right shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800 text-[11px] text-slate-400 space-y-0.5">
                    <div className="flex sm:justify-end items-center gap-1.5">
                      <span>Confidence:</span>
                      <strong className="text-slate-200">{Math.round(src.confidence * 100)}%</strong>
                    </div>
                    {src.last_success && (
                      <div className="text-[10px] text-slate-500">
                        Last Success: {new Date(src.last_success).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition"
          >
            Close Registry
          </button>
        </div>
      </div>
    </div>
  );
};
