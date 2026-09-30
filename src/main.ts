// VAPOR — main entry. Wires engine, renderer, audio, canvas, input.

import { Engine } from './game/engine.js';
import { computeScore } from './game/scoring.js';
import { defaultSeed } from './game/prng.js';
import { Renderer } from './ui/render.js';
import { AudioBus } from './ui/audio.js';
import { RivalCanvas } from './ui/canvas.js';
import { loadScores, saveScore, clearScores, type ScoreEntry } from './ui/storage.js';
import { applyTheme, loadTheme, saveTheme, nextTheme, THEMES, type ThemeId } from './ui/themes.js';

class GameApp {
  private engine: Engine;
  private renderer: Renderer;
  private audio = new AudioBus();
  private canvas: RivalCanvas | null = null;
  private selectedFeature: string | null = null;
  private selectedChoice: string | null = null;
  private log: string[] = [];
  private theme: ThemeId = 'bert-dark';

  constructor() {
    this.theme = loadTheme();
    applyTheme(this.theme);

    const seedInput = this.readSeedFromEnv();
    const seed = seedInput ?? defaultSeed();
    this.engine = new Engine({ seed, muted: false });
    this.renderer = new Renderer(this.engine);
    this.renderer.setThemeButton(THEMES.find((t) => t.id === this.theme)!.label);
    this.renderer.setMuteButton(false);

    this.bindSplash();
    this.bindGame();
    this.bindEnding();
    this.bindKeyboard();
    this.bindPause();

    this.renderer.showScreen('splash');
    this.renderer.renderScores(loadScores());
  }

  private readSeedFromEnv(): number | null {
    // Vite exposes import.meta.env.VITE_* at build time. We do not inject any,
    // but support it if the user populates .env. No secrets here.
    const v = (import.meta as unknown as { env?: Record<string, string> }).env;
    const raw = v?.VITE_DEFAULT_SEED;
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n >>> 0 : null;
  }

  // ---------- Splash ----------

  private bindSplash(): void {
    document.getElementById('btn-start')?.addEventListener('click', () => this.startNewGame());
    document.getElementById('btn-help')?.addEventListener('click', () => this.togglePanel('help-panel'));
    document.getElementById('btn-scores')?.addEventListener('click', () => this.togglePanel('scores-panel'));
    document.getElementById('btn-seed')?.addEventListener('click', () => this.togglePanel('seed-panel'));
    document.getElementById('btn-theme')?.addEventListener('click', () => this.cycleTheme());
    document.getElementById('btn-sound')?.addEventListener('click', () => this.toggleMute());

    document.getElementById('btn-seed-confirm')?.addEventListener('click', () => {
      const input = document.getElementById('seed-input') as HTMLInputElement | null;
      const raw = input?.value.trim();
      let seed: number;
      if (!raw) seed = defaultSeed();
      else { const n = Number(raw); seed = Number.isFinite(n) && n > 0 ? n >>> 0 : defaultSeed(); }
      this.engine = new Engine({ seed, muted: this.audio.muted });
      this.renderer = new Renderer(this.engine);
      this.togglePanel('seed-panel');
      this.renderer.showToast(`Seed set to ${seed}`);
    });
    document.getElementById('btn-seed-cancel')?.addEventListener('click', () => this.togglePanel('seed-panel'));
    document.getElementById('btn-scores-clear')?.addEventListener('click', () => {
      clearScores();
      this.renderer.renderScores([]);
      this.renderer.showToast('Scores cleared');
    });
  }

  private togglePanel(id: string): void {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle('panel--hidden');
    el.classList.toggle('panel--visible');
  }

  private cycleTheme(): void {
    this.theme = nextTheme(this.theme);
    applyTheme(this.theme);
    saveTheme(this.theme);
    this.renderer.setThemeButton(THEMES.find((t) => t.id === this.theme)!.label);
    this.audio.play('click');
  }

  private toggleMute(): void {
    this.audio.init();
    const muted = this.audio.muted ? false : true;
    this.audio.setMuted(muted);
    this.engine.state.muted = muted;
    this.renderer.setMuteButton(muted);
    if (!muted) this.audio.play('click');
  }

  // ---------- Game ----------

  private startNewGame(): void {
    this.audio.init();
    this.audio.play('confirm');
    this.engine.startGame();
    this.selectedFeature = null;
    this.selectedChoice = null;
    this.log = [];
    this.log.push(`Sprint 1. You founded a startup in the Cloud District.`);
    this.renderer.showScreen('game');
    this.initCanvas();
    this.renderAll();
  }

  private initCanvas(): void {
    const canvasEl = document.getElementById('rival-canvas') as HTMLCanvasElement | null;
    if (!canvasEl) return;
    if (!this.canvas) this.canvas = new RivalCanvas(canvasEl);
    this.canvas.setRivals(this.engine.state.competitors);
    this.canvas.start();
  }

  private bindGame(): void {
    // Feature card click (event delegation).
    document.getElementById('hand')?.addEventListener('click', (e) => {
      const target = (e.target as HTMLElement).closest('[data-feature]') as HTMLElement | null;
      if (!target) return;
      const id = target.getAttribute('data-feature');
      if (!id) return;
      this.selectFeature(id);
    });

    // Event choice click.
    document.getElementById('event-slot')?.addEventListener('click', (e) => {
      const target = (e.target as HTMLElement).closest('[data-choice]') as HTMLElement | null;
      if (!target) return;
      const id = target.getAttribute('data-choice');
      if (!id) return;
      this.selectChoice(id);
    });

    // Budget +/- buttons.
    document.getElementById('budget')?.addEventListener('click', (e) => {
      const target = (e.target as HTMLElement).closest('[data-budget]') as HTMLElement | null;
      if (!target) return;
      const key = target.getAttribute('data-budget') as 'engineering' | 'marketing' | 'support';
      const delta = Number(target.getAttribute('data-delta'));
      this.adjustBudget(key, delta);
    });

    // Confirm sprint.
    document.getElementById('btn-confirm')?.addEventListener('click', () => this.confirmSprint());

    // HUD controls.
    document.getElementById('btn-pause')?.addEventListener('click', () => this.pauseGame());
    document.getElementById('btn-restart')?.addEventListener('click', () => this.confirmRestart());
    document.getElementById('btn-mute')?.addEventListener('click', () => this.toggleMute());
    document.getElementById('btn-help-game')?.addEventListener('click', () => this.togglePanel('help-panel'));
  }

  private selectFeature(id: string): void {
    if (!this.engine.selectFeature(id)) {
      this.renderer.showToast('Not enough cash for that feature');
      this.audio.play('bad');
      return;
    }
    this.selectedFeature = id;
    this.audio.play('card');
    this.renderHand();
    this.updateConfirm();
  }

  private selectChoice(id: string): void {
    this.selectedChoice = id;
    this.audio.play('click');
    this.renderEvent();
    this.updateConfirm();
  }

  private adjustBudget(key: 'engineering' | 'marketing' | 'support', delta: number): void {
    const b = { ...this.engine.state.budget };
    b[key] = Math.max(0, b[key] + delta);
    if (this.engine.setBudget(b)) {
      this.audio.play('tick');
      this.renderBudget();
    } else {
      this.renderer.showToast('Cannot allocate more than available cash');
      this.audio.play('bad');
    }
  }

  private confirmSprint(): void {
    if (!this.selectedFeature) { this.renderer.showToast('Pick a feature card first'); return; }
    const event = this.engine.currentEvent;
    if (event && event.choices.length > 0 && !this.selectedChoice) {
      this.renderer.showToast('Pick an event response first'); return;
    }
    const choiceId = this.selectedChoice ?? event?.choices[0]?.id ?? 'none';
    const feature = this.engine.currentHand.find((f) => f.id === this.selectedFeature);
    const ending = this.engine.resolveSprint(this.selectedFeature!, choiceId);

    this.log.push(`Sprint ${this.engine.state.sprint}: built ${feature?.name ?? '?'}.`);
    if (event) this.log.push(`Event: ${event.name}.`);

    this.audio.play(ending ? (ending.win ? 'win' : 'lose') : 'confirm');

    if (ending) {
      this.handleEnding(ending);
    } else {
      this.selectedFeature = null;
      this.selectedChoice = null;
      this.renderAll();
    }
  }

  private renderAll(): void {
    this.renderer.renderHud();
    this.renderer.renderHand(this.selectedFeature);
    this.renderer.renderBudget();
    this.renderer.renderEvent(this.engine.currentEvent, this.selectedChoice);
    this.renderer.renderFeatureList();
    this.renderer.renderRivalList();
    this.renderer.renderLog(this.log);
    if (this.canvas) this.canvas.setRivals(this.engine.state.competitors);
    this.updateConfirm();
  }

  private renderHand(): void { this.renderer.renderHand(this.selectedFeature); }
  private renderBudget(): void { this.renderer.renderBudget(); }
  private renderEvent(): void {
    this.renderer.renderEvent(this.engine.currentEvent, this.selectedChoice);
  }

  private updateConfirm(): void {
    const ready = Boolean(this.selectedFeature) &&
      (!this.engine.currentEvent || this.engine.currentEvent.choices.length === 0 || Boolean(this.selectedChoice));
    this.renderer.setConfirmEnabled(ready);
  }

  // ---------- Pause / restart ----------

  private bindPause(): void {
    document.getElementById('btn-resume')?.addEventListener('click', () => this.resumeGame());
    document.getElementById('btn-quit')?.addEventListener('click', () => this.quitToMenu());
  }

  private pauseGame(): void {
    this.engine.pause();
    this.renderer.showScreen('pause');
    this.canvas?.stop();
  }
  private resumeGame(): void {
    this.engine.resume();
    this.renderer.showScreen('game');
    this.canvas?.start();
  }
  private quitToMenu(): void {
    this.engine.quitToMenu();
    this.canvas?.stop();
    this.renderer.showScreen('splash');
    this.renderer.renderScores(loadScores());
  }

  private confirmRestart(): void {
    if (!confirm('Restart with the same seed? Current run will be lost.')) return;
    this.startNewGame();
  }

  // ---------- Ending ----------

  private bindEnding(): void {
    document.getElementById('btn-ending-restart')?.addEventListener('click', () => this.startNewGame());
    document.getElementById('btn-ending-menu')?.addEventListener('click', () => this.quitToMenu());
  }

  private handleEnding(ending: import('./game/types.js').Ending): void {
    const breakdown = computeScore(this.engine.state, ending);
    const entry: ScoreEntry = {
      seed: this.engine.state.seed,
      score: breakdown.final,
      ending: ending.id,
      win: ending.win,
      sprint: this.engine.state.sprint,
      date: new Date().toISOString(),
    };
    const scores = saveScore(entry);
    this.renderer.renderScores(scores);
    this.renderer.showEnding(ending, breakdown);
    this.canvas?.stop();
  }

  // ---------- Keyboard ----------

  private bindKeyboard(): void {
    document.addEventListener('keydown', (e) => {
      // Avoid hijacking when user is typing in an input.
      const t = e.target as HTMLElement;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;

      const s = this.engine.state.status;
      if (s === 'splash') {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.startNewGame(); }
        return;
      }
      if (s === 'pause') {
        if (e.key.toLowerCase() === 'p' || e.key === 'Escape') { e.preventDefault(); this.resumeGame(); }
        return;
      }
      if (s === 'ending') {
        if (e.key.toLowerCase() === 'r' || e.key === 'Enter') { e.preventDefault(); this.startNewGame(); }
        return;
      }
      // In-game.
      switch (e.key) {
        case '1': case '2': case '3': case '4': {
          const idx = Number(e.key) - 1;
          const id = this.engine.state.hand[idx];
          if (id) this.selectFeature(id);
          break;
        }
        case 'ArrowLeft': this.adjustBudget('engineering', -500); break;
        case 'ArrowRight': this.adjustBudget('engineering', 500); break;
        case 'ArrowUp': this.adjustBudget('marketing', 500); break;
        case 'ArrowDown': this.adjustBudget('support', 500); break;
        case ' ': case 'Enter': e.preventDefault(); this.confirmSprint(); break;
        case 'p': case 'P': this.pauseGame(); break;
        case 'r': case 'R': this.confirmRestart(); break;
        case 'm': case 'M': this.toggleMute(); break;
        case '?': this.togglePanel('help-panel'); break;
        case 't': case 'T': this.cycleTheme(); break;
        case 'Escape': this.pauseGame(); break;
      }
    });
  }
}

// Boot.
const boot = () => {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new GameApp());
  } else {
    new GameApp();
  }
};
boot();
