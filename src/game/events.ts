// VAPOR — random events. All original, all satirical.

import type { GameEvent } from './types.js';

export const EVENTS: GameEvent[] = [
  {
    id: 'e-vc-cold', name: 'VC cold email', emoji: '📧', severity: 'wildcard',
    blurb: 'A venture capitalist emails: "Love what you are doing. Coffee?"',
    choices: [
      { id: 'meet', label: 'Take the meeting', hint: 'Reputation up, burn up',
        effects: { reputationDelta: 5, burnDelta: 200 } },
      { id: 'ignore', label: 'Ignore it', hint: 'Safe', effects: {} },
      { id: 'leak', label: 'Leak it to the press', hint: 'Risky',
        effects: { reputationDelta: -3, usersDelta: 800, burnDelta: 100 } },
    ],
  },
  {
    id: 'e-outage', name: 'Outage', emoji: '💥', severity: 'bad',
    blurb: 'The site is down. Users are posting screenshots.',
    choices: [
      { id: 'fix', label: 'All hands on fix', hint: 'Cash hit, churn down',
        effects: { churnDelta: -0.01, burnDelta: 600 } },
      { id: 'blame', label: 'Blame a vendor', hint: 'Cheap, risky',
        effects: { reputationDelta: -4, churnDelta: 0.02 } },
      { id: 'wait', label: 'Wait it out', hint: 'Worst option',
        effects: { churnDelta: 0.04, reputationDelta: -2 } },
    ],
  },
  {
    id: 'e-rival-launch', name: 'Rival launches', emoji: '🚀', severity: 'bad',
    blurb: 'A rival just shipped your roadmap. With a slicker site.',
    choices: [
      { id: 'pivot', label: 'Pivot hard', hint: 'Rep up, users down',
        effects: { reputationDelta: 3, usersDelta: -1500, burnDelta: 200 } },
      { id: 'copy', label: 'Copy them', hint: 'Churn up',
        effects: { churnDelta: 0.02, usersDelta: 200 } },
      { id: 'stay', label: 'Stay the course', hint: 'Neutral', effects: {} },
    ],
  },
  {
    id: 'e-press-hit', name: 'Press hit piece', emoji: '🪡', severity: 'bad',
    blurb: 'A journalist calls your product "a solution in search of a problem."',
    choices: [
      { id: 'respond', label: 'Write a rebuttal', hint: 'Rep small up',
        effects: { reputationDelta: 2, burnDelta: 100 } },
      { id: 'distract', label: 'Announce a roadmap', hint: 'Users up',
        effects: { usersDelta: 1000, burnDelta: 200 } },
      { id: 'sue', label: 'Threaten to sue', hint: 'Bad idea',
        effects: { reputationDelta: -6, burnDelta: 800 } },
    ],
  },
  {
    id: 'e-viral-meme', name: 'Viral meme', emoji: '😹', severity: 'good',
    blurb: 'Someone made a meme about your product. It is not even mean.',
    choices: [
      { id: 'ride', label: 'Ride the wave', hint: 'Users up, rep up',
        effects: { usersDelta: 3000, reputationDelta: 3, burnDelta: 200 } },
      { id: 'takedown', label: 'Send a takedown', hint: 'Rep down',
        effects: { reputationDelta: -5, usersDelta: -200 } },
    ],
  },
  {
    id: 'e-hire-coo', name: 'Hire a COO', emoji: '👔', severity: 'neutral',
    blurb: 'A "seasoned operator" wants to join. Salary: your burn rate, plus equity.',
    choices: [
      { id: 'hire', label: 'Hire them', hint: 'Burn up, churn down',
        effects: { burnDelta: 800, churnDelta: -0.02, reputationDelta: 2 } },
      { id: 'pass', label: 'Pass', hint: 'Safe', effects: {} },
    ],
  },
  {
    id: 'e-breach-rumor', name: 'Data breach rumor', emoji: '🔓', severity: 'bad',
    blurb: 'A forum post claims your database leaked. You are not sure.',
    choices: [
      { id: 'audit', label: 'Run an audit', hint: 'Cash hit, rep up',
        effects: { burnDelta: 1000, reputationDelta: 4, churnDelta: -0.01 } },
      { id: 'deny', label: 'Deny everything', hint: 'Rep down',
        effects: { reputationDelta: -5, churnDelta: 0.03 } },
      { id: 'notify', label: 'Notify users', hint: 'Honest, costly',
        effects: { reputationDelta: 2, churnDelta: 0.02, burnDelta: 500 } },
    ],
  },
  {
    id: 'e-big-customer', name: 'Big customer asks', emoji: '🤝', severity: 'good',
    blurb: 'An enterprise customer will sign if you ship one specific feature.',
    choices: [
      { id: 'build', label: 'Build it for them', hint: 'MRR up, burn up',
        effects: { mrrDelta: 1500, burnDelta: 600, churnDelta: -0.01 } },
      { id: 'refuse', label: 'Refuse politely', hint: 'Safe', effects: {} },
    ],
  },
  {
    id: 'e-key-quit', name: 'Key engineer quits', emoji: '🚪', severity: 'bad',
    blurb: 'Your only backend engineer got a better offer. From a rival.',
    choices: [
      { id: 'counter', label: 'Counter-offer', hint: 'Burn up',
        effects: { burnDelta: 700, churnDelta: -0.01 } },
      { id: 'replace', label: 'Replace fast', hint: 'Burn up, churn up',
        effects: { burnDelta: 400, churnDelta: 0.02 } },
      { id: 'pause', label: 'Pause roadmap', hint: 'Users down',
        effects: { usersDelta: -800, burnDelta: -200 } },
    ],
  },
  {
    id: 'e-acquirer', name: 'Acquirer sniffing', emoji: '🦈', severity: 'wildcard',
    blurb: 'A bigger company asks for "exploratory conversations."',
    choices: [
      { id: 'talk', label: 'Talk, no commitment', hint: 'Rep up',
        effects: { reputationDelta: 4 } },
      { id: 'demand', label: 'Demand a number', hint: 'Risky',
        effects: { reputationDelta: -2, mrrDelta: 200 } },
      { id: 'ghost', label: 'Ghost them', hint: 'Safe', effects: {} },
    ],
  },
  {
    id: 'e-conference', name: 'Conference invite', emoji: '🎪', severity: 'neutral',
    blurb: 'You are invited to keynote a conference in a city you cannot afford.',
    choices: [
      { id: 'go', label: 'Go and network', hint: 'Rep up, burn up',
        effects: { reputationDelta: 5, burnDelta: 1200, usersDelta: 500 } },
      { id: 'skip', label: 'Skip it', hint: 'Safe', effects: {} },
    ],
  },
  {
    id: 'e-compliance', name: 'Compliance form', emoji: '📋', severity: 'neutral',
    blurb: 'A prospect needs SOC2 before they will sign. You do not have SOC2.',
    choices: [
      { id: 'audit', label: 'Pay for an audit', hint: 'Costly, rep up',
        effects: { burnDelta: 2000, reputationDelta: 6, mrrDelta: 800 } },
      { id: 'self', label: 'Send a self-attestation', hint: 'Risky',
        effects: { reputationDelta: -3, mrrDelta: 300 } },
      { id: 'walk', label: 'Walk away', hint: 'Safe', effects: {} },
    ],
  },
  {
    id: 'e-power-user', name: 'Power user praise', emoji: '🌟', severity: 'good',
    blurb: 'A power user writes a glowing blog post. It is on the front page of somewhere.',
    choices: [
      { id: 'amplify', label: 'Amplify it', hint: 'Users up, rep up',
        effects: { usersDelta: 2500, reputationDelta: 4, burnDelta: 200 } },
      { id: 'thank', label: 'Thank them quietly', hint: 'Small rep up',
        effects: { reputationDelta: 2 } },
    ],
  },
  {
    id: 'e-bug-spree', name: 'Bug spree', emoji: '🐛', severity: 'bad',
    blurb: 'A regression slipped through. Users are tweeting screenshots.',
    choices: [
      { id: 'patch', label: 'Patch and apologize', hint: 'Burn up, churn down',
        effects: { burnDelta: 500, churnDelta: -0.01, reputationDelta: 1 } },
      { id: 'silent', label: 'Silent fix', hint: 'Rep down',
        effects: { burnDelta: 200, reputationDelta: -2 } },
    ],
  },
  {
    id: 'e-investor-intro', name: 'Warm investor intro', emoji: '🫡', severity: 'good',
    blurb: 'A friendly founder offers to introduce you to their investor.',
    choices: [
      { id: 'take', label: 'Take the intro', hint: 'Rep up, burn up',
        effects: { reputationDelta: 3, burnDelta: 300, mrrDelta: 200 } },
      { id: 'decline', label: 'Decline, stay lean', hint: 'Burn down',
        effects: { burnDelta: -100 } },
    ],
  },
  {
    id: 'e-trending', name: 'Trending topic', emoji: '📈', severity: 'good',
    blurb: 'Your category is suddenly the hot thing. Everyone is searching for it.',
    choices: [
      { id: 'capture', label: 'Capture the wave', hint: 'Users up, burn up',
        effects: { usersDelta: 4000, burnDelta: 400 } },
      { id: 'wait', label: 'Wait for it to pass', hint: 'Safe', effects: {} },
    ],
  },
  {
    id: 'e-layoff-wave', name: 'Layoff wave', emoji: '📉', severity: 'wildcard',
    blurb: 'A bigger rival lays off 10 percent. The press is calling it a sign.',
    choices: [
      { id: 'hire', label: 'Hire their talent', hint: 'Burn up, churn down',
        effects: { burnDelta: 500, churnDelta: -0.02, reputationDelta: 2 } },
      { id: 'pr', label: 'Write a "we are hiring" post', hint: 'Rep up',
        effects: { reputationDelta: 3, usersDelta: 300 } },
      { id: 'silent', label: 'Say nothing', hint: 'Safe', effects: {} },
    ],
  },
  {
    id: 'e-pricing-war', name: 'Pricing war', emoji: '⚔️', severity: 'bad',
    blurb: 'A rival cut prices to zero. Your customers are asking why you charge.',
    choices: [
      { id: 'match', label: 'Match their price', hint: 'MRR down, users up',
        effects: { mrrDelta: -1500, usersDelta: 2000, churnDelta: -0.01 } },
      { id: 'premium', label: 'Go premium instead', hint: 'Rep up, users down',
        effects: { reputationDelta: 4, usersDelta: -1000, mrrDelta: 500 } },
      { id: 'hold', label: 'Hold the line', hint: 'Churn up',
        effects: { churnDelta: 0.03 } },
    ],
  },
];

export const EVENT_BY_ID = new Map(EVENTS.map((e) => [e.id, e]));
