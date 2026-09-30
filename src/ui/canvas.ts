// VAPOR — rival ecosystem canvas. Animated dots representing rival startups.
// Pure DOM canvas, no external libs. Respects prefers-reduced-motion.

import type { Competitor } from '../game/types.js';

interface Particle {
  rival: Competitor;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}

export class RivalCanvas {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private raf = 0;
  private running = false;
  private reducedMotion = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    this.ctx = ctx;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    this.canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  setRivals(rivals: Competitor[]): void {
    const w = this.canvas.clientWidth || 320;
    const h = this.canvas.clientHeight || 320;
    this.particles = rivals.map((r, i) => {
      const existing = this.particles[i];
      const angle = (i / Math.max(1, rivals.length)) * Math.PI * 2;
      return {
        rival: r,
        x: existing?.x ?? w / 2 + Math.cos(angle) * 80,
        y: existing?.y ?? h / 2 + Math.sin(angle) * 80,
        vx: existing?.vx ?? (Math.cos(angle) * 0.4),
        vy: existing?.vy ?? (Math.sin(angle) * 0.4),
        r: 8 + Math.min(20, Math.sqrt(r.users) / 10),
      };
    });
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    if (this.reducedMotion) {
      this.draw();
      return;
    }
    const loop = () => {
      if (!this.running) return;
      this.step();
      this.draw();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop(): void {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private step(): void {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    for (const p of this.particles) {
      if (!p.rival.alive) continue;
      p.x += p.vx;
      p.y += p.vy;
      // Bounce off edges.
      if (p.x < p.r) { p.x = p.r; p.vx *= -1; }
      if (p.x > w - p.r) { p.x = w - p.r; p.vx *= -1; }
      if (p.y < p.r) { p.y = p.r; p.vy *= -1; }
      if (p.y > h - p.r) { p.y = h - p.r; p.vy *= -1; }
      // Tiny random wander.
      p.vx += (Math.random() - 0.5) * 0.02;
      p.vy += (Math.random() - 0.5) * 0.02;
      // Clamp speed.
      const sp = Math.hypot(p.vx, p.vy);
      const max = 1.2;
      if (sp > max) { p.vx = (p.vx / sp) * max; p.vy = (p.vy / sp) * max; }
    }
  }

  private draw(): void {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, w, h);

    // Grid background.
    ctx.strokeStyle = 'rgba(102,252,241,0.06)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 32) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 32) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Connection lines between alive rivals.
    const alive = this.particles.filter((p) => p.rival.alive);
    ctx.strokeStyle = 'rgba(69,162,158,0.18)';
    for (let i = 0; i < alive.length; i++) {
      for (let j = i + 1; j < alive.length; j++) {
        ctx.beginPath();
        ctx.moveTo(alive[i]!.x, alive[i]!.y);
        ctx.lineTo(alive[j]!.x, alive[j]!.y);
        ctx.stroke();
      }
    }

    // Particles.
    for (const p of this.particles) {
      if (!p.rival.alive) {
        // Dead rival: faded X.
        ctx.strokeStyle = 'rgba(255,45,85,0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p.x - 6, p.y - 6); ctx.lineTo(p.x + 6, p.y + 6);
        ctx.moveTo(p.x + 6, p.y - 6); ctx.lineTo(p.x - 6, p.y + 6);
        ctx.stroke();
        continue;
      }
      // Glow.
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 2.5);
      const hue = p.rival.reputation >= 60 ? '102,252,241' : p.rival.reputation >= 30 ? '69,162,158' : '255,45,85';
      grad.addColorStop(0, `rgba(${hue},0.9)`);
      grad.addColorStop(1, `rgba(${hue},0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 2.5, 0, Math.PI * 2);
      ctx.fill();
      // Core.
      ctx.fillStyle = `rgba(${hue},1)`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      // Label.
      ctx.fillStyle = '#C5C6C7';
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(p.rival.emoji + ' ' + p.rival.name, p.x, p.y - p.r - 6);
    }
  }
}
