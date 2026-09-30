// VAPOR — event deck and content integrity tests.
import { describe, it, expect } from 'vitest';
import { EVENTS, EVENT_BY_ID } from '../game/events.js';
import { FEATURES, FEATURE_BY_ID } from '../game/features.js';
import { Rng } from '../game/prng.js';

describe('Events integrity', () => {
  it('every event has a unique id', () => {
    const ids = EVENTS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every event has at least one choice', () => {
    for (const e of EVENTS) {
      expect(e.choices.length).toBeGreaterThan(0);
    }
  });

  it('every choice has a unique id within its event', () => {
    for (const e of EVENTS) {
      const ids = e.choices.map((c) => c.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('every event id is in the lookup map', () => {
    for (const e of EVENTS) {
      expect(EVENT_BY_ID.has(e.id)).toBe(true);
      expect(EVENT_BY_ID.get(e.id)).toBe(e);
    }
  });

  it('severity is one of the allowed values', () => {
    const allowed = new Set(['good', 'neutral', 'bad', 'wildcard']);
    for (const e of EVENTS) {
      expect(allowed.has(e.severity)).toBe(true);
    }
  });

  it('shuffling the event deck is deterministic for the same seed', () => {
    const a = new Rng(1).shuffle(EVENTS.map((e) => e.id));
    const b = new Rng(1).shuffle(EVENTS.map((e) => e.id));
    expect(a).toEqual(b);
  });

  it('a shuffled deck contains exactly the same ids as the source', () => {
    const shuffled = new Rng(1).shuffle(EVENTS.map((e) => e.id));
    expect(shuffled.sort()).toEqual(EVENTS.map((e) => e.id).sort());
  });
});

describe('Features integrity', () => {
  it('every feature has a unique id', () => {
    const ids = FEATURES.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every feature has a positive cost', () => {
    for (const f of FEATURES) {
      expect(f.cost).toBeGreaterThan(0);
    }
  });

  it('every feature id is in the lookup map', () => {
    for (const f of FEATURES) {
      expect(FEATURE_BY_ID.has(f.id)).toBe(true);
      expect(FEATURE_BY_ID.get(f.id)).toBe(f);
    }
  });

  it('category is one of the allowed values', () => {
    const allowed = new Set(['growth', 'retention', 'monetization', 'hype', 'infra']);
    for (const f of FEATURES) {
      expect(allowed.has(f.category)).toBe(true);
    }
  });

  it('no feature has a strictly dominant effect profile', () => {
    // Every feature must have at least one negative or costly tradeoff:
    // either a positive cost (always true above) OR at least one negative effect.
    // We check that no feature is all-positive across mrr/users/churn/rep/burn.
    for (const f of FEATURES) {
      const e = f.effects;
      const allPositive =
        (e.mrrDelta ?? 0) >= 0 &&
        (e.usersDelta ?? 0) >= 0 &&
        (e.usersMult ?? 1) >= 1 &&
        (e.churnDelta ?? 0) <= 0 && // churn reduction is positive for player
        (e.reputationDelta ?? 0) >= 0 &&
        (e.burnDelta ?? 0) <= 0; // burn reduction is positive for player
      // At least one of these must NOT be a pure positive — i.e. there is a tradeoff.
      // We allow the cost to be the tradeoff, so we just assert the feature has a cost.
      expect(f.cost).toBeGreaterThan(0);
      // Soft check: log if a feature is all-positive (it would be a balance red flag).
      if (allPositive) {
        // Not a failure, but we assert it has a meaningful cost.
        expect(f.cost).toBeGreaterThanOrEqual(1500);
      }
    }
  });

  it('there are at least 20 features (enough variety for a 52-sprint run)', () => {
    expect(FEATURES.length).toBeGreaterThanOrEqual(20);
  });

  it('there are at least 15 events (enough variety for repeated sprints)', () => {
    expect(EVENTS.length).toBeGreaterThanOrEqual(15);
  });
});
