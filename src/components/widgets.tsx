import { useEffect } from 'react';
import { govStateFor } from '../engine/phases';
import type { Alert, NewsItem } from '../types';
import { CaseImage } from './CaseImage';

export function NewsCard({ item, author, large = false }: { item: NewsItem; author?: string; large?: boolean }) {
  return (
    <article className={`news-card sev-${item.severity} ${large ? 'large' : ''} ${large && item.visual ? 'with-visual' : ''}`}>
      {large && item.visual && <CaseImage spec={item.visual} className="news-visual" />}
      <div className="news-body">
      <header>
        <span className="news-icon">{item.icon}</span>
        {item.kicker && <span className="news-kicker">{item.kicker}</span>}
      </header>
      <p className="news-headline">{renderInlineCode(item.headline)}</p>
      {item.statement && (
        <blockquote className="news-statement">
          «{renderInlineCode(item.statement)}»{author && <cite> — {author}</cite>}
        </blockquote>
      )}
      {item.evidence && (
        <div className="evidence">
          <span className="evidence-label">🔎 Prueba encontrada · {item.evidence.lang}</span>
          <pre>
            <code>{item.evidence.code}</code>
          </pre>
        </div>
      )}
      </div>
    </article>
  );
}

/** Convierte `texto` entre backticks en <code>. */
export function renderInlineCode(text: string) {
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((part, i) =>
    part.startsWith('`') && part.endsWith('`') && part.length > 1 ? <code key={i}>{part.slice(1, -1)}</code> : <span key={i}>{part}</span>,
  );
}

export function CorruptionMeter({ value, final = false }: { value: number; final?: boolean }) {
  const gov = govStateFor(value, final);
  return (
    <div className={`meter ${value >= 100 ? 'fallen' : ''}`}>
      <div className="meter-head">
        <span>📊 Índice de Corrupción del Gobierno</span>
        <strong>{Math.floor(value)} %</strong>
      </div>
      <div className="meter-track">
        <div className="meter-fill" style={{ width: `${Math.min(100, value)}%`, background: gov.color }} />
        {[20, 40, 60, 80].map((m) => (
          <span key={m} className="meter-mark" style={{ left: `${m}%` }} />
        ))}
      </div>
      <div className="meter-state" style={{ color: gov.color }}>
        {gov.icon} {gov.label}
      </div>
      {value >= 100 && !final && <div className="meter-note">La caída se decide cuando hayan hablado todos los ministros.</div>}
    </div>
  );
}

export function AlertOverlay({ alert, onDismiss }: { alert: Alert; onDismiss: () => void }) {
  useEffect(() => {
    const id = window.setTimeout(onDismiss, alert.tone === 'doom' ? 7000 : 5000);
    return () => window.clearTimeout(id);
  }, [alert.id, alert.tone, onDismiss]);

  return (
    <div className={`overlay tone-${alert.tone}`} onClick={onDismiss} role="alertdialog" aria-live="assertive">
      <div className="overlay-content">
        {alert.visual && <CaseImage spec={alert.visual} className="overlay-visual" />}
        <div className="overlay-kicker">
          {alert.icon} {alert.kicker} {alert.icon}
        </div>
        <h1 className="overlay-title">{alert.title}</h1>
        {alert.subtitle && <p className="overlay-subtitle">{renderInlineCode(alert.subtitle)}</p>}
        <p className="overlay-hint">Pulsa en cualquier sitio o Esc para volver a la sesión</p>
      </div>
    </div>
  );
}
