// VAPOR — high score persistence. localStorage with safe fallback.

import type { Ending } from '../game/types.js';

export interface ScoreEntry {
  seed: number;
  score: number;
  ending: Ending['id'];
  win: boolean;
  sprint: number;
  date: string; // ISO date
}

const KEY = 'vapor.highscores.v1';
const MAX = 10;

export function loadScores(): ScoreEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((e) => e && typeof e.score === 'number').slice(0, MAX);
  } catch {
    return [];
  }
}

export function saveScore(entry: ScoreEntry): ScoreEntry[] {
  const scores = loadScores();
  scores.push(entry);
  scores.sort((a, b) => b.score - a.score);
  const trimmed = scores.slice(0, MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(trimmed));
  } catch {
    // Quota or disabled: fail silently, in-memory only.
  }
  return trimmed;
}

export function clearScores(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
