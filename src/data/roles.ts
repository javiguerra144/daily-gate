import type { Specialty } from '../types';

export const SPECIALTIES: { id: Specialty; label: string; cargo: string }[] = [
  { id: 'backend', label: 'Backend Developer', cargo: 'Ministro de Interior y APIs' },
  { id: 'frontend', label: 'Frontend Developer', cargo: 'Ministro de Imagen Pública y CSS' },
  { id: 'fullstack', label: 'Full Stack Developer', cargo: 'Vicepresidente de Asuntos Transversales' },
  { id: 'devops', label: 'DevOps', cargo: 'Ministro de Infraestructuras y Emergencias' },
  { id: 'qa', label: 'QA', cargo: 'Fiscal General de Calidad' },
  { id: 'techlead', label: 'Tech Lead', cargo: 'Presidente del Gobierno' },
  { id: 'po', label: 'Product Owner', cargo: 'Ministro de Promesas Electorales' },
  { id: 'scrum', label: 'Scrum Master', cargo: 'Portavoz del Gobierno' },
  { id: 'architect', label: 'Arquitecto de Software', cargo: 'Ministro de Urbanismo Digital' },
  { id: 'data', label: 'Data Engineer', cargo: 'Director del Centro Nacional de Inteligencia de Datos' },
];

export const EXTRA_CARGOS = [
  'Ministro de Deuda Técnica',
  'Secretario de Estado de Merge Conflicts',
  'Ministro de Hacienda y Story Points',
  'Delegado del Gobierno en Producción',
  'Ministro sin Cartera ni Tickets',
  'Secretario de Estado de Reuniones que Podrían Ser un Email',
];

export const ALL_CARGOS = [...SPECIALTIES.map((s) => s.cargo), ...EXTRA_CARGOS];

/** Cargos que se sortean al iniciar, con la especialidad que usan para elegir los escándalos. */
export const CARGO_POOL: { cargo: string; specialty: Specialty }[] = [
  ...SPECIALTIES.map((s) => ({ cargo: s.cargo, specialty: s.id })),
  { cargo: 'Ministro de Deuda Técnica', specialty: 'architect' },
  { cargo: 'Secretario de Estado de Merge Conflicts', specialty: 'fullstack' },
  { cargo: 'Ministro de Hacienda y Story Points', specialty: 'scrum' },
  { cargo: 'Delegado del Gobierno en Producción', specialty: 'devops' },
  { cargo: 'Ministro sin Cartera ni Tickets', specialty: 'po' },
  { cargo: 'Secretario de Estado de Reuniones que Podrían Ser un Email', specialty: 'scrum' },
];

export function defaultCargo(specialty: Specialty): string {
  return SPECIALTIES.find((s) => s.id === specialty)?.cargo ?? 'Ministro sin Cartera ni Tickets';
}

export function specialtyLabel(specialty: Specialty): string {
  return SPECIALTIES.find((s) => s.id === specialty)?.label ?? specialty;
}
