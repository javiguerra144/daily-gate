import { aggregateHistory } from '../engine/summary';
import { formatDuration, formatMoney } from '../engine/util';
import type { LegislatureRecord } from '../types';

interface Props {
  history: LegislatureRecord[];
  onClear: () => void;
  onBack: () => void;
}

export function HistoryScreen({ history, onClear, onBack }: Props) {
  const legislatures = aggregateHistory(history);
  const sessions = [...history].reverse();

  return (
    <div className="history">
      <header className="setup-header">
        <div className="brand">
          <span className="brand-icon">📚</span>
          <div>
            <h1>HISTORIAL DE LEGISLATURAS</h1>
            <p className="tagline">Cada daily es una sesión parlamentaria; cada sprint, una legislatura.</p>
          </div>
        </div>
        <button className="btn" onClick={onBack}>← Volver</button>
      </header>

      {legislatures.length === 0 && (
        <section className="panel">
          <p>Todavía no hay sesiones registradas. La hemeroteca está tan limpia como un main recién protegido.</p>
        </section>
      )}

      <div className="legislatures">
        {legislatures.map((l) => (
          <section className="panel legislature" key={l.sprint}>
            <h2>🏛️ Legislatura {l.sprint}</h2>
            <ul>
              <li>Sesiones: <strong>{l.sessions}</strong></li>
              <li>Corrupción media: <strong>{l.avgCorruption} %</strong></li>
              <li>Ministro más investigado: <strong>{l.mostInvestigated ?? '—'}</strong></li>
              <li>Empresa más beneficiada: <strong>{l.topCompany ?? '—'}</strong></li>
              <li>Casos abiertos: <strong>{l.cases}</strong></li>
              <li>Gobiernos caídos: <strong>{l.fallen}</strong></li>
              <li>Fondos desaparecidos: <strong>{formatMoney(l.money)}</strong></li>
            </ul>
          </section>
        ))}
      </div>

      {sessions.length > 0 && (
        <section className="panel">
          <h2>🗓️ Sesiones</h2>
          <table className="history-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Legislatura</th>
                <th>Duración</th>
                <th>Corrupción</th>
                <th>Escándalos</th>
                <th>Responsable</th>
                <th>Gobierno</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id}>
                  <td>{new Date(s.date).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}</td>
                  <td>{s.sprint}</td>
                  <td>{formatDuration(s.durationSeconds)}</td>
                  <td>{s.corruption} %</td>
                  <td>{s.scandals}</td>
                  <td>{s.mainCulprit ?? '—'}</td>
                  <td>{s.fallen ? '💀 Caído' : s.scandals === 0 ? '🏆 Estable' : '🏛️ Resiste'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="btn ghost danger" onClick={() => window.confirm('¿Borrar todo el historial? La UCO lo agradecerá.') && onClear()}>
            🧨 Borrar historial («limpieza técnica»)
          </button>
        </section>
      )}
    </div>
  );
}
