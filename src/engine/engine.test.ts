import { describe, expect, it } from 'vitest';
import type { Config, Participant } from '../types';
import { corruptionShare, DailyEngine, overrunCurve, readingSeconds, type EngineEvent } from './engine';
import { phaseAt } from './phases';
import { buildAwards, buildSummary, toRecord } from './summary';

function participant(name: string, extra: Partial<Participant> = {}): Participant {
  return { id: name, name, specialty: 'backend', cargo: 'Ministro de Interior y APIs', maxTime: null, threshold: null, ...extra };
}

function config(extra: Partial<Config> = {}): Config {
  return {
    partyName: 'Partido de la Integración Continua',
    sprintName: 'Sprint 24',
    participants: [participant('Carlos'), participant('Laura', { specialty: 'frontend' })],
    maxTime: 120,
    threshold: 75,
    intensity: 'media',
    eventFrequency: 12,
    cumulative: true,
    sounds: false,
    music: false,
    musicVolume: 0.5,
    fullscreen: false,
    ...extra,
  };
}

/** RNG determinista para que los tests sean reproducibles. */
function seeded(seed = 42) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const sec = (s: number) => s * 1000;

describe('phaseAt', () => {
  it('reproduce la tabla de fases para 120 s / threshold 75 s', () => {
    const expected: [number, number][] = [
      [0, 0], [44, 0], [45, 1], [74, 1], [75, 2], [89, 2], [90, 3], [109, 3], [110, 4], [119, 4], [120, 5], [300, 5],
    ];
    for (const [t, phase] of expected) expect(phaseAt(t, 75, 120)).toBe(phase);
  });
});

describe('DailyEngine', () => {
  it('no genera corrupción si nadie supera el threshold', () => {
    const engine = new DailyEngine(config(), { rng: seeded() });
    engine.start(0);
    engine.update(sec(70));
    engine.next(sec(70));
    engine.update(sec(70 + 60));
    engine.next(sec(70 + 60));
    expect(engine.state.status).toBe('finished');
    expect(engine.state.corruption).toBe(0);
    const summary = buildSummary(engine);
    expect(summary.stable).toBe(true);
    expect(summary.headline).toContain('Por primera vez');
  });

  it('el threshold abre la investigación pero la corrupción empieza al pasarse del tiempo máximo', () => {
    const engine = new DailyEngine(config(), { rng: seeded() });
    engine.start(0);
    engine.update(sec(110));
    const turn = engine.currentTurn!;
    expect(turn.investigated).toBe(true);
    expect(turn.caseId).not.toBeNull();
    expect(engine.state.corruption).toBe(0);
    // 2 participantes: la cuota se consume entre 120 s y 240 s
    engine.update(sec(130));
    expect(engine.state.corruption).toBeCloseTo(corruptionShare(2) * overrunCurve(10 / 120), 5);
  });

  it('la curva es decreciente: el primer cuarto cuesta más que el resto', () => {
    const quarters = [0, 1, 2, 3].map((q) => overrunCurve((q + 1) / 4) - overrunCurve(q / 4));
    for (let i = 1; i < 4; i++) expect(quarters[i]).toBeLessThan(quarters[i - 1]);
    expect(quarters[0]).toBeGreaterThan(0.5);
    expect(overrunCurve(1)).toBe(1);
  });

  it('con el doble del tiempo se agota la cuota del ministro', () => {
    const five = ['A', 'B', 'C', 'D', 'E'].map((n) => participant(n));
    const engine = new DailyEngine(config({ participants: five }), { rng: seeded() });
    engine.start(0);
    engine.update(sec(150));
    // primer cuarto del exceso: ~58 % de la cuota
    const share = corruptionShare(5);
    expect(engine.state.corruption).toBeCloseTo(share * (1 - 0.75 ** 3), 5);
    engine.update(sec(180));
    expect(engine.state.corruption).toBeCloseTo(share * (1 - 0.5 ** 3), 5);
    engine.update(sec(240));
    expect(engine.state.corruption).toBeCloseTo(share, 5);
    engine.update(sec(1000));
    expect(engine.currentTurn!.corruption).toBeCloseTo(share, 5);
  });

  it('no avanza el tiempo mientras está en pausa', () => {
    const engine = new DailyEngine(config(), { rng: seeded() });
    engine.start(0);
    engine.update(sec(10));
    engine.pause(sec(10));
    engine.update(sec(500));
    engine.resume(sec(500));
    engine.update(sec(505));
    expect(Math.floor(engine.state.turnElapsedMs / 1000)).toBe(15);
    expect(engine.state.phase).toBe(0);
  });

  /** Simula una daily en la que los `over` primeros consumen el doble de tiempo y el resto cumple. */
  function runDaily(total: number, over: number) {
    const people = Array.from({ length: total }, (_, i) => participant(`P${i}`));
    const engine = new DailyEngine(config({ participants: people }), { rng: seeded() });
    engine.start(0);
    let now = 0;
    people.forEach((_, i) => {
      now += sec(i < over ? 240 : 60);
      engine.update(now);
      engine.next(now);
    });
    return engine;
  }

  it('el Gobierno no cae si se pasa menos de la mitad del equipo', () => {
    for (const total of [4, 5, 6, 8, 10]) {
      const engine = runDaily(total, Math.ceil(total / 2) - 1);
      expect(engine.state.fallen).toBe(false);
    }
  });

  it('el Gobierno cae cuando se pasan suficientes ministros, pero solo al final', () => {
    const events: EngineEvent[] = [];
    // 5 personas: 4 con el doble de tiempo tumban al Gobierno
    const people = ['A', 'B', 'C', 'D', 'E'].map((n) => participant(n));
    const engine = new DailyEngine(config({ participants: people }), { rng: seeded(), listener: (e) => events.push(e) });
    engine.start(0);
    let now = 0;
    for (let i = 0; i < 4; i++) {
      now += sec(300);
      engine.update(now);
      engine.next(now);
    }
    expect(engine.state.corruption).toBe(100);
    expect(engine.state.fallen).toBe(false);
    expect(events.some((e) => e.type === 'alert' && e.alert.title.includes('COLAPSO'))).toBe(true);
    now += sec(30);
    engine.update(now);
    engine.next(now);
    expect(engine.state.status).toBe('finished');
    expect(engine.state.fallen).toBe(true);
    expect(runDaily(10, 5).state.fallen).toBe(true);
  });

  it('espacia noticias y alertas para que dé tiempo a leerlas', () => {
    const events: { t: number; e: EngineEvent }[] = [];
    let now = 0;
    const engine = new DailyEngine(config({ intensity: 'extrema', eventFrequency: 3 }), {
      rng: seeded(3),
      listener: (e) => events.push({ t: now / 1000, e }),
    });
    engine.start(0);
    for (now = 0; now <= sec(240); now += sec(1)) engine.update(now);
    const published = events.filter(({ e }) => e.type !== 'finish');
    for (let i = 1; i < published.length; i++) {
      const prev = published[i - 1];
      const gap = published[i].t - prev.t;
      const needed = prev.e.type === 'alert' ? 5 : prev.e.type === 'news' ? readingSeconds(prev.e.item) : 0;
      expect(gap).toBeGreaterThanOrEqual(needed);
    }
  });

  it('detiene al ministro que agota su tiempo e incrementa el índice', () => {
    const events: EngineEvent[] = [];
    const engine = new DailyEngine(
      config({ participants: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((n) => participant(n)) }),
      { rng: () => 0.99, listener: (e) => events.push(e) },
    );
    engine.start(0);
    engine.update(sec(120));
    const turn = engine.currentTurn!;
    expect(turn.arrested).toBe(true);
    expect(engine.state.corruption).toBe(0);
    engine.update(sec(121));
    expect(engine.state.corruption).toBeCloseTo(corruptionShare(8) * overrunCurve(1 / 120), 5);
    engine.update(sec(140));
    expect(events.some((e) => e.type === 'alert' && e.alert.title === 'DETENIDO A')).toBe(true);
  });

  it('adjunta una imagen generada a los casos de corrupción', () => {
    const engine = new DailyEngine(config(), { rng: seeded() });
    engine.start(0);
    engine.update(sec(90));
    const caseNews = engine.state.news.find((n) => n.kind === 'case');
    expect(caseNews?.visual?.sign).toBeTruthy();
    expect(caseNews?.visual?.props.length).toBeGreaterThan(0);
  });

  it('respeta los tiempos individuales', () => {
    const engine = new DailyEngine(
      config({ participants: [participant('Miguel', { maxTime: 60, threshold: 30 })] }),
      { rng: seeded() },
    );
    engine.start(0);
    engine.update(sec(31));
    expect(engine.state.phase).toBe(2);
    engine.update(sec(61));
    expect(engine.state.phase).toBe(5);
  });

  it('las historias persistentes mencionan a compañeros implicados', () => {
    const engine = new DailyEngine(
      config({ participants: [participant('Carlos'), participant('Laura'), participant('Miguel')], intensity: 'extrema' }),
      { rng: seeded(7) },
    );
    engine.start(0);
    engine.update(sec(110));
    engine.next(sec(110));
    let now = sec(110);
    // Laura habla mucho: tiene que haber alguna mención a Carlos en algún momento
    now += sec(240);
    engine.update(now);
    const lauraNews = engine.state.news.filter((n) => n.participantId === 'Laura');
    expect(lauraNews.some((n) => n.headline.includes('Carlos'))).toBe(true);
  });

  it('los premios recaen siempre en ministros distintos', () => {
    const people = ['A', 'B', 'C', 'D', 'E'].map((n) => participant(n));
    for (let seed = 1; seed <= 20; seed++) {
      const engine = new DailyEngine(config({ participants: people }), { rng: seeded(seed) });
      engine.start(0);
      let now = 0;
      for (const secs of [40, 100, 150, 200, 260]) {
        now += sec(secs);
        engine.update(now);
        engine.next(now);
      }
      const summary = buildSummary(engine);
      const winners = summary.awards.map((a) => a.winner);
      expect(new Set(winners).size).toBe(winners.length);
      expect(summary.awards.length).toBeGreaterThanOrEqual(4);
      expect(summary.awards[0].winner).toBe('A'); // ministro ejemplar: el más breve
    }
  });

  it('sin candidatos libres un premio no se entrega en lugar de repetirse', () => {
    const engine = new DailyEngine(config({ participants: [participant('Solo')] }), { rng: seeded() });
    engine.start(0);
    engine.update(sec(200));
    engine.next(sec(200));
    const awards = buildAwards(engine.state.turns, engine.state.news);
    expect(awards.length).toBe(1);
  });

  it('marca ausentes sin contar tiempo y genera el registro de historial', () => {
    const engine = new DailyEngine(config(), { rng: seeded() });
    engine.start(0);
    engine.next(sec(1), true);
    engine.update(sec(151));
    engine.next(sec(151));
    const summary = buildSummary(engine);
    expect(summary.turns[0].status).toBe('absent');
    expect(summary.turns[1].used).toBeCloseTo(150, 5);
    // Con un ausente, Laura tiene la cuota de un equipo de 1
    expect(summary.turns[1].corruption).toBeCloseTo(corruptionShare(1) * overrunCurve(30 / 120), 5);
    const record = toRecord(summary);
    expect(record.caseIds.length).toBe(1);
    expect(record.mainCulprit).toBe('Laura');
  });
});
