// VAPOR — shared game types.
// All randomness flows through Rng. No Math.random in this module or engine.

export type Screen = 'splash' | 'game' | 'pause' | 'ending';

export type BudgetKey = 'engineering' | 'marketing' | 'support';

export interface Budget {
  engineering: number;
  marketing: number;
  support: number;
}

export type FeatureCategory =
  | 'growth'
  | 'retention'
  | 'monetization'
  | 'hype'
  | 'infra';

export interface FeatureCard {
  id: string;
  name: string;
  emoji: string;
  category: FeatureCategory;
  blurb: string;
  cost: number;          // cash cost to build
  // Effects applied when built (additive or multiplicative modifiers).
  effects: FeatureEffects;
}

export interface FeatureEffects {
  mrrDelta?: number;
  usersDelta?: number;       // additive users
  usersMult?: number;       // multiplier on current users (e.g. 1.1 = +10%)
  churnDelta?: number;       // negative reduces churn
  reputationDelta?: number;
  burnDelta?: number;        // added to per-sprint burn
}

export type EventSeverity = 'good' | 'neutral' | 'bad' | 'wildcard';

export interface GameEvent {
  id: string;
  name: string;
  emoji: string;
  blurb: string;
  severity: EventSeverity;
  // Choices offered to the player. If empty, event auto-resolves.
  choices: EventChoice[];
}

export interface EventChoice {
  id: string;
  label: string;
  hint?: string;
  // Effects applied if chosen.
  effects: FeatureEffects;
}

export interface Competitor {
  id: string;
  name: string;
  emoji: string;
  users: number;
  mrr: number;
  reputation: number;
  alive: boolean;
  // Visual position on the canvas (set by renderer, not persisted).
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export type EndingId = 'ipo' | 'acquired' | 'bootstrapped' | 'bankrupt' | 'scandal';

export interface Ending {
  id: EndingId;
  title: string;
  flavor: string;
  multiplier: number;
  win: boolean;
}

export interface SprintSnapshot {
  sprint: number;
  cash: number;
  mrr: number;
  users: number;
  churn: number;
  reputation: number;
  featureId: string | null;
  eventId: string | null;
  endingId: EndingId | null;
}

export interface GameState {
  seed: number;
  sprint: number;          // 0-indexed; display as sprint+1
  cash: number;
  mrr: number;             // monthly recurring revenue, $
  users: number;
  churn: number;           // 0..1, monthly
  reputation: number;       // 0..100
  burnRate: number;        // $ per sprint (2 weeks)
  features: string[];      // built feature ids
  hand: string[];          // current 4 feature card ids
  pendingEventId: string | null;
  pendingEventChoice: string | null;
  competitors: Competitor[];
  budget: Budget;
  status: Screen;
  ending: Ending | null;
  history: SprintSnapshot[];
  muted: boolean;
  rngState: number;        // PRNG snapshot for save/restore
}

export interface ScoreBreakdown {
  mrrComponent: number;
  usersComponent: number;
  reputationComponent: number;
  daysComponent: number;
  base: number;
  multiplier: number;
  final: number;
  ending: Ending;
}
