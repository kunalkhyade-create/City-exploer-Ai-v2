import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { Coordinates, haversineDistanceMeters, estimateTravelMinutes } from '../utils/geo.js';
import { registry } from './registry.js';

export type RouteProfile = 'foot-walking' | 'cycling-regular' | 'driving-car';

export interface RouteResult {
  distance_meters: number;
  duration_minutes: number;
  geometry: {
    type: 'LineString';
    coordinates: [number, number][]; // [lng, lat]
  };
  label: string;
  source: 'openrouteservice' | 'estimate';
  mode: RouteProfile;
}

interface CacheEntry {
  result: RouteResult;
  timestamp: number;
}

const routeCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export const routingProvider = {
  async getRoute(
    origin: Coordinates,
    destination: Coordinates,
    profile: RouteProfile = 'foot-walking'
  ): Promise<RouteResult> {
    const cacheKey = `${profile}:${origin.lat.toFixed(4)},${origin.lng.toFixed(4)}->${destination.lat.toFixed(4)},${destination.lng.toFixed(4)}`;
    const cached = routeCache.get(cacheKey);
    const now = Date.now();

    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      return cached.result;
    }

    if (!env.ORS_API_KEY) {
      const fallback = createHaversineFallback(origin, destination, profile);
      registry.recordSuccess('RoutingProvider (OpenRouteService)', 'fallback');
      return fallback;
    }

    const url = `https://api.openrouteservice.org/v2/directions/${profile}/geojson`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': env.ORS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coordinates: [
            [origin.lng, origin.lat],
            [destination.lng, destination.lat],
          ],
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`OpenRouteService HTTP error ${res.status}`);
      }

      const data = await res.json() as {
        features?: Array<{
          geometry: {
            type: 'LineString';
            coordinates: [number, number][];
          };
          properties?: {
            summary?: {
              distance: number; // in meters
              duration: number; // in seconds
            };
          };
        }>;
      };

      const feature = data.features?.[0];
      if (!feature || !feature.geometry) {
        throw new Error('Invalid GeoJSON feature structure from ORS');
      }

      const distanceMeters = Math.round(feature.properties?.summary?.distance || 0);
      const durationSeconds = feature.properties?.summary?.duration || 0;
      const durationMinutes = Math.max(1, Math.round(durationSeconds / 60));

      const result: RouteResult = {
        distance_meters: distanceMeters,
        duration_minutes: durationMinutes,
        geometry: feature.geometry,
        label: 'Live Turn-by-Turn Route',
        source: 'openrouteservice',
        mode: profile,
      };

      routeCache.set(cacheKey, { result, timestamp: now });
      registry.recordSuccess('RoutingProvider (OpenRouteService)', 'live');
      return result;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      logger.warn(`OpenRouteService routing error: ${errMsg}, falling back to Haversine estimate`);
      registry.recordError('RoutingProvider (OpenRouteService)', errMsg);

      const fallback = createHaversineFallback(origin, destination, profile);
      return fallback;
    } finally {
      clearTimeout(timeout);
    }
  },
};

function createHaversineFallback(
  origin: Coordinates,
  destination: Coordinates,
  mode: RouteProfile
): RouteResult {
  const straightDistance = haversineDistanceMeters(origin, destination);
  // Add a 1.25 urban street winding factor for realism in Pune grid
  const urbanDistance = Math.round(straightDistance * 1.25);
  const minutes = estimateTravelMinutes(urbanDistance, mode);

  return {
    distance_meters: urbanDistance,
    duration_minutes: minutes,
    geometry: {
      type: 'LineString',
      coordinates: [
        [origin.lng, origin.lat],
        [destination.lng, destination.lat],
      ],
    },
    label: 'Estimated, not a real route',
    source: 'estimate',
    mode,
  };
}
