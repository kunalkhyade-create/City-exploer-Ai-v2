import React, { useState } from 'react';
import {
  Activity,
  Globe,
  Bookmark,
  AlertTriangle,
  Shield,
  Layers,
  Compass,
  User as UserIcon,
  LogOut,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CitySelector } from './CitySelector';
import { User, CityInfo } from '../types';

interface NavbarProps {
  onOpenDataSources: () => void;
  onOpenSaved: () => void;
  onOpenReport: () => void;
  onOpenAdmin: () => void;
  onOpenPassport: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  currentUser: User | null;
  currentCity: string;
  onSelectCity: (city: CityInfo) => void;
  availableCities: CityInfo[];
  savedCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenDataSources,
  onOpenSaved,
  onOpenReport,
  onOpenAdmin,
  onOpenPassport,
  onOpenAuth,
  onLogout,
  currentUser,
  currentCity,
  onSelectCity,
  availableCities,
  savedCount,
}) => {
  const { t, i18n } = useTranslation();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        {/* Brand & City Selector */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-teal-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/20 pulse-glow shrink-0">
            <Activity className="w-6 h-6 text-white stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base sm:text-xl tracking-tight bg-gradient-to-r from-cyan-300 via-teal-200 to-white bg-clip-text text-transparent">
                CITYPULSE AI
              </span>
              <CitySelector
                currentCity={currentCity}
                onSelectCity={onSelectCity}
                availableCities={availableCities}
              />
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block font-medium">
              Explore Freely. Move Smartly. Stay Aware.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Language Selector */}
          <div className="flex items-center bg-slate-900/80 border border-slate-800 rounded-lg p-0.5 text-xs">
            <Globe className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-0.5" />
            <button
              onClick={() => changeLanguage('en')}
              className={`px-1.5 sm:px-2 py-1 rounded font-medium transition ${
                i18n.language === 'en' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => changeLanguage('hi')}
              className={`px-1.5 sm:px-2 py-1 rounded font-medium transition ${
                i18n.language === 'hi' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              HI
            </button>
            <button
              onClick={() => changeLanguage('mr')}
              className={`px-1.5 sm:px-2 py-1 rounded font-medium transition ${
                i18n.language === 'mr' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              MR
            </button>
          </div>

          {/* Urban Pulse Passport */}
          <button
            onClick={onOpenPassport}
            title="Urban Pulse Passport Preferences"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:text-white bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg transition shadow-sm"
          >
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">Passport</span>
          </button>

          {/* Data Sources Registry */}
          <button
            onClick={onOpenDataSources}
            title={t('nav.data_sources')}
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/50 rounded-lg transition"
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden lg:inline">{t('nav.data_sources')}</span>
          </button>

          {/* Citizen Report Trigger */}
          <button
            onClick={onOpenReport}
            title={t('nav.report')}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-rose-300 hover:text-rose-100 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 rounded-lg transition shadow-sm"
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
            <Bookmark className="w-4 h-4 text-cyan-400" />
            {savedCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-cyan-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow">
                {savedCount}
              </span>
            )}
          </button>

          {/* User Authentication Control */}
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-teal-500/40 rounded-lg transition"
                title={`Signed in as ${currentUser.email}`}
              >
                <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-cyan-500 to-teal-400 text-slate-950 font-black text-[9px] flex items-center justify-center">
                  {(currentUser.name || currentUser.email)[0].toUpperCase()}
                </div>
                <span className="hidden sm:inline max-w-[90px] truncate">
                  {currentUser.name || currentUser.email.split('@')[0]}
                </span>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-10 w-48 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-50 text-xs animate-fade-in">
                  <div className="px-2 py-1.5 border-b border-slate-800">
                    <p className="font-bold text-white truncate">{currentUser.name || 'Explorer'}</p>
                    <p className="text-[10px] text-slate-400 truncate">{currentUser.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenPassport();
                    }}
                    className="w-full text-left px-2 py-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg flex items-center gap-2 mt-1"
                  >
                    <Compass className="w-3.5 h-3.5 text-cyan-400" />
                    <span>My City Passport</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onLogout();
                    }}
                    className="w-full text-left px-2 py-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg flex items-center gap-2 mt-0.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-300 hover:from-cyan-300 hover:to-teal-300 rounded-lg shadow-sm shadow-cyan-500/20 transition cursor-pointer"
            >
              <UserIcon className="w-3.5 h-3.5 text-slate-950" />
              <span>Sign In</span>
            </button>
          )}

          {/* Moderator View */}
          <button
            onClick={onOpenAdmin}
            title={t('nav.admin')}
            className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 rounded-lg transition"
          >
            <Shield className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>
    </header>
  );
};
