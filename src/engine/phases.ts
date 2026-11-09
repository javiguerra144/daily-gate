export type PhaseIndex = 0 | 1 | 2 | 3 | 4 | 5;

export interface PhaseInfo {
  index: PhaseIndex;
  icon: string;
  label: string;
  description: string;
  color: string;
}

export const PHASES: PhaseInfo[] = [
  { index: 0, icon: '🟢', label: 'Normalidad institucional', description: 'El ministro informa sobre sus tareas.', color: 'var(--phase-0)' },
  { index: 1, icon: '🟡', label: 'Rumores en los pasillos', description: 'Aparecen pequeñas filtraciones.', color: 'var(--phase-1)' },
  { index: 2, icon: '🟠', label: 'Investigación judicial', description: 'La UCO entra en la sede.', color: 'var(--phase-2)' },
  { index: 3, icon: '🔴', label: 'Crisis de Gobierno', description: 'Aparecen pruebas comprometedoras.', color: 'var(--phase-3)' },
  { index: 4, icon: '🚨', label: 'Escándalo nacional', description: 'Detenciones, dimisiones y registros.', color: 'var(--phase-4)' },
  { index: 5, icon: '🚔', label: 'Detención', description: 'Tiempo agotado: la UCO se lleva al ministro esposado.', color: 'var(--phase-5)' },
];

/** Umbrales de cada fase (en segundos) para un threshold y un máximo dados. */
export function phaseBoundaries(threshold: number, max: number): number[] {
  const span = max - threshold;
  return [0, threshold * 0.6, threshold, threshold + span / 3, threshold + (span * 7) / 9, max];
}

/**
 * Fase de una intervención en el segundo `t`.
 * Con threshold 75 y máximo 120: 0-45 🟢, 45-75 🟡, 75-90 🟠, 90-110 🔴, 110-120 🚨, +120 💀.
 */
export function phaseAt(t: number, threshold: number, max: number): PhaseIndex {
  const b = phaseBoundaries(threshold, max);
  for (let i = 5; i > 0; i--) {
    if (t >= b[i]) return i as PhaseIndex;
  }
  return 0;
}

export interface GovState {
  icon: string;
  label: string;
  color: string;
}

/**
 * Estado del Gobierno según el índice de corrupción.
 * `final` indica que la sesión ha terminado: el Gobierno solo cae cuando han hablado todos.
 */
export function govStateFor(corruption: number, final = true): GovState {
  if (corruption >= 100) {
    return final
      ? { icon: '💀', label: 'CAÍDA DEL GOBIERNO', color: 'var(--phase-5)' }
      : { icon: '⚠️', label: 'Colapso inminente', color: 'var(--phase-5)' };
  }
  if (corruption >= 80) return { icon: '🚨', label: 'Detenciones en cadena', color: 'var(--phase-4)' };
  if (corruption >= 60) return { icon: '🔴', label: 'Crisis institucional', color: 'var(--phase-3)' };
  if (corruption >= 40) return { icon: '🟠', label: 'Comisión de investigación', color: 'var(--phase-2)' };
  if (corruption >= 20) return { icon: '🟡', label: 'Primeras sospechas', color: 'var(--phase-1)' };
  return { icon: '🟢', label: 'Estabilidad parlamentaria', color: 'var(--phase-0)' };
}
