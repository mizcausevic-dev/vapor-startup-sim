// VAPOR — game engine. Pure state transitions, no DOM, no I/O.
// All randomness flows through Rng. No Math.random anywhere.

import type {
  GameState, Budget, FeatureCard, GameEvent, Ending, SprintSnapshot,
} from './types.js';
import { Rng } from './prng.js';
import { FEATURES, FEATURE_BY_ID } from './features.js';
import { EVENTS, EVENT_BY_ID } from './events.js';
import { checkEnding } from './endings.js';
import { RIVAL_NAMES, advanceRivals } from './competitors.js';

export const STARTING_CASH = 250_000;
export const STARTING_MRR = 2_000;
export const STARTING_USERS = 1_500;
export const STARTING_CHURN = 0.05;
export const STARTING_REPUTATION = 50;
export const STARTING_BURN = 8_000;
export const MAX_SPRINT = 104; // 2-year hard cap; bootstrapped ending at 52

export interface EngineOptions {
  seed: number;
  muted?: boolean;
}

export class Engine {
  readonly state: GameState;
  private rng: Rng;
  private featureDeck: string[] = [];
  private eventDeck: string[] = [];

  constructor(opts: EngineOptions) {
    const seed = opts.seed >>> 0;
    this.rng = new Rng(seed);
    this.state = {
      seed,
      sprint: 0,
      cash: STARTING_CASH,
      mrr: STARTING_MRR,
      users: STARTING_USERS,
      churn: STARTING_CHURN,
      reputation: STARTING_REPUTATION,
      burnRate: STARTING_BURN,
      features: [],
      hand: [],
      pendingEventId: null,
      pendingEventChoice: null,
      competitors: RIVAL_NAMES.map((r) => ({ ...r })),
      budget: { engineering: 0, marketing: 0, support: 0 },
      status: 'splash',
      ending: null,
      history: [],
      muted: opts.muted ?? false,
      rngState: this.rng.snapshot(),
    };
    this.featureDeck = this.rng.shuffle(FEATURES.map((f) => f.id));
    this.eventDeck = this.rng.shuffle(EVENTS.map((e) => e.id));
  }

  /** Begin a new game. Resets state but keeps the seed. */
  startGame(): void {
    this.rng = new Rng(this.state.seed);
    this.state.sprint = 0;
    this.state.cash = STARTING_CASH;
    this.state.mrr = STARTING_MRR;
    this.state.users = STARTING_USERS;
    this.state.churn = STARTING_CHURN;
    this.state.reputation = STARTING_REPUTATION;
    this.state.burnRate = STARTING_BURN;
    this.state.features = [];
    this.state.hand = [];
    this.state.pendingEventId = null;
    this.state.pendingEventChoice = null;
    this.state.competitors = RIVAL_NAMES.map((r) => ({ ...r }));
    this.state.budget = { engineering: 0, marketing: 0, support: 0 };
    this.state.status = 'game';
    this.state.ending = null;
    this.state.history = [];
    this.state.rngState = this.rng.snapshot();
    this.featureDeck = this.rng.shuffle(FEATURES.map((f) => f.id));
    this.eventDeck = this.rng.shuffle(EVENTS.map((e) => e.id));
    this.dealHand();
    this.dealEvent();
    this.allocateDefaultBudget();
  }

  /** Deal 4 feature cards from the deck, reshuffling if needed. Hand is never empty. */
  dealHand(): void {
    const hand: string[] = [];
    for (let i = 0; i < 4; i++) {
      if (this.featureDeck.length === 0) {
        // First preference: unbuilt features (variety).
        const built = new Set(this.state.features);
        let pool = FEATURES.filter((f) => !built.has(f.id)).map((f) => f.id);
        // Fallback: if every feature is built, allow re-deals of any feature
        // (flavor: "iterate on an existing feature"). Keeps the game playable.
        if (pool.length === 0) pool = FEATURES.map((f) => f.id);
        this.featureDeck = this.rng.shuffle(pool);
      }
      hand.push(this.featureDeck.pop()!);
    }
    this.state.hand = hand;
  }

  /** Draw the next event. */
  dealEvent(): void {
    if (this.eventDeck.length === 0) {
      this.eventDeck = this.rng.shuffle(EVENTS.map((e) => e.id));
    }
    this.state.pendingEventId = this.eventDeck.pop()!;
    this.state.pendingEventChoice = null;
  }

  /** Default budget: split available cash evenly across the three buckets. */
  allocateDefaultBudget(): void {
    const per = Math.floor(this.state.cash / 3);
    this.state.budget = { engineering: per, marketing: per, support: per };
  }

  /** Player selects a feature card to build. Returns false if invalid. */
  selectFeature(featureId: string): boolean {
    if (!this.state.hand.includes(featureId)) return false;
    const feature = FEATURE_BY_ID.get(featureId);
    if (!feature) return false;
    if (this.state.cash < feature.cost) return false;
    return true;
  }

  /** Set the budget allocation. Sums must be <= cash. */
  setBudget(budget: Budget): boolean {
    const sum = budget.engineering + budget.marketing + budget.support;
    if (sum > this.state.cash) return false;
    if (budget.engineering < 0 || budget.marketing < 0 || budget.support < 0) return false;
    this.state.budget = { ...budget };
    return true;
  }

  /** Resolve a sprint: apply feature, event choice, budget effects, advance rivals, check ending. */
  resolveSprint(featureId: string, eventChoiceId: string): Ending | null {
    if (this.state.status !== 'game') return null;

    const feature = FEATURE_BY_ID.get(featureId);
    const event = this.state.pendingEventId ? EVENT_BY_ID.get(this.state.pendingEventId) : null;
    const choice = event?.choices.find((c) => c.id === eventChoiceId) ?? null;

    // 1. Apply feature effects (cost + effects).
    if (feature) {
      this.state.cash -= feature.cost;
      this.applyEffects(feature.effects);
      this.state.features.push(feature.id);
    }

    // 2. Apply event choice effects.
    if (choice) this.applyEffects(choice.effects);

    // 3. Apply budget effects.
    this.applyBudgetEffects();

    // 4. Apply per-sprint economic update (MRR from users, churn loss, burn).
    this.applyEconomicTick();

    // 5. Advance rivals.
    this.state.competitors = advanceRivals(this.state.competitors, this.rng);

    // 6. Snapshot.
    const snapshot: SprintSnapshot = {
      sprint: this.state.sprint,
      cash: this.state.cash,
      mrr: this.state.mrr,
      users: this.state.users,
      churn: this.state.churn,
      reputation: this.state.reputation,
      featureId: feature?.id ?? null,
      eventId: event?.id ?? null,
      endingId: null,
    };

    // 7. Check ending.
    const ending = checkEnding(this.state);
    if (ending) {
      this.state.ending = ending;
      this.state.status = 'ending';
      snapshot.endingId = ending.id;
    } else if (this.state.sprint + 1 >= MAX_SPRINT) {
      // Hard cap: force bootstrapped ending if we somehow exceed 52 without a win.
      this.state.ending = { id: 'bootstrapped', title: 'Bootstrapped',
        flavor: ENDINGS_FALLBACK_FLAVOR, multiplier: 1.5, win: true };
      this.state.status = 'ending';
      snapshot.endingId = 'bootstrapped';
    }

    this.state.history.push(snapshot);
    this.state.sprint += 1;
    this.state.rngState = this.rng.snapshot();

    // 8. If still playing, deal next hand and event.
    if (this.state.status === 'game') {
      this.dealHand();
      this.dealEvent();
      this.allocateDefaultBudget();
    }

    return this.state.ending;
  }

  /** Apply FeatureEffects to state. Clamps reputation and churn. */
  private applyEffects(effects: {
    mrrDelta?: number; usersDelta?: number; usersMult?: number;
    churnDelta?: number; reputationDelta?: number; burnDelta?: number;
  }): void {
    if (effects.mrrDelta) this.state.mrr = Math.max(0, this.state.mrr + effects.mrrDelta);
    if (effects.usersDelta) this.state.users = Math.max(0, this.state.users + effects.usersDelta);
    if (effects.usersMult) this.state.users = Math.max(0, Math.floor(this.state.users * effects.usersMult));
    if (effects.churnDelta) this.state.churn = Math.max(0, Math.min(1, this.state.churn + effects.churnDelta));
    if (effects.reputationDelta) this.state.reputation = Math.max(0, Math.min(100, this.state.reputation + effects.reputationDelta));
    if (effects.burnDelta) this.state.burnRate = Math.max(0, this.state.burnRate + effects.burnDelta);
  }

  /** Budget effects: engineering reduces churn, marketing grows users, support reduces burn. */
  private applyBudgetEffects(): void {
    const b = this.state.budget;
    // Engineering: every $1000 reduces churn by 0.002 (capped).
    const churnReduction = Math.min(0.05, (b.engineering / 1000) * 0.002);
    this.state.churn = Math.max(0, this.state.churn - churnReduction);
    // Marketing: every $1000 adds ~50 users, with noise from rng.
    const newUsers = Math.floor((b.marketing / 1000) * 50 * this.rng.float(0.7, 1.3));
    this.state.users = Math.max(0, this.state.users + newUsers);
    // Support: every $1000 reduces burn by $200 (efficiency).
    const burnReduction = (b.support / 1000) * 200;
    this.state.burnRate = Math.max(500, this.state.burnRate - burnReduction);
    // Budget is spent.
    this.state.cash -= (b.engineering + b.marketing + b.support);
  }

  /** Per-sprint economic tick. MRR from users, churn loss, burn spend. */
  private applyEconomicTick(): void {
    // Churn: lose a fraction of users per sprint. Churn is monthly, sprint is 2 weeks,
    // so effective churn per sprint = churn * 0.5.
    const sprintChurn = this.state.churn * 0.5;
    const lostUsers = Math.floor(this.state.users * sprintChurn);
    this.state.users = Math.max(0, this.state.users - lostUsers);

    // MRR drifts toward users * ARPU. ARPU ~ $6/user/month, sprint is half a month.
    const targetMrr = this.state.users * 6 * 0.5;
    // MRR moves 20% of the way toward target each sprint (smoothing).
    this.state.mrr = Math.floor(this.state.mrr * 0.8 + targetMrr * 0.2);

    // Cash in: half a month of MRR.
    this.state.cash += Math.floor(this.state.mrr * 0.5);
    // Cash out: burn.
    this.state.cash -= Math.floor(this.state.burnRate);
  }

  pause(): void {
    if (this.state.status === 'game') this.state.status = 'pause';
  }
  resume(): void {
    if (this.state.status === 'pause') this.state.status = 'game';
  }
  quitToMenu(): void {
    this.state.status = 'splash';
  }
  toggleMute(): boolean {
    this.state.muted = !this.state.muted;
    return this.state.muted;
  }

  get currentEvent(): GameEvent | null {
    return this.state.pendingEventId ? EVENT_BY_ID.get(this.state.pendingEventId) ?? null : null;
  }

  get currentHand(): FeatureCard[] {
    return this.state.hand
      .map((id) => FEATURE_BY_ID.get(id))
      .filter((f): f is FeatureCard => Boolean(f));
  }
}

const ENDINGS_FALLBACK_FLAVOR =
  'You ground it out for two years. The press stopped calling. You kept the lights on.';
