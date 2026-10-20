export type SfxName =
  | "tick" | "whoosh" | "chime" | "keys" | "page" | "chalk"
  | "clink" | "ring" | "woof" | "board" | "lamp" | "gull" | "yawn" | "boof";

const BPM = 72;
const EIGHTH = 60 / BPM / 2;
const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

/* Dm9 | G7 | Cmaj7 | Am7 */
const CHORDS = [
  { root: 38, notes: [53, 57, 60, 64] },
  { root: 43, notes: [53, 55, 59, 62] },
  { root: 48, notes: [52, 55, 59, 62] },
  { root: 45, notes: [52, 55, 60, 64] },
];
const PENTA = [72, 74, 76, 79, 81];

class CafeAudio {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private musicBus!: GainNode;
  private musicLP!: BiquadFilterNode;
  private melBus!: GainNode;
  private sfxBus!: GainNode;
  private noise!: AudioBuffer;
  private on = false;
  private present = false;
  private timer: number | null = null;
  private stopT = 0;
  private nextTime = 0;
  private step = 0;

  get enabled() {
    return this.on;
  }

  private init(): AudioContext {
    if (this.ctx) return this.ctx;
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const c = new AC();
    this.ctx = c;

    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.ratio.value = 4;
    this.master = c.createGain();
    this.master.gain.value = 0.0001;
    this.master.connect(comp);
    comp.connect(c.destination);

    const rev = c.createConvolver();
    rev.buffer = this.impulse(c, 2.2, 2.6);
    const wet = c.createGain();
    wet.gain.value = 0.3;
    rev.connect(wet);
    wet.connect(this.master);

    this.musicBus = c.createGain();
    this.musicBus.gain.value = 0.55;
    this.musicLP = c.createBiquadFilter();
    this.musicLP.type = "lowpass";
    this.musicLP.frequency.value = 3800;
    this.musicBus.connect(this.musicLP);
    this.musicLP.connect(this.master);
    this.musicLP.connect(rev);

    /* echo on the bell melody */
    this.melBus = c.createGain();
    this.melBus.connect(this.musicBus);
    const echo = c.createDelay(1.5);
    echo.delayTime.value = EIGHTH * 3;
    const fb = c.createGain();
    fb.gain.value = 0.38;
    const ew = c.createGain();
    ew.gain.value = 0.5;
    this.melBus.connect(echo);
    echo.connect(fb);
    fb.connect(echo);
    echo.connect(ew);
    ew.connect(this.musicBus);

    this.sfxBus = c.createGain();
    this.sfxBus.gain.value = 0.9;
    this.sfxBus.connect(this.master);
    this.sfxBus.connect(rev);

    const nb = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
    const nd = nb.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    this.noise = nb;

    this.ambience(c);
    return c;
  }

  private impulse(c: AudioContext, secs: number, decay: number) {
    const len = Math.floor(c.sampleRate * secs);
    const buf = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }

  /* vinyl crackle and a murmur of café chatter */
  private ambience(c: AudioContext) {
    const crack = c.createBuffer(1, c.sampleRate * 3, c.sampleRate);
    const cd = crack.getChannelData(0);
    for (let i = 0; i < cd.length; i++) {
      cd[i] = Math.random() < 0.0006 ? (Math.random() * 2 - 1) * (0.4 + Math.random() * 0.6) : 0;
    }
    const cs = c.createBufferSource();
    cs.buffer = crack;
    cs.loop = true;
    const chp = c.createBiquadFilter();
    chp.type = "highpass";
    chp.frequency.value = 1500;
    const cg = c.createGain();
    cg.gain.value = 0.12;
    cs.connect(chp);
    chp.connect(cg);
    cg.connect(this.musicBus);
    cs.start();

    const ns = c.createBufferSource();
    ns.buffer = this.noise;
    ns.loop = true;
    const bp = c.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 650;
    bp.Q.value = 0.6;
    const mg = c.createGain();
    mg.gain.value = 0.03;
    const lfo = c.createOscillator();
    lfo.frequency.value = 0.13;
    const lg = c.createGain();
    lg.gain.value = 0.012;
    lfo.connect(lg);
    lg.connect(mg.gain);
    lfo.start();
    ns.connect(bp);
    bp.connect(mg);
    mg.connect(this.musicBus);
    ns.start();
  }

  private osc(
    type: OscillatorType,
    f: number,
    t: number,
    a: number,
    d: number,
    peak: number,
    dest: AudioNode,
    o?: { f2?: number; detune?: number }
  ) {
    const c = this.ctx!;
    const g = c.createGain();
    const os = c.createOscillator();
    os.type = type;
    os.frequency.setValueAtTime(f, t);
    if (o?.f2) os.frequency.exponentialRampToValueAtTime(o.f2, t + a + d);
    if (o?.detune) os.detune.value = o.detune;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
    os.connect(g);
    g.connect(dest);
    os.start(t);
    os.stop(t + a + d + 0.05);
  }

  private hit(
    t: number,
    a: number,
    d: number,
    peak: number,
    type: BiquadFilterType,
    f: number,
    q: number,
    dest: AudioNode,
    f2?: number
  ) {
    const c = this.ctx!;
    const src = c.createBufferSource();
    src.buffer = this.noise;
    const flt = c.createBiquadFilter();
    flt.type = type;
    flt.Q.value = q;
    flt.frequency.setValueAtTime(f, t);
    if (f2) flt.frequency.exponentialRampToValueAtTime(f2, t + a + d);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
    src.connect(flt);
    flt.connect(g);
    g.connect(dest);
    src.start(t, Math.random() * 1.5);
    src.stop(t + a + d + 0.05);
  }

  /* ---------- the band ---------- */
  private ep(m: number, t: number, vel: number, dur = 1.6) {
    const c = this.ctx!;
    const f = mtof(m);
    const lp = c.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(2600, t);
    lp.frequency.exponentialRampToValueAtTime(700, t + dur);
    lp.connect(this.musicBus);
    this.osc("triangle", f, t, 0.012, dur, vel, lp);
    this.osc("sine", f * 2, t, 0.005, dur * 0.4, vel * 0.35, lp);
    this.osc("sine", f, t, 0.012, dur, vel * 0.5, lp, { detune: 6 });
  }
  private bass(m: number, t: number, v: number) {
    const f = mtof(m);
    this.osc("sine", f, t, 0.012, 0.9, v, this.musicBus);
    this.osc("triangle", f * 2, t, 0.012, 0.5, v * 0.22, this.musicBus);
  }
  private kick(t: number, v: number) {
    this.osc("sine", 125, t, 0.002, 0.3, 0.9 * v, this.musicBus, { f2: 44 });
  }
  private snare(t: number) {
    this.hit(t, 0.002, 0.14, 0.28, "bandpass", 1900, 0.9, this.musicBus);
    this.osc("triangle", 190, t, 0.002, 0.09, 0.12, this.musicBus, { f2: 130 });
  }
  private hat(t: number, v: number) {
    this.hit(t, 0.001, 0.04, v, "highpass", 7500, 0.7, this.musicBus);
  }
  private bell(m: number, t: number) {
    this.osc("sine", mtof(m), t, 0.004, 1.3, 0.07, this.melBus);
    this.osc("sine", mtof(m) * 2.01, t, 0.002, 0.4, 0.02, this.melBus);
  }
  private far(t: number) {
    this.osc("sine", 2500 + Math.random() * 900, t, 0.001, 0.3, 0.018, this.musicBus);
  }

  private schedule(step: number, t0: number) {
    const t = t0 + (step % 2 === 1 ? EIGHTH * 0.16 : 0);
    const bar = Math.floor(step / 8) % 4;
    const pos = step % 8;
    const ch = CHORDS[bar];

    if (pos === 0) {
      ch.notes.forEach((n, i) => this.ep(n, t + i * 0.018, 0.16 - i * 0.012));
      this.bass(ch.root, t, 0.5);
      this.kick(t, 1);
    }
    if (pos === 3) ch.notes.slice(1).forEach((n, i) => this.ep(n, t + i * 0.012, 0.07, 0.9));
    if (pos === 4) this.bass(ch.root + 7, t, 0.32);
    if (pos === 5) this.kick(t, 0.6);
    if (pos === 2 || pos === 6) this.snare(t);
    this.hat(t, 0.03 + Math.random() * 0.03);
    if ([1, 2, 3, 5, 6, 7].includes(pos) && Math.random() < 0.22) {
      this.bell(PENTA[Math.floor(Math.random() * PENTA.length)], t);
    }
    if (Math.random() < 0.03) this.far(t);
  }

  private tick = () => {
    const c = this.ctx;
    if (!c) return;
    if (this.nextTime < c.currentTime - 0.5) this.nextTime = c.currentTime + 0.05;
    while (this.nextTime < c.currentTime + 0.35) {
      this.schedule(this.step, this.nextTime);
      this.nextTime += EIGHTH;
      this.step = (this.step + 1) % 32;
    }
  };

  /* ---------- controls ---------- */
  setPresent(v: boolean) {
    this.present = v;
    this.apply();
  }

  /* must be called from a click */
  toggle(): boolean {
    this.init();
    this.on = !this.on;
    this.apply();
    return this.on;
  }

  /* leaning in: the music muffles while a panel is open */
  setFocus(on: boolean) {
    const c = this.ctx;
    if (!c) return;
    const t = c.currentTime;
    this.musicLP.frequency.setTargetAtTime(on ? 900 : 3800, t, 0.25);
    this.musicBus.gain.setTargetAtTime(on ? 0.34 : 0.55, t, 0.3);
  }

  private apply() {
    const c = this.ctx;
    if (!c) return;
    const want = this.on && this.present;
    const t = c.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(want ? 0.9 : 0.0001, t, want ? 0.6 : 0.35);
    if (want) {
      void c.resume();
      if (this.timer == null) {
        this.nextTime = c.currentTime + 0.1;
        this.timer = window.setInterval(this.tick, 100);
      }
    } else if (this.timer != null) {
      window.clearTimeout(this.stopT);
      this.stopT = window.setTimeout(() => {
        if (!(this.on && this.present) && this.timer != null) {
          window.clearInterval(this.timer);
          this.timer = null;
          void c.suspend();
        }
      }, 1500);
    }
  }

  /* ---------- sound effects ---------- */
  play(name: SfxName) {
    const c = this.ctx;
    if (!c || !this.on || !this.present) return;
    const t = c.currentTime + 0.01;
    const d = this.sfxBus;
    switch (name) {
      case "tick":
        this.hit(t, 0.002, 0.03, 0.22, "bandpass", 2000, 2, d);
        this.osc("sine", 880, t, 0.002, 0.05, 0.05, d);
        break;
      case "whoosh":
        this.hit(t, 0.14, 0.4, 0.16, "bandpass", 500, 0.9, d, 2600);
        break;
      case "chime":
        [988, 1319, 1568].forEach((f, i) => this.osc("sine", f, t + i * 0.09, 0.005, 1.3, 0.09, d));
        break;
      case "keys":
        for (let i = 0; i < 9; i++) {
          const tt = t + i * 0.07 + Math.random() * 0.03;
          this.hit(tt, 0.001, 0.025, 0.2, "bandpass", 2400 + Math.random() * 900, 3, d);
          this.osc("sine", 150, tt, 0.001, 0.04, 0.08, d);
        }
        break;
      case "page":
        this.hit(t, 0.03, 0.18, 0.14, "bandpass", 3200, 0.7, d, 900);
        break;
      case "chalk":
        this.hit(t, 0.02, 0.22, 0.1, "highpass", 3000, 0.6, d, 7000);
        this.hit(t + 0.12, 0.02, 0.18, 0.08, "highpass", 3500, 0.6, d, 6500);
        break;
      case "clink":
        [[2349, 0.12], [3136, 0.08], [1568, 0.07]].forEach(([f, p]) =>
          this.osc("sine", f, t, 0.001, 0.55, p, d)
        );
        break;
      case "ring":
        for (let r = 0; r < 2; r++) {
          for (let k = 0; k < 10; k++) {
            const tt = t + r * 0.95 + k * 0.04;
            this.osc("sine", 440, tt, 0.004, 0.03, 0.07, d);
            this.osc("sine", 480, tt, 0.004, 0.03, 0.07, d);
          }
        }
        break;
      case "woof":
        this.bark(t, 1);
        this.bark(t + 0.26, 0.85);
        break;
      case "board":
        this.hit(t, 0.001, 0.02, 0.3, "bandpass", 1300, 3, d);
        this.hit(t + 0.05, 0.12, 0.8, 0.1, "lowpass", 520, 0.7, d, 260);
        this.hit(t + 0.05, 0.12, 0.8, 0.05, "bandpass", 1700, 2, d, 900);
        this.hit(t + 0.95, 0.001, 0.03, 0.3, "bandpass", 1100, 3, d);
        break;
      case "lamp":
        this.hit(t, 0.001, 0.02, 0.25, "bandpass", 1800, 3, d);
        this.osc("sine", 90, t, 0.002, 0.1, 0.25, d, { f2: 55 });
        this.hit(t + 0.09, 0.001, 0.02, 0.18, "bandpass", 1400, 3, d);
        break;
      case "boof":
        this.bark(t, 0.55);
        break;
      case "yawn":
        this.osc("sine", 300, t, 0.25, 0.7, 0.07, d, { f2: 210 });
        this.osc("triangle", 150, t, 0.25, 0.7, 0.05, d, { f2: 105 });
        this.hit(t, 0.3, 0.8, 0.05, "lowpass", 700, 0.6, d, 300);
        break;
      case "gull":
        this.osc("sine", 1750, t, 0.02, 0.32, 0.08, d, { f2: 1150 });
        this.osc("sine", 1550, t + 0.42, 0.02, 0.4, 0.07, d, { f2: 950 });
        this.hit(t, 0.3, 0.9, 0.05, "lowpass", 600, 0.5, d);
        break;
    }
  }

  private bark(t: number, v: number) {
    const c = this.ctx!;
    const lp = c.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 1100;
    lp.connect(this.sfxBus);
    this.osc("sawtooth", 260, t, 0.01, 0.15, 0.22 * v, lp, { f2: 130 });
    this.hit(t, 0.005, 0.1, 0.12 * v, "bandpass", 700, 1.2, this.sfxBus);
  }
}

export const cafe = new CafeAudio();
