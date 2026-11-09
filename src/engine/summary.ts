import { caseById, type CaseDef } from '../data/cases';
import type { LegislatureRecord, NewsItem } from '../types';
import type { DailyEngine, TurnRecord } from './engine';
import { govStateFor, type GovState } from './phases';
import { formatMoney, tidy, uid } from './util';

export interface Award {
  icon: string;
  title: string;
  winner: string;
  detail: string;
}

export interface SessionSummary {
  party: string;
  sprint: string;
  totalSeconds: number;
  corruption: number;
  fallen: boolean;
  gov: GovState;
  scandals: number;
  investigated: number;
  arrests: number;
  disks: number;
  money: number;
  mainCulprit: TurnRecord | null;
  worstCase: CaseDef | null;
  headline: string;
  stable: boolean;
  awards: Award[];
  turns: TurnRecord[];
  companies: string[];
}

function mostFrequent(items: string[]): string | null {
  const counts = new Map<string, number>();
  for (const i of items) counts.set(i, (counts.get(i) ?? 0) + 1);
  let best: string | null = null;
  let bestCount = 0;
  for (const [item, count] of counts) {
    if (count > bestCount) {
      best = item;
      bestCount = count;
    }
  }
  return best;
}

export function buildSummary(engine: DailyEngine): SessionSummary {
  const { state, config } = engine;
  const turns = state.turns;
  const spoke = turns.filter((t) => t.status === 'done');
  const totalSeconds = spoke.reduce((acc, t) => acc + t.used, 0);
  const investigated = spoke.filter((t) => t.investigated).length;
  const arrests = spoke.filter((t) => t.arrested).length;

  const byCorruption = [...spoke].sort((a, b) => b.corruption - a.corruption);
  const mainCulprit = byCorruption[0] && byCorruption[0].corruption > 0 ? byCorruption[0] : null;
  const worstCase =
    (mainCulprit?.caseId ? caseById(mainCulprit.caseId) : undefined) ??
    spoke.map((t) => (t.caseId ? caseById(t.caseId) : undefined)).find(Boolean) ??
    null;

  const stable = state.scandals === 0 && investigated === 0;
  const gov = govStateFor(state.corruption);
  const topCompany = mostFrequent(state.companies);

  let headline: string;
  if (stable) {
    headline = 'Por primera vez en la legislatura, no se ha descubierto ningún caso de corrupción.';
  } else if (state.fallen) {
    headline = `Cae el Gobierno de ${config.partyName}: ${mainCulprit ? `la intervención de ${mainCulprit.participant.name}` : 'una daily interminable'} desencadena elecciones anticipadas${worstCase ? `, con el ${worstCase.title} sobre la mesa` : ''}.`;
  } else if (state.corruption >= 40) {
    headline = `El Ejecutivo consigue cerrar el sprint, pero pierde la mayoría parlamentaria tras descubrirse una red de adjudicaciones vinculada a ${topCompany ?? 'los microservicios'}.`;
  } else {
    headline = `El Gobierno supera la sesión con algunos rasguños: ${investigated} ${investigated === 1 ? 'ministro investigado' : 'ministros investigados'} y un portavoz que culpa a CORS.`;
  }

  const awards = buildAwards(spoke, state.news);

  return {
    party: config.partyName,
    sprint: config.sprintName,
    totalSeconds,
    corruption: state.corruption,
    fallen: state.fallen,
    gov,
    scandals: state.scandals,
    investigated,
    arrests,
    disks: state.disks,
    money: state.money,
    mainCulprit,
    worstCase,
    headline: tidy(headline),
    stable,
    awards,
    turns,
    companies: state.companies,
  };
}

interface AwardDef {
  icon: string;
  title: string;
  /** Candidatos ordenados de mejor a peor (solo quienes cumplen el criterio). */
  ranking: TurnRecord[];
  detail: (t: TurnRecord) => string;
}

/**
 * Condecoraciones: cada una mide algo distinto y, para que no se repitan,
 * cada premio va al mejor candidato que todavía no tenga ninguno.
 * Si no queda nadie que cumpla el criterio, ese premio no se entrega.
 */
export function buildAwards(spoke: TurnRecord[], news: NewsItem[]): Award[] {
  const newsCount = (t: TurnRecord) => news.filter((n) => n.participantId === t.participant.id).length;
  const by = (score: (t: TurnRecord) => number) => (a: TurnRecord, b: TurnRecord) => score(b) - score(a);

  // Orden de asignación: primero los premios más significativos.
  const defs: (AwardDef & { order: number })[] = [
    {
      order: 3,
      icon: '🔥',
      title: 'Premio al daño institucional',
      ranking: spoke.filter((t) => t.corruption > 0).sort(by((t) => t.corruption)),
      detail: (t) => `Aportó un ${Math.round(t.corruption)} % al índice de corrupción.`,
    },
    {
      order: 0,
      icon: '🏆',
      title: 'Premio al ministro ejemplar',
      ranking: [...spoke].sort(by((t) => -t.used)),
      detail: (t) => `Solo ${Math.round(t.used)} s de intervención.`,
    },
    {
      order: 1,
      icon: '💰',
      title: 'Premio al mayor escándalo',
      ranking: spoke.filter((t) => t.money > 0).sort(by((t) => t.money)),
      detail: (t) => `Durante su intervención desaparecieron ${formatMoney(t.money)}.`,
    },
    {
      order: 2,
      icon: '🕵️',
      title: 'Premio al mejor encubrimiento',
      ranking: spoke.filter((t) => t.used > 0 && t.used <= t.max).sort(by((t) => t.used / t.max)),
      detail: (t) => `Se quedó a ${Math.max(0, Math.round(t.max - t.used))} s de su tiempo máximo sin que la UCO pudiera detenerle.`,
    },
    {
      order: 4,
      icon: '📰',
      title: 'Premio a la portada del día',
      ranking: spoke.filter((t) => newsCount(t) > 0).sort(by(newsCount)),
      detail: (t) => `Protagonizó ${newsCount(t)} ${newsCount(t) === 1 ? 'noticia' : 'noticias'}.`,
    },
  ];

  const awarded = new Set<string>();
  const result: (Award & { order: number })[] = [];
  for (const def of defs) {
    const winner = def.ranking.find((t) => !awarded.has(t.participant.id));
    if (!winner) continue;
    awarded.add(winner.participant.id);
    result.push({ order: def.order, icon: def.icon, title: def.title, winner: winner.participant.name, detail: def.detail(winner) });
  }
  return result.sort((a, b) => a.order - b.order).map(({ order: _order, ...award }) => award);
}

export function toRecord(summary: SessionSummary): LegislatureRecord {
  return {
    id: uid(),
    date: new Date().toISOString(),
    sprint: summary.sprint,
    party: summary.party,
    durationSeconds: Math.round(summary.totalSeconds),
    corruption: Math.round(summary.corruption),
    fallen: summary.fallen,
    scandals: summary.scandals,
    investigated: summary.investigated,
    arrests: summary.arrests,
    money: summary.money,
    mainCulprit: summary.mainCulprit?.participant.name ?? null,
    companies: summary.companies,
    caseIds: summary.turns.map((t) => t.caseId).filter((id): id is string => !!id),
  };
}

export interface LegislatureStats {
  sprint: string;
  sessions: number;
  avgCorruption: number;
  mostInvestigated: string | null;
  topCompany: string | null;
  cases: number;
  fallen: number;
  money: number;
  lastDate: string;
}

export function aggregateHistory(records: LegislatureRecord[]): LegislatureStats[] {
  const bySprint = new Map<string, LegislatureRecord[]>();
  for (const r of records) {
    const list = bySprint.get(r.sprint) ?? [];
    list.push(r);
    bySprint.set(r.sprint, list);
  }
  return [...bySprint.entries()]
    .map(([sprint, list]) => ({
      sprint,
      sessions: list.length,
      avgCorruption: Math.round(list.reduce((a, r) => a + r.corruption, 0) / list.length),
      mostInvestigated: mostFrequent(list.map((r) => r.mainCulprit).filter((n): n is string => !!n)),
      topCompany: mostFrequent(list.flatMap((r) => r.companies)),
      cases: list.reduce((a, r) => a + r.scandals, 0),
      fallen: list.filter((r) => r.fallen).length,
      money: list.reduce((a, r) => a + r.money, 0),
      lastDate: list.map((r) => r.date).sort().at(-1) ?? '',
    }))
    .sort((a, b) => b.lastDate.localeCompare(a.lastDate));
}
