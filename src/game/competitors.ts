// VAPOR — AI rivals. Deterministic, driven by the same Rng as the player.

import type { Competitor } from './types.js';
import { Rng } from './prng.js';

export const RIVAL_NAMES: Competitor[] = [
  { id: 'r1', name: 'Slood', emoji: '🦷', users: 800, mrr: 4000, reputation: 50, alive: true },
  { id: 'r2', name: 'VibeStack', emoji: '🌀', users: 1200, mrr: 6000, reputation: 55, alive: true },
  { id: 'r3', name: 'Quokka', emoji: '🦝', users: 600, mrr: 3000, reputation: 45, alive: true },
];

/** Advance one rival by one sprint. Mutates the rival in place. */
export function advanceRival(rival: Competitor, rng: Rng): void {
  if (!rival.alive) return;
  // Growth: 5% to 25% per sprint, biased by reputation.
  const growthRate = 0.05 + (rival.reputation / 100) * 0.20;
  const newUsers = Math.floor(rival.users * (1 + rng.float(0, growthRate)));
  rival.users = Math.max(0, newUsers);

  // MRR grows roughly with users, plus noise.
  const arpu = 5 + rng.float(0, 3); // $5-8 per user per month
  rival.mrr = Math.floor(rival.users * arpu);

  // Reputation drifts toward 50 with noise.
  const drift = (50 - rival.reputation) * 0.1;
  rival.reputation = Math.max(0, Math.min(100, rival.reputation + drift + rng.float(-3, 3)));

  // Small chance a rival dies if reputation tanks.
  if (rival.reputation < 5 && rng.next() < 0.3) {
    rival.alive = false;
    rival.users = 0;
    rival.mrr = 0;
  }
}

/** Advance all rivals. Returns a new array (does not mutate input). */
export function advanceRivals(rivals: Competitor[], rng: Rng): Competitor[] {
  return rivals.map((r) => {
    const copy: Competitor = { ...r };
    advanceRival(copy, rng);
    return copy;
  });
}
