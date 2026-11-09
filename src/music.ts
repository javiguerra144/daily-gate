import { audio } from './audio';

/**
 * Música de fondo generativa al estilo «especial informativo».
 * Un secuenciador de semicorcheas con lookahead programa notas en Web Audio;
 * cada nivel (la fase de la intervención) añade capas y sube el tempo.
 *
 *  0 🟢 colchón armónico + pulso suave
 *  1 🟡 + tic-tac de reloj
 *  2 🟠 + bajo en ostinato y bombo
 *  3 🔴 + caja y arpegio
 *  4 🚨 + charles y golpes de metal
 *  5 🚔 + sirena disonante y tempo máximo
 */

// Progresión en La menor: Am – F – G – Em (MIDI)
const PROGRESSION = [
  [57, 60, 64],
  [53, 57, 60],
  [55, 59, 62],
  [52, 55, 59],
];
const TEMPO = [78, 90, 104, 118, 132, 146];
const LOOKAHEAD = 0.15;

const freq = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

export class BackgroundMusic {
  private ac: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private timer: number | null = null;
  private nextTime = 0;
  private step = 0;
  private level = 0;
  private volume = 0.5;

  get playing(): boolean {
    return this.timer !== null;
  }

  start(volume: number): void {
    this.volume = volume;
    const ac = audio();
    if (!ac) return;
    this.ensureGraph(ac);
    this.master!.gain.cancelScheduledValues(ac.currentTime);
    this.master!.gain.setTargetAtTime(this.volume * 0.6, ac.currentTime, 0.4);
    if (this.timer !== null) return;
    this.nextTime = ac.currentTime + 0.05;
    this.timer = window.setInterval(() => this.schedule(), 25);
  }

  stop(): void {
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
    if (this.ac && this.master) {
      this.master.gain.cancelScheduledValues(this.ac.currentTime);
      this.master.gain.setTargetAtTime(0, this.ac.currentTime, 0.15);
    }
  }

  setLevel(level: number): void {
    this.level = Math.max(0, Math.min(5, Math.round(level)));
  }

  setVolume(volume: number): void {
    this.volume = volume;
    if (this.ac && this.master && this.playing) this.master.gain.setTargetAtTime(volume * 0.6, this.ac.currentTime, 0.1);
  }

  /** Baja la música un momento para que se oigan las alertas. */
  duck(seconds = 2.5): void {
    if (!this.ac || !this.master || !this.playing) return;
    const g = this.master.gain;
    const now = this.ac.currentTime;
    g.cancelScheduledValues(now);
    g.setTargetAtTime(this.volume * 0.15, now, 0.05);
    g.setTargetAtTime(this.volume * 0.6, now + seconds, 0.6);
  }

  private ensureGraph(ac: AudioContext): void {
    if (this.ac === ac && this.master) return;
    this.ac = ac;
    const compressor = ac.createDynamicsCompressor();
    compressor.threshold.value = -18;
    compressor.ratio.value = 4;
    this.master = ac.createGain();
    this.master.gain.value = 0;
    this.master.connect(compressor).connect(ac.destination);
    const length = ac.sampleRate;
    this.noise = ac.createBuffer(1, length, ac.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  }

  private schedule(): void {
    const ac = this.ac;
    if (!ac) return;
    while (this.nextTime < ac.currentTime + LOOKAHEAD) {
      this.playStep(this.step, this.nextTime);
      this.nextTime += 60 / TEMPO[this.level] / 4;
      this.step = (this.step + 1) % 64;
    }
  }

  private playStep(step: number, t: number): void {
    const L = this.level;
    const s = step % 16;
    const chord = PROGRESSION[Math.floor(step / 16) % 4];
    const sixteenth = 60 / TEMPO[L] / 4;

    if (s === 0) this.pad(chord, t, sixteenth * 16, L);
    if (s % 8 === 0) this.pluck(chord[0] + 12, t, 0.05);
    if (L >= 1 && s % 4 === 0) this.tick(t, s === 0);
    if (L >= 2) {
      if (L >= 4 || s % 2 === 0) this.bass(chord[0] - 24, t, sixteenth * 1.6);
      if (s % 4 === 0) this.kick(t);
    }
    if (L >= 3) {
      if (s === 4 || s === 12) this.snare(t);
      if (s % 2 === 0) this.pluck(chord[(s / 2) % 3] + 24, t, 0.035, 'square');
    }
    if (L >= 4) {
      this.hat(t, s % 4 === 2 ? 0.09 : 0.04);
      if (s === 0 || s === 10) this.stab(chord, t);
    }
    if (L >= 5 && s === 0) this.siren(chord[0] + 13, t, sixteenth * 16);
  }

  // ---------------------------------------------------------------------------
  // Instrumentos
  // ---------------------------------------------------------------------------

  private voice(type: OscillatorType, f: number, t: number, dur: number, gain: number, filter?: { type: BiquadFilterType; freq: number }): OscillatorNode {
    const ac = this.ac!;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + Math.min(0.02, dur / 4));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node: AudioNode = osc;
    if (filter) {
      const bq = ac.createBiquadFilter();
      bq.type = filter.type;
      bq.frequency.value = filter.freq;
      node = node.connect(bq);
    }
    node.connect(g).connect(this.master!);
    osc.start(t);
    osc.stop(t + dur + 0.05);
    return osc;
  }

  private pad(chord: number[], t: number, dur: number, level: number): void {
    const ac = this.ac!;
    const cutoff = 600 + level * 350;
    for (const note of chord) {
      for (const detune of [-7, 7]) {
        const osc = ac.createOscillator();
        const g = ac.createGain();
        const bq = ac.createBiquadFilter();
        osc.type = 'sawtooth';
        osc.frequency.value = freq(note);
        osc.detune.value = detune;
        bq.type = 'lowpass';
        bq.frequency.value = cutoff;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.018, t + dur * 0.25);
        g.gain.linearRampToValueAtTime(0.012, t + dur * 0.8);
        g.gain.linearRampToValueAtTime(0.0001, t + dur * 1.05);
        osc.connect(bq).connect(g).connect(this.master!);
        osc.start(t);
        osc.stop(t + dur * 1.1);
      }
    }
  }

  private pluck(note: number, t: number, gain: number, type: OscillatorType = 'triangle'): void {
    this.voice(type, freq(note), t, 0.22, gain, type === 'square' ? { type: 'lowpass', freq: 2200 } : undefined);
  }

  private tick(t: number, accent: boolean): void {
    this.voice('square', accent ? 2400 : 1800, t, 0.03, accent ? 0.05 : 0.03, { type: 'highpass', freq: 1200 });
  }

  private bass(note: number, t: number, dur: number): void {
    this.voice('sawtooth', freq(note), t, dur, 0.12, { type: 'lowpass', freq: 420 });
  }

  private kick(t: number): void {
    const ac = this.ac!;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(42, t + 0.12);
    g.gain.setValueAtTime(0.45, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    osc.connect(g).connect(this.master!);
    osc.start(t);
    osc.stop(t + 0.25);
  }

  private noiseHit(t: number, dur: number, gain: number, filterType: BiquadFilterType, filterFreq: number): void {
    const ac = this.ac!;
    const src = ac.createBufferSource();
    const bq = ac.createBiquadFilter();
    const g = ac.createGain();
    src.buffer = this.noise;
    bq.type = filterType;
    bq.frequency.value = filterFreq;
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bq).connect(g).connect(this.master!);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.02);
  }

  private snare(t: number): void {
    this.noiseHit(t, 0.16, 0.22, 'bandpass', 1800);
    this.voice('triangle', 190, t, 0.08, 0.08);
  }

  private hat(t: number, gain: number): void {
    this.noiseHit(t, 0.04, gain, 'highpass', 7500);
  }

  private stab(chord: number[], t: number): void {
    for (const note of chord) this.voice('sawtooth', freq(note + 12), t, 0.18, 0.035, { type: 'lowpass', freq: 3000 });
  }

  private siren(note: number, t: number, dur: number): void {
    const osc = this.voice('sawtooth', freq(note), t, dur, 0.025, { type: 'lowpass', freq: 1800 });
    const steps = 4;
    for (let i = 1; i <= steps; i++) {
      osc.frequency.linearRampToValueAtTime(freq(note + (i % 2 ? 5 : 0)), t + (dur * i) / steps);
    }
  }
}
