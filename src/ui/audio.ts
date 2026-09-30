// VAPOR — Web Audio synthesized SFX. No audio files, all original.
// AudioContext is created lazily on first user gesture (start button) to satisfy autoplay policies.

type SfxName = 'click' | 'confirm' | 'card' | 'event' | 'good' | 'bad' | 'win' | 'lose' | 'tick';

export class AudioBus {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  muted = false;

  /** Must be called from a user gesture handler. */
  init(): void {
    if (this.ctx) return;
    try {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.18;
      this.master.connect(this.ctx.destination);
    } catch {
      this.ctx = null;
    }
  }

  setMuted(m: boolean): void {
    this.muted = m;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(m ? 0 : 0.18, this.ctx.currentTime, 0.01);
    }
  }

  play(name: SfxName): void {
    if (!this.ctx || !this.master || this.muted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    switch (name) {
      case 'click': this.blip(now, 660, 0.05, 'square', 0.4); break;
      case 'confirm': this.chord(now, [523, 659, 784], 0.18, 'triangle'); break;
      case 'card': this.blip(now, 440, 0.08, 'sine', 0.5); break;
      case 'event': this.sweep(now, 220, 660, 0.22, 'sawtooth', 0.3); break;
      case 'good': this.chord(now, [523, 659, 784, 1047], 0.25, 'triangle'); break;
      case 'bad': this.sweep(now, 440, 110, 0.3, 'sawtooth', 0.35); break;
      case 'win': this.arpeggio(now, [523, 659, 784, 1047, 1319], 0.12, 'triangle'); break;
      case 'lose': this.arpeggio(now, [440, 392, 330, 262, 196], 0.18, 'sawtooth'); break;
      case 'tick': this.blip(now, 880, 0.02, 'square', 0.2); break;
    }
  }

  private blip(start: number, freq: number, dur: number, type: OscillatorType, gain: number): void {
    if (!this.ctx || !this.master) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(gain, start + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start(start);
    osc.stop(start + dur + 0.02);
  }

  private sweep(start: number, fromHz: number, toHz: number, dur: number, type: OscillatorType, gain: number): void {
    if (!this.ctx || !this.master) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(fromHz, start);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, toHz), start + dur);
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(gain, start + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start(start);
    osc.stop(start + dur + 0.02);
  }

  private chord(start: number, freqs: number[], dur: number, type: OscillatorType): void {
    freqs.forEach((f, i) => this.blip(start + i * 0.02, f, dur, type, 0.3));
  }

  private arpeggio(start: number, freqs: number[], step: number, type: OscillatorType): void {
    freqs.forEach((f, i) => this.blip(start + i * step, f, step * 1.6, type, 0.35));
  }
}
