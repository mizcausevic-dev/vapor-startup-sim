// VAPOR — theme picker. 7 themes, light/dark variants, localStorage persistence.
// Estate rule: dashboards ship with all 7 themes. Game HUD is dashboard-adjacent, so we comply.

export type ThemeId =
  | 'bert-dark' | 'bento-grid' | 'cosmic-cyber' | 'swiss-architect'
  | 'aqua-web20' | 'pop-brutalist' | 'steel-tactical' | 'parchment';

export const THEMES: { id: ThemeId; label: string; dark: boolean }[] = [
  { id: 'bert-dark', label: 'BERT Dark', dark: true },
  { id: 'bento-grid', label: 'Bento Grid', dark: true },
  { id: 'cosmic-cyber', label: 'Cosmic Cyber', dark: true },
  { id: 'swiss-architect', label: 'Swiss Architect', dark: false },
  { id: 'aqua-web20', label: 'Aqua Web 2.0', dark: false },
  { id: 'pop-brutalist', label: 'Pop Brutalist', dark: false },
  { id: 'steel-tactical', label: 'Steel Tactical', dark: true },
  { id: 'parchment', label: 'Parchment', dark: false },
];

const KEY = 'vapor.theme.v1';

export function loadTheme(): ThemeId {
  try {
    const t = localStorage.getItem(KEY) as ThemeId | null;
    if (t && THEMES.some((x) => x.id === t)) return t;
  } catch { /* ignore */ }
  return 'bert-dark';
}

export function saveTheme(t: ThemeId): void {
  try { localStorage.setItem(KEY, t); } catch { /* ignore */ }
}

export function applyTheme(t: ThemeId): void {
  document.body.setAttribute('data-theme', t);
  const isDark = THEMES.find((x) => x.id === t)?.dark ?? true;
  document.body.setAttribute('data-mode', isDark ? 'dark' : 'light');
}

export function nextTheme(t: ThemeId): ThemeId {
  const idx = THEMES.findIndex((x) => x.id === t);
  const next = THEMES[(idx + 1) % THEMES.length]!;
  return next.id;
}
