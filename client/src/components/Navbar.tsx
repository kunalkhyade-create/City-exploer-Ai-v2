import React from 'react';
import { Activity, Globe, Bookmark, AlertTriangle, Shield, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface NavbarProps {
  onOpenDataSources: () => void;
  onOpenSaved: () => void;
  onOpenReport: () => void;
  onOpenAdmin: () => void;
  savedCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenDataSources,
  onOpenSaved,
  onOpenReport,
  onOpenAdmin,
  savedCount,
}) => {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 via-amber-500 to-orange-400 flex items-center justify-center shadow-lg shadow-orange-500/20 pulse-glow">
            <Activity className="w-6 h-6 text-white stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-orange-400 via-amber-200 to-white bg-clip-text text-transparent">
                CITYPULSE AI
              </span>
              <span className="text-[11px] font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full">
                Pune • ₹ INR
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block font-medium">
              "{t('tagline')}"
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Selector */}
          <div className="flex items-center bg-slate-900/80 border border-slate-800 rounded-lg p-0.5 text-xs">
            <Globe className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-0.5" />
            <button
              onClick={() => changeLanguage('en')}
              className={`px-2 py-1 rounded font-medium transition ${
                i18n.language === 'en' ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => changeLanguage('hi')}
              className={`px-2 py-1 rounded font-medium transition ${
                i18n.language === 'hi' ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              HI
            </button>
            <button
              onClick={() => changeLanguage('mr')}
              className={`px-2 py-1 rounded font-medium transition ${
                i18n.language === 'mr' ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              MR
            </button>
          </div>

          {/* Data Sources Registry */}
          <button
            onClick={onOpenDataSources}
            title={t('nav.data_sources')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/50 rounded-lg transition"
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">{t('nav.data_sources')}</span>
          </button>

          {/* Citizen Report Trigger */}
          <button
            onClick={onOpenReport}
            title={t('nav.report')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:text-rose-100 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 rounded-lg transition shadow-sm"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">{t('nav.report')}</span>
          </button>

          {/* Bookmarks */}
          <button
            onClick={onOpenSaved}
            title={t('nav.saved')}
            className="relative flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700/50 rounded-lg transition"
          >
            <Bookmark className="w-4 h-4 text-orange-400" />
            {savedCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-orange-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow">
                {savedCount}
              </span>
            )}
          </button>

          {/* Moderator View */}
          <button
            onClick={onOpenAdmin}
            title={t('nav.admin')}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 rounded-lg transition"
          >
            <Shield className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>
    </header>
  );
};
