import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { playSound } from '../audio';
import { BackgroundMusic } from '../music';
import { AlertOverlay, CorruptionMeter, NewsCard, renderInlineCode } from '../components/widgets';
import { DailyEngine, type EngineEvent, type TurnRecord } from '../engine/engine';
import { PHASES, phaseBoundaries } from '../engine/phases';
import { buildSummary, type SessionSummary } from '../engine/summary';
import { formatClock, formatMoney } from '../engine/util';
import { toggleFullscreen } from '../fullscreen';
import type { Alert, Config, LegislatureRecord, NewsItem } from '../types';

interface Props {
  config: Config;
  history: LegislatureRecord[];
  onFinish: (summary: SessionSummary) => void;
  onAbort: () => void;
}

const TURN_ICON: Record<TurnRecord['status'], string> = { pending: '⏳', active: '🎙️', done: '✅', absent: '🚫' };

export function SessionScreen({ config, history, onFinish, onAbort }: Props) {
  const [engine] = useState(() => new DailyEngine(config, { history }));
  const [, rerender] = useReducer((x: number) => x + 1, 0);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const finishedRef = useRef(false);
  const [music] = useState(() => new BackgroundMusic());
  const [musicOn, setMusicOn] = useState(config.music);

  const handleEvent = useCallback(
    (event: EngineEvent) => {
      if (event.type === 'alert') {
        setAlerts((q) => [...q, event.alert].slice(-3));
        music.duck();
        if (config.sounds) playSound(event.alert.sound);
      } else if (event.type === 'news' && config.sounds) {
        playSound(event.item.severity >= 4 ? 'beep' : 'teletype');
      }
    },
    [config.sounds, music],
  );

  useEffect(() => {
    engine.setListener(handleEvent);
    return () => engine.setListener(undefined);
  }, [engine, handleEvent]);

  const checkFinished = useCallback(() => {
    if (engine.state.status === 'finished' && !finishedRef.current) {
      finishedRef.current = true;
      onFinish(buildSummary(engine));
    }
  }, [engine, onFinish]);

  useEffect(() => {
    engine.start(performance.now());
    const id = window.setInterval(() => {
      engine.update(performance.now());
      rerender();
    }, 200);
    return () => window.clearInterval(id);
  }, [engine]);

  const status = engine.state.status;
  const phaseLevel = engine.state.phase;

  useEffect(() => {
    if (musicOn && status === 'running') music.start(config.musicVolume);
    else music.stop();
  }, [music, musicOn, status, config.musicVolume]);

  useEffect(() => music.setLevel(phaseLevel), [music, phaseLevel]);

  useEffect(() => () => music.stop(), [music]);

  const next = useCallback(
    (absent = false) => {
      engine.next(performance.now(), absent);
      setAlerts([]);
      rerender();
      checkFinished();
    },
    [engine, checkFinished],
  );

  const togglePause = useCallback(() => {
    engine.togglePause(performance.now());
    rerender();
  }, [engine]);

  const finishNow = useCallback(() => {
    if (!window.confirm('¿Disolver las Cortes y terminar la daily ahora?')) return;
    engine.finish();
    checkFinished();
  }, [engine, checkFinished]);

  const dismissAlert = useCallback(() => setAlerts((q) => q.slice(1)), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return;
      if (e.key === ' ') {
        e.preventDefault();
        togglePause();
      } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'n') {
        e.preventDefault();
        next(false);
      } else if (e.key.toLowerCase() === 'a') {
        next(true);
      } else if (e.key.toLowerCase() === 'm') {
        setMusicOn((on) => !on);
      } else if (e.key.toLowerCase() === 'f') {
        toggleFullscreen();
      } else if (e.key === 'Escape') {
        dismissAlert();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [togglePause, next, dismissAlert]);

  const { state } = engine;
  const turn = engine.currentTurn;
  if (!turn) return null;

  const elapsed = state.turnElapsedMs / 1000;
  const phase = PHASES[state.phase];
  const progress = Math.min(1, elapsed / turn.max);
  const remaining = turn.max - elapsed;
  const turnNews = state.news.filter((n) => n.participantId === turn.participant.id);
  const latest = turnNews.at(-1);
  const feed = [...state.news].reverse().slice(0, 14);
  const tickerNews = [...state.news].reverse().slice(0, 8);
  const nameOf = (n: NewsItem) => state.turns.find((t) => t.participant.id === n.participantId)?.participant.name;
  const bounds = phaseBoundaries(turn.threshold, turn.max);
  const nextUp = state.turns[state.turnIndex + 1];

  return (
    <div className={`session phase-${state.phase} ${state.status === 'paused' ? 'paused' : ''}`}>
      <header className="tv-header">
        <div className="tv-brand">
          🏛️ <strong>DAILYGATE</strong>
          <span className="tv-party">{config.partyName}</span>
        </div>
        <div className="tv-live">
          <span className="live-dot" /> EN DIRECTO
        </div>
      </header>
      <div className="tv-subheader">
        CONSEJO DE MINISTROS — SESIÓN EXTRAORDINARIA · {config.sprintName} · Intervención {state.turnIndex + 1}/{state.turns.length}
        <span className="tv-clock">⏱ {formatClock(engine.sessionSeconds)}</span>
      </div>

      <main className="tv-main">
        <section className="stage">
          <div className="stage-cargo">{turn.participant.cargo.toUpperCase()}</div>
          <div className="stage-name">{turn.participant.name}</div>
          <div className="stage-timer" style={{ color: phase.color }}>
            {formatClock(elapsed)}
          </div>
          <div className="stage-remaining">
            {remaining >= 0 ? `Quedan ${formatClock(remaining)}` : `+${formatClock(-remaining)} de más`}
            {state.status === 'paused' && <span className="paused-badge">⏸️ SESIÓN SUSPENDIDA</span>}
          </div>

          <div className="progress">
            <div className="progress-fill" style={{ width: `${progress * 100}%`, background: phase.color }} />
            {bounds.slice(1, 5).map((b, i) => (
              <span key={i} className={`progress-mark ${i === 1 ? 'threshold' : ''}`} style={{ left: `${(b / turn.max) * 100}%` }} />
            ))}
          </div>

          <div className="phase-badge" style={{ borderColor: phase.color, color: phase.color }}>
            {phase.icon} {phase.label.toUpperCase()} <span className="muted">· {phase.description}</span>
          </div>

          <div className="stage-alert">
            {latest ? (
              <NewsCard key={latest.id} item={latest} author={turn.participant.name} large />
            ) : (
              <div className="calm">
                <p>🟢 Normalidad institucional</p>
                <p className="muted">
                  {turn.participant.name} informa sobre sus tareas.
                </p>
              </div>
            )}
          </div>
        </section>

        <aside className="sidebar">
          <CorruptionMeter value={state.corruption} />

          <div className="side-panel">
            <h3>📜 Orden del día</h3>
            <ol className="order-list">
              {state.turns.map((t, i) => (
                <li key={t.participant.id} className={`order-${t.status}`}>
                  <span>{TURN_ICON[t.status]}</span>
                  <span className="order-name">{t.participant.name}</span>
                  <span className="order-meta">
                    {t.status === 'done' && `${Math.round(t.used)} s`}
                    {t.status === 'done' && t.investigated && ' 🔍'}
                    {t.status === 'done' && t.arrested && ' 🚔'}
                    {t.status === 'pending' && i === state.turnIndex + 1 && 'siguiente'}
                  </span>
                </li>
              ))}
            </ol>
            <div className="stats-mini">
              <span>🗂️ {state.scandals} escándalos</span>
              <span>🗃️ {state.disks} discos</span>
              <span>💸 {formatMoney(state.money)}</span>
            </div>
          </div>

          <div className="side-panel feed">
            <h3>📰 Hemeroteca de la sesión</h3>
            {feed.length === 0 && <p className="muted">Sin novedades. Por ahora.</p>}
            {feed.map((n) => (
              <div key={n.id} className={`feed-item sev-${n.severity}`}>
                <span className="feed-time">{formatClock(n.sessionSecond)}</span>
                <span>
                  {n.icon} <span className="feed-who">{nameOf(n)}</span> · {renderInlineCode(n.headline)}
                </span>
              </div>
            ))}
          </div>
        </aside>
      </main>

      <div className="ticker">
        <span className="ticker-label">🚨 ÚLTIMA HORA</span>
        <div className="ticker-track">
          <div className="ticker-content" key={tickerNews[0]?.id ?? 0}>
            {tickerNews.length === 0
              ? `${config.partyName} garantiza transparencia, escalabilidad y despliegues sin downtime ◆ La oposición pide la palabra ◆ El Consejo de Ministros arranca con normalidad`
              : tickerNews.map((n) => `${n.icon} ${n.headline.replace(/`/g, '')}`).join('   ◆   ')}
          </div>
        </div>
      </div>

      <footer className="controls">
        <button className="btn" onClick={togglePause}>
          {state.status === 'paused' ? '▶️ REANUDAR' : '⏸️ PAUSAR'}
        </button>
        <button className="btn primary" onClick={() => next(false)}>
          ➡️ {nextUp ? `SIGUIENTE MINISTRO (${nextUp.participant.name})` : 'CERRAR SESIÓN'}
        </button>
        <button className="btn ghost" onClick={() => next(true)} title="Saltar sin contar tiempo">🚫 Ausente</button>
        <button className="btn ghost" onClick={() => setMusicOn((on) => !on)} title="Música de fondo (M)">
          {musicOn ? '🎵 Música' : '🔇 Música'}
        </button>
        <button className="btn ghost" onClick={toggleFullscreen}>📺 Pantalla completa</button>
        <span className="spacer" />
        <button className="btn ghost" onClick={finishNow}>🗳️ Terminar daily</button>
        <button className="btn ghost danger" onClick={() => window.confirm('¿Abandonar la sesión sin guardar?') && onAbort()}>✕ Salir</button>
      </footer>

      {alerts[0] && <AlertOverlay key={alerts[0].id} alert={alerts[0]} onDismiss={dismissAlert} />}
    </div>
  );
}
