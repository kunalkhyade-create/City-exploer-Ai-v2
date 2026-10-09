import React from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const DemoRibbon: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="bg-gradient-to-r from-amber-600/90 via-orange-600/90 to-amber-600/90 text-white text-xs px-3 py-1.5 flex items-center justify-between font-medium tracking-wide shadow-md z-30">
      <div className="flex items-center gap-2">
        <span className="bg-black/30 font-bold px-1.5 py-0.5 rounded text-[10px] tracking-wider uppercase border border-white/20">
          {t('demo_badge')}
        </span>
        <span className="hidden sm:inline">
          Pune simulated dataset active. Hourly crowd & hazards are modeled patterns, not live traffic or emergency services.
        </span>
        <span className="sm:hidden">
          Pune simulated dataset active.
        </span>
      </div>
      <div className="flex items-center gap-1.5 text-amber-100 text-[11px]">
        <ShieldAlert className="w-3.5 h-3.5 text-amber-200" />
        <span className="italic">{t('safety_disclaimer')}</span>
      </div>
    </div>
  );
};
