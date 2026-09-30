// VAPOR — scoring. Pure function, fully deterministic, fully tested.

import type { GameState, ScoreBreakdown, Ending } from './types.js';

/**
 * Score is a weighted sum of the four core metrics, multiplied by the ending multiplier.
 * Components are clamped so no single metric can dominate via runaway inflation.
 *
 * - MRR: $1 of MRR = 0.5 points, capped at 250,000 points (500K MRR).
 * - Users: 1 user = 0.01 points, capped at 100,000 points (10M users).
 * - Reputation: 1 point of rep = 100 points, capped at 10,000 (100 rep).
 * - Days survived: 1 sprint = 14 days, 1 day = 10 points, capped at 1040 (104 sprints).
 */
export function computeScore(state: GameState, ending: Ending): ScoreBreakdown {
  const mrrComponent = Math.min(state.mrr * 0.5, 250_000);
  const usersComponent = Math.min(state.users * 0.01, 100_000);
  const reputationComponent = Math.min(Math.max(state.reputation, 0) * 100, 10_000);
  const daysSurvived = state.sprint * 14;
  const daysComponent = Math.min(daysSurvived * 10, 1040);

  const base = mrrComponent + usersComponent + reputationComponent + daysComponent;
  const multiplier = ending.multiplier;
  const final = Math.round(base * multiplier);

  return {
    mrrComponent,
    usersComponent,
    reputationComponent,
    daysComponent,
    base,
    multiplier,
    final,
    ending,
  };
}
