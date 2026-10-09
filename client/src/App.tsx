import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Activity,
  Compass,
  AlertTriangle,
  Scale,
  Sparkles,
  Layers,
  MapPin,
  Clock,
  IndianRupee,
  ShieldCheck,
  Check,
  ChevronRight,
  Sliders,
} from 'lucide-react';

import { Navbar } from './components/Navbar';
import { DemoRibbon } from './components/DemoRibbon';
import { MapView } from './components/MapView';
import { PlanPromptBar } from './components/PlanPromptBar';
import { ItineraryView } from './components/ItineraryView';
import { WeatherWidget } from './components/WeatherWidget';
import { PlanDiffModal } from './components/PlanDiffModal';
import { ReportModal } from './components/ReportModal';
import { AdminModal } from './components/AdminModal';
import { DataSourcesModal } from './components/DataSourcesModal';
import { SavedDrawer } from './components/SavedDrawer';
import { CompareModal } from './components/CompareModal';
import { ConfidenceMeter } from './components/ConfidenceMeter';
import { AuthModal } from './components/AuthModal';
import { PassportModal } from './components/PassportModal';
import { WhatIfSimulatorModal } from './components/WhatIfSimulatorModal';
import { GeminiKeyModal } from './components/GeminiKeyModal';

import {
  Place,
  Hazard,
  WeatherData,
  GeneratedPlan,
  ReplanResult,
  DataSourceStatus,
  User,
  UserPassport,
  CityInfo,
} from './types';
import { api } from './api/client';

export const App: React.FC = () => {
  const { t, i18n } = useTranslation();

  // Core Data State
  const [places, setPlaces] = useState<Place[]>([]);
  const [hazards, setHazards] = useState<Hazard[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [dataSources, setDataSources] = useState<DataSourceStatus[]>([]);
  const [savedPlaces, setSavedPlaces] = useState<Place[]>([]);

  // Multi-City State
  const [availableCities, setAvailableCities] = useState<CityInfo[]>([]);
  const [currentCity, setCurrentCity] = useState<string>('Pune');
  const [currentCityCoords, setCurrentCityCoords] = useState<[number, number]>([18.5204, 73.8567]);

  // Auth & Passport State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [passport, setPassport] = useState<UserPassport | null>(null);

  // Planner State
  const [currentPlan, setCurrentPlan] = useState<GeneratedPlan | null>(null);
  const [replanData, setReplanData] = useState<ReplanResult | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isReplanning, setIsReplanning] = useState(false);
  const [aiSource, setAiSource] = useState<'gemini' | 'local'>('local');

  // Modal Visibility State
  const [showDataSources, setShowDataSources] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showPassport, setShowPassport] = useState(false);
  const [showWhatIf, setShowWhatIf] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [isOnboarding, setIsOnboarding] = useState(false);

  // Notification Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Initial Data Fetching
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [citiesRes, meRes, placesRes, hazardsRes, weatherRes, healthRes, savedRes] = await Promise.allSettled([
          api.getCities(),
          api.getMe(),
          api.getPlaces({ city: currentCity, pageSize: 50 }),
          api.getHazards(currentCity),
          api.getWeather(currentCityCoords[0], currentCityCoords[1]),
          api.getHealth(),
          api.getSavedPlaces(),
        ]);

        if (citiesRes.status === 'fulfilled') {
          setAvailableCities(citiesRes.value.items || []);
        }

        if (meRes.status === 'fulfilled') {
          setCurrentUser(meRes.value.user);
          if (meRes.value.passport) {
            setPassport(meRes.value.passport);
            if (meRes.value.passport.default_city && meRes.value.passport.default_city !== currentCity) {
              const targetCity = meRes.value.passport.default_city;
              setCurrentCity(targetCity);
            }
          }
        }

        if (placesRes.status === 'fulfilled') setPlaces(placesRes.value.items || []);
        if (hazardsRes.status === 'fulfilled') setHazards(hazardsRes.value.items || []);
        if (weatherRes.status === 'fulfilled') setWeather(weatherRes.value);
        if (healthRes.status === 'fulfilled') {
          setDataSources(healthRes.value.providers || []);
          const geminiProvider = healthRes.value.providers?.find(p => p.name.includes('Gemini'));
          if (geminiProvider && geminiProvider.provider_type === 'live') {
            setAiSource('gemini');
          }
        }
        if (savedRes.status === 'fulfilled') setSavedPlaces(savedRes.value.items || []);
      } catch (err) {
        console.error('Initialization error:', err);
      }
    };

    loadInitialData();
  }, []);

  // Handle Switching Destination City
  const handleSelectCity = async (city: CityInfo) => {
    setCurrentCity(city.name);
    setCurrentCityCoords([city.lat, city.lng]);
    setSelectedPlace(null);

    try {
      const [placesRes, hazardsRes, weatherRes] = await Promise.allSettled([
        api.getPlaces({ city: city.name, pageSize: 50 }),
        api.getHazards(city.name),
        api.getWeather(city.lat, city.lng),
      ]);

      if (placesRes.status === 'fulfilled') setPlaces(placesRes.value.items || []);
      if (hazardsRes.status === 'fulfilled') setHazards(hazardsRes.value.items || []);
      if (weatherRes.status === 'fulfilled') setWeather(weatherRes.value);

      showToast(`Switched destination to ${city.name}`);
    } catch (err) {
      console.error('Error switching city:', err);
    }
  };

  // Generate Itinerary from Natural Prompt
  const handleGeneratePlan = async (
    promptText: string,
    customConstraints?: Partial<GeneratedPlan['constraintsUsed']>
  ) => {
    setIsGenerating(true);
    try {
      const effectivePrompt = (promptText || '').trim() || `Explore best of ${currentCity}`;
      let parsedConstraints: GeneratedPlan['constraintsUsed'];

      try {
        const parsed = await api.parsePrompt(effectivePrompt);
        parsedConstraints = parsed.constraints;
        setAiSource(parsed.source);
      } catch {
        parsedConstraints = {
          budget_inr: 600,
          hours: 4,
          interests: ['heritage', 'street food'],
          travel_mode: 'foot-walking',
          pace: 'moderate',
          accessibility: [],
          mood: 'curious',
          group_size: 1,
          start_location: 'Central Downtown',
          city: currentCity,
        };
        setAiSource('local');
      }

      let constraints: GeneratedPlan['constraintsUsed'];

      if (customConstraints && Object.keys(customConstraints).length > 0) {
        constraints = {
          ...parsedConstraints,
          ...customConstraints,
          city: currentCity,
        };
      } else {
        constraints = {
          ...parsedConstraints,
          city: currentCity,
          budget_inr: passport?.budget_inr || parsedConstraints.budget_inr,
          travel_mode: passport?.travel_mode || parsedConstraints.travel_mode,
          pace: passport?.pace || parsedConstraints.pace,
          accessibility: passport?.accessibility?.length ? passport.accessibility : parsedConstraints.accessibility,
        };
      }

      const plan = await api.generatePlan({
        constraints,
        lang: (i18n.language as any) || 'en',
        startTime: '10:00',
      });

      if (plan.aiSource) {
        setAiSource(plan.aiSource);
      }
      setCurrentPlan(plan);
      showToast(`Generated: ${plan.title} (${plan.stops.length} stops in ${plan.city})`);
    } catch (err: any) {
      console.error(err);
      showToast('Error generating plan. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Trigger Plan B Replanning
  const handleReplan = async (strategy: 'avoid_crowds' | 'budget_saver' | 'alternative_stops') => {
    if (!currentPlan) return;
    setIsReplanning(true);
    try {
      const replanRes = await api.replan({
        plan: currentPlan,
        strategy,
        lang: (i18n.language as any) || 'en',
      });
      setReplanData(replanRes);
    } catch (err) {
      console.error(err);
      showToast('Replanning failed. Using original itinerary.');
    } finally {
      setIsReplanning(false);
    }
  };

  const applyPlanB = () => {
    if (replanData) {
      setCurrentPlan(replanData.planB);
      setReplanData(null);
      showToast('Plan B successfully applied!');
    }
  };

  // Bookmark Toggle
  const handleToggleSave = async (placeId: string) => {
    const isSaved = savedPlaces.some(p => p.id === placeId);
    try {
      await api.toggleSavePlace(placeId, isSaved);
      if (isSaved) {
        setSavedPlaces(prev => prev.filter(p => p.id !== placeId));
        showToast('Place removed from bookmarks');
      } else {
        const placeObj = places.find(p => p.id === placeId);
        if (placeObj) {
          setSavedPlaces(prev => [...prev, placeObj]);
          showToast('Place saved to bookmarks');
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // WhatsApp Share
  const handleShareWhatsApp = async () => {
    if (!currentPlan) return;
    try {
      const shareRes = await api.shareWhatsApp({
        title: currentPlan.title,
        startTime: currentPlan.startTime,
        endTime: currentPlan.endTime,
        totalCostInr: currentPlan.totalCostInr,
        stops: currentPlan.stops.map(s => ({
          name: s.place.name,
          arrivalTime: s.arrivalTime,
          costInr: s.costInr,
          whyThis: s.whyThis,
        })),
        tagline: currentPlan.tagline,
      });

      // Open WhatsApp URL in new window
      window.open(shareRes.whatsAppUrl, '_blank');
      showToast('WhatsApp share link opened!');
    } catch (err) {
      console.error(err);
    }
  };

  // Auth Handlers
  const handleAuthSuccess = (user: User, isNewRegistration?: boolean) => {
    setCurrentUser(user);
    showToast(`Welcome ${user.name || user.email}!`);
    if (isNewRegistration) {
      setIsOnboarding(true);
      setShowPassport(true);
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
      setCurrentUser(null);
      showToast('Signed out. Continuing in anonymous guest mode.');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-white">
      {/* Persistent DEMO DATA Ribbon & Safety Disclaimer */}
      <DemoRibbon />

      {/* Main Navigation with Multi-City & Auth */}
      <Navbar
        onOpenDataSources={() => setShowDataSources(true)}
        onOpenSaved={() => setShowSaved(true)}
        onOpenReport={() => setShowReport(true)}
        onOpenAdmin={() => setShowAdmin(true)}
        onOpenPassport={() => {
          setIsOnboarding(false);
          setShowPassport(true);
        }}
        onOpenAuth={() => setShowAuth(true)}
        onLogout={handleLogout}
        currentUser={currentUser}
        currentCity={currentCity}
        onSelectCity={handleSelectCity}
        availableCities={availableCities}
        savedCount={savedPlaces.length}
      />

      {/* Main App Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        {/* Top Control Section: Search Bar & Weather Glance */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
          <div className="lg:col-span-2">
            <PlanPromptBar
              onGeneratePlan={handleGeneratePlan}
              isLoading={isGenerating}
              aiSource={aiSource}
              cityName={currentCity}
              onOpenAiSettings={() => setShowGeminiKey(true)}
            />
          </div>
          <div>
            <WeatherWidget weather={weather} />
          </div>
        </div>

        {/* Action Quick Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-900/60 p-3 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Destination Explorer:</span>
            <span className="font-bold text-cyan-300">{places.length} {currentCity} Spots</span>
            <span className="text-slate-500">•</span>
            <span className="text-rose-400 font-semibold">{hazards.length} Active Alerts (Demo)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCompare(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg border border-slate-700 transition"
            >
              <Scale className="w-3.5 h-3.5 text-cyan-400" />
              <span>Compare Places</span>
            </button>
          </div>
        </div>

        {/* Dual Layout: Interactive Map + Itinerary / Place Catalog */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Map Column (7 cols) */}
          <div className="lg:col-span-7 h-[460px] sm:h-[540px] lg:h-[620px] sticky top-20">
            <MapView
              places={places}
              hazards={hazards}
              plannedStops={currentPlan?.stops || []}
              selectedPlace={selectedPlace}
              onSelectPlace={(p) => setSelectedPlace(p)}
              onSavePlace={handleToggleSave}
              cityCenter={currentCityCoords}
              cityName={currentCity}
            />
          </div>

          {/* Details / Itinerary Column (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {currentPlan ? (
              <ItineraryView
                plan={currentPlan}
                onReplan={handleReplan}
                onSavePlace={handleToggleSave}
                onShareWhatsApp={handleShareWhatsApp}
                onSelectStop={(s) => setSelectedPlace(s.place)}
                onOpenWhatIf={() => setShowWhatIf(true)}
                isReplanning={isReplanning}
              />
            ) : (
              <div className="glass-panel rounded-2xl p-6 text-center space-y-4 border border-slate-800">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center mx-auto shadow-inner pulse-glow">
                  <Compass className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Ready to Pulse Through {currentCity}?
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
                    Type a prompt above (e.g., <em>"Plan my afternoon in {currentCity} for ₹600 with local street food"</em>) or click any pin on the map to inspect historic crowd profiles.
                  </p>
                </div>

                {/* Sample places list preview */}
                <div className="pt-2 text-left space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Featured {currentCity} Curations:
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {places.slice(0, 3).map(p => (
                      <div
                        key={p.id}
                        onClick={() => setSelectedPlace(p)}
                        className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition flex items-center justify-between text-xs"
                      >
                        <div>
                          <strong className="text-slate-200">{p.name}</strong>
                          <div className="text-[10px] text-slate-400 capitalize">{p.category} • ₹{p.indicative_price_inr}</div>
                        </div>
                        <ConfidenceMeter source={p.source_tag} size="sm" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950/80 py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>CITYPULSE AI — "Explore Freely. Move Smartly. Stay Aware." Multi-City Platform.</span>
          <span className="text-slate-600">
            Open-Meteo • OpenRouteService • Nominatim • Leaflet • Gemini
          </span>
        </div>
      </footer>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-cyan-500/50 text-cyan-200 text-xs px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 text-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modals & Drawers */}
      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      <GeminiKeyModal
        isOpen={showGeminiKey}
        onClose={() => setShowGeminiKey(false)}
        onSuccess={() => {
          setAiSource('gemini');
          showToast('Gemini AI activated! All plan generations now use live Gemini.');
        }}
      />

      <PassportModal
        isOpen={showPassport}
        onClose={() => {
          setShowPassport(false);
          setIsOnboarding(false);
        }}
        passport={passport}
        onSave={(updated) => {
          setPassport(updated);
          if (updated.default_city && updated.default_city !== currentCity) {
            const found = availableCities.find(c => c.name.toLowerCase() === updated.default_city.toLowerCase());
            if (found) handleSelectCity(found);
          }
          showToast('Urban Pulse Passport saved!');
        }}
        availableCities={availableCities}
        isOnboarding={isOnboarding}
      />

      {currentPlan && (
        <WhatIfSimulatorModal
          isOpen={showWhatIf}
          onClose={() => setShowWhatIf(false)}
          currentPlan={currentPlan}
          onApplySimulatedPlan={(simulated) => {
            setCurrentPlan(simulated);
            showToast('Simulation successfully applied to active plan!');
          }}
        />
      )}

      <PlanDiffModal
        replanData={replanData}
        onClose={() => setReplanData(null)}
        onApplyPlanB={applyPlanB}
      />

      <ReportModal
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        onReportSubmitted={() => {
          showToast('Citizen report submitted for moderation!');
        }}
        initialCoords={selectedPlace ? { lat: selectedPlace.lat, lng: selectedPlace.lng } : undefined}
      />

      <AdminModal
        isOpen={showAdmin}
        onClose={() => setShowAdmin(false)}
      />

      <DataSourcesModal
        isOpen={showDataSources}
        onClose={() => setShowDataSources(false)}
        sources={dataSources}
      />

      <SavedDrawer
        isOpen={showSaved}
        onClose={() => setShowSaved(false)}
        savedPlaces={savedPlaces}
        onRemove={handleToggleSave}
        onSelectPlace={(p) => setSelectedPlace(p)}
      />

      <CompareModal
        isOpen={showCompare}
        onClose={() => setShowCompare(false)}
        places={places}
      />
    </div>
  );
};

export default App;
