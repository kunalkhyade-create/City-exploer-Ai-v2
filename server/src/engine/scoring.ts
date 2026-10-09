import { Place } from '../providers/places.js';
import { PlanConstraints } from '../providers/ai.js';
import { Coordinates, haversineDistanceMeters, estimateTravelMinutes } from '../utils/geo.js';

export interface ActiveHazard {
  id: string;
  lat: number;
  lng: number;
  radius_m: number;
  confidence: number;
  category: string;
}

export interface CandidateScore {
  place: Place;
  compositeScore: number;
  factors: {
    interest_match: number;
    budget_fit: number;
    travel_time: number;
    hour_suitability: number;
    weather_suitability: number;
    hazard_penalty: number;
  };
  travelMinutes: number;
  distanceMeters: number;
}

export function scorePlaceCandidate(
  place: Place,
  currentLocation: Coordinates,
  currentHour: number,
  remainingBudgetInr: number,
  constraints: PlanConstraints,
  hazards: ActiveHazard[],
  rainProbability: number = 0
): CandidateScore | null {
  // Hard accessibility filter
  if (constraints.accessibility.includes('step_free') && !place.step_free) {
    return null; // Excluded
  }

  // 1. Interest match (0 to 1)
  let interest_match = 0.3;
  if (constraints.interests.includes(place.category)) {
    interest_match = 1.0;
  } else if (
    (constraints.interests.includes('street food') && place.category === 'culture') ||
    (constraints.interests.includes('heritage') && place.category === 'culture')
  ) {
    interest_match = 0.6;
  }

  // 2. Budget fit (0 to 1)
  let budget_fit = 1.0;
  if (place.indicative_price_inr > remainingBudgetInr) {
    budget_fit = Math.max(0, 1 - (place.indicative_price_inr - remainingBudgetInr) / Math.max(100, remainingBudgetInr));
  }

  // 3. Travel time (0 to 1)
  const distMeters = haversineDistanceMeters(currentLocation, { lat: place.lat, lng: place.lng });
  const travelMinutes = estimateTravelMinutes(distMeters, constraints.travel_mode);
  const travel_time = Math.max(0.1, Math.min(1.0, 1 - travelMinutes / 70));

  // 4. Hour crowd suitability (0 to 1)
  const validHour = Math.min(23, Math.max(0, currentHour));
  const crowd = place.hourly_crowd[validHour] ?? 0.5;
  // If user mood is peaceful/relaxed, lower crowd is rewarded; if buzzing, moderate crowd is ok
  const hour_suitability = constraints.mood === 'buzzing'
    ? 1 - Math.abs(crowd - 0.7)
    : 1 - crowd * 0.8;

  // 5. Weather suitability (0 to 1)
  let weather_suitability = 1.0;
  if (rainProbability > 40) {
    const isOutdoor = place.category === 'nature' || place.id.includes('sinhagad') || place.id.includes('tekdi');
    if (isOutdoor) {
      weather_suitability = Math.max(0.2, 1 - (rainProbability / 100));
    }
  }

  // 6. Hazard penalty (0 to 1)
  let maxHazardPenalty = 0;
  for (const h of hazards) {
    const distToHazard = haversineDistanceMeters({ lat: place.lat, lng: place.lng }, { lat: h.lat, lng: h.lng });
    const buffer = h.radius_m * 1.5;
    if (distToHazard < buffer) {
      const severity = (buffer - distToHazard) / buffer;
      const penalty = severity * h.confidence;
      if (penalty > maxHazardPenalty) {
        maxHazardPenalty = penalty;
      }
    }
  }

  const compositeScore = Math.max(
    0,
    Math.min(
      1.0,
      0.25 * interest_match +
      0.20 * hour_suitability +
      0.20 * travel_time +
      0.15 * budget_fit +
      0.10 * weather_suitability -
      0.20 * maxHazardPenalty
    )
  );

  return {
    place,
    compositeScore: Number(compositeScore.toFixed(3)),
    factors: {
      interest_match: Number(interest_match.toFixed(2)),
      budget_fit: Number(budget_fit.toFixed(2)),
      travel_time: Number(travel_time.toFixed(2)),
      hour_suitability: Number(hour_suitability.toFixed(2)),
      weather_suitability: Number(weather_suitability.toFixed(2)),
      hazard_penalty: Number(maxHazardPenalty.toFixed(2)),
    },
    travelMinutes,
    distanceMeters: distMeters,
  };
}
