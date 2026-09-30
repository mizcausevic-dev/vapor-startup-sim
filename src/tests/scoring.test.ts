// VAPOR — scoring tests. Pure function, fully deterministic.
import { describe, it, expect } from 'vitest';
import { computeScore } from '../game/scoring.js';
import { ENDINGS } from '../game/endings.js';
import type { GameState } from '../game/types.js';

const baseState = (over: Partial<GameState> = {}): GameState => ({
  seed: 1,
  sprint: 0,
  cash: 250_000,
  mrr: 2_000,
  users: 1_500,
  churn: 0.05,
  reputation: 50,
  burnRate: 8_000,
  features: [],
  hand: [],
  pendingEventId: null,
  pendingEventChoice: null,
  competitors: [],
  budget: { engineering: 0, marketing: 0, support: 0 },
  status: 'game',
  ending: null,
  history: [],
  muted: false,
  rngState: 0,
  ...over,
});

describe('computeScore', () => {
  it('applies the ending multiplier to the base score', () => {
    const state = baseState({ mrr: 100_000, users: 50_000, reputation: 70, sprint: 20 });
    const b = computeScore(state, ENDINGS.ipo);
    expect(b.multiplier).toBe(3);
    expect(b.final).toBe(Math.round(b.base * 3));
  });

  it('IPO multiplier (3) beats bootstrapped (1.5) for the same state', () => {
    const state = baseState({ mrr: 100_000, users: 50_000, reputation: 70, sprint: 20 });
    const ipo = computeScore(state, ENDINGS.ipo);
    const boot = computeScore(state, ENDINGS.bootstrapped);
    expect(ipo.final).toBeGreaterThan(boot.final);
    expect(ipo.final / boot.final).toBeCloseTo(2, 1);
  });

  it('clamps MRR component at 250,000 points (500K MRR)', () => {
    const low = baseState({ mrr: 400_000, users: 0, reputation: 0, sprint: 0 });
    const high = baseState({ mrr: 5_000_000, users: 0, reputation: 0, sprint: 0 });
    expect(computeScore(low, ENDINGS.bootstrapped).mrrComponent).toBe(200_000);
    expect(computeScore(high, ENDINGS.bootstrapped).mrrComponent).toBe(250_000);
  });

  it('clamps users component at 100,000 points (10M users)', () => {
    const low = baseState({ mrr: 0, users: 5_000_000, reputation: 0, sprint: 0 });
    const high = baseState({ mrr: 0, users: 50_000_000, reputation: 0, sprint: 0 });
    expect(computeScore(low, ENDINGS.bootstrapped).usersComponent).toBe(50_000);
    expect(computeScore(high, ENDINGS.bootstrapped).usersComponent).toBe(100_000);
  });

  it('clamps reputation component at 10,000 points (100 rep)', () => {
    const state = baseState({ mrr: 0, users: 0, reputation: 200, sprint: 0 });
    expect(computeScore(state, ENDINGS.bootstrapped).reputationComponent).toBe(10_000);
  });

  it('does not award reputation points for negative reputation', () => {
    const state = baseState({ mrr: 0, users: 0, reputation: -50, sprint: 0 });
    expect(computeScore(state, ENDINGS.scandal).reputationComponent).toBe(0);
  });

  it('clamps days component at 1040 points (104 sprints)', () => {
    const state = baseState({ mrr: 0, users: 0, reputation: 0, sprint: 200 });
    expect(computeScore(state, ENDINGS.bootstrapped).daysComponent).toBe(1040);
  });

  it('scandal and bankrupt both use 0.5 multiplier', () => {
    const state = baseState({ mrr: 100_000, users: 50_000, reputation: 50, sprint: 20 });
    expect(computeScore(state, ENDINGS.scandal).multiplier).toBe(0.5);
    expect(computeScore(state, ENDINGS.bankrupt).multiplier).toBe(0.5);
  });

  it('is deterministic: same state and ending produce the same score', () => {
    const state = baseState({ mrr: 123_456, users: 7_889, reputation: 67, sprint: 13 });
    const a = computeScore(state, ENDINGS.ipo);
    const b = computeScore(state, ENDINGS.ipo);
    expect(a).toEqual(b);
  });

  it('a perfect IPO run scores higher than a perfect bankrupt run', () => {
    const win = baseState({ mrr: 600_000, users: 200_000, reputation: 95, sprint: 40 });
    const lose = baseState({ mrr: 0, users: 0, reputation: 0, sprint: 2 });
    expect(computeScore(win, ENDINGS.ipo).final).toBeGreaterThan(
      computeScore(lose, ENDINGS.bankrupt).final
    );
  });
});
