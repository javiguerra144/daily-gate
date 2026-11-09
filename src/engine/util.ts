export type Rng = () => number;

export function pick<T>(rng: Rng, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)];
}

export function randInt(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

export function weighted<T>(rng: Rng, options: [T, number][]): T {
  const valid = options.filter(([, w]) => w > 0);
  const total = valid.reduce((acc, [, w]) => acc + w, 0);
  let r = rng() * total;
  for (const [value, w] of valid) {
    r -= w;
    if (r < 0) return value;
  }
  return valid[valid.length - 1][0];
}

export function shuffle<T>(rng: Rng, items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Valor alrededor de `base` (±30 %), mínimo 3. */
export function jitter(rng: Rng, base: number): number {
  return Math.max(3, Math.round(base * (0.7 + rng() * 0.6)));
}

export type TextContext = Record<string, string | number | undefined>;

/** Sustituye placeholders del tipo {clave}. Los desconocidos se dejan intactos. */
export function fill(template: string, ctx: TextContext): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = ctx[key];
    return value === undefined ? match : String(value);
  });
}

/** Limpia artefactos de la composición de plantillas (p. ej. «S.L..»). */
export function tidy(text: string): string {
  return text.replace(/(?<!\.)\.\.(?!\.)/g, '.');
}

export function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

const moneyFormatter = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

export function formatMoney(amount: number): string {
  return moneyFormatter.format(amount);
}

export function formatAmountWords(amount: number): string {
  if (amount >= 1_000_000) {
    const m = amount / 1_000_000;
    const txt = Number.isInteger(m) ? String(m) : m.toFixed(1).replace('.', ',');
    return m === 1 ? '1 millón de euros' : `${txt} millones de euros`;
  }
  return formatMoney(amount);
}

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export function formatDuration(totalSeconds: number): string {
  const s = Math.round(totalSeconds);
  const m = Math.floor(s / 60);
  const rest = s % 60;
  if (m === 0) return `${rest} segundos`;
  return `${m} ${m === 1 ? 'minuto' : 'minutos'} y ${rest} segundos`;
}

export function hashString(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** RNG determinista (mulberry32). */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}
