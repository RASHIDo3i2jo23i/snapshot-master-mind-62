// Synthetic sound effects via the Web Audio API. No external assets.
export class Sfx {
  private ctx: AudioContext | null = null;
  enabled = true;
  private whistle: { osc: OscillatorNode; gain: GainNode; filter: BiquadFilterNode } | null = null;

  private ac(): AudioContext | null {
    if (!this.enabled) return null;
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  resume() {
    this.ac();
  }

  private env(gain: GainNode, t: number, peak: number, attack: number, decay: number) {
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(peak, t + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  }

  private noiseBuffer(ctx: AudioContext, dur: number) {
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    return buf;
  }

  /** Dry knock of two bones colliding. */
  knock(strength = 1) {
    const ctx = this.ac();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(420 + 180 * strength, t);
    osc.frequency.exponentialRampToValueAtTime(90, t + 0.12);
    const g = ctx.createGain();
    this.env(g, t, Math.min(0.5, 0.18 + 0.3 * strength), 0.005, 0.13);
    osc.connect(g).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.2);

    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer(ctx, 0.08);
    const nf = ctx.createBiquadFilter();
    nf.type = "bandpass";
    nf.frequency.value = 1600;
    const ng = ctx.createGain();
    ng.gain.value = 0.12 * strength;
    noise.connect(nf).connect(ng).connect(ctx.destination);
    noise.start(t);
  }

  /** Soft thud of the saka hitting the ground. */
  thud(strength = 1) {
    const ctx = this.ac();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(55, t + 0.18);
    const g = ctx.createGain();
    this.env(g, t, Math.min(0.35, 0.1 + 0.25 * strength), 0.004, 0.18);
    osc.connect(g).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.3);
  }

  /** Bright chime when an asyk leaves the circle. */
  chime(golden = false) {
    const ctx = this.ac();
    if (!ctx) return;
    const t = ctx.currentTime;
    const notes = golden ? [660, 880, 1320] : [520, 780];
    notes.forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = f;
      const g = ctx.createGain();
      this.env(g, t + i * 0.07, 0.18, 0.01, 0.35);
      osc.connect(g).connect(ctx.destination);
      osc.start(t + i * 0.07);
      osc.stop(t + i * 0.07 + 0.5);
    });
  }

  /** Air whistle while the saka is airborne. */
  startWhistle() {
    const ctx = this.ac();
    if (!ctx || this.whistle) return;
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = 520;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 900;
    filter.Q.value = 6;
    const gain = ctx.createGain();
    gain.gain.value = 0.0001;
    osc.connect(filter).connect(gain).connect(ctx.destination);
    osc.start();
    this.whistle = { osc, gain, filter };
  }

  updateWhistle(intensity: number) {
    if (!this.whistle || !this.ctx) return;
    const t = this.ctx.currentTime;
    this.whistle.gain.gain.setTargetAtTime(Math.max(0.0001, 0.05 * intensity), t, 0.05);
    this.whistle.filter.frequency.setTargetAtTime(700 + 900 * intensity, t, 0.05);
  }

  stopWhistle() {
    if (!this.whistle || !this.ctx) return;
    const { osc, gain } = this.whistle;
    const t = this.ctx.currentTime;
    gain.gain.setTargetAtTime(0.0001, t, 0.04);
    osc.stop(t + 0.3);
    this.whistle = null;
  }

  click() {
    const ctx = this.ac();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.value = 700;
    const g = ctx.createGain();
    this.env(g, t, 0.07, 0.004, 0.06);
    osc.connect(g).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.12);
  }

  dispose() {
    this.stopWhistle();
    if (this.ctx) void this.ctx.close();
    this.ctx = null;
  }
}
