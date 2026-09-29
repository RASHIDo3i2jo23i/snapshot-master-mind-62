import { Sfx } from "./audio";

export const W = 800;
export const H = 1000;
const CX = 400;
const CY = 360;
const R = 228;
const START_X = 400;
const START_Y = 880;

const G = 2000; // gravity on the z axis
const SPEED_MAX = 1500;
const VZ_MAX = 640;
const DRAG_MAX = 230;

export type SakaKind = "normal" | "lead";
export type AsykKind = "plain" | "gold";

export const PRAISE = ["Жарайсың!", "Керемет!", "Шебер!", "Мерген!"];

interface Asyk {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  kind: AsykKind;
  angle: number;
  spin: number;
  out: boolean;
  gone: boolean;
}

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  max: number;
  size: number;
  color: string;
}

interface FloatText {
  x: number;
  y: number;
  text: string;
  life: number;
  color: string;
}

export interface EngineCallbacks {
  onScore: (score: number) => void;
  onThrows: (left: number) => void;
  onEnd: (win: boolean, score: number) => void;
}

const SAKA_STATS: Record<SakaKind, { speed: number; impulse: number; color: string }> = {
  normal: { speed: 1, impulse: 1, color: "#e8d5a8" },
  lead: { speed: 0.78, impulse: 1.45, color: "#8f97a3" },
};

function rnd(a: number, b: number) {
  return a + Math.random() * (b - a);
}

export class AsykEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private raf = 0;
  private last = 0;
  private scale = 1;

  private sfx: Sfx;
  private cb: EngineCallbacks;
  private kind: SakaKind;

  private asyks: Asyk[] = [];
  private particles: Particle[] = [];
  private texts: FloatText[] = [];

  private saka = { x: START_X, y: START_Y, z: 0, vx: 0, vy: 0, vz: 0, r: 26, active: false, grounded: false, angle: 0 };
  private aiming = false;
  private aimPoint = { x: START_X, y: START_Y };

  private score = 0;
  private throwsLeft = 5;
  private settleTimer = 0;
  private shake = 0;
  private slowmo = 0;
  private finished = false;
  private pattern: CanvasPattern | null = null;

  constructor(canvas: HTMLCanvasElement, kind: SakaKind, sfx: Sfx, cb: EngineCallbacks) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas 2d context unavailable");
    this.ctx = ctx;
    this.kind = kind;
    this.sfx = sfx;
    this.cb = cb;
    this.reset();
    this.pattern = this.buildPattern();
    this.bind();
    this.resize();
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.loop);
  }

  // ---------- setup ----------

  private reset() {
    const layout: { a: number; d: number; kind: AsykKind }[] = [
      { a: -Math.PI / 2, d: 148, kind: "gold" },
      { a: -Math.PI / 2 + 1.25, d: 160, kind: "plain" },
      { a: -Math.PI / 2 - 1.25, d: 160, kind: "plain" },
      { a: Math.PI / 2 - 0.5, d: 132, kind: "plain" },
      { a: Math.PI / 2 + 0.5, d: 132, kind: "plain" },
    ];
    this.asyks = layout.map((l) => ({
      x: CX + Math.cos(l.a) * l.d,
      y: CY + Math.sin(l.a) * l.d * 0.85,
      vx: 0,
      vy: 0,
      r: 20,
      kind: l.kind,
      angle: rnd(-0.6, 0.6),
      spin: 0,
      out: false,
      gone: false,
    }));
    this.score = 0;
    this.throwsLeft = 5;
    this.finished = false;
    this.resetSaka();
  }

  private resetSaka() {
    this.saka = {
      x: START_X,
      y: START_Y,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      r: 26,
      active: false,
      grounded: false,
      angle: 0,
    };
    this.aiming = false;
  }

  private buildPattern(): CanvasPattern | null {
    const c = document.createElement("canvas");
    c.width = 120;
    c.height = 120;
    const p = c.getContext("2d");
    if (!p) return null;
    p.fillStyle = "#0d4a4e";
    p.fillRect(0, 0, 120, 120);
    // qoshqar muyiz (ram horn) style ornament
    p.strokeStyle = "rgba(226, 183, 90, 0.22)";
    p.lineWidth = 3;
    p.lineCap = "round";
    const horn = (ox: number, oy: number, flip: number) => {
      p.save();
      p.translate(ox, oy);
      p.scale(flip, 1);
      p.beginPath();
      p.moveTo(0, 22);
      p.lineTo(0, -6);
      p.arc(-11, -6, 11, 0, Math.PI * 1.35, false);
      p.stroke();
      p.beginPath();
      p.arc(-11, -6, 4, Math.PI * 1.35, Math.PI * 2.4, false);
      p.stroke();
      p.restore();
    };
    horn(30, 40, 1);
    horn(30, 40, -1);
    horn(90, 100, 1);
    horn(90, 100, -1);
    return p.createPattern(c, "repeat");
  }

  private bind() {
    this.canvas.addEventListener("pointerdown", this.onDown);
    this.canvas.addEventListener("pointermove", this.onMove);
    this.canvas.addEventListener("pointerup", this.onUp);
    this.canvas.addEventListener("pointercancel", this.onUp);
    window.addEventListener("resize", this.resize);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.canvas.removeEventListener("pointerdown", this.onDown);
    this.canvas.removeEventListener("pointermove", this.onMove);
    this.canvas.removeEventListener("pointerup", this.onUp);
    this.canvas.removeEventListener("pointercancel", this.onUp);
    window.removeEventListener("resize", this.resize);
    this.sfx.stopWhistle();
  }

  restart() {
    this.particles = [];
    this.texts = [];
    this.reset();
    this.cb.onScore(0);
    this.cb.onThrows(this.throwsLeft);
  }

  resize = () => {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.max(1, Math.round(rect.width * dpr));
    this.canvas.height = Math.max(1, Math.round(rect.height * dpr));
    this.scale = rect.width / W;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  // ---------- input ----------

  private toLocal(e: PointerEvent) {
    const rect = this.canvas.getBoundingClientRect();
    return { x: (e.clientX - rect.left) / this.scale, y: (e.clientY - rect.top) / this.scale };
  }

  private onDown = (e: PointerEvent) => {
    if (this.finished || this.saka.active) return;
    this.sfx.resume();
    this.canvas.setPointerCapture(e.pointerId);
    this.aiming = true;
    this.aimPoint = this.toLocal(e);
  };

  private onMove = (e: PointerEvent) => {
    if (!this.aiming) return;
    this.aimPoint = this.toLocal(e);
  };

  private onUp = () => {
    if (!this.aiming) return;
    this.aiming = false;
    const aim = this.aimVector();
    if (!aim) return;
    this.launch(aim);
  };

  /** Direction + power derived from how far the pointer is pulled back. */
  private aimVector() {
    const dx = this.saka.x - this.aimPoint.x;
    const dy = this.saka.y - this.aimPoint.y;
    const len = Math.hypot(dx, dy);
    if (len < 24) return null;
    const power = Math.min(len, DRAG_MAX) / DRAG_MAX;
    return { dx: dx / len, dy: dy / len, power };
  }

  private launch(aim: { dx: number; dy: number; power: number }) {
    const st = SAKA_STATS[this.kind];
    const speed = aim.power * SPEED_MAX * st.speed;
    this.saka.vx = aim.dx * speed;
    this.saka.vy = aim.dy * speed;
    this.saka.vz = aim.power * VZ_MAX * (this.kind === "lead" ? 0.92 : 1);
    this.saka.z = 6;
    this.saka.active = true;
    this.saka.grounded = false;
    this.settleTimer = 0;
    this.throwsLeft -= 1;
    this.cb.onThrows(this.throwsLeft);
    this.sfx.startWhistle();
  }

  // ---------- simulation ----------

  private predict(aim: { dx: number; dy: number; power: number }) {
    const st = SAKA_STATS[this.kind];
    const speed = aim.power * SPEED_MAX * st.speed;
    const vz = aim.power * VZ_MAX * (this.kind === "lead" ? 0.92 : 1);
    const t = (2 * vz) / G;
    const pts: { x: number; y: number; z: number }[] = [];
    const steps = 26;
    for (let i = 0; i <= steps; i++) {
      const tt = (t * i) / steps;
      pts.push({
        x: this.saka.x + aim.dx * speed * tt,
        y: this.saka.y + aim.dy * speed * tt,
        z: Math.max(0, 6 + vz * tt - 0.5 * G * tt * tt),
      });
    }
    return { pts, land: pts[pts.length - 1] };
  }

  private burst(x: number, y: number, n: number, color: string, power: number, gold = false) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = rnd(30, 140) * power;
      this.particles.push({
        x,
        y,
        z: gold ? rnd(4, 20) : 2,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s * 0.6,
        vz: gold ? rnd(90, 260) : rnd(30, 120),
        life: 0,
        max: gold ? rnd(0.6, 1.1) : rnd(0.35, 0.7),
        size: gold ? rnd(2, 4.5) : rnd(3, 7),
        color,
      });
    }
  }

  private addText(x: number, y: number, text: string, color = "#ffe9a8") {
    this.texts.push({ x, y, text, life: 0, color });
  }

  private update(dt: number) {
    const s = this.saka;

    // slow-motion trigger: fast saka about to reach an asyk
    if (s.active && this.slowmo <= 0) {
      const sp = Math.hypot(s.vx, s.vy);
      if (sp > 500 && s.z < 90) {
        for (const a of this.asyks) {
          if (a.gone) continue;
          const nx = s.x + s.vx * 0.18;
          const ny = s.y + s.vy * 0.18;
          if (Math.hypot(nx - a.x, ny - a.y) < a.r + s.r + 14) {
            this.slowmo = 0.45;
            break;
          }
        }
      }
    }
    if (this.slowmo > 0) this.slowmo = Math.max(0, this.slowmo - dt);

    if (s.active) {
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.z += s.vz * dt;
      s.vz -= G * dt;
      s.angle += (Math.hypot(s.vx, s.vy) / 160) * dt * 6;

      if (s.z <= 0) {
        s.z = 0;
        if (s.vz < -150) {
          // bounce, losing most of the energy
          s.vz = -s.vz * 0.36;
          s.vx *= 0.68;
          s.vy *= 0.68;
          const p = Math.min(1, Math.abs(s.vz) / 400);
          this.sfx.thud(p);
          this.burst(s.x, s.y, 10, "#c9b189", 0.7 + p);
          this.shake = Math.max(this.shake, 4 * p);
        } else {
          s.vz = 0;
          if (!s.grounded) {
            s.grounded = true;
            this.sfx.stopWhistle();
            this.sfx.thud(0.4);
            this.burst(s.x, s.y, 8, "#c9b189", 0.6);
          }
        }
      }

      if (s.grounded) {
        const damp = Math.exp(-2.6 * dt);
        s.vx *= damp;
        s.vy *= damp;
      }

      const airborne = s.z > 4;
      this.sfx.updateWhistle(airborne ? Math.min(1, Math.hypot(s.vx, s.vy) / 900) : 0);

      // collisions only near the ground — in the air the saka flies OVER the asyks
      if (s.z < 22) {
        const st = SAKA_STATS[this.kind];
        for (const a of this.asyks) {
          if (a.gone) continue;
          const dx = a.x - s.x;
          const dy = a.y - s.y;
          const d = Math.hypot(dx, dy);
          if (d < a.r + s.r && d > 0.001) {
            const nx = dx / d;
            const ny = dy / d;
            const sp = Math.hypot(s.vx, s.vy);
            const power = Math.min(1, sp / 900);
            a.vx += nx * sp * 0.85 * st.impulse + s.vx * 0.12;
            a.vy += ny * sp * 0.85 * st.impulse + s.vy * 0.12;
            a.spin = rnd(-12, 12);
            s.vx = s.vx * 0.32 - nx * sp * 0.12;
            s.vy = s.vy * 0.32 - ny * sp * 0.12;
            s.x = a.x - nx * (a.r + s.r);
            s.y = a.y - ny * (a.r + s.r);
            this.shake = Math.max(this.shake, 6 + 10 * power);
            this.sfx.knock(0.4 + power);
            this.burst(a.x, a.y, 12, "#d8c49a", 0.8 + power);
          }
        }
      }

      // throw ends once everything has come to rest
      const allSlow =
        s.grounded &&
        Math.hypot(s.vx, s.vy) < 18 &&
        this.asyks.every((a) => a.gone || Math.hypot(a.vx, a.vy) < 18);
      if (allSlow) {
        this.settleTimer += dt;
        if (this.settleTimer > 0.5) this.endThrow();
      } else {
        this.settleTimer = 0;
      }
      if ((s.x < -120 || s.x > W + 120 || s.y < -160 || s.y > H + 160) && s.grounded) this.endThrow();
    }

    // asyks
    for (const a of this.asyks) {
      if (a.gone) continue;
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      const damp = Math.exp(-1.9 * dt);
      a.vx *= damp;
      a.vy *= damp;
      a.angle += a.spin * dt;
      a.spin *= Math.exp(-2.4 * dt);
      if (Math.hypot(a.vx, a.vy) < 6) {
        a.vx = 0;
        a.vy = 0;
      }

      if (!a.out) {
        const d = Math.hypot(a.x - CX, (a.y - CY) / 0.85);
        if (d > R + a.r) {
          a.out = true;
          const gold = a.kind === "gold";
          this.score += gold ? 300 : 100;
          this.cb.onScore(this.score);
          if (gold) {
            this.throwsLeft += 1;
            this.cb.onThrows(this.throwsLeft);
          }
          this.sfx.chime(gold);
          this.burst(a.x, a.y, gold ? 34 : 20, gold ? "#ffd766" : "#f0dca8", 1.2, true);
          this.addText(
            a.x,
            a.y - 30,
            PRAISE[Math.floor(Math.random() * PRAISE.length)],
            gold ? "#ffd766" : "#ffe9a8",
          );
          if (gold) this.addText(a.x, a.y - 74, "+300", "#ffd766");
          else this.addText(a.x, a.y - 74, "+100", "#bff0e4");
        }
      } else if (Math.hypot(a.vx, a.vy) < 10) {
        a.gone = true;
      }
    }

    // asyk vs asyk
    for (let i = 0; i < this.asyks.length; i++) {
      for (let j = i + 1; j < this.asyks.length; j++) {
        const a = this.asyks[i];
        const b = this.asyks[j];
        if (a.gone || b.gone) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.hypot(dx, dy);
        const min = a.r + b.r;
        if (d < min && d > 0.001) {
          const nx = dx / d;
          const ny = dy / d;
          const push = (min - d) / 2;
          a.x -= nx * push;
          a.y -= ny * push;
          b.x += nx * push;
          b.y += ny * push;
          const rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (rel < 0) {
            const imp = -rel * 0.75;
            a.vx -= nx * imp;
            a.vy -= ny * imp;
            b.vx += nx * imp;
            b.vy += ny * imp;
            this.sfx.knock(0.35);
          }
        }
      }
    }

    // particles & texts
    for (const p of this.particles) {
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      p.vz -= 700 * dt;
      if (p.z < 0) {
        p.z = 0;
        p.vz *= -0.3;
        p.vx *= 0.6;
        p.vy *= 0.6;
      }
    }
    this.particles = this.particles.filter((p) => p.life < p.max);
    for (const t of this.texts) t.life += dt;
    this.texts = this.texts.filter((t) => t.life < 1.4);

    this.shake = Math.max(0, this.shake - dt * 30);
  }

  private endThrow() {
    this.sfx.stopWhistle();
    const win = this.asyks.every((a) => a.out);
    if (win || this.throwsLeft <= 0) {
      this.finished = true;
      this.saka.active = false;
      this.cb.onEnd(win, this.score);
      return;
    }
    this.resetSaka();
  }

  // ---------- rendering ----------

  private loop = (now: number) => {
    const raw = Math.min((now - this.last) / 1000, 0.05);
    this.last = now;
    const dt = raw * (this.slowmo > 0 ? 0.35 : 1);
    if (!this.finished) this.update(dt);
    this.draw();
    this.raf = requestAnimationFrame(this.loop);
  };

  private draw() {
    const ctx = this.ctx;
    const rect = this.canvas.getBoundingClientRect();
    ctx.save();
    ctx.scale(this.scale, this.scale);
    ctx.clearRect(0, 0, W, H);

    if (this.shake > 0.2) {
      ctx.translate(rnd(-this.shake, this.shake), rnd(-this.shake, this.shake));
    }

    // background
    ctx.fillStyle = "#0d4a4e";
    ctx.fillRect(-40, -40, W + 80, H + 80);
    if (this.pattern) {
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = this.pattern;
      ctx.fillRect(-40, -40, W + 80, H + 80);
      ctx.restore();
    }
    const vig = ctx.createRadialGradient(CX, CY + 120, 120, CX, CY + 120, 760);
    vig.addColorStop(0, "rgba(255,255,255,0.06)");
    vig.addColorStop(1, "rgba(0,0,0,0.45)");
    ctx.fillStyle = vig;
    ctx.fillRect(-40, -40, W + 80, H + 80);

    this.drawField(ctx);

    // shadows first
    for (const a of this.asyks) if (!a.gone) this.drawShadow(ctx, a.x, a.y, 0, a.r);
    if (!this.finished) this.drawShadow(ctx, this.saka.x, this.saka.y, this.saka.z, this.saka.r);

    this.drawParticles(ctx, false);

    // sort by y for depth
    const sorted = [...this.asyks].filter((a) => !a.gone).sort((a, b) => a.y - b.y);
    for (const a of sorted) this.drawAsyk(ctx, a);

    if (!this.finished) this.drawSaka(ctx);
    this.drawParticles(ctx, true);
    this.drawAim(ctx);
    this.drawTexts(ctx);

    ctx.restore();
    void rect;
  }

  private drawField(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(CX, CY);
    ctx.scale(1, 0.85);

    const g = ctx.createRadialGradient(0, -40, 40, 0, 0, R + 30);
    g.addColorStop(0, "#c4a878");
    g.addColorStop(0.75, "#a8895c");
    g.addColorStop(1, "#8a6f49");
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();

    // speckled ground
    ctx.save();
    ctx.clip();
    for (let i = 0; i < 160; i++) {
      const a = Math.random() * Math.PI * 2;
      const d = Math.sqrt(Math.random()) * R;
      ctx.fillStyle = Math.random() > 0.5 ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)";
      ctx.beginPath();
      ctx.arc(Math.cos(a) * d, Math.sin(a) * d, rnd(1, 3.4), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // golden ornamented rim
    ctx.lineWidth = 7;
    ctx.strokeStyle = "#e2b75a";
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255, 233, 168, 0.75)";
    ctx.beginPath();
    ctx.arc(0, 0, R + 12, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "rgba(255, 233, 168, 0.55)";
    ctx.lineWidth = 2.5;
    const n = 28;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      ctx.save();
      ctx.rotate(a);
      ctx.beginPath();
      ctx.arc(0, -(R + 24), 9, Math.PI * 0.15, Math.PI * 1.1);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  private drawShadow(ctx: CanvasRenderingContext2D, x: number, y: number, z: number, r: number) {
    const k = Math.max(0.35, 1 - z / 320);
    ctx.save();
    ctx.globalAlpha = 0.34 * k;
    ctx.fillStyle = "#1c1208";
    ctx.beginPath();
    ctx.ellipse(x, y + 4, r * 0.95 * k, r * 0.5 * k, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private boneShape(ctx: CanvasRenderingContext2D, r: number, fill: string, edge: string, top: string) {
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.74, 0, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = edge;
    ctx.stroke();
    // knuckle lobes
    ctx.beginPath();
    ctx.ellipse(-r * 0.42, -r * 0.16, r * 0.42, r * 0.44, -0.3, 0, Math.PI * 2);
    ctx.ellipse(r * 0.42, -r * 0.16, r * 0.42, r * 0.44, 0.3, 0, Math.PI * 2);
    ctx.fillStyle = top;
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, r * 0.26, r * 0.5, r * 0.28, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    ctx.fill();
  }

  private drawAsyk(ctx: CanvasRenderingContext2D, a: Asyk) {
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(a.angle);
    if (a.kind === "gold") {
      this.boneShape(ctx, a.r, "#e8b73f", "#8a6410", "#ffd978");
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.ellipse(-a.r * 0.3, -a.r * 0.3, a.r * 0.24, a.r * 0.16, -0.5, 0, Math.PI * 2);
      ctx.fillStyle = "#fff6d2";
      ctx.fill();
    } else {
      this.boneShape(ctx, a.r, "#e3d3ae", "#9a8560", "#f3e8cc");
    }
    ctx.restore();
  }

  private drawSaka(ctx: CanvasRenderingContext2D) {
    const s = this.saka;
    const lift = s.z * 0.55;
    const sc = 1 + s.z / 620;
    ctx.save();
    ctx.translate(s.x, s.y - lift);
    ctx.scale(sc, sc);
    ctx.rotate(s.angle);
    if (this.kind === "lead") {
      this.boneShape(ctx, s.r, "#8f97a3", "#454b55", "#b9c1cb");
      ctx.beginPath();
      ctx.ellipse(0, 0, s.r * 0.34, s.r * 0.22, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#5a6personal";
      ctx.fillStyle = "#5a626d";
      ctx.fill();
    } else {
      this.boneShape(ctx, s.r, "#e8d5a8", "#8a7345", "#f8efd6");
    }
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#e2b75a";
    ctx.beginPath();
    ctx.ellipse(0, 0, s.r * 0.62, s.r * 0.45, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  private drawParticles(ctx: CanvasRenderingContext2D, above: boolean) {
    for (const p of this.particles) {
      const isGold = p.z > 6;
      if (isGold !== above) continue;
      const k = 1 - p.life / p.max;
      ctx.save();
      ctx.globalAlpha = Math.max(0, k);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y - p.z * 0.55, p.size * (0.4 + k), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private drawAim(ctx: CanvasRenderingContext2D) {
    if (this.finished) return;
    const s = this.saka;
    if (!s.active && !this.aiming) {
      // idle hint ring
      ctx.save();
      ctx.globalAlpha = 0.45 + 0.2 * Math.sin(performance.now() / 300);
      ctx.strokeStyle = "#7fe3d0";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 8]);
      ctx.beginPath();
      ctx.arc(s.x, s.y, 46, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      return;
    }
    if (!this.aiming) return;
    const aim = this.aimVector();
    if (!aim) return;
    const { pts, land } = this.predict(aim);

    ctx.save();
    // pull-back line
    ctx.strokeStyle = "rgba(255,233,168,0.5)";
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(this.aimPoint.x, this.aimPoint.y);
    ctx.stroke();

    // dotted parabola
    ctx.setLineDash([]);
    pts.forEach((p, i) => {
      if (i % 2) return;
      const k = i / pts.length;
      ctx.globalAlpha = 0.85 - k * 0.35;
      ctx.fillStyle = "#7fe3d0";
      ctx.beginPath();
      ctx.arc(p.x, p.y - p.z * 0.55, 4.5 - k * 1.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // landing marker
    ctx.globalAlpha = 0.95;
    ctx.strokeStyle = "#ffd766";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(land.x, land.y, 22, 12, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(land.x - 10, land.y);
    ctx.lineTo(land.x + 10, land.y);
    ctx.moveTo(land.x, land.y - 7);
    ctx.lineTo(land.x, land.y + 7);
    ctx.stroke();

    // power bar
    ctx.globalAlpha = 1;
    const bw = 180;
    const bx = s.x - bw / 2;
    const by = s.y + 66;
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(bx, by, bw, 12);
    const grd = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    grd.addColorStop(0, "#7fe3d0");
    grd.addColorStop(1, "#ffd766");
    ctx.fillStyle = grd;
    ctx.fillRect(bx, by, bw * aim.power, 12);
    ctx.strokeStyle = "#e2b75a";
    ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, bw, 12);
    ctx.restore();
  }

  private drawTexts(ctx: CanvasRenderingContext2D) {
    for (const t of this.texts) {
      const k = t.life / 1.4;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - k * k);
      ctx.translate(t.x, t.y - k * 70);
      ctx.scale(1 + 0.25 * Math.sin(Math.min(1, k * 4) * Math.PI * 0.5), 1 + 0.25 * Math.sin(Math.min(1, k * 4) * Math.PI * 0.5));
      ctx.font = "700 34px Georgia, serif";
      ctx.textAlign = "center";
      ctx.lineWidth = 6;
      ctx.strokeStyle = "rgba(10,40,42,0.85)";
      ctx.strokeText(t.text, 0, 0);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, 0, 0);
      ctx.restore();
    }
  }
}
