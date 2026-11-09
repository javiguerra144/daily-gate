import { useCallback, useEffect, useState } from 'react';
import { playSound } from '../audio';
import { CARGO_POOL } from '../data/roles';
import type { Config } from '../types';

interface Props {
  config: Config;
  onBegin: () => void;
  onRedraw: () => void;
  onBack: () => void;
}

const REVEAL_MS = 900;

/** Sorteo animado: se van revelando el orden de intervención y el cargo de cada ministro. */
export function DrawScreen({ config, onBegin, onRedraw, onBack }: Props) {
  const total = config.participants.length;
  const [revealed, setRevealed] = useState(0);
  const [spin, setSpin] = useState(0);
  const done = revealed >= total;

  useEffect(() => {
    if (done) {
      if (config.sounds) playSound('fanfare');
      return;
    }
    const reveal = window.setTimeout(() => {
      setRevealed((r) => r + 1);
      if (config.sounds) playSound('teletype');
    }, REVEAL_MS);
    const spinner = window.setInterval(() => setSpin((s) => s + 1), 70);
    return () => {
      window.clearTimeout(reveal);
      window.clearInterval(spinner);
    };
  }, [revealed, done, config.sounds]);

  const begin = useCallback(() => {
    if (done) onBegin();
    else setRevealed(total);
  }, [done, onBegin, total]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        begin();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [begin]);

  return (
    <div className="draw">
      <header className="draw-header">
        <div className="draw-kicker">🎲 SORTEO OFICIAL · {config.partyName}</div>
        <h1>COMPOSICIÓN DEL CONSEJO DE MINISTROS</h1>
        <p className="muted">
          {config.sprintName} · {done ? 'El Boletín Oficial publica los nombramientos.' : 'La Mesa del Congreso extrae las bolas…'}
        </p>
      </header>

      <ol className="draw-list">
        {config.participants.map((p, i) => {
          const shown = i < revealed;
          const spinning = i === revealed;
          const cargo = shown ? p.cargo : spinning ? CARGO_POOL[(spin + i * 3) % CARGO_POOL.length].cargo : '???';
          return (
            <li key={p.id} className={shown ? 'shown' : spinning ? 'spinning' : 'hidden'}>
              <span className="draw-order">{i + 1}º</span>
              <span className="draw-name">{shown || spinning ? p.name : '· · ·'}</span>
              <span className="draw-cargo">{cargo}</span>
            </li>
          );
        })}
      </ol>

      <div className="start-bar">
        <button className="btn primary huge" onClick={begin}>
          {done ? '🔴 ABRIR LA SESIÓN' : '⏩ Revelar todo'}
        </button>
        <div className="row-actions">
          <button className="btn ghost" onClick={onRedraw}>🔁 Repetir sorteo</button>
          <button className="btn ghost" onClick={onBack}>← Volver</button>
        </div>
      </div>
    </div>
  );
}
