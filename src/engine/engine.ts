import { CASES, caseById, type CaseDef } from '../data/cases';
import { EVENTS } from '../data/events';
import {
  CRISIS_CARDS,
  GEN_COMPANIES,
  GEN_DELIVERABLES,
  GEN_EXCUSES,
  GEN_TECH,
  GEN_TEMPLATES,
  NATIONAL_SCANDAL_LINES,
  PERSISTENT_DENIALS,
  PERSISTENT_IMPLICATIONS,
  REOPEN_TEMPLATES,
  RUMORS,
  type CrisisCard,
} from '../data/misc';
import { PLOTS } from '../data/plots';
import type {
  Alert,
  AlertTone,
  Config,
  Intensity,
  LegislatureRecord,
  NewsItem,
  NewsKind,
  Participant,
  SceneSpec,
  Severity,
  SoundName,
  Tag,
} from '../types';
import { phaseAt, type PhaseIndex } from './phases';
import {
  fill,
  formatAmountWords,
  hashString,
  jitter,
  lowerFirst,
  pick,
  randInt,
  tidy,
  weighted,
  type Rng,
  type TextContext,
} from './util';

/**
 * Índice de corrupción: el 100 % se reparte entre los participantes.
 * Cada uno tiene una cuota de (100 / N) * EXTRA_MULTIPLY (p. ej. 5 personas → 20 % × 2 = 40 %),
 * que se va consumiendo desde que supera su tiempo máximo hasta el doble de ese tiempo.
 * Con el doble de tiempo agota su cuota. Así, para tumbar al Gobierno tiene que pasarse
 * al menos la mitad de los participantes.
 *
 * El consumo no es lineal: los primeros segundos de exceso salen muy caros y cada segundo
 * adicional vale menos (curva 1 - (1 - x)^3). En el primer cuarto del exceso se gasta ~58 %
 * de la cuota; en el último cuarto, menos del 2 %.
 */
export const EXTRA_MULTIPLY = 2;
export const OVERRUN_EXPONENT = 3;

/** Fracción de la cuota consumida tras exceder el máximo en una fracción `x` (0 = en el máximo, 1 = el doble). */
export function overrunCurve(x: number): number {
  const c = Math.min(1, Math.max(0, x));
  return 1 - (1 - c) ** OVERRUN_EXPONENT;
}

export function corruptionShare(participants: number): number {
  return (100 / Math.max(1, participants)) * EXTRA_MULTIPLY;
}

const FREQ_FACTOR: Record<Intensity, number> = { baja: 1.4, media: 1, extrema: 0.7 };
const CRISIS_PROB: Record<Intensity, number> = { baja: 0.1, media: 0.25, extrema: 0.45 };

/** Segundos que una alerta ocupa la pantalla antes de emitir lo siguiente. */
const ALERT_SECONDS = { normal: 5, doom: 7 };
/** Máximo de emisiones en espera: si se acumulan más, se descartan las menos importantes. */
const MAX_QUEUE = 4;

/** Segundos necesarios para leer una noticia con calma. */
export function readingSeconds(item: Pick<NewsItem, 'headline' | 'statement' | 'evidence'>): number {
  const words = `${item.headline} ${item.statement ?? ''}`.trim().split(/\s+/).length;
  const secs = 3 + words / 3.2 + (item.evidence ? 3 : 0);
  return Math.round(Math.min(16, Math.max(6, secs)));
}

type PendingNews = Omit<NewsItem, 'id' | 'sessionSecond' | 'turnSecond'>;

interface Broadcast {
  priority: number;
  news?: PendingNews;
  alert?: Alert;
}
const SEVERITY_SHIFT: Record<Intensity, number> = { baja: -1, media: 0, extrema: 1 };

export type TurnStatus = 'pending' | 'active' | 'done' | 'absent';

export interface TurnRecord {
  participant: Participant;
  max: number;
  threshold: number;
  status: TurnStatus;
  /** Segundos utilizados (con decimales). */
  used: number;
  /** Puntos de corrupción aportados al índice global. */
  corruption: number;
  /** Fondos públicos desaparecidos durante su intervención. */
  money: number;
  investigated: boolean;
  arrested: boolean;
  caseId: string | null;
  peakPhase: PhaseIndex;
}

export interface ActivePlot {
  id: string;
  step: number;
}

export interface SessionState {
  status: 'idle' | 'running' | 'paused' | 'finished';
  turnIndex: number;
  turnElapsedMs: number;
  phase: PhaseIndex;
  corruption: number;
  /** Solo se decide al terminar la sesión, cuando han hablado todos. */
  fallen: boolean;
  /** Se ha avisado ya de que el índice ha llegado al 100 %. */
  collapseWarned: boolean;
  news: NewsItem[];
  turns: TurnRecord[];
  money: number;
  disks: number;
  scandals: number;
  companies: string[];
  plot: ActivePlot | null;
  startedAt: number;
  finishedAt: number | null;
}

export type EngineEvent =
  | { type: 'news'; item: NewsItem }
  | { type: 'alert'; alert: Alert }
  | { type: 'finish' };

export interface EngineOptions {
  history?: LegislatureRecord[];
  rng?: Rng;
  listener?: (event: EngineEvent) => void;
}

interface TurnPlan {
  nextRumorAt: number;
  nextNewsAt: number;
  persistentAt: number | null;
  crisisAt: number | null;
  crisis: CrisisCard | null;
  caseDef: CaseDef | null;
  followupIdx: number;
}

export function effectiveTimes(p: Participant, config: Config): { max: number; threshold: number } {
  const max = Math.max(5, p.maxTime ?? config.maxTime);
  let threshold = p.threshold ?? config.threshold;
  if (threshold >= max || threshold <= 0) threshold = Math.round(max * 0.625);
  return { max, threshold };
}

export class DailyEngine {
  readonly config: Config;
  state: SessionState;

  private rng: Rng;
  private history: LegislatureRecord[];
  private listener: ((event: EngineEvent) => void) | undefined;

  private turnStart = 0;
  private pausedAt: number | null = null;
  private pausedAccum = 0;
  private processed = 0;
  private plan: TurnPlan = emptyPlan();
  private seq = 0;
  /** Cola de emisión: noticias y alertas salen de una en una, con tiempo para leerlas. */
  private queue: Broadcast[] = [];
  private nextSlotAt = 0;

  private usedCases = new Set<string>();
  private usedEvents = new Set<string>();
  private usedRumors = new Set<string>();
  private usedPlots = new Set<string>();
  private usedCrisis = new Set<string>();
  private usedReopen = new Set<string>();

  constructor(config: Config, options: EngineOptions = {}) {
    this.config = config;
    this.rng = options.rng ?? Math.random;
    this.history = options.history ?? [];
    this.listener = options.listener;
    const participants = config.participants.filter((p) => p.name.trim() !== '');
    this.state = {
      status: 'idle',
      turnIndex: 0,
      turnElapsedMs: 0,
      phase: 0,
      corruption: 0,
      fallen: false,
      collapseWarned: false,
      news: [],
      turns: participants.map((participant) => ({
        participant,
        ...effectiveTimes(participant, config),
        status: 'pending',
        used: 0,
        corruption: 0,
        money: 0,
        investigated: false,
        arrested: false,
        caseId: null,
        peakPhase: 0,
      })),
      money: 0,
      disks: 0,
      scandals: 0,
      companies: [],
      plot: null,
      startedAt: Date.now(),
      finishedAt: null,
    };
  }

  setListener(listener: ((event: EngineEvent) => void) | undefined): void {
    this.listener = listener;
  }

  /** Cuota del índice de corrupción de cada ministro (los ausentes no cuentan). */
  get share(): number {
    return corruptionShare(this.state.turns.filter((t) => t.status !== 'absent').length);
  }

  get currentTurn(): TurnRecord | undefined {
    return this.state.turns[this.state.turnIndex];
  }

  /** Segundos totales transcurridos en la sesión. */
  get sessionSeconds(): number {
    return this.state.turns.reduce(
      (acc, t, i) => acc + (i === this.state.turnIndex && t.status === 'active' ? this.state.turnElapsedMs / 1000 : t.used),
      0,
    );
  }

  start(now: number): void {
    if (this.state.status !== 'idle') return;
    if (this.state.turns.length === 0) {
      this.finish();
      return;
    }
    this.state.startedAt = Date.now();
    this.beginTurn(0, now);
  }

  update(now: number): void {
    if (this.state.status !== 'running') return;
    const elapsed = now - this.turnStart - this.pausedAccum;
    this.state.turnElapsedMs = elapsed;
    const second = Math.floor(elapsed / 1000);
    while (this.processed < second) {
      this.processed++;
      this.processSecond(this.processed);
    }
  }

  pause(now: number): void {
    if (this.state.status !== 'running') return;
    this.update(now);
    this.pausedAt = now;
    this.state.status = 'paused';
  }

  resume(now: number): void {
    if (this.state.status !== 'paused' || this.pausedAt === null) return;
    this.pausedAccum += now - this.pausedAt;
    this.pausedAt = null;
    this.state.status = 'running';
  }

  togglePause(now: number): void {
    if (this.state.status === 'running') this.pause(now);
    else if (this.state.status === 'paused') this.resume(now);
  }

  /** Cierra la intervención actual y da paso al siguiente ministro. */
  next(now: number, absent = false): void {
    if (this.state.status !== 'running' && this.state.status !== 'paused') return;
    if (this.state.status === 'running') this.update(now);
    const turn = this.currentTurn;
    if (turn) {
      turn.used = this.state.turnElapsedMs / 1000;
      turn.status = absent ? 'absent' : 'done';
      if (absent) turn.used = 0;
    }
    const nextIndex = this.state.turnIndex + 1;
    if (nextIndex >= this.state.turns.length) this.finish();
    else this.beginTurn(nextIndex, now);
  }

  finish(): void {
    if (this.state.status === 'finished') return;
    const turn = this.currentTurn;
    if (turn && turn.status === 'active') {
      turn.used = this.state.turnElapsedMs / 1000;
      turn.status = 'done';
    }
    for (const t of this.state.turns) if (t.status === 'pending') t.status = 'absent';
    // El Gobierno solo cae al final, cuando todos los ministros han intervenido.
    this.state.fallen = this.state.corruption >= 100;
    this.state.status = 'finished';
    this.state.finishedAt = Date.now();
    this.listener?.({ type: 'finish' });
  }

  // ---------------------------------------------------------------------------
  // Turnos
  // ---------------------------------------------------------------------------

  private beginTurn(index: number, now: number): void {
    this.state.turnIndex = index;
    const turn = this.state.turns[index];
    turn.status = 'active';
    this.turnStart = now;
    this.pausedAt = null;
    this.pausedAccum = 0;
    this.processed = 0;
    this.state.turnElapsedMs = 0;
    this.state.phase = 0;
    this.state.status = 'running';
    if (!this.config.cumulative) this.state.plot = null;
    this.queue = [];
    this.nextSlotAt = 0;
    this.plan = this.makePlan(turn);
  }

  private makePlan(turn: TurnRecord): TurnPlan {
    const plan = emptyPlan();
    const rumorStart = Math.floor(turn.threshold * 0.6);
    if (this.config.cumulative && this.implicated().length > 0 && rumorStart > 8) {
      plan.persistentAt = Math.min(rumorStart - 1, randInt(this.rng, 15, 35));
    }
    if (this.rng() < CRISIS_PROB[this.config.intensity]) {
      const from = turn.threshold + 3;
      const to = Math.max(from + 1, turn.max - 3);
      plan.crisisAt = randInt(this.rng, from, to);
      plan.crisis = this.takeUnused(CRISIS_CARDS, this.usedCrisis);
    }
    return plan;
  }

  private processSecond(t: number): void {
    const turn = this.currentTurn;
    if (!turn) return;
    const phase = phaseAt(t, turn.threshold, turn.max);
    while (this.state.phase < phase) {
      this.state.phase = (this.state.phase + 1) as PhaseIndex;
      this.onPhaseEnter(this.state.phase, t, turn);
    }
    turn.peakPhase = Math.max(turn.peakPhase, phase) as PhaseIndex;

    if (t > turn.max) {
      const step = overrunCurve((t - turn.max) / turn.max) - overrunCurve((t - 1 - turn.max) / turn.max);
      this.addCorruption(turn, this.share * step);
    }

    if (this.plan.persistentAt === t) this.emitPersistent(turn, t, false);
    if (this.plan.crisisAt === t) this.fireCrisis(turn, t);

    // Solo se genera contenido nuevo cuando no hay nada pendiente de emitir.
    const idle = this.queue.length === 0;
    if (idle && phase === 1 && t >= this.plan.nextRumorAt) {
      this.emitRumor(turn, t);
      this.plan.nextRumorAt = t + jitter(this.rng, this.frequency() * 1.5);
    }
    if (idle && phase >= 2 && t >= this.plan.nextNewsAt) {
      this.emitEscalation(turn, t, phase);
      this.plan.nextNewsAt = t + jitter(this.rng, this.frequency());
    }

    this.flushQueue(t);
  }

  private enqueue(b: Broadcast): void {
    // Orden estable por prioridad: alertas > casos/fases/crisis > resto.
    let i = this.queue.length;
    while (i > 0 && this.queue[i - 1].priority < b.priority) i--;
    this.queue.splice(i, 0, b);
    while (this.queue.length > MAX_QUEUE) {
      const minPriority = Math.min(...this.queue.map((q) => q.priority));
      const idx = this.queue.findIndex((q) => q.priority === minPriority);
      this.queue.splice(idx, 1);
    }
  }

  private flushQueue(t: number): void {
    while (this.queue.length > 0 && t >= this.nextSlotAt) {
      const b = this.queue.shift()!;
      if (b.alert) {
        this.listener?.({ type: 'alert', alert: b.alert });
        this.nextSlotAt = t + (b.alert.tone === 'doom' ? ALERT_SECONDS.doom : ALERT_SECONDS.normal);
      } else if (b.news) {
        const news: NewsItem = { ...b.news, id: ++this.seq, sessionSecond: Math.floor(this.sessionSeconds), turnSecond: t };
        this.state.news.push(news);
        this.listener?.({ type: 'news', item: news });
        this.nextSlotAt = t + readingSeconds(news);
      }
    }
  }

  private onPhaseEnter(phase: PhaseIndex, t: number, turn: TurnRecord): void {
    const ctx = this.ctx(turn);
    switch (phase) {
      case 1:
        this.plan.nextRumorAt = t;
        break;
      case 2: {
        turn.investigated = true;
        this.openCase(turn, t);
        this.alert('🚨', 'ÚLTIMA HORA', 'LA UCO ENTRA EN LA SEDE DEL PARTIDO', fill(
          'Los agentes registran los servidores mientras {name} continúa explicando por qué su ticket lleva {days} días en progreso.',
          { ...ctx, days: randInt(this.rng, 3, 21) },
        ), 'warning', 'siren', this.plan.caseDef ? this.caseScene(this.plan.caseDef, ctx) : undefined);
        this.plan.nextNewsAt = t + jitter(this.rng, this.frequency());
        break;
      }
      case 3: {
        const c = this.plan.caseDef;
        if (c) {
          this.emitNews(turn, t, {
            kind: 'case',
            severity: 4,
            icon: '🔴',
            kicker: `Crisis de Gobierno · ${c.title}`,
            headline: fill(c.headline, ctx),
            visual: this.caseScene(c, ctx),
          });
        }
        break;
      }
      case 4: {
        const disks = randInt(this.rng, 2, 9);
        this.state.disks += disks;
        const line = fill(pick(this.rng, NATIONAL_SCANDAL_LINES), ctx);
        this.alert('🚨', 'ESCÁNDALO NACIONAL', `${turn.participant.name.toUpperCase()}, BAJO SOSPECHA`, line, 'danger', 'alarm');
        this.emitNews(turn, t, { kind: 'phase', severity: 4, icon: '🚨', kicker: 'Escándalo nacional', headline: `${line} Se incautan ${disks} discos duros.` });
        break;
      }
      case 5: {
        turn.arrested = true;
        this.alert('🚔', 'DETENCIÓN EN DIRECTO', `DETENIDO ${turn.participant.name.toUpperCase()}`,
          fill('{name} ha agotado su tiempo y sale esposado de la daily.', ctx),
          'doom', 'doom', this.plan.caseDef ? this.caseScene(this.plan.caseDef, ctx, ['police']) : undefined);
        this.emitNews(turn, t, {
          kind: 'phase',
          severity: 5,
          icon: '🚔',
          kicker: 'Detención',
          headline: fill('La UCO detiene a {name}, {cargo}, en plena intervención. Sale esposado mientras sigue explicando su ticket.', ctx),
        });
        break;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Generación de noticias
  // ---------------------------------------------------------------------------

  private openCase(turn: TurnRecord, t: number): void {
    const tags = this.tagsFor(turn);
    const available = CASES.filter((c) => !this.usedCases.has(c.id));
    const pool = available.length > 0 ? available : CASES;
    const matching = pool.filter((c) => c.tags.some((tag) => tags.includes(tag)));
    const caseDef = pick(this.rng, matching.length > 0 ? matching : pool);
    this.usedCases.add(caseDef.id);
    this.plan.caseDef = caseDef;
    this.plan.followupIdx = 0;
    turn.caseId = caseDef.id;
    this.state.scandals++;
    this.addMoney(turn, caseDef.amount);
    this.addCompany(caseDef.company);
    const ctx = this.ctx(turn, { company: caseDef.company });
    this.emitNews(turn, t, {
      kind: 'case',
      severity: 3,
      icon: '🚔',
      kicker: caseDef.title,
      headline: fill(caseDef.accusation, ctx),
      statement: caseDef.statement ? fill(caseDef.statement, ctx) : undefined,
      evidence: caseDef.evidence ? { lang: caseDef.evidence.lang, code: fill(caseDef.evidence.code, ctx) } : undefined,
      visual: this.caseScene(caseDef, ctx),
    });
  }

  private emitRumor(turn: TurnRecord, t: number): void {
    const rumor = this.takeUnused(RUMORS.map((text, i) => ({ id: String(i), text })), this.usedRumors);
    this.emitNews(turn, t, {
      kind: 'rumor',
      severity: 1,
      icon: '🗞️',
      kicker: 'Rumores en los pasillos',
      headline: fill(rumor.text, this.ctx(turn)),
    });
  }

  private emitEscalation(turn: TurnRecord, t: number, phase: PhaseIndex): void {
    type Option = 'followup' | 'event' | 'plot' | 'generated' | 'persistent' | 'reopen';
    const c = this.plan.caseDef;
    const hasFollowup = !!c && this.plan.followupIdx < c.followups.length;
    const canPersist = this.config.cumulative && this.implicated(turn).length > 0;
    const canReopen = this.reopenCandidates().length > 0;
    const choice = weighted<Option>(this.rng, [
      ['followup', hasFollowup ? 3 : 0],
      ['event', 3],
      ['plot', 2],
      ['generated', 2],
      ['persistent', canPersist ? 2 : 0],
      ['reopen', canReopen ? 0.6 : 0],
    ]);
    switch (choice) {
      case 'followup': {
        const text = c!.followups[this.plan.followupIdx++];
        this.emitNews(turn, t, {
          kind: 'case',
          severity: Math.min(5, phase) as Severity,
          icon: '🔴',
          kicker: c!.title,
          headline: fill(text, this.ctx(turn, { company: c!.company })),
        });
        break;
      }
      case 'event':
        this.emitEvent(turn, t, phase);
        break;
      case 'plot':
        this.advancePlot(turn, t);
        break;
      case 'generated':
        this.emitGenerated(turn, t, phase);
        break;
      case 'persistent':
        this.emitPersistent(turn, t, true);
        break;
      case 'reopen':
        this.emitReopen(turn, t);
        break;
    }
  }

  private emitEvent(turn: TurnRecord, t: number, phase: PhaseIndex): void {
    const shift = SEVERITY_SHIFT[this.config.intensity];
    const target = Math.max(1, Math.min(5, phase - 1 + shift));
    const tags = this.tagsFor(turn);
    const fresh = EVENTS.filter((e) => !this.usedEvents.has(e.id));
    if (fresh.length === 0) this.usedEvents.clear();
    const pool = fresh.length > 0 ? fresh : EVENTS;
    const inRange = pool.filter((e) => Math.abs(e.severity - target) <= 1);
    const candidates = inRange.length > 0 ? inRange : pool;
    const matching = candidates.filter((e) => e.tags.some((tag) => tags.includes(tag)));
    const event = pick(this.rng, matching.length > 0 && this.rng() < 0.75 ? matching : candidates);
    this.usedEvents.add(event.id);
    if (event.disks) this.state.disks += event.disks;
    if (event.money) this.addMoney(turn, event.money);
    this.emitNews(turn, t, {
      kind: 'event',
      severity: event.severity,
      icon: event.icon,
      kicker: event.kicker,
      headline: fill(event.text, this.ctx(turn)),
    });
  }

  private advancePlot(turn: TurnRecord, t: number): void {
    if (!this.state.plot) {
      const tags = this.tagsFor(turn);
      const fresh = PLOTS.filter((p) => !this.usedPlots.has(p.id));
      if (fresh.length === 0) this.usedPlots.clear();
      const pool = fresh.length > 0 ? fresh : PLOTS;
      const matching = pool.filter((p) => p.tags.some((tag) => tags.includes(tag)));
      const plot = pick(this.rng, matching.length > 0 ? matching : pool);
      this.usedPlots.add(plot.id);
      this.state.plot = { id: plot.id, step: 0 };
    }
    const active = this.state.plot;
    const def = PLOTS.find((p) => p.id === active.id)!;
    const step = def.steps[active.step];
    const prev = this.implicated(turn);
    const ctx = this.ctx(turn, { prev: prev.length > 0 ? pick(this.rng, prev).participant.name : turn.participant.name });
    this.emitNews(turn, t, {
      kind: 'plot',
      severity: step.severity,
      icon: step.icon,
      kicker: `Trama · ${def.title} (${active.step + 1}/${def.steps.length})`,
      headline: fill(step.text, ctx),
    });
    active.step++;
    if (active.step >= def.steps.length) {
      this.state.scandals++;
      this.addMoney(turn, def.money);
      this.state.plot = null;
    }
  }

  private emitGenerated(turn: TurnRecord, t: number, phase: PhaseIndex): void {
    const amount = randInt(this.rng, 1, 3 + phase * 3) * 1_000_000;
    const company = pick(this.rng, GEN_COMPANIES);
    const techPool = [...GEN_TECH[turn.participant.specialty], ...GEN_TECH.general];
    const headline = fill(pick(this.rng, GEN_TEMPLATES), this.ctx(turn, {
      company,
      amount: formatAmountWords(amount),
      tech: pick(this.rng, techPool),
      deliverable: pick(this.rng, GEN_DELIVERABLES),
      excuse: pick(this.rng, GEN_EXCUSES),
    }));
    this.addMoney(turn, amount);
    this.addCompany(company);
    this.emitNews(turn, t, { kind: 'generated', severity: Math.min(5, phase) as Severity, icon: '🎰', kicker: 'Corruptela', headline });
  }

  private emitPersistent(turn: TurnRecord, t: number, implication: boolean): void {
    const prevTurns = this.implicated(turn);
    if (prevTurns.length === 0) return;
    const prev = pick(this.rng, prevTurns);
    const prevCase = prev.caseId ? caseById(prev.caseId) : undefined;
    const ctx = this.ctx(turn, {
      prev: prev.participant.name,
      prevCompany: prevCase?.company ?? 'las empresas investigadas',
    });
    const template = pick(this.rng, implication ? PERSISTENT_IMPLICATIONS : PERSISTENT_DENIALS);
    this.emitNews(turn, t, {
      kind: 'persistent',
      severity: implication ? 4 : 2,
      icon: implication ? '🔗' : '📰',
      kicker: implication ? 'La trama se extiende' : 'Comparecencia',
      headline: fill(template, ctx),
    });
  }

  private reopenCandidates(): { caseId: string; ago: number }[] {
    const out: { caseId: string; ago: number }[] = [];
    this.history.forEach((record, i) => {
      const ago = this.history.length - i;
      for (const caseId of record.caseIds) {
        if (!this.usedReopen.has(caseId) && caseById(caseId)) out.push({ caseId, ago });
      }
    });
    return out;
  }

  private emitReopen(turn: TurnRecord, t: number): void {
    const candidate = pick(this.rng, this.reopenCandidates());
    this.usedReopen.add(candidate.caseId);
    const c = caseById(candidate.caseId)!;
    this.emitNews(turn, t, {
      kind: 'reopen',
      severity: 3,
      icon: '📂',
      kicker: 'Hemeroteca',
      headline: fill(pick(this.rng, REOPEN_TEMPLATES), { caseTitle: c.title, n: candidate.ago }),
    });
  }

  private fireCrisis(turn: TurnRecord, t: number): void {
    const card = this.plan.crisis;
    if (!card) return;
    const ctx = this.ctx(turn);
    const text = fill(card.text, ctx);
    const visual: SceneSpec = {
      scene: card.scene,
      props: card.props,
      accent: card.accent,
      sign: card.sign,
      caption: card.title,
      screen: card.screen,
      seed: hashString(card.id),
    };
    this.alert(card.icon, 'CARTA DE CRISIS', card.title, text, 'danger', 'alarm', visual);
    this.emitNews(turn, t, { kind: 'crisis', severity: 4, icon: card.icon, kicker: `Crisis extraordinaria · ${card.title}`, headline: text, visual });
    this.state.scandals++;
  }

  // ---------------------------------------------------------------------------
  // Utilidades internas
  // ---------------------------------------------------------------------------

  private addCorruption(turn: TurnRecord, amount: number): void {
    // Cada ministro solo puede gastar su cuota del índice.
    const applied = Math.min(amount, Math.max(0, this.share - turn.corruption));
    if (applied <= 0) return;
    turn.corruption += applied;
    // Suma de las aportaciones, redondeada para evitar errores de coma flotante (99,9999… ≠ 100).
    const total = this.state.turns.reduce((acc, t) => acc + t.corruption, 0);
    this.state.corruption = Math.min(100, Math.round(total * 1e6) / 1e6);
    if (this.state.corruption >= 100 && !this.state.collapseWarned) {
      this.state.collapseWarned = true;
      this.alert('⚠️', 'CRISIS INSTITUCIONAL', 'EL GOBIERNO, AL BORDE DEL COLAPSO',
        'El índice de corrupción alcanza el 100 %. La caída del Gobierno se decidirá cuando hayan hablado todos los ministros.', 'danger', 'alarm');
    }
  }

  private emitNews(turn: TurnRecord, t: number, item: Omit<NewsItem, 'id' | 'sessionSecond' | 'turnSecond' | 'participantId'> & { kind: NewsKind }): void {
    void t;
    const important = item.kind === 'case' || item.kind === 'phase' || item.kind === 'crisis';
    this.enqueue({
      priority: important ? 2 : 1,
      news: { ...item, headline: tidy(item.headline), participantId: turn.participant.id },
    });
  }

  private alert(icon: string, kicker: string, title: string, subtitle: string | undefined, tone: AlertTone, sound: SoundName, visual?: SceneSpec): void {
    this.enqueue({ priority: 3, alert: { id: ++this.seq, icon, kicker, title, subtitle, tone, sound, visual } });
  }

  private caseScene(c: CaseDef, ctx: TextContext, extraProps: SceneSpec['props'] = []): SceneSpec {
    const firstLine = c.evidence ? fill(c.evidence.code, ctx).split('\n')[0] : c.title;
    return {
      scene: c.scene,
      props: [...new Set([...extraProps, ...c.props])].slice(0, 3),
      accent: c.accent,
      sign: c.company,
      caption: c.title,
      screen: c.screen ?? firstLine,
      seed: hashString(c.id),
    };
  }

  private frequency(): number {
    return Math.max(3, this.config.eventFrequency * FREQ_FACTOR[this.config.intensity]);
  }

  private tagsFor(turn: TurnRecord): Tag[] {
    return [turn.participant.specialty, 'general'];
  }

  /** Compañeros que ya han intervenido y han quedado implicados en algún caso. */
  private implicated(exclude?: TurnRecord): TurnRecord[] {
    return this.state.turns.filter((t) => t !== exclude && t.status === 'done' && t.investigated);
  }

  private addMoney(turn: TurnRecord, amount: number): void {
    this.state.money += amount;
    turn.money += amount;
  }

  private addCompany(company: string): void {
    this.state.companies.push(company);
  }

  private takeUnused<T extends { id: string }>(items: readonly T[], used: Set<string>): T {
    let fresh = items.filter((i) => !used.has(i.id));
    if (fresh.length === 0) {
      used.clear();
      fresh = [...items];
    }
    const item = pick(this.rng, fresh);
    used.add(item.id);
    return item;
  }

  private ctx(turn: TurnRecord, extra: TextContext = {}): TextContext {
    return {
      name: turn.participant.name,
      cargo: lowerFirst(turn.participant.cargo),
      Cargo: turn.participant.cargo,
      party: this.config.partyName,
      ...extra,
    };
  }
}

function emptyPlan(): TurnPlan {
  return {
    nextRumorAt: Infinity,
    nextNewsAt: Infinity,
    persistentAt: null,
    crisisAt: null,
    crisis: null,
    caseDef: null,
    followupIdx: 0,
  };
}
