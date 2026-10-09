import { logger } from '../utils/logger.js';
import { registry } from './registry.js';

export interface WeatherData {
  available: boolean;
  temperature_c?: number;
  humidity_percent?: number;
  condition?: string;
  weather_code?: number;
  wind_speed_kmh?: number;
  rain_probability_12h?: number[]; // hourly 12 values
  rain_summary?: string;
  cached_at?: string;
  message?: string;
  source: 'open-meteo' | 'fallback';
}

let cachedWeather: { data: WeatherData; timestamp: number } | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function weatherCodeToCondition(code: number): string {
  if (code === 0) return 'Clear Sky';
  if (code === 1 || code === 2) return 'Mainly Clear / Partly Cloudy';
  if (code === 3) return 'Overcast';
  if (code >= 45 && code <= 48) return 'Foggy / Hazy';
  if (code >= 51 && code <= 55) return 'Drizzle';
  if (code >= 61 && code <= 65) return 'Rain Showers';
  if (code >= 80 && code <= 82) return 'Heavy Monsoon Showers';
  if (code >= 95) return 'Thunderstorm';
  return 'Cloudy';
}

export const weatherProvider = {
  async getWeather(lat = 18.5204, lng = 73.8567): Promise<WeatherData> {
    const now = Date.now();
    if (cachedWeather && now - cachedWeather.timestamp < CACHE_TTL_MS) {
      return cachedWeather.data;
    }

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&hourly=precipitation_probability,rain&timezone=Asia%2FKolkata&forecast_hours=12`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) {
        throw new Error(`Open-Meteo returned status ${res.status}`);
      }
      const data = await res.json() as {
        current?: {
          temperature_2m: number;
          relative_humidity_2m: number;
          weather_code: number;
          wind_speed_10m: number;
        };
        hourly?: {
          precipitation_probability: number[];
        };
      };

      if (!data.current) {
        throw new Error('Current weather block missing in Open-Meteo response');
      }

      const rainProbs = data.hourly?.precipitation_probability?.slice(0, 12) || [];
      const maxRainProb = rainProbs.length > 0 ? Math.max(...rainProbs) : 0;
      let rainSummary = 'Dry conditions expected across Pune';
      if (maxRainProb > 60) {
        rainSummary = 'High likelihood of rain in upcoming hours; carry an umbrella or visit indoor spots';
      } else if (maxRainProb > 30) {
        rainSummary = 'Moderate chance of passing showers';
      }

      const result: WeatherData = {
        available: true,
        temperature_c: Math.round(data.current.temperature_2m),
        humidity_percent: Math.round(data.current.relative_humidity_2m),
        condition: weatherCodeToCondition(data.current.weather_code),
        weather_code: data.current.weather_code,
        wind_speed_kmh: Math.round(data.current.wind_speed_10m),
        rain_probability_12h: rainProbs,
        rain_summary: rainSummary,
        cached_at: new Date().toISOString(),
        source: 'open-meteo',
      };

      cachedWeather = { data: result, timestamp: now };
      registry.recordSuccess('WeatherProvider (Open-Meteo)', 'live');
      return result;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      logger.warn(`Open-Meteo fetch failed: ${errMsg}`);
      registry.recordError('WeatherProvider (Open-Meteo)', errMsg);

      return {
        available: false,
        message: 'Live weather service currently unavailable from Open-Meteo. Rain conditions cannot be confirmed.',
        source: 'fallback',
      };
    } finally {
      clearTimeout(timeout);
    }
  },
};
