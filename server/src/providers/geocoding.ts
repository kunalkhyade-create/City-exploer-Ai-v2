import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { Coordinates } from '../utils/geo.js';
import { registry } from './registry.js';

export interface GeocodeResult {
  query: string;
  lat: number;
  lng: number;
  displayName: string;
  source: 'nominatim' | 'cache' | 'fallback';
}

interface CacheEntry {
  result: GeocodeResult;
  timestamp: number;
}

const geocodeCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// 1 request / second throttling queue
let lastRequestTime = 0;
const requestQueue: Array<() => void> = [];
let isProcessingQueue = false;

function processQueue(): void {
  if (isProcessingQueue || requestQueue.length === 0) return;
  isProcessingQueue = true;

  const now = Date.now();
  const timeSinceLast = now - lastRequestTime;
  const delay = Math.max(0, 1000 - timeSinceLast);

  setTimeout(() => {
    const nextTask = requestQueue.shift();
    lastRequestTime = Date.now();
    if (nextTask) nextTask();
    isProcessingQueue = false;
    if (requestQueue.length > 0) {
      processQueue();
    }
  }, delay);
}

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    requestQueue.push(async () => {
      try {
        const res = await task();
        resolve(res);
      } catch (err) {
        reject(err);
      }
    });
    processQueue();
  });
}

// Known city landmarks fallback dictionary
const KNOWN_LOCATIONS: Record<string, Coordinates> = {
  // Pune
  'fc road': { lat: 18.5283, lng: 73.8409 },
  'deccan': { lat: 18.5170, lng: 73.8410 },
  'jm road': { lat: 18.5255, lng: 73.8482 },
  'shaniwar wada': { lat: 18.5196, lng: 73.8553 },
  'swargate': { lat: 18.5018, lng: 73.8582 },
  'kothrud': { lat: 18.5074, lng: 73.8077 },
  'koregaon park': { lat: 18.5372, lng: 73.8967 },
  'kp': { lat: 18.5372, lng: 73.8967 },
  'pune station': { lat: 18.5284, lng: 73.8742 },
  'pune': { lat: 18.5204, lng: 73.8567 },
  // Mumbai
  'mumbai': { lat: 19.0760, lng: 72.8777 },
  'gateway of india': { lat: 18.9220, lng: 72.8347 },
  'marine drive': { lat: 18.9432, lng: 72.8230 },
  'bandra': { lat: 19.0596, lng: 72.8295 },
  'colaba': { lat: 18.9067, lng: 72.8147 },
  // Delhi
  'delhi': { lat: 28.6139, lng: 77.2090 },
  'connaught place': { lat: 28.6315, lng: 77.2167 },
  'red fort': { lat: 28.6562, lng: 77.2410 },
  'india gate': { lat: 28.6129, lng: 77.2295 },
  // Bengaluru
  'bengaluru': { lat: 12.9716, lng: 77.5946 },
  'bangalore': { lat: 12.9716, lng: 77.5946 },
  'indiranagar': { lat: 12.9784, lng: 77.6408 },
  'koramangala': { lat: 12.9352, lng: 77.6245 },
  // Jaipur
  'jaipur': { lat: 26.9124, lng: 75.7873 },
  'hawa mahal': { lat: 26.9239, lng: 75.8267 },
  // Global
  'london': { lat: 51.5074, lng: -0.1278 },
  'tokyo': { lat: 35.6762, lng: 139.6503 },
  'paris': { lat: 48.8566, lng: 2.3522 },
  'new york': { lat: 40.7128, lng: -74.0060 },
  'goa': { lat: 15.2993, lng: 74.1240 },
};

export const geocodingProvider = {
  async geocode(query: string, cityContext?: string): Promise<GeocodeResult> {
    const normalized = query.trim().toLowerCase();
    const cacheKey = `${cityContext ? cityContext.toLowerCase() + ':' : ''}${normalized}`;
    const now = Date.now();

    const cached = geocodeCache.get(cacheKey);
    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      return { ...cached.result, source: 'cache' };
    }

    // Try Nominatim with appropriate geographical context
    return enqueue(async () => {
      const userAgent = env.NOMINATIM_USER_AGENT || 'CityPulseAI/2.0';
      
      let searchQuery = query;
      if (cityContext && !normalized.includes(cityContext.toLowerCase())) {
        searchQuery = `${query}, ${cityContext}`;
      }
      
      const encodedQuery = encodeURIComponent(searchQuery);
      const url = `https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&limit=1`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      try {
        const res = await fetch(url, {
          headers: {
            'User-Agent': userAgent,
            'Accept-Language': 'en',
          },
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`Nominatim error ${res.status}`);
        }

        const data = await res.json() as Array<{
          lat: string;
          lon: string;
          display_name: string;
        }>;

        if (data && data.length > 0) {
          const first = data[0];
          const result: GeocodeResult = {
            query,
            lat: parseFloat(first.lat),
            lng: parseFloat(first.lon),
            displayName: first.display_name,
            source: 'nominatim',
          };
          geocodeCache.set(cacheKey, { result, timestamp: now });
          registry.recordSuccess('GeocodingProvider (Nominatim)', 'live');
          return result;
        }

        throw new Error('No geocoding results found');
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        logger.warn(`Nominatim geocoding failed: ${errMsg}, checking fallback dictionary`);
        registry.recordError('GeocodingProvider (Nominatim)', errMsg);

        // Check dictionary fallback
        for (const [key, coords] of Object.entries(KNOWN_LOCATIONS)) {
          if (normalized.includes(key)) {
            const result: GeocodeResult = {
              query,
              lat: coords.lat,
              lng: coords.lng,
              displayName: `${query} (${key.toUpperCase()})`,
              source: 'fallback',
            };
            geocodeCache.set(cacheKey, { result, timestamp: now });
            return result;
          }
        }

        // If cityContext is provided, check if cityContext is in KNOWN_LOCATIONS
        if (cityContext) {
          const cityKey = cityContext.toLowerCase();
          if (KNOWN_LOCATIONS[cityKey]) {
            const coords = KNOWN_LOCATIONS[cityKey];
            return {
              query,
              lat: coords.lat,
              lng: coords.lng,
              displayName: `${query}, ${cityContext}`,
              source: 'fallback',
            };
          }
        }

        // Default to Pune Center if all else fails
        return {
          query,
          lat: 18.5204,
          lng: 73.8567,
          displayName: `${query}, Pune, Maharashtra`,
          source: 'fallback',
        };
      } finally {
        clearTimeout(timeout);
      }
    });
  },
};
