import { Place, placesProvider } from '../providers/places.js';
import { PlanConstraints, aiProvider } from '../providers/ai.js';
import { ActiveHazard, scorePlaceCandidate } from './scoring.js';
import { Coordinates } from '../utils/geo.js';
import { routingProvider, RouteResult } from '../providers/routing.js';
import { weatherProvider } from '../providers/weather.js';
import { geocodingProvider } from '../providers/geocoding.js';
import { db } from '../db/sqlite.js';
import { env } from '../config/env.js';

export interface PlannedStop {
  stopOrder: number;
  place: Place;
  arrivalTime: string;
  departureTime: string;
  durationMinutes: number;
  costInr: number;
  whyThis: string;
  score: number;
  scoreFactors: {
    interest_match: number;
    budget_fit: number;
    travel_time: number;
    hour_suitability: number;
    weather_suitability: number;
    hazard_penalty: number;
  };
  travelFromPrev: {
    distanceMeters: number;
    durationMinutes: number;
    mode: string;
    routeLabel: string;
    geometry?: RouteResult['geometry'];
  } | null;
}

export interface GeneratedPlan {
  id: string;
  title: string;
  tagline: string;
  city: 'Pune';
  currency: 'INR';
  startTime: string;
  endTime: string;
  totalDurationMinutes: number;
  totalCostInr: number;
  remainingBudgetInr: number;
  stops: PlannedStop[];
  routeLegs: RouteResult[];
  constraintsUsed: PlanConstraints;
  weatherSummary: string;
  aiSource: 'gemini' | 'local';
  createdAt: string;
}

function formatTime(hour: number, minute: number): string {
  const h = String(hour % 24).padStart(2, '0');
  const m = String(minute).padStart(2, '0');
  return `${h}:${m}`;
}

export const planner = {
  async generatePlan(
    constraints: PlanConstraints,
    lang: 'en' | 'hi' | 'mr' = 'en',
    startTimeStr: string = '10:00'
  ): Promise<GeneratedPlan> {
    // 1. Geocode start location
    const startGeo = await geocodingProvider.geocode(constraints.start_location || 'FC Road');
    let currentLocation: Coordinates = { lat: startGeo.lat, lng: startGeo.lng };

    // 2. Fetch all places and active hazards
    const allPlaces = placesProvider.getAll({ pageSize: 100 }).items;
    const hazardRows = db.prepare(`
      SELECT id, lat, lng, radius_m, confidence, category
      FROM hazards
    `).all() as unknown as ActiveHazard[];

    // 3. Fetch weather
    const weather = await weatherProvider.getWeather(currentLocation.lat, currentLocation.lng);
    const rainProbs = weather.rain_probability_12h || [];

    // Parse start time
    const [startHStr, startMStr] = startTimeStr.split(':');
    let currentHour = parseInt(startHStr || '10', 10);
    let currentMinute = parseInt(startMStr || '0', 10);

    const totalMinutesAllowed = Math.round(constraints.hours * 60);
    let remainingMinutes = totalMinutesAllowed;
    let remainingBudget = constraints.budget_inr;

    const paceMultiplier = constraints.pace === 'relaxed' ? 1.3 : constraints.pace === 'packed' ? 0.75 : 1.0;
    const visitedIds = new Set<string>();
    const stops: PlannedStop[] = [];
    const routeLegs: RouteResult[] = [];

    let stopOrder = 1;

    while (remainingMinutes > 35 && visitedIds.size < allPlaces.length) {
      // Score all unvisited candidates
      const scoredCandidates = allPlaces
        .filter(p => !visitedIds.has(p.id))
        .map(p => {
          const rainProb = rainProbs[currentHour % 12] || 0;
          return scorePlaceCandidate(
            p,
            currentLocation,
            currentHour,
            remainingBudget,
            constraints,
            hazardRows,
            rainProb
          );
        })
        .filter((c): c is NonNullable<typeof c> => c !== null)
        .sort((a, b) => b.compositeScore - a.compositeScore);

      if (scoredCandidates.length === 0) {
        break; // No more reachable or eligible places
      }

      const best = scoredCandidates[0];
      const place = best.place;
      const dwellMinutes = Math.max(30, Math.round(place.visit_minutes * paceMultiplier));

      // Calculate travel time and get route geometry
      const route = await routingProvider.getRoute(
        currentLocation,
        { lat: place.lat, lng: place.lng },
        constraints.travel_mode
      );

      const legTime = route.duration_minutes;
      const legCost = place.indicative_price_inr;

      if (legTime + dwellMinutes > remainingMinutes && stops.length >= 2) {
        // Can't fit this stop within remaining time and we already have a viable itinerary
        break;
      }

      // Compute arrival and departure
      let arrivalMinutesTotal = currentHour * 60 + currentMinute + legTime;
      const arrivalHour = Math.floor(arrivalMinutesTotal / 60) % 24;
      const arrivalMin = arrivalMinutesTotal % 60;
      const arrivalTimeStr = formatTime(arrivalHour, arrivalMin);

      let departureMinutesTotal = arrivalMinutesTotal + dwellMinutes;
      const departureHour = Math.floor(departureMinutesTotal / 60) % 24;
      const departureMin = departureMinutesTotal % 60;
      const departureTimeStr = formatTime(departureHour, departureMin);

      // Generate "Why this?"
      const crowdAtArrival = place.hourly_crowd[arrivalHour] || 0.5;
      const whyThis = await aiProvider.generateWhyThis(
        place.name,
        place.category,
        crowdAtArrival,
        lang,
        legTime
      );

      stops.push({
        stopOrder,
        place,
        arrivalTime: arrivalTimeStr,
        departureTime: departureTimeStr,
        durationMinutes: dwellMinutes,
        costInr: legCost,
        whyThis,
        score: best.compositeScore,
        scoreFactors: best.factors,
        travelFromPrev: {
          distanceMeters: route.distance_meters,
          durationMinutes: route.duration_minutes,
          mode: route.mode,
          routeLabel: route.label,
          geometry: route.geometry,
        },
      });

      routeLegs.push(route);
      visitedIds.add(place.id);

      // Advance state
      remainingMinutes -= (legTime + dwellMinutes);
      remainingBudget = Math.max(0, remainingBudget - legCost);
      currentHour = departureHour;
      currentMinute = departureMin;
      currentLocation = { lat: place.lat, lng: place.lng };
      stopOrder++;
    }

    const totalCost = stops.reduce((sum, s) => sum + s.costInr, 0);
    const totalDuration = totalMinutesAllowed - remainingMinutes;
    const endMinutes = parseInt(startHStr || '10', 10) * 60 + parseInt(startMStr || '0', 10) + totalDuration;
    const endTimeStr = formatTime(Math.floor(endMinutes / 60), endMinutes % 60);

    const planId = `plan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const planTitle = `${constraints.interests.map(i => i.charAt(0).toUpperCase() + i.slice(1)).join(' & ')} Journey`;

    return {
      id: planId,
      title: planTitle,
      tagline: 'Plan around the city\'s pulse.',
      city: 'Pune',
      currency: 'INR',
      startTime: startTimeStr,
      endTime: endTimeStr,
      totalDurationMinutes: totalDuration,
      totalCostInr: totalCost,
      remainingBudgetInr: Math.max(0, constraints.budget_inr - totalCost),
      stops,
      routeLegs,
      constraintsUsed: constraints,
      weatherSummary: weather.available ? `${weather.condition}, ${weather.temperature_c}°C` : 'Weather unavailable',
      aiSource: env.GEMINI_API_KEY ? 'gemini' : 'local',
      createdAt: new Date().toISOString(),
    };
  },
};
