import { describe, it, expect } from 'vitest';
import { scorePlaceCandidate } from '../engine/scoring.js';
import { Place } from '../providers/places.js';
import { PlanConstraints } from '../providers/ai.js';

const mockPlace: Place = {
  id: 'place_fc_road',
  name: 'FC Road Hub',
  category: 'street food',
  description: 'Popular youth food stretch',
  lat: 18.5283,
  lng: 73.8409,
  indicative_price_inr: 120,
  visit_minutes: 60,
  step_free: true,
  seating: false,
  restroom: false,
  hourly_crowd: Array(24).fill(0.3),
  opening_hours: '10:00 - 23:00',
  source_tag: 'Demo',
  last_updated: '2026-10-09T00:00:00Z',
};

const mockInaccessiblePlace: Place = {
  ...mockPlace,
  id: 'place_steep_hill',
  step_free: false,
};

const defaultConstraints: PlanConstraints = {
  budget_inr: 500,
  hours: 4,
  interests: ['street food'],
  travel_mode: 'foot-walking',
  pace: 'moderate',
  accessibility: [],
  mood: 'exploratory',
  group_size: 1,
  start_location: 'FC Road',
};

describe('Planner Scoring Engine', () => {
  it('strictly filters out places when step_free is required but not supported', () => {
    const accessibleScore = scorePlaceCandidate(
      mockPlace,
      { lat: 18.5283, lng: 73.8409 },
      14,
      500,
      { ...defaultConstraints, accessibility: ['step_free'] },
      []
    );
    expect(accessibleScore).not.toBeNull();

    const blockedScore = scorePlaceCandidate(
      mockInaccessiblePlace,
      { lat: 18.5283, lng: 73.8409 },
      14,
      500,
      { ...defaultConstraints, accessibility: ['step_free'] },
      []
    );
    expect(blockedScore).toBeNull();
  });

  it('rewards matching interest categories', () => {
    const matchingScore = scorePlaceCandidate(
      mockPlace,
      { lat: 18.5283, lng: 73.8409 },
      14,
      500,
      { ...defaultConstraints, interests: ['street food'] },
      []
    );

    const nonMatchingScore = scorePlaceCandidate(
      mockPlace,
      { lat: 18.5283, lng: 73.8409 },
      14,
      500,
      { ...defaultConstraints, interests: ['shopping'] },
      []
    );

    expect(matchingScore!.compositeScore).toBeGreaterThan(nonMatchingScore!.compositeScore);
  });

  it('applies hazard penalty for places within active hazard radius', () => {
    const hazard = {
      id: 'h1',
      lat: 18.5283,
      lng: 73.8409,
      radius_m: 300,
      confidence: 0.9,
      category: 'road work',
    };

    const scoreWithoutHazard = scorePlaceCandidate(
      mockPlace,
      { lat: 18.5283, lng: 73.8409 },
      14,
      500,
      defaultConstraints,
      []
    );

    const scoreWithHazard = scorePlaceCandidate(
      mockPlace,
      { lat: 18.5283, lng: 73.8409 },
      14,
      500,
      defaultConstraints,
      [hazard]
    );

    expect(scoreWithHazard!.factors.hazard_penalty).toBeGreaterThan(0);
    expect(scoreWithoutHazard!.compositeScore).toBeGreaterThan(scoreWithHazard!.compositeScore);
  });
});
