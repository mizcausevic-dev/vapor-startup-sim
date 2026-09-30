// VAPOR — endings. Thresholds are intentionally tight so most runs end somewhere.

import type { Ending, EndingId, GameState } from './types.js';

export const ENDINGS: Record<EndingId, Ending> = {
  ipo: {
    id: 'ipo',
    title: 'IPO',
    flavor: 'You rang the bell. The stock pops 40 percent. Then quietly drifts down for a year. You sell half your shares and buy a small island. The island has bad Wi-Fi.',
    multiplier: 3,
    win: true,
  },
  acquired: {
    id: 'acquired',
    title: 'Acquired',
    flavor: 'A bigger company buys you for "talent and traction." Your product is sunsetted within 18 months. You sign a 4-year vesting cliff and quietly leave after 2.',
    multiplier: 2,
    win: true,
  },
  bootstrapped: {
    id: 'bootstrapped',
    title: 'Bootstrapped',
    flavor: 'You survived two years without outside money. You are profitable, small, and tired. The business supports you and three engineers. You never ring a bell. You sleep fine.',
    multiplier: 1.5,
    win: true,
  },
  bankrupt: {
    id: 'bankrupt',
    title: 'Bankrupt',
    flavor: 'Cash hit zero. You send a "winding down" email. Customers ask for refunds you cannot give. You take a contract job at a bigger startup. The cycle continues.',
    multiplier: 0.5,
    win: false,
  },
  scandal: {
    id: 'scandal',
    title: 'Scandal',
    flavor: 'Reputation hit zero. A thread goes viral. Your name is now a verb, in a bad way. You change your LinkedIn headline to "Building in stealth."',
    multiplier: 0.5,
    win: false,
  },
};

/** Check whether a state has reached a terminal ending. Returns null if still playing. */
export function checkEnding(state: GameState): Ending | null {
  // Lose conditions first (a player can hit both, but lose wins priority).
  if (state.cash < 0) return ENDINGS.bankrupt;
  if (state.reputation <= 0) return ENDINGS.scandal;

  // Win conditions.
  if (state.mrr >= 500_000 && state.cash >= 2_000_000 && state.reputation >= 80) {
    return ENDINGS.ipo;
  }
  if (state.reputation >= 90 && state.users >= 100_000) {
    return ENDINGS.acquired;
  }
  // Bootstrapped: survived 52 sprints (2 years of 2-week sprints) without dying.
  if (state.sprint >= 52) {
    return ENDINGS.bootstrapped;
  }
  return null;
}
