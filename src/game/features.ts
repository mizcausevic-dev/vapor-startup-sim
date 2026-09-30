// VAPOR — feature cards. All original, all satirical, no real companies referenced.
// Every card has a cost. No card is strictly dominant.

import type { FeatureCard } from './types.js';

export const FEATURES: FeatureCard[] = [
  // Growth
  { id: 'f-viral-loop', name: 'Viral Loop', emoji: '🦠', category: 'growth',
    blurb: 'Users invite users who invite users. What could go wrong?',
    cost: 4000, effects: { usersMult: 1.18, churnDelta: 0.01, burnDelta: 200 } },
  { id: 'f-seo-grind', name: 'SEO Grind', emoji: '🔍', category: 'growth',
    blurb: 'Publish 400 blog posts. The blog is the product now.',
    cost: 3000, effects: { usersDelta: 1200, burnDelta: 150 } },
  { id: 'f-ads-blitz', name: 'Ads Blitz', emoji: '📺', category: 'growth',
    blurb: 'Buy ads on every podcast. ROI TBD.',
    cost: 6000, effects: { usersDelta: 2500, reputationDelta: -2, burnDelta: 300 } },
  { id: 'f-referral', name: 'Referral Bribes', emoji: '🎁', category: 'growth',
    blurb: 'Give $10 to get a friend. Lose $10 per friend.',
    cost: 5000, effects: { usersDelta: 1800, mrrDelta: -200, burnDelta: 250 } },
  { id: 'f-press-tour', name: 'Press Tour', emoji: '📰', category: 'growth',
    blurb: 'Tell a journalist you are the future of work.',
    cost: 3500, effects: { usersDelta: 600, reputationDelta: 4, burnDelta: 100 } },

  // Retention
  { id: 'f-onboarding', name: 'Onboarding Flow', emoji: '🎓', category: 'retention',
    blurb: 'A 14-step wizard. Users love wizards.',
    cost: 2500, effects: { churnDelta: -0.03, burnDelta: 100 } },
  { id: 'f-streaks', name: 'Streaks', emoji: '🔥', category: 'retention',
    blurb: 'Daily login streaks. The dark pattern, classic.',
    cost: 2000, effects: { churnDelta: -0.02, reputationDelta: -1, burnDelta: 80 } },
  { id: 'f-notifications', name: 'Notifications', emoji: '🔔', category: 'retention',
    blurb: 'Push notifications for everything. Especially nothing.',
    cost: 1500, effects: { churnDelta: -0.015, reputationDelta: -2, burnDelta: 60 } },
  { id: 'f-community', name: 'Community Forum', emoji: '💬', category: 'retention',
    blurb: 'A forum where users answer other users. Free labor.',
    cost: 3000, effects: { churnDelta: -0.025, usersDelta: 400, burnDelta: 120 } },
  { id: 'f-loyalty', name: 'Loyalty Tiers', emoji: '🏆', category: 'retention',
    blurb: 'Bronze, Silver, Gold, Platinum, Vibranium.',
    cost: 4000, effects: { churnDelta: -0.04, mrrDelta: 300, burnDelta: 200 } },

  // Monetization
  { id: 'f-freemium', name: 'Freemium Tier', emoji: '🆓', category: 'monetization',
    blurb: 'Free forever. Pay us later. Or never.',
    cost: 2000, effects: { usersDelta: 2000, mrrDelta: -100, burnDelta: 100 } },
  { id: 'f-upsell', name: 'Upsell Modal', emoji: '💸', category: 'monetization',
    blurb: 'Pop up after every action. They will click yes eventually.',
    cost: 2500, effects: { mrrDelta: 800, churnDelta: 0.01, reputationDelta: -1, burnDelta: 80 } },
  { id: 'f-enterprise', name: 'Enterprise Tier', emoji: '🏢', category: 'monetization',
    blurb: 'Add a tier with SSO and a 47-page contract.',
    cost: 6000, effects: { mrrDelta: 2200, usersDelta: 200, burnDelta: 250 } },
  { id: 'f-addons', name: 'Micro-add-ons', emoji: '🧩', category: 'monetization',
    blurb: 'Sell features separately. Like a puzzle.',
    cost: 3000, effects: { mrrDelta: 1100, churnDelta: 0.005, burnDelta: 120 } },
  { id: 'f-annual', name: 'Annual Plans', emoji: '📅', category: 'monetization',
    blurb: 'Pay for a year up front. We get cash now, you get a discount.',
    cost: 2000, effects: { mrrDelta: 400, burnDelta: -100 } },

  // Hype
  { id: 'f-ai-badge', name: 'AI Badge', emoji: '🤖', category: 'hype',
    blurb: 'Slap "AI" on the homepage. The product is unchanged.',
    cost: 1500, effects: { usersDelta: 1500, reputationDelta: -1, burnDelta: 50 } },
  { id: 'f-keynote', name: 'Keynote Event', emoji: '🎤', category: 'hype',
    blurb: 'Rent a theater. Wear a turtleneck. Reveal nothing.',
    cost: 5000, effects: { usersDelta: 800, reputationDelta: 6, burnDelta: 300 } },
  { id: 'f-podcast', name: 'Founder Podcast', emoji: '🎙️', category: 'hype',
    blurb: 'A podcast about building a startup while building a startup.',
    cost: 2000, effects: { usersDelta: 400, reputationDelta: 3, burnDelta: 100 } },
  { id: 'f-rebrand', name: 'Bold Rebrand', emoji: '🎨', category: 'hype',
    blurb: 'New logo, new name, same product. Charge for the relaunch.',
    cost: 4500, effects: { usersDelta: -500, reputationDelta: 5, mrrDelta: 600, burnDelta: 200 } },

  // Infra
  { id: 'f-observability', name: 'Observability', emoji: '📈', category: 'infra',
    blurb: 'Know about outages before users do. Revolutionary.',
    cost: 3500, effects: { churnDelta: -0.01, burnDelta: -150, reputationDelta: 2 } },
  { id: 'f-cdn', name: 'Edge CDN', emoji: '🌐', category: 'infra',
    blurb: 'Pages load in 80ms instead of 800ms. Boring. Effective.',
    cost: 4000, effects: { churnDelta: -0.015, burnDelta: -200 } },
  { id: 'f-automation', name: 'Test Automation', emoji: '🧪', category: 'infra',
    blurb: 'Tests that run themselves. Bugs now arrive on schedule.',
    cost: 3000, effects: { churnDelta: -0.01, burnDelta: -180, reputationDelta: 1 } },
  { id: 'f-migrations', name: 'DB Migrations', emoji: '🐘', category: 'infra',
    blurb: 'Stop hot-swapping the schema on Friday afternoons.',
    cost: 2500, effects: { churnDelta: -0.008, burnDelta: -120 } },
];

export const FEATURE_BY_ID = new Map(FEATURES.map((f) => [f.id, f]));
