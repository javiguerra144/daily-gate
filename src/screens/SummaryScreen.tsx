import { useEffect } from 'react';
import { playSound } from '../audio';
import { CaseImage } from '../components/CaseImage';
import { renderInlineCode } from '../components/widgets';
import { hashString } from '../engine/util';
import type { SessionSummary } from '../engine/summary';
import { formatDuration, formatMoney, lowerFirst } from '../engine/util';

interface Props {
  summary: SessionSummary;
  sounds: boolean;
  onRestart: () => void;
  onSetup: () => void;
  onHistory: () => void;
}

export function SummaryScreen({ summary, sounds, onRestart, onSetup, onHistory }: Props) {
  useEffect(() => {
    if (sounds) playSound(summary.fallen ? 'doom' : summary.stable ? 'fanfare' : 'jingle');
  }, [sounds, summary]);

  const spoke = summary.turns.filter((t) => t.status === 'done');
  const longest = Math.max(1, ...spoke.map((t) => Math.max(t.used, t.max)));

  return (
    <div className={`summary ${summary.fallen ? 'is-fallen' : ''} ${summary.stable ? 'is-stable' : ''}`}>
      {summary.fallen && (
        <div className="banner doom">
          <h1>💀 CAÍDA DEL GOBIERNO</h1>
          <p>«El Gobierno ha caído. La daily ha durado demasiado».</p>
          <p className="muted">Se convocan elecciones anticipadas para el próximo sprint.</p>
        </div>
      )}
      {summary.stable && (
        <div className="banner good">
          <h1>🏆 GOBIERNO ESTABLE</h1>
          <p>«Por primera vez en la legislatura, no se ha descubierto ningún caso de corrupción».</p>
        </div>
      )}

      <section className="panel">
        <h2>🏛️ BALANCE DEL CONSEJO DE MINISTROS</h2>
        <p className="muted">{summary.party} · {summary.sprint}</p>
        <blockquote className="headline-of-day">
          <span>📰 Titular de la jornada</span>
          «{summary.headline}»
        </blockquote>
        <div className="stat-grid">
          <Stat label="Duración total" value={formatDuration(summary.totalSeconds)} />
          <Stat label="Estado del Gobierno" value={`${summary.gov.icon} ${summary.gov.label}`} color={summary.gov.color} />
          <Stat label="Índice de corrupción" value={`${Math.round(summary.corruption)} %`} color={summary.gov.color} />
          <Stat label="Escándalos destapados" value={summary.scandals} />
          <Stat label="Miembros investigados" value={summary.investigated} />
          <Stat label="Detenciones" value={summary.arrests} />
          <Stat label="Discos duros destruidos" value={summary.disks} />
          <Stat label="Fondos públicos desaparecidos" value={formatMoney(summary.money)} />
          <Stat
            label="Principal responsable de la crisis"
            value={summary.mainCulprit ? `${summary.mainCulprit.participant.name}, ${lowerFirst(summary.mainCulprit.participant.cargo)}` : 'Nadie (de momento)'}
          />
          <Stat label="Caso más grave" value={summary.worstCase?.title ?? 'Sin casos abiertos'} />
        </div>
      </section>

      {summary.awards.length > 0 && (
        <section className="panel">
          <h2>🎖️ Condecoraciones</h2>
          <div className="awards">
            {summary.awards.map((a) => (
              <div className="award" key={a.title}>
                <span className="award-icon">{a.icon}</span>
                <div>
                  <div className="award-title">{a.title}</div>
                  <div className="award-winner">{a.winner}</div>
                  <div className="muted">{a.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="panel">
        <h2>🗳️ Resultados por ministerio</h2>
        <div className="results">
          {summary.turns.map((t) => (
            <div className="result-row" key={t.participant.id}>
              <div className="result-who">
                <strong>{t.participant.name}</strong>
                <span className="muted">{t.participant.cargo}</span>
              </div>
              {t.status === 'done' ? (
                <div className="result-bar">
                  <div
                    className={`result-fill ${t.used > t.max ? 'over-max' : t.used > t.threshold ? 'over-th' : ''}`}
                    style={{ width: `${(t.used / longest) * 100}%` }}
                  />
                  <span className="result-mark threshold" style={{ left: `${(t.threshold / longest) * 100}%` }} title="Threshold" />
                  <span className="result-mark max" style={{ left: `${(t.max / longest) * 100}%` }} title="Máximo" />
                </div>
              ) : (
                <div className="result-bar absent">Ausente</div>
              )}
              <div className="result-meta">
                {t.status === 'done' && `${Math.round(t.used)} s`}
                {t.investigated && ' 🔍'}
                {t.arrested && ' 🚔'}
                {t.corruption > 0 && ` · ${Math.round(t.corruption)} %`}
              </div>
            </div>
          ))}
        </div>
        {spoke.length > 0 && (
          <p className="muted legend">
            Barra verde: dentro del threshold · naranja: investigado 🔍 · roja: detenido por agotar su tiempo 🚔. Marcas: threshold y máximo.
          </p>
        )}
      </section>

      {summary.worstCase && (
        <section className="panel">
          <h2>🗂️ Sumario del caso más grave</h2>
          <CaseImage
            className="summary-visual"
            spec={{
              scene: summary.worstCase.scene,
              props: summary.worstCase.props,
              accent: summary.worstCase.accent,
              sign: summary.worstCase.company,
              caption: summary.worstCase.title,
              screen: summary.worstCase.screen ?? summary.worstCase.title,
              seed: hashString(summary.worstCase.id),
            }}
          />
          <h3>{summary.worstCase.title}</h3>
          <p>
            <strong>Empresa investigada:</strong> <code>{summary.worstCase.company}</code>
          </p>
          {summary.worstCase.statement && <blockquote>«{renderInlineCode(summary.worstCase.statement)}»</blockquote>}
        </section>
      )}

      <div className="start-bar">
        <button className="btn primary" onClick={onRestart}>🔁 Nueva sesión con el mismo Gobierno</button>
        <button className="btn" onClick={onSetup}>🏠 Inicio</button>
        <button className="btn ghost" onClick={onHistory}>📚 Historial de legislaturas</button>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={color ? { color } : undefined}>
        {value}
      </div>
    </div>
  );
}
