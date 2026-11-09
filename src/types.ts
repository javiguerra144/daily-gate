export type Specialty =
  | 'backend'
  | 'frontend'
  | 'fullstack'
  | 'devops'
  | 'qa'
  | 'techlead'
  | 'po'
  | 'scrum'
  | 'architect'
  | 'data';

export type Tag = Specialty | 'general';

export type Intensity = 'baja' | 'media' | 'extrema';

export interface Participant {
  id: string;
  name: string;
  specialty: Specialty;
  cargo: string;
  /** Tiempo máximo individual en segundos (null = usar el global). */
  maxTime: number | null;
  /** Threshold individual en segundos (null = usar el global). */
  threshold: number | null;
}

export interface Config {
  partyName: string;
  sprintName: string;
  participants: Participant[];
  maxTime: number;
  threshold: number;
  intensity: Intensity;
  /** Música de fondo generada en tiempo real. */
  music: boolean;
  /** Volumen de la música (0-1). */
  musicVolume: number;
  /** Cada cuántos segundos aparecen noticias una vez superado el threshold. */
  eventFrequency: number;
  /** Historias compartidas entre participantes. */
  cumulative: boolean;
  sounds: boolean;
  fullscreen: boolean;
}

export type Severity = 1 | 2 | 3 | 4 | 5;

export type NewsKind =
  | 'rumor'
  | 'case'
  | 'event'
  | 'plot'
  | 'crisis'
  | 'generated'
  | 'persistent'
  | 'phase'
  | 'reopen';

export interface Evidence {
  lang: string;
  code: string;
}

export type SceneKind = 'hq' | 'datacenter' | 'island' | 'office' | 'court';
export type SceneProp = 'briefcase' | 'envelopes' | 'servers' | 'money' | 'laptop' | 'boxes' | 'pods' | 'monitor' | 'police' | 'champagne';

/** Descripción de una imagen generada para un caso de corrupción. */
export interface SceneSpec {
  scene: SceneKind;
  props: SceneProp[];
  accent: string;
  /** Rótulo de la empresa investigada. */
  sign: string;
  /** Pie de foto (título del caso). */
  caption: string;
  /** Texto que aparece en pantallas y portátiles. */
  screen: string;
  seed: number;
}

export interface NewsItem {
  id: number;
  /** Segundo de la sesión completa en el que se publicó. */
  sessionSecond: number;
  /** Segundo del turno en el que se publicó. */
  turnSecond: number;
  participantId: string;
  kind: NewsKind;
  severity: Severity;
  icon: string;
  kicker?: string;
  headline: string;
  statement?: string;
  evidence?: Evidence;
  visual?: SceneSpec;
}

export type SoundName = 'teletype' | 'beep' | 'siren' | 'alarm' | 'doom' | 'fanfare' | 'jingle';

export type AlertTone = 'warning' | 'danger' | 'doom' | 'good';

export interface Alert {
  id: number;
  icon: string;
  kicker: string;
  title: string;
  subtitle?: string;
  tone: AlertTone;
  sound: SoundName;
  visual?: SceneSpec;
}

/** Registro de una daily guardada en el historial (una sesión parlamentaria). */
export interface LegislatureRecord {
  id: string;
  date: string;
  sprint: string;
  party: string;
  durationSeconds: number;
  corruption: number;
  fallen: boolean;
  scandals: number;
  investigated: number;
  arrests: number;
  money: number;
  mainCulprit: string | null;
  companies: string[];
  caseIds: string[];
}
