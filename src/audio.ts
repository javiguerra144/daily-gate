import type { SoundName } from './types';

/** Efectos de sonido sintetizados con Web Audio (sin ficheros externos). */
let ctx: AudioContext | null = null;

export function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** Llamar desde un gesto del usuario para desbloquear el audio del navegador. */
export function unlockAudio(): void {
  audio();
}

function tone(
  ac: AudioContext,
  { freq, start, duration, type = 'sine', gain = 0.15, endFreq }: { freq: number; start: number; duration: number; type?: OscillatorType; gain?: number; endFreq?: number },
): void {
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  const t0 = ac.currentTime + start;
  osc.frequency.setValueAtTime(freq, t0);
  if (endFreq) osc.frequency.linearRampToValueAtTime(endFreq, t0 + duration);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(g).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

function noiseClick(ac: AudioContext, start: number): void {
  const length = Math.floor(ac.sampleRate * 0.015);
  const buffer = ac.createBuffer(1, length, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  const src = ac.createBufferSource();
  const g = ac.createGain();
  g.gain.value = 0.25;
  src.buffer = buffer;
  src.connect(g).connect(ac.destination);
  src.start(ac.currentTime + start);
}

export function playSound(name: SoundName): void {
  const ac = audio();
  if (!ac) return;
  switch (name) {
    case 'teletype':
      for (let i = 0; i < 9; i++) noiseClick(ac, i * 0.055 + Math.random() * 0.02);
      tone(ac, { freq: 1800, start: 0.55, duration: 0.06, type: 'square', gain: 0.04 });
      break;
    case 'beep':
      tone(ac, { freq: 880, start: 0, duration: 0.12, type: 'square', gain: 0.06 });
      tone(ac, { freq: 660, start: 0.15, duration: 0.18, type: 'square', gain: 0.06 });
      break;
    case 'siren':
      for (let i = 0; i < 3; i++) {
        tone(ac, { freq: 650, endFreq: 1100, start: i * 0.7, duration: 0.35, type: 'sawtooth', gain: 0.07 });
        tone(ac, { freq: 1100, endFreq: 650, start: i * 0.7 + 0.35, duration: 0.35, type: 'sawtooth', gain: 0.07 });
      }
      break;
    case 'alarm':
      for (let i = 0; i < 6; i++) tone(ac, { freq: i % 2 ? 740 : 988, start: i * 0.18, duration: 0.16, type: 'square', gain: 0.07 });
      break;
    case 'doom':
      tone(ac, { freq: 196, endFreq: 98, start: 0, duration: 1.6, type: 'sawtooth', gain: 0.12 });
      tone(ac, { freq: 233, endFreq: 116, start: 0.05, duration: 1.6, type: 'triangle', gain: 0.1 });
      tone(ac, { freq: 65, start: 0, duration: 2.2, type: 'sine', gain: 0.2 });
      break;
    case 'fanfare':
      [523, 659, 784, 1047].forEach((f, i) => tone(ac, { freq: f, start: i * 0.14, duration: i === 3 ? 0.6 : 0.16, type: 'triangle', gain: 0.12 }));
      break;
    case 'jingle':
      [392, 523, 659, 523, 784].forEach((f, i) => tone(ac, { freq: f, start: i * 0.12, duration: 0.2, type: 'triangle', gain: 0.1 }));
      break;
  }
}
