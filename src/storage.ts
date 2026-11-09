import { defaultCargo } from './data/roles';
import { uid } from './engine/util';
import type { Config, LegislatureRecord, Participant, Specialty } from './types';

const CONFIG_KEY = 'dailygate.config.v1';
const HISTORY_KEY = 'dailygate.history.v1';

export function newParticipant(name = '', specialty: Specialty = 'backend'): Participant {
  return { id: uid(), name, specialty, cargo: defaultCargo(specialty), maxTime: null, threshold: null };
}

export function defaultConfig(): Config {
  return {
    partyName: 'Partido de la Integración Continua',
    sprintName: 'Sprint 1',
    participants: [
      newParticipant('Carlos', 'backend'),
      newParticipant('Laura', 'frontend'),
      newParticipant('Miguel', 'devops'),
    ],
    maxTime: 120,
    threshold: 75,
    intensity: 'media',
    eventFrequency: 12,
    cumulative: true,
    sounds: true,
    music: true,
    musicVolume: 0.5,
    fullscreen: false,
  };
}

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* almacenamiento no disponible: la app sigue funcionando sin persistencia */
  }
}

export function loadConfig(): Config {
  const stored = read<Partial<Config>>(CONFIG_KEY);
  return stored ? { ...defaultConfig(), ...stored } : defaultConfig();
}

export function saveConfig(config: Config): void {
  write(CONFIG_KEY, config);
}

export function loadHistory(): LegislatureRecord[] {
  return read<LegislatureRecord[]>(HISTORY_KEY) ?? [];
}

export function saveHistory(records: LegislatureRecord[]): void {
  write(HISTORY_KEY, records);
}
