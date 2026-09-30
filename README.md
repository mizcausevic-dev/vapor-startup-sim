# VAPOR — Ship Nothing, Scale Everything

A satirical browser management game about competing software startups. You run a fictional startup in the fictional "Cloud District," pick features, juggle budget and churn, respond to random events, and try to reach one of five endings before your rivals eat your lunch.

Original work. No real companies are depicted. No third-party branding, code, or assets are used. All art is CSS/SVG. All audio is synthesized at runtime via the Web Audio API. All randomness is deterministic and seeded.

## What it is

- **Genre:** turn-based management sim, satirical
- **Stack:** TypeScript 5, Vite 5, Vitest 2. DOM HUD + Canvas rival viz. No runtime dependencies.
- **Loop:** each sprint (2 in-game weeks), draw 4 feature cards, pick 1, allocate budget across Engineering / Marketing / Support, resolve a seeded event, watch 3 AI rivals act, check for an ending.
- **Endings (5):** IPO, Acquired, Bootstrapped (win), Bankrupt, Scandal (lose).
- **Determinism:** `mulberry32` PRNG. Same seed = same feature deck, same event sequence, same rival behavior. Seed is shown in the HUD and settable from the menu.
- **Controls:** keyboard (1-4, arrows, Space, P, R, M, ?, T, Esc), touch (tap cards, +/- budget, tap confirm), mouse.
- **Themes:** 8 swappable themes (BERT Dark default + 7 more), light and dark, persisted in localStorage.
- **Accessibility:** `prefers-reduced-motion` collapses all animations. ARIA live regions on HUD, log, toast, scores.
- **Privacy:** no backend, no accounts, no network calls, no cookies, no analytics. localStorage only for high scores and theme.

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
```

## Build and preview

```bash
npm run build    # tsc --noEmit && vite build -> dist/
npm run preview  # serves dist/ on http://localhost:4173
```

## Tests

```bash
npm test         # vitest run, 53 tests
npm run test:watch
```

Test coverage:

- `src/tests/prng.test.ts` — PRNG determinism, shuffle, snapshot/restore, seed hashing.
- `src/tests/scoring.test.ts` — scoring formula, clamps, multipliers, determinism.
- `src/tests/engine.test.ts` — engine determinism (same seed = same trace), state transitions, ending logic, budget validation, history snapshots.
- `src/tests/events.test.ts` — event and feature integrity, deck determinism, balance sanity.

All randomness flows through the `Rng` class. `Math.random` is not called anywhere in `src/game/` or `src/ui/`. The only `Math.random` call is in `src/ui/canvas.ts` for the rival particle wander (cosmetic, does not affect game state).

## Environment variables

This game is fully static and client-side. It does NOT read any environment variables at runtime. The `.env.example` file documents this and provides an optional `VITE_DEFAULT_SEED` for CI runs. No secrets are required or used.

## Deployment

### Netlify (recommended, configured)

`netlify.toml` is included. The site is a static build with no serverless functions.

```bash
npm run build
# then either:
npx netlify deploy --prod --dir=dist
# or connect the repo in the Netlify dashboard and let it auto-deploy
```

Security headers (CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy) are set in `netlify.toml`.

### Other static hosts

```bash
npm run build
# upload the dist/ folder to any static host (Vercel, GitHub Pages, Cloudflare Pages, S3, etc.)
```

## Project structure

```
src/
  game/         # pure game logic, no DOM, no I/O
    types.ts    # shared types
    prng.ts     # mulberry32 PRNG + seed hashing
    features.ts # 24 feature cards
    events.ts   # 18 random events
    engine.ts   # game state, turn loop, transitions
    scoring.ts  # pure scoring function
    endings.ts  # ending thresholds and metadata
    competitors.ts # AI rival logic
  ui/           # DOM rendering, audio, canvas, storage, themes
    render.ts   # DOM renderer
    audio.ts    # Web Audio synthesized SFX
    canvas.ts   # rival ecosystem canvas viz
    storage.ts  # localStorage high scores (safe fallback)
    themes.ts   # 8 themes, persisted
  styles/       # split CSS (base, game, ending, themes)
  tests/        # vitest specs
  main.ts       # orchestrator, wires everything together
```

## Design notes

- **No dominant strategy.** Every feature card has a cost. Growth cards grow churn. Monetization cards hurt reputation. Hype cards cost cash. Infra cards reduce burn but don't grow users.
- **Endings are tight.** IPO requires all three thresholds simultaneously. Acquired requires high reputation AND high users. Most runs end somewhere in between.
- **Rivals are deterministic.** They grow based on the same PRNG, so a given seed always produces the same rival trajectory. They can die if their reputation tanks.
- **Score is clamped.** No single metric can dominate via runaway inflation. MRR capped at 250K points, users at 100K, reputation at 10K, days at 1040.

## Security and privacy caveats

- No backend. No data leaves the browser.
- localStorage is used for high scores and theme preference only. No PII is collected.
- The CSP in `netlify.toml` blocks external connections (`connect-src 'none'`), frames, and plugin content.
- Audio context is created only after a user gesture (the Start button), per browser autoplay policies.
- The game does not set any cookies.

## What still needs human verification

- **Audio on mobile browsers.** Web Audio API is well-supported, but iOS Safari has historically required the AudioContext to be resumed on first touch. The code calls `audio.init()` on the Start button gesture, which should satisfy this, but live mobile testing is recommended.
- **Theme contrast.** The 8 themes are designed for readability, but formal WCAG AA/AAA contrast auditing across all themes is not automated. BERT Dark (default) is the primary audited theme.
- **Canvas performance on low-end devices.** The rival canvas uses `requestAnimationFrame` and respects `prefers-reduced-motion` (static draw when reduced). Live testing on a low-end phone is recommended.
- **Netlify deploy.** The build is verified locally. The actual deploy via MCP is run in the delivery step, and the live URL is reported only after it returns.

## License

MIT. Original work by Miz (Kinetic Gain LLC). No third-party material.
