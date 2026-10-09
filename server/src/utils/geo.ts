export interface Coordinates {
  lat: number;
  lng: number;
}

// Approximate Pune boundaries
export const PUNE_BOUNDS = {
  minLat: 18.4000,
  maxLat: 18.6600,
  minLng: 73.7000,
  maxLng: 74.0200,
  centerLat: 18.5204,
  centerLng: 73.8567,
};

export function isWithinPune(lat: number, lng: number): boolean {
  return (
    lat >= PUNE_BOUNDS.minLat &&
    lat <= PUNE_BOUNDS.maxLat &&
    lng >= PUNE_BOUNDS.minLng &&
    lng <= PUNE_BOUNDS.maxLng
  );
}

/**
 * Calculates great-circle distance between two points in meters using Haversine formula.
 */
export function haversineDistanceMeters(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const dLng = ((coord2.lng - coord1.lng) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1.lat * Math.PI) / 180) *
      Math.cos((coord2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Estimate travel time in minutes based on distance and mode.
 */
export function estimateTravelMinutes(
  distanceMeters: number,
  mode: 'foot-walking' | 'cycling-regular' | 'driving-car'
): number {
  // Speed in km/h
  let speedKmH = 4.5; // walking
  if (mode === 'cycling-regular') speedKmH = 14;
  if (mode === 'driving-car') speedKmH = 25; // Pune city traffic average

  const km = distanceMeters / 1000;
  const hours = km / speedKmH;
  return Math.max(2, Math.round(hours * 60));
}
