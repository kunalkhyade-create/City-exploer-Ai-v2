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

import { Place, Hazard, WeatherData, GeneratedPlan, ReplanResult, DataSourceStatus } from './types';
import { api } from './api/client';

export const App: React.FC = () => {
  const { t, i18n } = useTranslation();

  // Core Data State
  const [places, setPlaces] = useState<Place[]>([]);
  const [hazards, setHazards] = useState<Hazard[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [dataSources, setDataSources] = useState<DataSourceStatus[]>([]);
  const [savedPlaces, setSavedPlaces] = useState<Place[]>([]);

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
        const [placesRes, hazardsRes, weatherRes, healthRes, savedRes] = await Promise.allSettled([
          api.getPlaces({ pageSize: 50 }),
          api.getHazards(),
          api.getWeather(),
          api.getHealth(),
          api.getSavedPlaces(),
        ]);

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

  // Generate Itinerary from Natural Prompt
  const handleGeneratePlan = async (
    promptText: string,
    customConstraints?: Partial<GeneratedPlan['constraintsUsed']>
  ) => {
    setIsGenerating(true);
    try {
      let constraints: GeneratedPlan['constraintsUsed'];

      if (customConstraints && Object.keys(customConstraints).length > 0) {
        // Use custom overrides merged with defaults
        const parsed = await api.parsePrompt(promptText);
        constraints = {
          ...parsed.constraints,
          ...customConstraints,
        };
        setAiSource(parsed.source);
      } else {
        const parsed = await api.parsePrompt(promptText);
        constraints = parsed.constraints;
        setAiSource(parsed.source);
      }

      const plan = await api.generatePlan({
        constraints,
        lang: (i18n.language as any) || 'en',
        startTime: '10:00',
      });

      setCurrentPlan(plan);
      showToast(`Generated: ${plan.title} (${plan.stops.length} stops)`);
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

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-orange-500 selection:text-white">
      {/* Persistent DEMO DATA Ribbon & Safety Disclaimer */}
      <DemoRibbon />

      {/* Main Navigation */}
      <Navbar
        onOpenDataSources={() => setShowDataSources(true)}
        onOpenSaved={() => setShowSaved(true)}
        onOpenReport={() => setShowReport(true)}
        onOpenAdmin={() => setShowAdmin(true)}
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
            />
          </div>
          <div>
            <WeatherWidget weather={weather} />
          </div>
        </div>

        {/* Action Quick Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-900/60 p-3 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Demo Landmark Explorer:</span>
            <span className="font-bold text-slate-200">{places.length} Pune Spots</span>
            <span className="text-slate-500">•</span>
            <span className="text-rose-400 font-semibold">{hazards.length} Active Alerts (Demo)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCompare(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg border border-slate-700 transition"
            >
              <Scale className="w-3.5 h-3.5 text-orange-400" />
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
                isReplanning={isReplanning}
              />
            ) : (
              <div className="glass-panel rounded-2xl p-6 text-center space-y-4 border border-slate-800">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/40 text-orange-400 flex items-center justify-center mx-auto shadow-inner pulse-glow">
                  <Compass className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Ready to Pulse Through Pune?
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
                    Type a prompt above (e.g., <em>"Plan my afternoon in Pune for ₹500 near FC Road with street food"</em>) or click any pin on the map to inspect historic crowd profiles.
                  </p>
                </div>

                {/* Sample places list preview */}
                <div className="pt-2 text-left space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Featured Pune Curations:
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {places.slice(0, 3).map(p => (
                      <div
                        key={p.id}
                        onClick={() => setSelectedPlace(p)}
                        className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-orange-500/50 cursor-pointer transition flex items-center justify-between text-xs"
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
          <span>CITYPULSE AI — "Plan around the city's pulse." Demo city: Pune, India.</span>
          <span className="text-slate-600">
            Open-Meteo • OpenRouteService • Nominatim • Leaflet • Gemini
          </span>
        </div>
      </footer>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-orange-500/50 text-orange-200 text-xs px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 text-orange-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modals & Drawers */}
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
