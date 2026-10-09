import { GeneratedPlan, planner, PlannedStop } from './planner.js';
import { PlanConstraints } from '../providers/ai.js';

export interface PlanDiff {
  planAId: string;
  planBId: string;
  addedStops: PlannedStop[];
  removedStops: PlannedStop[];
  retainedStops: PlannedStop[];
  costDifferenceInr: number; // positive = Plan B costs more, negative = saves money
  durationDifferenceMinutes: number;
  reason: string;
}

export interface ReplanResponse {
  originalPlan: GeneratedPlan;
  planB: GeneratedPlan;
  diff: PlanDiff;
}

export const replanner = {
  async generatePlanB(
    originalPlan: GeneratedPlan,
    strategy: 'avoid_crowds' | 'budget_saver' | 'alternative_stops' = 'avoid_crowds',
    lang: 'en' | 'hi' | 'mr' = 'en'
  ): Promise<ReplanResponse> {
    const modifiedConstraints: PlanConstraints = {
      ...originalPlan.constraintsUsed,
    };

    let reason = 'Alternative optimized itinerary (Plan B)';

    if (strategy === 'avoid_crowds') {
      modifiedConstraints.mood = 'peaceful';
      modifiedConstraints.pace = 'relaxed';
      reason = 'Plan B optimizes for lower crowd densities and serene alternative stops.';
    } else if (strategy === 'budget_saver') {
      modifiedConstraints.budget_inr = Math.round(originalPlan.totalCostInr * 0.7);
      reason = 'Plan B trims premium stops to reduce overall expenditure while preserving experience.';
    } else {
      // alternative spots
      reason = 'Plan B explores alternative hidden gems and varied cultural neighborhoods.';
    }

    const planB = await planner.generatePlan(
      modifiedConstraints,
      lang,
      originalPlan.startTime
    );

    // Compute diff between Plan A and Plan B
    const planAIds = new Set(originalPlan.stops.map(s => s.place.id));
    const planBIds = new Set(planB.stops.map(s => s.place.id));

    const addedStops = planB.stops.filter(s => !planAIds.has(s.place.id));
    const removedStops = originalPlan.stops.filter(s => !planBIds.has(s.place.id));
    const retainedStops = planB.stops.filter(s => planAIds.has(s.place.id));

    const diff: PlanDiff = {
      planAId: originalPlan.id,
      planBId: planB.id,
      addedStops,
      removedStops,
      retainedStops,
      costDifferenceInr: planB.totalCostInr - originalPlan.totalCostInr,
      durationDifferenceMinutes: planB.totalDurationMinutes - originalPlan.totalDurationMinutes,
      reason,
    };

    return {
      originalPlan,
      planB,
      diff,
    };
  },
};
