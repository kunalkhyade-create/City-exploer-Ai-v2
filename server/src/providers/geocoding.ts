import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { Coordinates, PUNE_BOUNDS } from '../utils/geo.js';
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

// Known Pune landmarks fallback dictionary
const PUNE_KNOWN_LOCATIONS: Record<string, Coordinates> = {
  'fc road': { lat: 18.5283, lng: 73.8409 },
  'deccan': { lat: 18.5170, lng: 73.8410 },
  'jm road': { lat: 18.5255, lng: 73.8482 },
  'shaniwar wada': { lat: 18.5196, lng: 73.8553 },
  'swargate': { lat: 18.5018, lng: 73.8582 },
  'kothrud': { lat: 18.5074, lng: 73.8077 },
  'koregaon park': { lat: 18.5372, lng: 73.8967 },
  'kp': { lat: 18.5372, lng: 73.8967 },
  'pune station': { lat: 18.5284, lng: 73.8742 },
  'camp': { lat: 18.5173, lng: 73.8767 },
  'baner': { lat: 18.5590, lng: 73.7868 },
  'viman nagar': { lat: 18.5679, lng: 73.9143 },
  'shivaji nagar': { lat: 18.5314, lng: 73.8446 },
};

export const geocodingProvider = {
  async geocode(query: string): Promise<GeocodeResult> {
    const normalized = query.trim().toLowerCase();
    const cacheKey = normalized;
    const now = Date.now();

    const cached = geocodeCache.get(cacheKey);
    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      return { ...cached.result, source: 'cache' };
    }

    // Try Nominatim with Pune viewbox bias
    return enqueue(async () => {
      const userAgent = env.NOMINATIM_USER_AGENT || 'CityPulseAI-Pune/1.0';
      const encodedQuery = encodeURIComponent(`${query}, Pune, Maharashtra, India`);
      const url = `https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&limit=1&viewbox=73.7000,18.6600,74.0200,18.4000&bounded=0`;

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
        logger.warn(`Nominatim geocoding failed: ${errMsg}, using Pune fallback`);
        registry.recordError('GeocodingProvider (Nominatim)', errMsg);

        // Check dictionary fallback
        for (const [key, coords] of Object.entries(PUNE_KNOWN_LOCATIONS)) {
          if (normalized.includes(key)) {
            const result: GeocodeResult = {
              query,
              lat: coords.lat,
              lng: coords.lng,
              displayName: `${query} (Pune Landmark)`,
              source: 'fallback',
            };
            geocodeCache.set(cacheKey, { result, timestamp: now });
            return result;
          }
        }

        // Default to Pune Center
        return {
          query,
          lat: PUNE_BOUNDS.centerLat,
          lng: PUNE_BOUNDS.centerLng,
          displayName: `${query}, Pune, Maharashtra`,
          source: 'fallback',
        };
      } finally {
        clearTimeout(timeout);
      }
    });
  },
};
