// VAPOR — engine determinism tests. Same seed = same game.
import { describe, it, expect } from 'vitest';
import { Engine } from '../game/engine.js';
import { EVENT_BY_ID } from '../game/events.js';
import { FEATURE_BY_ID } from '../game/features.js';

/**
 * Run a deterministic "auto-play" of the engine for N sprints.
 * Strategy: always pick the first affordable feature, always pick the first event choice.
 * Returns the sequence of (featureId, eventId, choiceId, cash, mrr, users) tuples.
 */
function autoPlay(seed: number, sprints: number): Array<{
  featureId: string; eventId: string | null; choiceId: string;
  cash: number; mrr: number; users: number; reputation: number; endingId: string | null;
}> {
  const engine = new Engine({ seed });
  engine.startGame();
  const trace: Array<{
    featureId: string; eventId: string | null; choiceId: string;
    cash: number; mrr: number; users: number; reputation: number; endingId: string | null;
  }> = [];

  for (let i = 0; i < sprints; i++) {
    if (engine.state.status !== 'game') break;
    const hand = engine.currentHand;
    // Pick the first affordable feature.
    const feature = hand.find((f) => engine.state.cash >= f.cost) ?? hand[0];
    if (!feature) break;
    const event = engine.currentEvent;
    const choice = event?.choices[0]?.id ?? 'none';
    const ending = engine.resolveSprint(feature.id, choice);
    trace.push({
      featureId: feature.id,
      eventId: event?.id ?? null,
      choiceId: choice,
      cash: engine.state.cash,
      mrr: engine.state.mrr,
      users: engine.state.users,
      reputation: engine.state.reputation,
      endingId: ending?.id ?? null,
    });
  }
  return trace;
}

describe('Engine determinism', () => {
  it('produces identical traces for the same seed', () => {
    const a = autoPlay(42, 20);
    const b = autoPlay(42, 20);
    expect(a).toEqual(b);
  });

  it('produces different traces for different seeds', () => {
    const a = autoPlay(1, 20);
    const b = autoPlay(2, 20);
    expect(a).not.toEqual(b);
  });

  it('the first hand is deterministic for a given seed', () => {
    const a = new Engine({ seed: 777 });
    a.startGame();
    const b = new Engine({ seed: 777 });
    b.startGame();
    expect(a.state.hand).toEqual(b.state.hand);
  });

  it('the first event is deterministic for a given seed', () => {
    const a = new Engine({ seed: 777 });
    a.startGame();
    const b = new Engine({ seed: 777 });
    b.startGame();
    expect(a.state.pendingEventId).toEqual(b.state.pendingEventId);
  });

  it('starting cash/MRR/users are the documented constants', () => {
    const e = new Engine({ seed: 1 });
    e.startGame();
    expect(e.state.cash).toBe(250_000);
    expect(e.state.mrr).toBe(2_000);
    expect(e.state.users).toBe(1_500);
    expect(e.state.churn).toBe(0.05);
    expect(e.state.reputation).toBe(50);
    expect(e.state.burnRate).toBe(8_000);
  });

  it('a hand always has 4 cards (until deck exhausted)', () => {
    const e = new Engine({ seed: 99 });
    e.startGame();
    expect(e.state.hand.length).toBe(4);
  });

  it('all hand cards reference real features', () => {
    const e = new Engine({ seed: 99 });
    e.startGame();
    for (const id of e.state.hand) {
      expect(FEATURE_BY_ID.has(id)).toBe(true);
    }
  });

  it('the pending event references a real event', () => {
    const e = new Engine({ seed: 99 });
    e.startGame();
    expect(e.state.pendingEventId).not.toBeNull();
    expect(EVENT_BY_ID.has(e.state.pendingEventId!)).toBe(true);
  });

  it('resolveSprint advances the sprint counter', () => {
    const e = new Engine({ seed: 5 });
    e.startGame();
    const before = e.state.sprint;
    const feature = e.currentHand[0]!;
    const event = e.currentEvent;
    const choice = event?.choices[0]?.id ?? 'none';
    e.resolveSprint(feature.id, choice);
    expect(e.state.sprint).toBe(before + 1);
  });

  it('selectFeature rejects cards not in the hand', () => {
    const e = new Engine({ seed: 5 });
    e.startGame();
    expect(e.selectFeature('does-not-exist')).toBe(false);
  });

  it('setBudget rejects allocations exceeding cash', () => {
    const e = new Engine({ seed: 5 });
    e.startGame();
    const tooMuch = { engineering: 1_000_000, marketing: 0, support: 0 };
    expect(e.setBudget(tooMuch)).toBe(false);
  });

  it('setBudget rejects negative allocations', () => {
    const e = new Engine({ seed: 5 });
    e.startGame();
    expect(e.setBudget({ engineering: -100, marketing: 0, support: 0 })).toBe(false);
  });

  it('pause and resume toggle status correctly', () => {
    const e = new Engine({ seed: 5 });
    e.startGame();
    expect(e.state.status).toBe('game');
    e.pause();
    expect(e.state.status).toBe('pause');
    e.resume();
    expect(e.state.status).toBe('game');
  });

  it('toggleMute flips the muted flag', () => {
    const e = new Engine({ seed: 5 });
    expect(e.state.muted).toBe(false);
    e.toggleMute();
    expect(e.state.muted).toBe(true);
    e.toggleMute();
    expect(e.state.muted).toBe(false);
  });

  it('checkEnding returns bankrupt when cash is negative', async () => {
    const { checkEnding } = await import('../game/endings.js');
    const e = new Engine({ seed: 13 });
    e.startGame();
    e.state.cash = -1;
    const ending = checkEnding(e.state);
    expect(ending?.id).toBe('bankrupt');
    expect(ending?.win).toBe(false);
  });

  it('checkEnding returns scandal when reputation hits zero', async () => {
    const { checkEnding } = await import('../game/endings.js');
    const e = new Engine({ seed: 13 });
    e.startGame();
    e.state.reputation = 0;
    const ending = checkEnding(e.state);
    expect(ending?.id).toBe('scandal');
    expect(ending?.win).toBe(false);
  });

  it('checkEnding returns IPO when all three IPO thresholds are met', async () => {
    const { checkEnding } = await import('../game/endings.js');
    const e = new Engine({ seed: 13 });
    e.startGame();
    e.state.mrr = 600_000;
    e.state.cash = 3_000_000;
    e.state.reputation = 85;
    const ending = checkEnding(e.state);
    expect(ending?.id).toBe('ipo');
    expect(ending?.win).toBe(true);
  });

  it('a full auto-play run terminates with an ending within 60 sprints', () => {
    // Strategy: always pick the most expensive affordable feature (drains cash),
    // always pick the first event choice. The run must end before the hard cap.
    const e = new Engine({ seed: 13 });
    e.startGame();
    let guard = 0;
    while (e.state.status === 'game' && guard < 60) {
      guard++;
      const hand = e.currentHand;
      if (hand.length === 0) break;
      const sorted = [...hand].sort((a, b) => b.cost - a.cost);
      const feature = sorted.find((f) => e.state.cash >= f.cost) ?? sorted[0]!;
      const event = e.currentEvent;
      const choice = event?.choices[0]?.id ?? 'none';
      e.setBudget({ engineering: 0, marketing: 0, support: 0 });
      e.resolveSprint(feature.id, choice);
    }
    expect(e.state.status).toBe('ending');
    expect(e.state.ending).not.toBeNull();
    // The ending must be one of the five documented endings.
    const validEndings = new Set(['ipo', 'acquired', 'bootstrapped', 'bankrupt', 'scandal']);
    expect(validEndings.has(e.state.ending!.id)).toBe(true);
  });

  it('history snapshots are recorded one per sprint', () => {
    const e = new Engine({ seed: 5 });
    e.startGame();
    const feature = e.currentHand[0]!;
    const event = e.currentEvent;
    const choice = event?.choices[0]?.id ?? 'none';
    e.resolveSprint(feature.id, choice);
    e.resolveSprint(e.currentHand[0]!.id, e.currentEvent?.choices[0]?.id ?? 'none');
    expect(e.state.history.length).toBe(2);
    expect(e.state.history[0]!.sprint).toBe(0);
    expect(e.state.history[1]!.sprint).toBe(1);
  });
});
