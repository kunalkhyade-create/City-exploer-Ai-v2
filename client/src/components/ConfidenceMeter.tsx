import React from 'react';
import { ShieldCheck, Activity, Users, Database } from 'lucide-react';

export type SourceType = 'Official' | 'Community' | 'Estimate' | 'Demo';

interface ConfidenceMeterProps {
  source: SourceType | string;
  confidence?: number; // 0 to 1
  freshness?: string;
  size?: 'sm' | 'md';
}

export const ConfidenceMeter: React.FC<ConfidenceMeterProps> = ({
  source,
  confidence = 0.9,
  freshness = 'Today',
  size = 'md',
}) => {
  const getBadgeStyle = (src: string) => {
    switch (src) {
      case 'Official':
        return {
          bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
          icon: <ShieldCheck className="w-3 h-3 text-emerald-400" />,
        };
      case 'Community':
        return {
          bg: 'bg-sky-500/15 border-sky-500/30 text-sky-400',
          icon: <Users className="w-3 h-3 text-sky-400" />,
        };
      case 'Estimate':
        return {
          bg: 'bg-purple-500/15 border-purple-500/30 text-purple-400',
          icon: <Activity className="w-3 h-3 text-purple-400" />,
        };
      default: // Demo
        return {
          bg: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
          icon: <Database className="w-3 h-3 text-amber-400" />,
        };
    }
  };

  const style = getBadgeStyle(source);
  const percent = Math.round(confidence * 100);

  if (size === 'sm') {
    return (
      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${style.bg}`}>
        {style.icon}
        <span>{source}</span>
        <span className="opacity-75">({percent}%)</span>
      </span>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-medium border ${style.bg}`}>
      <div className="flex items-center gap-1.5">
        {style.icon}
        <span className="font-semibold">{source}</span>
      </div>
      <span className="text-slate-400">|</span>
      <div className="flex items-center gap-1">
        <span className="text-slate-300">Confidence:</span>
        <span className="font-bold">{percent}%</span>
      </div>
      {freshness && (
        <>
          <span className="text-slate-400">|</span>
          <span className="text-slate-400 text-[11px]">{freshness}</span>
        </>
      )}
    </div>
  );
};
