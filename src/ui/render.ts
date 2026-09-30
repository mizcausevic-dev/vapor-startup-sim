// VAPOR — DOM renderer. Reads engine state, writes to DOM. No game logic here.

import type { Engine } from '../game/engine.js';
import type { Ending, ScoreBreakdown, GameEvent } from '../game/types.js';
import type { ScoreEntry } from './storage.js';

const fmtMoney = (n: number): string => {
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(Math.round(n));
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}K`;
  return `${sign}$${abs}`;
};

const fmtNum = (n: number): string => {
  const abs = Math.round(n);
  if (abs >= 1_000_000) return `${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${(abs / 1_000).toFixed(1)}K`;
  return String(abs);
};

const fmtPct = (n: number): string => `${(n * 100).toFixed(1)}%`;

export class Renderer {
  constructor(private engine: Engine) {}

  showScreen(name: 'splash' | 'game' | 'pause' | 'ending'): void {
    const screens = {
      splash: document.getElementById('screen-splash'),
      game: document.getElementById('screen-game'),
      pause: document.getElementById('screen-pause'),
      ending: document.getElementById('screen-ending'),
    };
    for (const [key, el] of Object.entries(screens)) {
      if (!el) continue;
      if (key === name) {
        el.hidden = false;
        el.classList.add('is-active');
      } else {
        el.hidden = true;
        el.classList.remove('is-active');
      }
    }
  }

  renderHud(): void {
    const s = this.engine.state;
    const el = document.getElementById('hud-metrics');
    if (!el) return;
    const metrics: { label: string; value: string; cls: string }[] = [
      { label: 'Cash', value: fmtMoney(s.cash), cls: s.cash < 50000 ? 'metric--warn' : '' },
      { label: 'MRR', value: fmtMoney(s.mrr), cls: '' },
      { label: 'Users', value: fmtNum(s.users), cls: '' },
      { label: 'Churn', value: fmtPct(s.churn), cls: s.churn > 0.08 ? 'metric--warn' : '' },
      { label: 'Rep', value: String(Math.round(s.reputation)), cls: s.reputation < 20 ? 'metric--warn' : '' },
      { label: 'Burn', value: fmtMoney(s.burnRate) + '/sprint', cls: '' },
    ];
    el.innerHTML = metrics.map((m) =>
      `<div class="metric ${m.cls}"><div class="metric__label">${m.label}</div><div class="metric__value">${m.value}</div></div>`
    ).join('');

    const sprintNum = document.getElementById('sprint-num');
    if (sprintNum) sprintNum.textContent = String(s.sprint + 1);
    const sprintSeed = document.getElementById('sprint-seed');
    if (sprintSeed) sprintSeed.textContent = `seed ${s.seed}`;
  }

  renderHand(selectedId: string | null): void {
    const el = document.getElementById('hand');
    if (!el) return;
    const hand = this.engine.currentHand;
    el.innerHTML = hand.map((f, i) => {
      const affordable = this.engine.state.cash >= f.cost;
      const selected = f.id === selectedId;
      const cls = `card card--${f.category}${selected ? ' is-selected' : ''}${!affordable ? ' is-disabled' : ''}`;
      return `
        <button class="${cls}" data-feature="${f.id}" data-index="${i}" type="button"
          ${!affordable ? 'disabled aria-disabled="true"' : ''} aria-pressed="${selected}">
          <div class="card__emoji">${f.emoji}</div>
          <div class="card__name">${f.name}</div>
          <div class="card__blurb">${f.blurb}</div>
          <div class="card__cost">${fmtMoney(f.cost)}</div>
          <div class="card__index">${i + 1}</div>
        </button>`;
    }).join('');
  }

  renderBudget(): void {
    const el = document.getElementById('budget');
    if (!el) return;
    const s = this.engine.state;
    const b = s.budget;
    const total = b.engineering + b.marketing + b.support;
    const remaining = s.cash - total;
    const buckets: { key: 'engineering' | 'marketing' | 'support'; label: string; hint: string }[] = [
      { key: 'engineering', label: 'Engineering', hint: 'Reduces churn' },
      { key: 'marketing', label: 'Marketing', hint: 'Grows users' },
      { key: 'support', label: 'Support', hint: 'Reduces burn' },
    ];
    el.innerHTML = `
      <div class="budget__row">
        ${buckets.map((bk) => `
          <div class="budget__bucket">
            <div class="budget__bucket-label">${bk.label}</div>
            <div class="budget__bucket-hint">${bk.hint}</div>
            <div class="budget__bucket-controls">
              <button class="btn btn--tiny" data-budget="${bk.key}" data-delta="-500" type="button" aria-label="Decrease ${bk.label}">-</button>
              <div class="budget__bucket-value">${fmtMoney(b[bk.key])}</div>
              <button class="btn btn--tiny" data-budget="${bk.key}" data-delta="500" type="button" aria-label="Increase ${bk.label}">+</button>
            </div>
          </div>`).join('')}
      </div>
      <div class="budget__total">
        <span>Allocated: ${fmtMoney(total)}</span>
        <span class="${remaining < 0 ? 'metric--warn' : ''}">Remaining: ${fmtMoney(remaining)}</span>
      </div>`;
  }

  renderEvent(event: GameEvent | null, chosenChoiceId: string | null): void {
    const el = document.getElementById('event-slot');
    if (!el) return;
    if (!event) { el.innerHTML = ''; return; }
    const sevCls = `event--${event.severity}`;
    el.innerHTML = `
      <div class="event ${sevCls}">
        <div class="event__head">
          <span class="event__emoji">${event.emoji}</span>
          <span class="event__name">${event.name}</span>
          <span class="event__sev">${event.severity}</span>
        </div>
        <div class="event__blurb">${event.blurb}</div>
        <div class="event__choices">
          ${event.choices.map((c) => `
            <button class="btn btn--small ${c.id === chosenChoiceId ? 'btn--primary' : 'btn--ghost'}"
              data-choice="${c.id}" type="button" aria-pressed="${c.id === chosenChoiceId}">
              ${c.label}${c.hint ? `<span class="event__hint">${c.hint}</span>` : ''}
            </button>`).join('')}
        </div>
      </div>`;
  }

  renderFeatureList(): void {
    const el = document.getElementById('feature-list');
    if (!el) return;
    const ids = this.engine.state.features;
    el.innerHTML = ids.length === 0
      ? '<li class="feature-list__empty">No features shipped yet.</li>'
      : ids.map((id) => {
          const f = this.engine.currentHand.find((x) => x.id === id);
          return `<li class="feature-list__item">${f?.emoji ?? '📦'} ${f?.name ?? id}</li>`;
        }).join('');
  }

  renderRivalList(): void {
    const el = document.getElementById('rival-list');
    if (!el) return;
    const rivals = this.engine.state.competitors;
    el.innerHTML = rivals.map((r) => `
      <div class="rival ${r.alive ? '' : 'rival--dead'}">
        <span class="rival__emoji">${r.emoji}</span>
        <span class="rival__name">${r.name}</span>
        <span class="rival__users">${fmtNum(r.users)}u</span>
        <span class="rival__mrr">${fmtMoney(r.mrr)}</span>
        ${r.alive ? '' : '<span class="rival__dead-tag">dead</span>'}
      </div>`).join('');
  }

  renderLog(entries: string[]): void {
    const el = document.getElementById('log');
    if (!el) return;
    el.innerHTML = entries.slice(-6).reverse()
      .map((t) => `<div class="log__entry">${t}</div>`).join('');
  }

  showToast(msg: string, durMs = 2200): void {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('toast--show');
    window.setTimeout(() => el.classList.remove('toast--show'), durMs);
  }

  showEnding(ending: Ending, breakdown: ScoreBreakdown): void {
    this.showScreen('ending');
    const title = document.getElementById('ending-title');
    const flavor = document.getElementById('ending-flavor');
    const score = document.getElementById('ending-score');
    const list = document.getElementById('ending-breakdown');
    if (title) title.textContent = ending.title;
    if (flavor) flavor.textContent = ending.flavor;
    if (score) score.textContent = String(breakdown.final);
    if (list) {
      list.innerHTML = `
        <li>MRR component: ${Math.round(breakdown.mrrComponent)}</li>
        <li>Users component: ${Math.round(breakdown.usersComponent)}</li>
        <li>Reputation component: ${Math.round(breakdown.reputationComponent)}</li>
        <li>Days survived component: ${Math.round(breakdown.daysComponent)}</li>
        <li>Base: ${Math.round(breakdown.base)}</li>
        <li>Multiplier: ×${breakdown.multiplier}</li>`;
    }
  }

  renderScores(scores: ScoreEntry[]): void {
    const el = document.getElementById('scores-list');
    if (!el) return;
    el.innerHTML = scores.length === 0
      ? '<li class="scores-list__empty">No scores yet. Play a game.</li>'
      : scores.map((s, i) => `
        <li class="scores-list__item">
          <span class="scores-list__rank">#${i + 1}</span>
          <span class="scores-list__score">${s.score}</span>
          <span class="scores-list__ending">${s.ending}</span>
          <span class="scores-list__seed">seed ${s.seed}</span>
          <span class="scores-list__date">${s.date.slice(0, 10)}</span>
        </li>`).join('');
  }

  setMuteButton(muted: boolean): void {
    const btn = document.getElementById('btn-mute');
    const splash = document.getElementById('btn-sound');
    if (btn) {
      btn.setAttribute('aria-pressed', String(muted));
      btn.textContent = muted ? 'Sound: off' : 'Sound: on';
    }
    if (splash) {
      splash.setAttribute('aria-pressed', String(muted));
      splash.textContent = muted ? 'Sound: off' : 'Sound: on';
    }
  }

  setThemeButton(label: string): void {
    const btn = document.getElementById('btn-theme');
    if (btn) btn.textContent = `Theme: ${label}`;
  }

  setConfirmEnabled(enabled: boolean): void {
    const btn = document.getElementById('btn-confirm') as HTMLButtonElement | null;
    if (btn) btn.disabled = !enabled;
  }
}
