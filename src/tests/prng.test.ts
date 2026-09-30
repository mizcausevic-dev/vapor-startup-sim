// VAPOR — PRNG determinism tests.
import { describe, it, expect } from 'vitest';
import { Rng, hashSeed, defaultSeed } from '../game/prng.js';

describe('Rng', () => {
  it('produces identical sequences for the same seed', () => {
    const a = new Rng(12345);
    const b = new Rng(12345);
    const seqA: number[] = [];
    const seqB: number[] = [];
    for (let i = 0; i < 100; i++) {
      seqA.push(a.next());
      seqB.push(b.next());
    }
    expect(seqA).toEqual(seqB);
  });

  it('produces different sequences for different seeds', () => {
    const a = new Rng(1);
    const b = new Rng(2);
    const seqA: number[] = [];
    const seqB: number[] = [];
    for (let i = 0; i < 100; i++) {
      seqA.push(a.next());
      seqB.push(b.next());
    }
    expect(seqA).not.toEqual(seqB);
  });

  it('returns floats in [0, 1)', () => {
    const r = new Rng(42);
    for (let i = 0; i < 1000; i++) {
      const v = r.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('int() stays within [min, max] inclusive', () => {
    const r = new Rng(7);
    for (let i = 0; i < 1000; i++) {
      const v = r.int(-5, 5);
      expect(v).toBeGreaterThanOrEqual(-5);
      expect(v).toBeLessThanOrEqual(5);
    }
  });

  it('shuffle is deterministic for the same seed and does not drop items', () => {
    const a = new Rng(99);
    const b = new Rng(99);
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const sa = a.shuffle(arr);
    const sb = b.shuffle(arr);
    expect(sa).toEqual(sb);
    expect(sa.sort((x, y) => x - y)).toEqual(arr);
  });

  it('sample returns distinct items', () => {
    const r = new Rng(314);
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const s = r.sample(arr, 4);
    expect(s.length).toBe(4);
    expect(new Set(s).size).toBe(4);
  });

  it('snapshot and restore round-trip', () => {
    const r = new Rng(2024);
    r.next(); r.next(); r.next();
    const snap = r.snapshot();
    const v1 = r.next();
    r.restore(snap);
    const v2 = r.next();
    expect(v2).toBe(v1);
  });

  it('hashSeed is deterministic and stable', () => {
    expect(hashSeed('vapor-2026-09-29')).toBe(hashSeed('vapor-2026-09-29'));
    expect(hashSeed('a')).not.toBe(hashSeed('b'));
    expect(hashSeed('')).toBe(hashSeed(''));
  });

  it('defaultSeed returns a positive 32-bit int', () => {
    const s = defaultSeed();
    expect(s).toBeGreaterThan(0);
    expect(Number.isInteger(s)).toBe(true);
    expect(s).toBeLessThanOrEqual(0xffffffff);
  });

  it('does not collapse to a degenerate zero state', () => {
    const r = new Rng(0);
    let nonZero = 0;
    for (let i = 0; i < 100; i++) if (r.next() !== 0) nonZero++;
    expect(nonZero).toBe(100);
  });
});
