import React from 'react';
import { CloudRain, Sun, Wind, Droplets, AlertTriangle } from 'lucide-react';
import { WeatherData } from '../types';

interface WeatherWidgetProps {
  weather: WeatherData | null;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ weather }) => {
  if (!weather || !weather.available) {
    return (
      <div className="glass-card rounded-xl p-3 sm:p-4 text-xs text-slate-400 border border-slate-800 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
        <span>{weather?.message || 'Live weather service currently unavailable from Open-Meteo.'}</span>
      </div>
    );
  }

  const isRainy = (weather.weather_code && weather.weather_code >= 51) || weather.condition?.toLowerCase().includes('rain');

  return (
    <div className="glass-card rounded-xl p-3 sm:p-4 border border-slate-800/80 bg-slate-900/60">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isRainy ? (
            <CloudRain className="w-5 h-5 text-sky-400 animate-bounce" />
          ) : (
            <Sun className="w-5 h-5 text-amber-400" />
          )}
          <div>
            <h4 className="text-xs sm:text-sm font-semibold text-slate-100">
              Pune Pulse Weather
            </h4>
            <span className="text-[10px] text-emerald-400 font-medium">Live Open-Meteo (Cached 10m)</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-lg sm:text-xl font-extrabold text-orange-400">
            {weather.temperature_c}°C
          </span>
          <p className="text-[10px] text-slate-400">{weather.condition}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 bg-slate-950/40 p-2 rounded-lg">
        <div className="flex items-center gap-1.5">
          <Droplets className="w-3.5 h-3.5 text-sky-400" />
          <span>Humidity: {weather.humidity_percent}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Wind className="w-3.5 h-3.5 text-teal-400" />
          <span>Wind: {weather.wind_speed_kmh} km/h</span>
        </div>
      </div>

      {weather.rain_summary && (
        <p className="text-[11px] text-slate-300 mt-2 italic flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 inline-block" />
          {weather.rain_summary}
        </p>
      )}
    </div>
  );
};
