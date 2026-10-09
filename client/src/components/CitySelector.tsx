import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Search,
  Crosshair,
  Star,
  Clock,
  Check,
  ChevronDown,
  X,
  Radio,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  CloudSun,
  Navigation,
} from 'lucide-react';
import { CityInfo } from '../types';

interface CitySelectorProps {
  currentCity: string;
  onSelectCity: (city: CityInfo) => void;
  availableCities: CityInfo[];
}

const STORAGE_KEY_RECENT = 'citypulse_recent_cities';
const STORAGE_KEY_SAVED = 'citypulse_saved_cities';

export const CitySelector: React.FC<CitySelectorProps> = ({
  currentCity,
  onSelectCity,
  availableCities,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentCities, setRecentCities] = useState<string[]>([]);
  const [savedCities, setSavedCities] = useState<string[]>(['Pune']);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Load recently explored & saved destinations
  useEffect(() => {
    try {
      const storedRecent = localStorage.getItem(STORAGE_KEY_RECENT);
      if (storedRecent) setRecentCities(JSON.parse(storedRecent));

      const storedSaved = localStorage.getItem(STORAGE_KEY_SAVED);
      if (storedSaved) setSavedCities(JSON.parse(storedSaved));
    } catch {
      // ignore storage access error
    }
  }, []);

  const handleSelectCity = (city: CityInfo) => {
    // Update recent cities in localStorage
    const updatedRecent = [city.name, ...recentCities.filter(c => c !== city.name)].slice(0, 5);
    setRecentCities(updatedRecent);
    try {
      localStorage.setItem(STORAGE_KEY_RECENT, JSON.stringify(updatedRecent));
    } catch {
      // ignore
    }

    onSelectCity(city);
    setIsOpen(false);
  };

  const toggleSaveCity = (cityName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let updated: string[];
    if (savedCities.includes(cityName)) {
      updated = savedCities.filter(c => c !== cityName);
    } else {
      updated = [...savedCities, cityName];
    }
    setSavedCities(updated);
    try {
      localStorage.setItem(STORAGE_KEY_SAVED, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setIsDetectingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsDetectingLocation(false);
        const { latitude, longitude } = pos.coords;

        // Find closest supported city or create dynamic entry
        let closest = availableCities[0];
        let minDistance = Infinity;

        for (const city of availableCities) {
          const d = Math.hypot(city.lat - latitude, city.lng - longitude);
          if (d < minDistance) {
            minDistance = d;
            closest = city;
          }
        }

        if (closest && minDistance < 1.0) {
          // Within ~100km of a supported city
          handleSelectCity(closest);
        } else {
          // Fallback to closest or custom coordinates
          const dynamicCity: CityInfo = {
            id: 'current_location',
            name: 'Current Vicinity',
            state: 'Nearby Area',
            country: 'Detected Location',
            lat: latitude,
            lng: longitude,
            currency: 'INR',
            timezone: 'Asia/Kolkata',
            coverage: {
              weather: 'live',
              routing: 'live',
              placesCount: 0,
              hazardsCount: 0,
            },
          };
          handleSelectCity(dynamicCity);
        }
      },
      (err) => {
        setIsDetectingLocation(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError('Location permission was denied. You can select any city manually.');
        } else {
          setLocationError('Unable to detect coordinates. Please choose a city below.');
        }
      },
      { timeout: 8000 }
    );
  };

  const filteredCities = availableCities.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCityInfo = availableCities.find(c => c.name.toLowerCase() === currentCity.toLowerCase()) || {
    name: currentCity,
    state: 'Active Destination',
    currency: 'INR',
    coverage: { weather: 'live', routing: 'live', placesCount: 30, hazardsCount: 6 },
  };

  return (
    <div className="relative inline-block text-left">
      {/* Current City Button Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/30 hover:border-cyan-400 text-xs font-semibold text-slate-100 transition shadow-sm group"
        aria-label="Select destination city"
      >
        <MapPin className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
        <span className="font-bold text-cyan-300">{currentCity}</span>
        <span className="text-[10px] text-slate-400 hidden sm:inline">• ₹ INR</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5 group-hover:text-cyan-400 transition" />
      </button>

      {/* Dropdown Modal / Popover */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-950/70 backdrop-blur-sm sm:absolute sm:inset-auto sm:top-10 sm:left-0 sm:pt-0 sm:p-0"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-sm sm:w-96 rounded-2xl bg-slate-900/95 border border-cyan-500/40 shadow-2xl shadow-cyan-950/80 p-4 space-y-3 z-50 text-xs animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-cyan-400" />
                <span className="font-extrabold text-sm text-white">Select Destination City</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search city, town or state..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                autoFocus
              />
            </div>

            {/* Detect Location Button */}
            <button
              type="button"
              onClick={handleDetectLocation}
              disabled={isDetectingLocation}
              className="w-full py-2 px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-semibold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {isDetectingLocation ? (
                <span className="inline-block animate-spin rounded-full h-3 w-3 border-2 border-cyan-400 border-t-transparent" />
              ) : (
                <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
              )}
              <span>{isDetectingLocation ? 'Detecting coordinates...' : 'Detect Current Location'}</span>
            </button>

            {locationError && (
              <p className="text-[11px] text-amber-400/90 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                {locationError}
              </p>
            )}

            {/* Quick Pills for Recent / Saved */}
            {(savedCities.length > 0 || recentCities.length > 0) && !searchQuery && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Quick Destinations:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from(new Set([...savedCities, ...recentCities])).map(cityName => {
                    const city = availableCities.find(c => c.name.toLowerCase() === cityName.toLowerCase());
                    if (!city) return null;
                    const isActive = currentCity.toLowerCase() === city.name.toLowerCase();
                    return (
                      <button
                        key={city.id}
                        type="button"
                        onClick={() => handleSelectCity(city)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border flex items-center gap-1 transition ${
                          isActive
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-sm'
                            : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {savedCities.includes(city.name) && (
                          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                        )}
                        <span>{city.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* City List */}
            <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
              {filteredCities.length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-xs">
                  No direct matches found. Try searching by state or country.
                </div>
              ) : (
                filteredCities.map(city => {
                  const isActive = currentCity.toLowerCase() === city.name.toLowerCase();
                  const isSaved = savedCities.includes(city.name);
                  return (
                    <div
                      key={city.id}
                      onClick={() => handleSelectCity(city)}
                      className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                        isActive
                          ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-sm'
                          : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/70 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <strong className="text-xs font-bold text-slate-100">{city.name}</strong>
                          <span className="text-[10px] text-slate-400">{city.state}, {city.country}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <span className="flex items-center gap-0.5">
                            <CloudSun className="w-2.5 h-2.5 text-cyan-400" />
                            <span>Weather: Live</span>
                          </span>
                          <span>•</span>
                          <span>{city.coverage.placesCount > 0 ? `${city.coverage.placesCount} spots` : 'Dynamic Discovery'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => toggleSaveCity(city.name, e)}
                          title={isSaved ? 'Unstar city' : 'Star destination'}
                          className="p-1 text-slate-400 hover:text-amber-400 transition"
                        >
                          <Star className={`w-3.5 h-3.5 ${isSaved ? 'fill-amber-400 text-amber-400' : ''}`} />
                        </button>
                        {isActive && <Check className="w-4 h-4 text-cyan-400 font-bold" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* City Coverage Footer */}
            <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
              <span>Coverage: Open-Meteo & ORS Global</span>
              <span className="text-cyan-400 font-medium">Pune • Mumbai • Delhi • Bengaluru +</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
