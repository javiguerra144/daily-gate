import { CARGO_POOL } from '../data/roles';
import type { Config } from '../types';
import { shuffle, type Rng } from './util';

/**
 * Sorteo del Consejo de Ministros: baraja el orden de intervención y reparte
 * los cargos (sin repetir mientras haya cargos suficientes).
 */
export function drawGovernment(config: Config, rng: Rng = Math.random): Config {
  const people = shuffle(rng, config.participants.filter((p) => p.name.trim() !== ''));
  const cargos = shuffle(rng, CARGO_POOL);
  return {
    ...config,
    participants: people.map((p, i) => {
      const { cargo, specialty } = cargos[i % cargos.length];
      return { ...p, name: p.name.trim(), cargo, specialty };
    }),
  };
}
