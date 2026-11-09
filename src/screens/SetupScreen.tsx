import { useEffect, useState } from 'react';
import { playSound, unlockAudio } from '../audio';
import { PHASES } from '../engine/phases';
import { BackgroundMusic } from '../music';
import { enterFullscreen } from '../fullscreen';
import { newParticipant } from '../storage';
import type { Config, Intensity, Participant } from '../types';

interface Props {
  config: Config;
  onChange: (config: Config) => void;
  onStart: () => void;
  onHistory: () => void;
  historyCount: number;
}

function parseOptionalSeconds(value: string): number | null {
  if (value.trim() === '') return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

/** Vista de inicio: se convoca a los participantes; cargos y orden se sortean al iniciar. */
export function SetupScreen({ config, onChange, onStart, onHistory, historyCount }: Props) {
  const [newName, setNewName] = useState('');

  // Prueba de la música: suena aquí mismo y el volumen se ajusta en directo.
  const [preview] = useState(() => new BackgroundMusic());
  const [previewing, setPreviewing] = useState(false);
  const [previewLevel, setPreviewLevel] = useState(0);

  useEffect(() => () => preview.stop(), [preview]);
  useEffect(() => preview.setVolume(config.musicVolume), [preview, config.musicVolume]);
  useEffect(() => preview.setLevel(previewLevel), [preview, previewLevel]);
  useEffect(() => {
    if (!config.music && previewing) {
      preview.stop();
      setPreviewing(false);
    }
  }, [config.music, previewing, preview]);

  const togglePreview = () => {
    if (previewing) {
      preview.stop();
      setPreviewing(false);
    } else {
      unlockAudio();
      preview.setLevel(previewLevel);
      preview.start(config.musicVolume);
      setPreviewing(true);
    }
  };
  const set = <K extends keyof Config>(key: K, value: Config[K]) => onChange({ ...config, [key]: value });
  const setParticipants = (participants: Participant[]) => set('participants', participants);
  const updateParticipant = (id: string, patch: Partial<Participant>) =>
    setParticipants(config.participants.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const addParticipant = () => {
    const names = newName.split(',').map((n) => n.trim()).filter(Boolean);
    if (names.length === 0) return;
    setParticipants([...config.participants, ...names.map((n) => newParticipant(n))]);
    setNewName('');
  };

  const valid = config.participants.filter((p) => p.name.trim()).length;
  const thresholdInvalid = config.threshold >= config.maxTime;

  const start = () => {
    unlockAudio();
    if (config.sounds) playSound('jingle');
    if (config.fullscreen) enterFullscreen();
    onStart();
  };

  return (
    <div className="setup home">
      <header className="setup-header">
        <div className="brand">
          <span className="brand-icon">🏛️</span>
          <div>
            <h1>DAILYGATE</h1>
            <p className="tagline">El escándalo del sprint · «Un commit por el pueblo, un merge por la patria»</p>
          </div>
        </div>
        <button className="btn ghost" onClick={onHistory}>
          📚 Historial de legislaturas {historyCount > 0 && <span className="badge">{historyCount}</span>}
        </button>
      </header>

      <section className="panel convocatoria">
        <h2>🧑‍💼 Convocatoria del Consejo de Ministros <span className="muted">({valid})</span></h2>
        <p className="muted">
          Añade a quienes participan en la daily. Los cargos y el orden de intervención se sortean al pulsar <strong>Iniciar</strong>.
        </p>

        <ul className="attendees">
          {config.participants.map((p, i) => (
            <li key={p.id}>
              <span className="attendee-number">{i + 1}</span>
              <input
                value={p.name}
                placeholder="Nombre"
                aria-label={`Participante ${i + 1}`}
                onChange={(e) => updateParticipant(p.id, { name: e.target.value })}
              />
              <button
                className="icon-btn danger"
                title="Quitar"
                onClick={() => setParticipants(config.participants.filter((x) => x.id !== p.id))}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>

        <form
          className="add-attendee"
          onSubmit={(e) => {
            e.preventDefault();
            addParticipant();
          }}
        >
          <input
            value={newName}
            placeholder="Nombre (o varios separados por comas)"
            aria-label="Nuevo participante"
            onChange={(e) => setNewName(e.target.value)}
          />
          <button className="btn" type="submit" disabled={!newName.trim()}>
            ➕ Añadir
          </button>
        </form>
      </section>

      <div className="start-bar">
        <button className="btn primary huge" disabled={valid === 0} onClick={start}>
          🔴 INICIAR · SORTEAR CARGOS
        </button>
        <p className="muted">
          Atajos durante la sesión: <kbd>Espacio</kbd> pausa · <kbd>→</kbd> siguiente · <kbd>A</kbd> ausente · <kbd>M</kbd> música · <kbd>F</kbd> pantalla completa
        </p>
      </div>

      <details className="panel settings">
        <summary>⚙️ Ajustes de la sesión</summary>

        <div className="grid two">
          <label>
            Nombre del partido
            <input value={config.partyName} onChange={(e) => set('partyName', e.target.value)} />
          </label>
          <label>
            Legislatura (sprint)
            <input value={config.sprintName} onChange={(e) => set('sprintName', e.target.value)} placeholder="Sprint 24" />
          </label>
        </div>

        <div className="grid three">
          <label>
            Tiempo máximo por intervención (s)
            <input type="number" min={10} value={config.maxTime} onChange={(e) => set('maxTime', Math.max(10, Number(e.target.value) || 0))} />
          </label>
          <label>
            Threshold de corrupción (s)
            <input type="number" min={5} value={config.threshold} onChange={(e) => set('threshold', Math.max(5, Number(e.target.value) || 0))} />
            {thresholdInvalid && <small className="warn">Debe ser menor que el máximo (se usará el 62,5 %).</small>}
          </label>
          <label>
            Frecuencia de eventos (s)
            <input type="number" min={3} value={config.eventFrequency} onChange={(e) => set('eventFrequency', Math.max(3, Number(e.target.value) || 0))} />
          </label>
          <label>
            Intensidad de corrupción
            <select value={config.intensity} onChange={(e) => set('intensity', e.target.value as Intensity)}>
              <option value="baja">Baja · escándalos moderados</option>
              <option value="media">Media · lo habitual</option>
              <option value="extrema">Extrema · la UCO vive en la oficina</option>
            </select>
          </label>
        </div>

        <div className="toggles">
          <label className="toggle">
            <input type="checkbox" checked={config.cumulative} onChange={(e) => set('cumulative', e.target.checked)} />
            <span>📰 Corrupción acumulativa (historias compartidas entre ministros)</span>
          </label>
          <label className="toggle">
            <input type="checkbox" checked={config.sounds} onChange={(e) => set('sounds', e.target.checked)} />
            <span>🔊 Sonidos (sirenas, teletipos y alarmas)</span>
          </label>
          <label className="toggle">
            <input type="checkbox" checked={config.music} onChange={(e) => set('music', e.target.checked)} />
            <span>🎵 Música de fondo (se intensifica con cada fase de la intervención)</span>
          </label>
          {config.music && (
            <div className="volume">
              <label className="volume-slider">
                Volumen de la música
                <input type="range" min={0} max={1} step={0.05} value={config.musicVolume} onChange={(e) => set('musicVolume', Number(e.target.value))} />
                <span className="volume-value">{Math.round(config.musicVolume * 100)} %</span>
              </label>
              <button className="btn small" type="button" onClick={togglePreview}>
                {previewing ? '⏹️ Parar' : '▶️ Escuchar'}
              </button>
              <select
                value={previewLevel}
                onChange={(e) => setPreviewLevel(Number(e.target.value))}
                aria-label="Fase que se escucha en la prueba"
                title="Fase de la intervención que suena en la prueba"
              >
                {PHASES.map((p) => (
                  <option key={p.index} value={p.index}>
                    {p.icon} {p.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          <label className="toggle">
            <input type="checkbox" checked={config.fullscreen} onChange={(e) => set('fullscreen', e.target.checked)} />
            <span>📺 Pantalla completa al iniciar (para proyectar)</span>
          </label>
        </div>

        {valid > 0 && (
          <div className="individual-times">
            <h3>⏱️ Tiempos individuales</h3>
            <p className="muted">Déjalo vacío para usar los tiempos generales ({config.maxTime} s / {config.threshold} s).</p>
            {config.participants
              .filter((p) => p.name.trim())
              .map((p) => (
                <div className="time-row" key={p.id}>
                  <span>{p.name}</span>
                  <input
                    type="number"
                    min={5}
                    placeholder={`Máx. ${config.maxTime}`}
                    value={p.maxTime ?? ''}
                    aria-label={`Tiempo máximo de ${p.name}`}
                    onChange={(e) => updateParticipant(p.id, { maxTime: parseOptionalSeconds(e.target.value) })}
                  />
                  <input
                    type="number"
                    min={1}
                    placeholder={`Threshold ${config.threshold}`}
                    value={p.threshold ?? ''}
                    aria-label={`Threshold de ${p.name}`}
                    onChange={(e) => updateParticipant(p.id, { threshold: parseOptionalSeconds(e.target.value) })}
                  />
                </div>
              ))}
          </div>
        )}
      </details>
    </div>
  );
}
