export interface Place {
  id: string;
  name: string;
  category: 'heritage' | 'street food' | 'nature' | 'shopping' | 'culture';
  description: string;
  lat: number;
  lng: number;
  indicative_price_inr: number;
  visit_minutes: number;
  step_free: boolean;
  seating: boolean;
  restroom: boolean;
  hourly_crowd: number[];
  opening_hours: string | null;
  source_tag: string;
  city?: string;
  last_updated: string;
}

export interface Hazard {
  id: string;
  title: string;
  description: string;
  category: string;
  lat: number;
  lng: number;
  radius_m: number;
  date: string;
  verification_status: string;
  confidence: number;
  source_tag: string;
  city?: string;
  created_at: string;
}

export interface WeatherData {
  available: boolean;
  temperature_c?: number;
  humidity_percent?: number;
  condition?: string;
  weather_code?: number;
  wind_speed_kmh?: number;
  rain_probability_12h?: number[];
  rain_summary?: string;
  cached_at?: string;
  message?: string;
  source?: string;
}

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
    geometry?: {
      type: 'LineString';
      coordinates: [number, number][];
    };
  } | null;
}

export interface GeneratedPlan {
  id: string;
  title: string;
  tagline: string;
  city: string;
  currency: 'INR' | string;
  startTime: string;
  endTime: string;
  totalDurationMinutes: number;
  totalCostInr: number;
  remainingBudgetInr: number;
  stops: PlannedStop[];
  weatherSummary: string;
  aiSource: 'gemini' | 'local';
  createdAt: string;
  constraintsUsed: {
    city?: string;
    budget_inr: number;
    hours: number;
    interests: string[];
    travel_mode: 'foot-walking' | 'cycling-regular' | 'driving-car';
    pace: 'relaxed' | 'moderate' | 'packed';
    accessibility: string[];
    mood: string;
    group_size: number;
    start_location: string;
  };
}

export interface PlanDiff {
  planAId: string;
  planBId: string;
  addedStops: PlannedStop[];
  removedStops: PlannedStop[];
  retainedStops: PlannedStop[];
  costDifferenceInr: number;
  durationDifferenceMinutes: number;
  reason: string;
}

export interface ReplanResult {
  originalPlan: GeneratedPlan;
  planB: GeneratedPlan;
  diff: PlanDiff;
}

export interface DataSourceStatus {
  name: string;
  provider_type: 'live' | 'demo' | 'fallback';
  last_success: string | null;
  last_error: string | null;
  confidence: number;
  status: 'operational' | 'degraded' | 'offline';
  description: string;
}

export interface ReportItem {
  id: string;
  title: string;
  description: string;
  category: string;
  lat: number;
  lng: number;
  status: string;
  actualStatus?: string;
  isFact: boolean;
  source_tag: string;
  created_at: string;
  safetyDisclaimer?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface UserPassport {
  id?: string;
  user_id?: string;
  session_id?: string;
  interests: string[];
  budget_inr: number;
  travel_mode: 'foot-walking' | 'cycling-regular' | 'driving-car';
  pace: 'relaxed' | 'moderate' | 'packed';
  accessibility: string[];
  crowd_preference: 'peaceful' | 'balanced' | 'buzzing';
  indoor_outdoor: 'all' | 'indoor' | 'outdoor';
  preferred_language: 'en' | 'hi' | 'mr';
  default_city: string;
  updated_at?: string;
}

export interface CityInfo {
  id: string;
  name: string;
  state: string;
  country: string;
  lat: number;
  lng: number;
  currency: string;
  timezone: string;
  popular?: boolean;
  coverage: {
    weather: 'live' | 'fallback' | 'unavailable';
    routing: 'live' | 'fallback';
    placesCount: number;
    hazardsCount: number;
  };
}
