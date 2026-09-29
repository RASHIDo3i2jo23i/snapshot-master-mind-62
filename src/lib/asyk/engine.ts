import { Sfx } from "./audio";
import { FACE_MULT, FACE_NAME, rollFace, type Face } from "./faces";
import type { LevelDef, ModeId } from "./levels";
import { SKINS, type Skin, type SkinId } from "./skins";

export const W = 800;
export const H = 1000;
const CX = 400;
const CY = 360;
const R = 228;
const START_X = 400;
const START_Y = 880;

const G = 2000;
const SPEED_MAX = 1500;
const VZ_MAX = 640;
const DRAG_MAX = 230;

export type AsykKind = "plain" | "gold";

export const PRAISE = ["Жарайсың!", "Керемет!", "Шебер!", "Мерген!"];

interface Asyk {
  x: number;
  y: number;
  hx: number;
  hy: number;
  ph: number;
  vx: number;
  vy: number;
  r: number;
  kind: AsykKind;
  face: Face;
  angle: number;
  spin: number;
  out: boolean;
  gone: boolean;
  hit: boolean;
  cool: number;
}

interface Stone {
  x: number;
  y: number;
  r: number;
  seed: number;
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
  size: number;
}

export interface PvpState {
  turn: 0 | 1;
  knocked: [number, number];
  points: [number, number];
  left: [number, number];
}

export interface EndResult {
  win: boolean;
  score: number;
  coins: number;
  throwsLeft: number;
  pvp?: PvpState | undefined;
}

export interface EngineCallbacks {
  onScore: (score: number) => void;
  onThrows: (left: number) => void;
  onTime: (sec: number | null) => void;
  onPvp: (s: PvpState) => void;
  onEnd: (r: EndResult) => void;
}

export interface EngineOptions {
  mode: ModeId;
  level: LevelDef;
  skin: SkinId;
}

function rnd(a: number, b: number) {
  return a + Math.random() * (b - a);
}

function polar(a: number, d: number) {
  return { x: CX + Math.cos(a) * d, y: CY + Math.sin(a) * d * 0.85 };
}

export class AsykEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private raf = 0;
  private last = 0;
  private scale = 1;

  private sfx: Sfx;
  private cb: EngineCallbacks;
  private opts: EngineOptions;
  private skin: Skin;

  private asyks: Asyk[] = [];
  private stones: Stone[] = [];
  private particles: Particle[] = [];
  private texts: FloatText[] = [];
  private trail: { x: number; y: number }[] = [];

  private saka = { x: START_X, y: START_Y, z: 0, vx: 0, vy: 0, vz: 0, r: 26, active: false, grounded: false, angle: 0 };
  private aiming = false;
  private aimPoint = { x: START_X, y: START_Y };

  private score = 0;
  private coins = 0;
  private pending = 0;
  private throwsLeft = 5;
  private timeLeft: number | null = null;
  private lastSec = -1;
  private settleTimer = 0;
  private shake = 0;
  private slowmo = 0;
  private finished = false;
  private pattern: CanvasPattern | null = null;
  private groundDots: { x: number; y: number; r: number; l: boolean }[] = [];
  private pvp: PvpState = { turn: 0, knocked: [0, 0], points: [0, 0], left: [5, 5] };

  constructor(canvas: HTMLCanvasElement, opts: EngineOptions, sfx: Sfx, cb: EngineCallbacks) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas 2d context unavailable");
    this.ctx = ctx;
    this.opts = opts;
    this.skin = SKINS[opts.skin];
    this.sfx = sfx;
    this.cb = cb;
    for (let i = 0; i < 160; i++) {
      const a = Math.random() * Math.PI * 2;
      const d = Math.sqrt(Math.random()) * R;
      this.groundDots.push({ x: Math.cos(a) * d, y: Math.sin(a) * d, r: rnd(1, 3.4), l: Math.random() > 0.5 });
    }
    this.reset();
    this.pattern = this.buildPattern();
    this.bind();
    this.resize();
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.loop);
  }

  // ---------- setup ----------

  private spawnAsyks() {
    this.asyks = this.opts.level.asyks.map((l) => {
      const p = polar(l.a, l.d);
      const faces: Face[] = ["buk", "shik", "taike", "buk", "shik"];
      return {
        x: p.x,
        y: p.y,
        hx: p.x,
        hy: p.y,
        ph: rnd(0, Math.PI * 2),
        vx: 0,
        vy: 0,
        r: 20,
        kind: l.kind,
        face: faces[Math.floor(Math.random() * faces.length)] ?? "buk",
        angle: rnd(-0.6, 0.6),
        spin: 0,
        out: false,
        gone: false,
        hit: false,
        cool: 0,
      };
    });
  }

  private reset() {
    const lv = this.opts.level;
    this.spawnAsyks();
    this.stones = (lv.stones ?? []).map((s) => ({ ...polar(s.a, s.d), r: s.r, seed: Math.random() * 10 }));
    this.score = 0;
    this.coins = 0;
    this.throwsLeft = lv.throws;
    this.timeLeft = lv.time ?? null;
    this.finished = false;
    if (this.opts.mode === "pvp") {
      const half = Math.ceil(lv.throws / 2);
      this.pvp = { turn: 0, knocked: [0, 0], points: [0, 0], left: [half, half] };
      queueMicrotask(() => this.cb.onPvp({ ...this.pvp }));
    }
    queueMicrotask(() => this.cb.onTime(this.timeLeft === null ? null : Math.ceil(this.timeLeft)));
    this.resetSaka();
  }

  private resetSaka() {
    this.saka = { x: START_X, y: START_Y, z: 0, vx: 0, vy: 0, vz: 0, r: 26, active: false, grounded: false, angle: 0 };
    this.aiming = false;
    this.pending = 0;
    this.trail = [];
  }

  private buildPattern(): CanvasPattern | null {
    const c = document.createElement("canvas");
    c.width = 120;
    c.height = 120;
    const p = c.getContext("2d");
    if (!p) return null;
    p.fillStyle = "#0d4a4e";
    p.fillRect(0, 0, 120, 120);
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

  private aimVector() {
    const dx = this.saka.x - this.aimPoint.x;
    const dy = this.saka.y - this.aimPoint.y;
    const len = Math.hypot(dx, dy);
    if (len < 24) return null;
    const power = Math.min(len, DRAG_MAX) / DRAG_MAX;
    return { dx: dx / len, dy: dy / len, power };
  }

  private launchVel(aim: { dx: number; dy: number; power: number }) {
    const speed = aim.power * SPEED_MAX * this.skin.speed;
    const vz = aim.power * VZ_MAX * (this.skin.impulse > 1.3 ? 0.92 : 1);
    return { vx: aim.dx * speed, vy: aim.dy * speed, vz };
  }

  private launch(aim: { dx: number; dy: number; power: number }) {
    const v = this.launchVel(aim);
    // slight human wobble: a couple of degrees and a few % of power
    const j = rnd(-0.035, 0.035);
    const k = rnd(0.97, 1.03);
    const c = Math.cos(j);
    const s = Math.sin(j);
    this.saka.vx = (v.vx * c - v.vy * s) * k;
    this.saka.vy = (v.vx * s + v.vy * c) * k;
    this.saka.vz = v.vz;
    this.saka.z = 6;
    this.saka.active = true;
    this.saka.grounded = false;
    this.settleTimer = 0;
    this.pending = 0;
    this.throwsLeft -= 1;
    this.cb.onThrows(this.throwsLeft);
    if (this.opts.mode === "pvp") {
      this.pvp.left[this.pvp.turn] -= 1;
      this.cb.onPvp({ ...this.pvp, knocked: [...this.pvp.knocked], points: [...this.pvp.points], left: [...this.pvp.left] });
    }
    this.sfx.startWhistle();
  }

  // ---------- simulation ----------

  private wind() {
    return this.opts.level.wind ?? 0;
  }

  private predict(aim: { dx: number; dy: number; power: number }) {
    const v = this.launchVel(aim);
    const t = (2 * v.vz) / G;
    const w = this.wind();
    const pts: { x: number; y: number; z: number }[] = [];
    const steps = 26;
    for (let i = 0; i <= steps; i++) {
      const tt = (t * i) / steps;
      pts.push({
        x: this.saka.x + v.vx * tt + 0.5 * w * tt * tt,
        y: this.saka.y + v.vy * tt,
        z: Math.max(0, 6 + v.vz * tt - 0.5 * G * tt * tt),
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

  private addText(x: number, y: number, text: string, color = "#ffe9a8", size = 34) {
    this.texts.push({ x, y, text, life: 0, color, size });
  }

  private collideStone(o: { x: number; y: number; vx: number; vy: number }, r: number) {
    for (const st of this.stones) {
      const dx = o.x - st.x;
      const dy = o.y - st.y;
      const d = Math.hypot(dx, dy);
      if (d < r + st.r && d > 0.001) {
        const nx = dx / d;
        const ny = dy / d;
        o.x = st.x + nx * (r + st.r);
        o.y = st.y + ny * (r + st.r);
        const vn = o.vx * nx + o.vy * ny;
        if (vn < 0) {
          o.vx -= 1.55 * vn * nx;
          o.vy -= 1.55 * vn * ny;
          if (-vn > 80) this.sfx.knock(Math.min(0.8, -vn / 900));
        }
      }
    }
  }

  private update(dt: number, rawDt: number) {
    const s = this.saka;

    if (this.timeLeft !== null) {
      this.timeLeft = Math.max(0, this.timeLeft - rawDt);
      const sec = Math.ceil(this.timeLeft);
      if (sec !== this.lastSec) {
        this.lastSec = sec;
        this.cb.onTime(sec);
      }
      if (this.timeLeft <= 0 && !s.active) {
        this.finish(this.asyks.every((a) => a.out));
        return;
      }
    }

    if (s.active && this.slowmo <= 0) {
      const sp = Math.hypot(s.vx, s.vy);
      if (sp > 650 && s.z < 60) {
        for (const a of this.asyks) {
          if (a.gone) continue;
          if (Math.hypot(s.x + s.vx * 0.15 - a.x, s.y + s.vy * 0.15 - a.y) < a.r + s.r + 10) {
            this.slowmo = 0.35;
            break;
          }
        }
      }
    }
    if (this.slowmo > 0) this.slowmo = Math.max(0, this.slowmo - rawDt);

    if (s.active) {
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.z += s.vz * dt;
      s.vz -= G * dt;
      if (s.z > 4) s.vx += this.wind() * dt;
      s.angle += (Math.hypot(s.vx, s.vy) / 160) * dt * 6;

      if (this.skin.trail && s.z > 2) {
        this.trail.push({ x: s.x, y: s.y - s.z * 0.55 });
        if (this.trail.length > 22) this.trail.shift();
      } else if (this.trail.length) this.trail.shift();

      if (s.z <= 0) {
        s.z = 0;
        if (s.vz < -150) {
          s.vz = -s.vz * 0.34;
          // bounce with a tiny random kick
          const j = rnd(-0.07, 0.07);
          const c = Math.cos(j) * 0.66;
          const sn = Math.sin(j) * 0.66;
          const vx = s.vx;
          s.vx = vx * c - s.vy * sn;
          s.vy = vx * sn + s.vy * c;
          const p = Math.min(1, Math.abs(s.vz) / 400);
          this.sfx.thud(p);
          this.burst(s.x, s.y, 10, "#c9b189", 0.7 + p);
          if (p > 0.5) this.shake = Math.max(this.shake, 2 * p);
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
        const damp = Math.exp(-3.2 * dt);
        s.vx *= damp;
        s.vy *= damp;
      }

      this.sfx.updateWhistle(s.z > 4 ? Math.min(1, Math.hypot(s.vx, s.vy) / 900) : 0);

      if (s.z < 30) this.collideStone(s, s.r);

      // collisions only near the ground — in the air the saka flies OVER the asyks
      if (s.z < 20) {
        for (const a of this.asyks) {
          if (a.gone || a.cool > 0) continue;
          const dx = a.x - s.x;
          const dy = a.y - s.y;
          const d = Math.hypot(dx, dy);
          if (d >= a.r + s.r || d < 0.001) continue;
          const nx = dx / d;
          const ny = dy / d;
          // separate without pulling (no magnet effect)
          const overlap = a.r + s.r - d;
          s.x -= nx * overlap * 0.5;
          s.y -= ny * overlap * 0.5;
          a.x += nx * overlap * 0.5;
          a.y += ny * overlap * 0.5;
          const closing = (s.vx - a.vx) * nx + (s.vy - a.vy) * ny;
          if (closing <= 25) continue;
          // impulse proportional to the real closing speed, with a light random deflection
          const j = rnd(-0.09, 0.09);
          const mx = nx * Math.cos(j) - ny * Math.sin(j);
          const my = nx * Math.sin(j) + ny * Math.cos(j);
          const imp = closing * 0.95 * this.skin.impulse * rnd(0.92, 1.05);
          a.vx += mx * imp;
          a.vy += my * imp;
          a.spin = rnd(-10, 10) * Math.min(1, closing / 600);
          a.hit = true;
          a.cool = 0.15;
          // saka hands over most of its normal speed and keeps some tangential motion
          s.vx -= nx * closing * 0.8;
          s.vy -= ny * closing * 0.8;
          s.vx *= 0.8;
          s.vy *= 0.8;
          const power = Math.min(1, closing / 1000);
          if (power > 0.55) this.shake = Math.max(this.shake, 2 + 4 * power);
          this.sfx.knock(0.25 + power);
          this.burst(a.x, a.y, Math.round(4 + 10 * power), "#d8c49a", 0.5 + power);
        }
      }

      const allSlow =
        s.grounded && Math.hypot(s.vx, s.vy) < 18 && this.asyks.every((a) => a.gone || Math.hypot(a.vx, a.vy) < 18);
      if (allSlow) {
        this.settleTimer += dt;
        if (this.settleTimer > 0.45) this.endThrow();
      } else this.settleTimer = 0;
      if ((s.x < -120 || s.x > W + 120 || s.y < -160 || s.y > H + 160) && s.grounded) this.endThrow();
    }

    for (const a of this.asyks) {
      if (a.gone) continue;
      if (a.cool > 0) a.cool -= dt;
      if (this.opts.level.moving && !a.hit) {
        a.ph += dt * 0.9;
        a.x = a.hx + Math.cos(a.ph) * 28;
        a.y = a.hy + Math.sin(a.ph * 1.3) * 12;
        continue;
      }
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      const damp = Math.exp(-2.7 * dt);
      a.vx *= damp;
      a.vy *= damp;
      a.angle += a.spin * dt;
      a.spin *= Math.exp(-2.6 * dt);
      if (Math.hypot(a.vx, a.vy) < 6) {
        a.vx = 0;
        a.vy = 0;
      }
      if (!a.out) this.collideStone(a, a.r);

      if (!a.out) {
        const d = Math.hypot(a.x - CX, (a.y - CY) / 0.85);
        if (d > R + a.r) this.knockOut(a);
      } else if (Math.hypot(a.vx, a.vy) < 10) a.gone = true;
    }

    for (let i = 0; i < this.asyks.length; i++) {
      for (let j = i + 1; j < this.asyks.length; j++) {
        const a = this.asyks[i];
        const b = this.asyks[j];
        if (!a || !b || a.gone || b.gone) continue;
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
            const imp = -rel * 0.8;
            a.vx -= nx * imp;
            a.vy -= ny * imp;
            b.vx += nx * imp;
            b.vy += ny * imp;
            a.hit = true;
            b.hit = true;
            if (-rel > 60) this.sfx.knock(0.3);
          }
        }
      }
    }

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
    this.texts = this.texts.filter((t) => t.life < 1.5);

    this.shake = Math.max(0, this.shake - rawDt * 28);
  }

  private knockOut(a: Asyk) {
    a.out = true;
    const gold = a.kind === "gold";
    a.face = rollFace(0.08);
    const mult = FACE_MULT[a.face];
    const base = gold ? 300 : 100;
    const pts = base * mult;
    this.coins += (gold ? 30 : 10) * mult;
    if (this.opts.mode === "alshy") {
      this.pending += base;
    } else if (this.opts.mode === "pvp") {
      const t = this.pvp.turn;
      this.pvp.knocked[t] += 1;
      this.pvp.points[t] += pts;
      this.cb.onPvp({ ...this.pvp, knocked: [...this.pvp.knocked], points: [...this.pvp.points], left: [...this.pvp.left] });
    } else {
      this.score += pts;
      this.cb.onScore(this.score);
    }
    if (gold && this.opts.mode !== "pvp") {
      this.throwsLeft += 1;
      this.cb.onThrows(this.throwsLeft);
    }
    this.sfx.chime(gold || mult > 1);
    this.burst(a.x, a.y, gold ? 34 : 20, gold ? "#ffd766" : "#f0dca8", 1.2, true);
    this.addText(a.x, a.y - 30, PRAISE[Math.floor(Math.random() * PRAISE.length)] ?? "Керемет!", gold ? "#ffd766" : "#ffe9a8");
    const faceLabel = mult > 1 ? `${FACE_NAME[a.face]} ×${mult}` : FACE_NAME[a.face];
    this.addText(a.x, a.y - 72, this.opts.mode === "alshy" ? faceLabel : `${faceLabel}  +${pts}`, mult > 1 ? "#ffd766" : "#bff0e4", 24);
  }

  private endThrow() {
    this.sfx.stopWhistle();
    const s = this.saka;
    const mode = this.opts.mode;

    if (mode === "alshy") {
      const face = rollFace(0.3);
      const inField = Math.hypot(s.x - CX, (s.y - CY) / 0.85) < R + 120;
      const ok = face === "alshy" && inField;
      if (this.pending > 0 || ok) {
        const gain = ok ? this.pending * 2 + 50 : 0;
        this.score += gain;
        this.cb.onScore(this.score);
        this.addText(s.x, s.y - 50, ok ? `Алшы! +${gain}` : `${FACE_NAME[face]} — 0`, ok ? "#ffd766" : "#f4a3a3", 30);
        if (ok) this.sfx.chime(true);
      } else {
        this.addText(s.x, s.y - 50, FACE_NAME[face], "#bff0e4", 26);
      }
    }

    if (mode === "pvp") {
      if (this.asyks.every((a) => a.out)) this.spawnAsyks();
      const done = this.pvp.left[0] <= 0 && this.pvp.left[1] <= 0;
      if (done) {
        const [k0, k1] = this.pvp.knocked;
        const [p0, p1] = this.pvp.points;
        this.finish(k0 !== k1 ? k0 > k1 : p0 >= p1);
        return;
      }
      const next: 0 | 1 = this.pvp.turn === 0 ? 1 : 0;
      this.pvp.turn = this.pvp.left[next] > 0 ? next : this.pvp.turn;
      this.cb.onPvp({ ...this.pvp, knocked: [...this.pvp.knocked], points: [...this.pvp.points], left: [...this.pvp.left] });
      this.resetSaka();
      return;
    }

    const win = this.asyks.every((a) => a.out);
    const timeUp = this.timeLeft !== null && this.timeLeft <= 0;
    if (win || this.throwsLeft <= 0 || timeUp) {
      this.finish(win);
      return;
    }
    this.resetSaka();
  }

  private finish(win: boolean) {
    this.finished = true;
    this.saka.active = false;
    this.sfx.stopWhistle();
    const pvp = this.opts.mode === "pvp" ? { ...this.pvp } : undefined;
    const res: EndResult = { win, score: this.score, coins: this.coins, throwsLeft: this.throwsLeft, pvp };
    setTimeout(() => this.cb.onEnd(res), 500);
  }

  // ---------- rendering ----------

  private loop = (now: number) => {
    const raw = Math.min((now - this.last) / 1000, 0.05);
    this.last = now;
    const dt = raw * (this.slowmo > 0 ? 0.4 : 1);
    if (!this.finished) this.update(dt, raw);
    this.draw();
    this.raf = requestAnimationFrame(this.loop);
  };

  private draw() {
    const ctx = this.ctx;
    ctx.save();
    ctx.scale(this.scale, this.scale);
    ctx.clearRect(0, 0, W, H);
    if (this.shake > 0.2) ctx.translate(rnd(-this.shake, this.shake), rnd(-this.shake, this.shake));

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
    for (const st of this.stones) this.drawStone(ctx, st);

    for (const a of this.asyks) if (!a.gone) this.drawShadow(ctx, a.x, a.y, 0, a.r);
    if (!this.finished) this.drawShadow(ctx, this.saka.x, this.saka.y, this.saka.z, this.saka.r);

    this.drawParticles(ctx, false);
    const sorted = this.asyks.filter((a) => !a.gone).sort((a, b) => a.y - b.y);
    for (const a of sorted) this.drawAsyk(ctx, a);

    this.drawTrail(ctx);
    if (!this.finished) this.drawSaka(ctx);
    this.drawParticles(ctx, true);
    this.drawAim(ctx);
    this.drawWind(ctx);
    this.drawTexts(ctx);
    ctx.restore();
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
    for (const d of this.groundDots) {
      ctx.fillStyle = d.l ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)";
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }
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
    for (let i = 0; i < 28; i++) {
      ctx.save();
      ctx.rotate((i / 28) * Math.PI * 2);
      ctx.beginPath();
      ctx.arc(0, -(R + 24), 9, Math.PI * 0.15, Math.PI * 1.1);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  private drawStone(ctx: CanvasRenderingContext2D, st: Stone) {
    this.drawShadow(ctx, st.x, st.y, 0, st.r * 1.05);
    ctx.save();
    ctx.translate(st.x, st.y - 4);
    ctx.beginPath();
    const n = 9;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      const rr = st.r * (0.85 + 0.15 * Math.sin(a * 3 + st.seed));
      const x = Math.cos(a) * rr;
      const y = Math.sin(a) * rr * 0.8;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    const g = ctx.createLinearGradient(0, -st.r, 0, st.r);
    g.addColorStop(0, "#9aa0a4");
    g.addColorStop(1, "#4f5559");
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = "#2f3336";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  private drawShadow(ctx: CanvasRenderingContext2D, x: number, y: number, z: number, r: number) {
    const k = Math.max(0.35, 1 - z / 320);
    ctx.save();
    ctx.globalAlpha = 0.34 * k;
    ctx.fillStyle = "#1c1208";
    ctx.beginPath();
    ctx.ellipse(x, y + 4, r * 1.1 * k, r * 0.5 * k, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /** Top view of an ankle bone: two lobes with a waist, detail depends on the face. */
  private drawBone(ctx: CanvasRenderingContext2D, r: number, face: Face, fill: string, light: string, edge: string) {
    const w = r * 1.12;
    const h = r * 0.74;
    ctx.beginPath();
    ctx.moveTo(-w, -h * 0.55);
    ctx.bezierCurveTo(-w, -h * 1.12, -w * 0.3, -h * 1.1, 0, -h * 0.6);
    ctx.bezierCurveTo(w * 0.3, -h * 1.1, w, -h * 1.12, w, -h * 0.55);
    ctx.bezierCurveTo(w * 1.12, -h * 0.1, w * 1.12, h * 0.1, w, h * 0.55);
    ctx.bezierCurveTo(w, h * 1.12, w * 0.3, h * 1.05, 0, h * 0.72);
    ctx.bezierCurveTo(-w * 0.3, h * 1.05, -w, h * 1.12, -w, h * 0.55);
    ctx.bezierCurveTo(-w * 1.12, h * 0.1, -w * 1.12, -h * 0.1, -w, -h * 0.55);
    ctx.closePath();
    const g = ctx.createLinearGradient(-w * 0.4, -h, w * 0.4, h);
    g.addColorStop(0, light);
    g.addColorStop(0.55, fill);
    g.addColorStop(1, edge);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = edge;
    ctx.stroke();

    ctx.save();
    ctx.lineCap = "round";
    if (face === "alshy") {
      // S-shaped ridge across the bone
      ctx.strokeStyle = "rgba(60,40,20,0.55)";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-w * 0.7, h * 0.1);
      ctx.bezierCurveTo(-w * 0.3, -h * 0.6, w * 0.3, h * 0.6, w * 0.7, -h * 0.1);
      ctx.stroke();
      ctx.fillStyle = "rgba(60,40,20,0.35)";
      ctx.beginPath();
      ctx.arc(-w * 0.5, -h * 0.35, r * 0.1, 0, Math.PI * 2);
      ctx.arc(w * 0.5, h * 0.35, r * 0.1, 0, Math.PI * 2);
      ctx.fill();
    } else if (face === "taike") {
      // deep central hollow
      ctx.fillStyle = "rgba(50,32,14,0.45)";
      ctx.beginPath();
      ctx.ellipse(0, h * 0.05, w * 0.36, h * 0.36, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(0, h * 0.05, w * 0.4, h * 0.42, 0, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
    } else if (face === "buk") {
      // rounded hump with a highlight
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.beginPath();
      ctx.ellipse(-w * 0.2, -h * 0.25, w * 0.35, h * 0.2, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(60,40,20,0.3)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-w * 0.55, h * 0.35);
      ctx.quadraticCurveTo(0, h * 0.55, w * 0.55, h * 0.35);
      ctx.stroke();
    } else {
      // shik: flat side with a notch
      ctx.strokeStyle = "rgba(60,40,20,0.45)";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-w * 0.15, -h * 0.55);
      ctx.lineTo(0, -h * 0.15);
      ctx.lineTo(w * 0.15, -h * 0.55);
      ctx.moveTo(-w * 0.6, h * 0.2);
      ctx.lineTo(w * 0.6, h * 0.2);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawAsyk(ctx: CanvasRenderingContext2D, a: Asyk) {
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(a.angle);
    if (a.kind === "gold") {
      ctx.shadowColor = "rgba(255,215,102,0.7)";
      ctx.shadowBlur = 12;
      this.drawBone(ctx, a.r, a.face, "#e8b73f", "#fff0b0", "#8a6410");
    } else {
      this.drawBone(ctx, a.r, a.face, "#e3d3ae", "#fbf3dc", "#9a8560");
    }
    ctx.restore();
  }

  private drawTrail(ctx: CanvasRenderingContext2D) {
    if (!this.skin.trail || this.trail.length < 2) return;
    ctx.save();
    ctx.lineCap = "round";
    for (let i = 1; i < this.trail.length; i++) {
      const p0 = this.trail[i - 1]!;
      const p1 = this.trail[i]!;
      const k = i / this.trail.length;
      ctx.globalAlpha = k * 0.7;
      ctx.strokeStyle = this.skin.trail;
      ctx.shadowColor = this.skin.glow ?? this.skin.trail;
      ctx.shadowBlur = 16;
      ctx.lineWidth = 4 + k * 14;
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawSaka(ctx: CanvasRenderingContext2D) {
    const s = this.saka;
    const sk = this.skin;
    ctx.save();
    ctx.translate(s.x, s.y - s.z * 0.55);
    const sc = 1 + s.z / 620;
    ctx.scale(sc, sc);
    ctx.rotate(s.angle);
    if (sk.glow) {
      ctx.shadowColor = sk.glow;
      ctx.shadowBlur = 22;
    }
    this.drawBone(ctx, s.r, "alshy", sk.fill, sk.light, sk.edge);
    ctx.shadowBlur = 0;
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = sk.glow ?? "#e2b75a";
    ctx.beginPath();
    ctx.ellipse(0, 0, s.r * 0.5, s.r * 0.32, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  private drawParticles(ctx: CanvasRenderingContext2D, above: boolean) {
    for (const p of this.particles) {
      if (p.z > 6 !== above) continue;
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

  private drawWind(ctx: CanvasRenderingContext2D) {
    const w = this.wind();
    if (!w) return;
    ctx.save();
    ctx.translate(CX, 118);
    const len = 30 + Math.min(90, Math.abs(w) / 2.6);
    const dir = Math.sign(w);
    const off = ((performance.now() / 12) % 20) * dir;
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = "#bff0e4";
    ctx.fillStyle = "#bff0e4";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo((-len / 2) * dir + off * 0.3, 0);
    ctx.lineTo((len / 2) * dir + off * 0.3, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo((len / 2 + 14) * dir + off * 0.3, 0);
    ctx.lineTo((len / 2) * dir + off * 0.3, -10);
    ctx.lineTo((len / 2) * dir + off * 0.3, 10);
    ctx.closePath();
    ctx.fill();
    ctx.font = "600 18px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText(`Жел ${Math.round(Math.abs(w) / 20)}`, 0, 30);
    ctx.restore();
  }

  private drawAim(ctx: CanvasRenderingContext2D) {
    if (this.finished) return;
    const s = this.saka;
    if (!s.active && !this.aiming) {
      ctx.save();
      ctx.globalAlpha = 0.45 + 0.2 * Math.sin(performance.now() / 300);
      ctx.strokeStyle = this.opts.mode === "pvp" && this.pvp.turn === 1 ? "#ff9f7a" : "#7fe3d0";
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
    if (!land) return;
    ctx.save();
    ctx.strokeStyle = "rgba(255,233,168,0.5)";
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(this.aimPoint.x, this.aimPoint.y);
    ctx.stroke();
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
      const k = t.life / 1.5;
      const pop = 1 + 0.25 * Math.sin(Math.min(1, k * 4) * Math.PI * 0.5);
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - k * k);
      ctx.translate(t.x, t.y - k * 70);
      ctx.scale(pop, pop);
      ctx.font = `700 ${t.size}px Georgia, serif`;
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
