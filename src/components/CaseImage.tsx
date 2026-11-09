import { useId, useMemo, type ReactNode } from 'react';
import { seededRng, type Rng } from '../engine/util';
import type { SceneProp, SceneSpec } from '../types';

/**
 * «Fotografía de agencia» generada proceduralmente para cada caso de corrupción:
 * escenario + luces policiales + cinta de la UCO + pruebas incautadas + rótulo de la empresa.
 * Es determinista por caso (misma semilla, misma imagen).
 */

const W = 640;
const H = 360;
const PROP_SLOTS = [140, 330, 515];
const PROP_BASE = 322;

function fitFont(text: string, width: number, max: number, ratio = 0.56): number {
  return Math.max(8, Math.min(max, width / (Math.max(1, text.length) * ratio)));
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export function CaseImage({ spec, className = '' }: { spec: SceneSpec; className?: string }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const content = useMemo(() => {
    const rng = seededRng(spec.seed);
    return {
      scene: renderScene(spec, rng, id),
      props: spec.props.slice(0, 3).map((p, i) => (
        <g key={`${p}-${i}`}>{renderProp(p, PROP_SLOTS[i], PROP_BASE, spec, rng)}</g>
      )),
    };
  }, [spec, id]);

  const time = useMemo(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }, []);

  return (
    <svg className={`case-image ${className}`} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Imagen del ${spec.caption}: ${spec.sign}`}>
      <defs>
        <radialGradient id={`red${id}`}>
          <stop offset="0" stopColor="#ff1f3d" stopOpacity="0.85" />
          <stop offset="1" stopColor="#ff1f3d" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`blue${id}`}>
          <stop offset="0" stopColor="#2f6bff" stopOpacity="0.85" />
          <stop offset="1" stopColor="#2f6bff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`vig${id}`} cx="0.5" cy="0.45" r="0.75">
          <stop offset="0.55" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.7" />
        </radialGradient>
        <filter id={`grain${id}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.09 0" />
        </filter>
        <linearGradient id={`sky${id}`} x1="0" y1="0" x2="0" y2="1">
          {skyStops(spec.scene)}
        </linearGradient>
      </defs>

      {content.scene}

      {/* Luces de los coches patrulla */}
      <circle cx="40" cy="30" r="260" fill={`url(#red${id})`}>
        <animate attributeName="opacity" values="0.7;0.1;0.7" dur="0.9s" repeatCount="indefinite" />
      </circle>
      <circle cx={W - 40} cy="30" r="260" fill={`url(#blue${id})`}>
        <animate attributeName="opacity" values="0.1;0.7;0.1" dur="0.9s" repeatCount="indefinite" />
      </circle>

      {/* Cinta policial */}
      <g transform="rotate(-4 320 252)">
        <rect x="-30" y="240" width={W + 60} height="24" fill="#ffd400" />
        <text x="-10" y="257" fontFamily="Oswald, Impact, sans-serif" fontSize="14" fontWeight="700" fill="#111" letterSpacing="2">
          {'UCO · NO PASAR · POLICÍA JUDICIAL · '.repeat(4)}
        </text>
      </g>

      {content.props}

      {/* Acabado fotográfico */}
      <rect width={W} height={H} fill={`url(#vig${id})`} />
      <rect width={W} height={H} filter={`url(#grain${id})`} />

      <rect x="14" y="14" width="112" height="24" rx="3" fill="#e3122b" />
      <text x="24" y="31" fontFamily="Oswald, Impact, sans-serif" fontSize="14" fill="#fff" letterSpacing="1.5">
        ● EXCLUSIVA
      </text>
      <text x={W - 14} y="30" textAnchor="end" fontFamily="Inter, sans-serif" fontSize="10" fill="#fff" opacity="0.75">
        FOTO: AGENCIA DAILYGATE · {time}
      </text>

      <rect y={H - 36} width={W} height="36" fill="#000" opacity="0.78" />
      <rect y={H - 36} width="6" height="36" fill={spec.accent} />
      <text x="18" y={H - 13} fontFamily="Oswald, Impact, sans-serif" fontSize={fitFont(spec.caption, 600, 17, 0.5)} fill="#fff" letterSpacing="0.5">
        {spec.caption}
      </text>
    </svg>
  );
}

// -----------------------------------------------------------------------------
// Escenarios
// -----------------------------------------------------------------------------

function skyStops(scene: SceneSpec['scene']): ReactNode {
  const stops: Record<SceneSpec['scene'], string[]> = {
    hq: ['#050816', '#1c1a3c', '#3b2142'],
    datacenter: ['#03070f', '#08121f', '#0d1a2b'],
    island: ['#3d2a7a', '#ff5e8a', '#ffb067'],
    office: ['#1d2238', '#252b45', '#2d3350'],
    court: ['#12141f', '#1b1e2c', '#232738'],
  };
  return stops[scene].map((c, i) => <stop key={c} offset={i / 2} stopColor={c} />);
}

function Sign({ x, y, w, h, text, accent, sub }: { x: number; y: number; w: number; h: number; text: string; accent: string; sub?: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="3" fill={accent} stroke="#000" strokeOpacity="0.4" strokeWidth="2" />
      <rect x={x + 4} y={y + 4} width={w - 8} height={h - 8} rx="2" fill="none" stroke="#fff" strokeOpacity="0.35" />
      <text
        x={x + w / 2}
        y={y + h / 2 + (sub ? -1 : 5)}
        textAnchor="middle"
        fontFamily="Oswald, Impact, sans-serif"
        fontSize={fitFont(text, w - 20, h * 0.42)}
        fill="#fff"
        style={{ paintOrder: 'stroke' }}
        stroke="#000"
        strokeOpacity="0.35"
        strokeWidth="2"
      >
        {text}
      </text>
      {sub && (
        <text x={x + w / 2} y={y + h - 7} textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="8" fill="#fff" opacity="0.85" letterSpacing="1.5">
          {sub}
        </text>
      )}
    </g>
  );
}

function renderScene(spec: SceneSpec, rng: Rng, id: string): ReactNode {
  const sky = <rect width={W} height={H} fill={`url(#sky${id})`} />;
  switch (spec.scene) {
    case 'hq':
      return (
        <g>
          {sky}
          {Array.from({ length: 30 }, (_, i) => (
            <circle key={i} cx={rng() * W} cy={rng() * 90} r={rng() * 1.2 + 0.3} fill="#fff" opacity={0.3 + rng() * 0.6} />
          ))}
          <line x1="320" y1="18" x2="320" y2="58" stroke="#888" strokeWidth="2" />
          <rect x="321" y="18" width="30" height="18" fill={spec.accent} />
          <polygon points="100,112 320,56 540,112" fill="#cfc6b0" />
          <rect x="100" y="110" width="440" height="16" fill="#b5ab92" />
          <rect x="112" y="126" width="416" height="172" fill="#d9d1bd" />
          {Array.from({ length: 7 }, (_, i) => {
            const x = 124 + i * 64;
            return (
              <g key={i}>
                <rect x={x} y="126" width="24" height="172" fill="#ece6d6" />
                <rect x={x + 16} y="126" width="8" height="172" fill="#000" opacity="0.12" />
                {i < 6 && (
                  <rect x={x + 33} y={150 + (i % 2) * 6} width="22" height="36" fill={rng() > 0.4 ? '#ffd76a' : '#2e2a40'} opacity="0.9" />
                )}
              </g>
            );
          })}
          <Sign x={190} y={140} w={260} h={46} text={spec.sign} accent={spec.accent} sub="SEDE SOCIAL" />
          <rect x="96" y="298" width="448" height="10" fill="#bfb6a0" />
          <rect x="80" y="308" width="480" height="10" fill="#a9a08a" />
          <rect y="318" width={W} height={H - 318} fill="#17151f" />
        </g>
      );
    case 'datacenter':
      return (
        <g>
          {sky}
          {[120, 320, 520].map((x) => (
            <rect key={x} x={x - 50} y="0" width="100" height="6" fill="#cfe3ff" opacity="0.5" />
          ))}
          <polygon points={`0,${H} ${W},${H} ${W},250 0,250`} fill="#0b1626" />
          {Array.from({ length: 9 }, (_, i) => (
            <line key={i} x1={i * 80} y1="250" x2={(i - 4) * 160 + 320} y2={H} stroke="#1d3350" strokeWidth="1" />
          ))}
          {Array.from({ length: 6 }, (_, r) => {
            const x = 18 + r * 104;
            return (
              <g key={r}>
                <rect x={x} y="70" width="88" height="180" fill="#151d2b" stroke="#2c3a52" strokeWidth="2" />
                {Array.from({ length: 12 }, (_, u) => (
                  <g key={u}>
                    <rect x={x + 6} y={78 + u * 14} width="76" height="10" fill="#1e2a3d" />
                    {Array.from({ length: 3 }, (_, l) => {
                      const colors = ['#2ecc71', spec.accent, '#ff4136', '#f1c40f'];
                      return (
                        <circle key={l} cx={x + 60 + l * 7} cy={83 + u * 14} r="1.8" fill={colors[Math.floor(rng() * colors.length)]}>
                          <animate attributeName="opacity" values="1;0.15;1" dur={`${0.4 + rng() * 1.6}s`} repeatCount="indefinite" />
                        </circle>
                      );
                    })}
                  </g>
                ))}
              </g>
            );
          })}
          <line x1="230" y1="0" x2="230" y2="14" stroke="#666" />
          <line x1="410" y1="0" x2="410" y2="14" stroke="#666" />
          <Sign x={200} y={14} w={240} h={44} text={spec.sign} accent={spec.accent} sub="CPD · ACCESO RESTRINGIDO" />
        </g>
      );
    case 'island':
      return (
        <g>
          {sky}
          <circle cx="470" cy="160" r="62" fill="#ffd36b" opacity="0.95" />
          <rect y="200" width={W} height={H - 200} fill="#1b5f9a" />
          {Array.from({ length: 7 }, (_, i) => (
            <path key={i} d={`M ${rng() * W} ${215 + i * 16} q 12 -6 24 0 t 24 0`} stroke="#9fd3ff" strokeOpacity="0.5" fill="none" strokeWidth="2" />
          ))}
          <rect x="400" y="200" width="140" height="4" fill="#ffd36b" opacity="0.6" />
          <path d={`M 0 ${H} L 0 250 Q 180 220 360 270 Q 420 290 470 ${H} Z`} fill="#e8c27a" />
          <path d="M 330 262 C 320 200 300 140 312 90" stroke="#6b4a2b" strokeWidth="12" fill="none" strokeLinecap="round" />
          {[-150, -100, -40, 20, 70].map((a, i) => (
            <path
              key={i}
              d="M 0 0 q 40 -24 85 6 q -45 -6 -85 -6"
              fill="#2f7d32"
              transform={`translate(312 90) rotate(${a})`}
            />
          ))}
          <polygon points="60,160 155,128 250,160" fill="#efe9da" />
          <rect x="66" y="160" width="178" height="96" fill="#f6f2e8" />
          {[78, 118, 158, 198].map((x) => (
            <rect key={x} x={x} y="164" width="12" height="92" fill="#ddd5c2" />
          ))}
          <Sign x={74} y={168} w={162} h={38} text={spec.sign} accent={spec.accent} sub="OFFSHORE BANK" />
        </g>
      );
    case 'office':
      return (
        <g>
          {sky}
          <rect x="384" y="36" width="220" height="160" fill="#0b1027" stroke="#11162a" strokeWidth="8" />
          {Array.from({ length: 9 }, (_, i) => {
            const h = 40 + rng() * 90;
            const x = 388 + i * 24;
            return (
              <g key={i}>
                <rect x={x} y={196 - h} width="20" height={h} fill="#1a2140" />
                {Array.from({ length: Math.floor(h / 14) }, (_, j) =>
                  rng() > 0.55 ? <rect key={j} x={x + 4 + (j % 2) * 7} y={200 - h + j * 13} width="4" height="5" fill="#ffd76a" opacity="0.8" /> : null,
                )}
              </g>
            );
          })}
          <line x1="494" y1="36" x2="494" y2="196" stroke="#11162a" strokeWidth="6" />
          <Sign x={44} y={50} w={290} h={58} text={spec.sign} accent={spec.accent} sub="OFICINAS CENTRALES" />
          <rect x="44" y="182" width="290" height="8" fill="#4a3424" />
          {Array.from({ length: 14 }, (_, i) => (
            <rect key={i} x={52 + i * 20} y="150" width="15" height="32" fill={['#c0392b', '#2980b9', '#27ae60', '#8e44ad', '#d35400'][Math.floor(rng() * 5)]} opacity="0.85" />
          ))}
          <rect y="270" width={W} height={H - 270} fill="#1a1d2e" />
          <rect x="20" y="262" width="600" height="14" fill="#5a3e2b" />
        </g>
      );
    case 'court':
      return (
        <g>
          {sky}
          <rect x="60" y="40" width="520" height="34" fill="#c9c3b3" />
          <text x="320" y="64" textAnchor="middle" fontFamily="Oswald, Impact, sans-serif" fontSize="20" fill="#3a3a3a" letterSpacing="5">
            AUDIENCIA NACIONAL
          </text>
          {[80, 200, 400, 520].map((x) => (
            <g key={x}>
              <rect x={x} y="74" width="40" height="190" fill="#e2ddcf" />
              <rect x={x + 28} y="74" width="12" height="190" fill="#000" opacity="0.12" />
            </g>
          ))}
          <g transform="translate(320 96)" stroke="#d4a017" strokeWidth="3" fill="none">
            <line x1="0" y1="-20" x2="0" y2="60" />
            <line x1="-60" y1="0" x2="60" y2="0" />
            <path d="M -60 0 L -78 34 L -42 34 Z" />
            <path d="M 60 0 L 42 26 L 78 26 Z" />
            <path d="M -80 34 a 18 8 0 0 0 40 0" fill="#d4a017" fillOpacity="0.3" />
            <path d="M 40 26 a 18 8 0 0 0 40 0" fill="#d4a017" fillOpacity="0.3" />
            <line x1="-20" y1="60" x2="20" y2="60" />
          </g>
          <Sign x={210} y={160} w={220} h={44} text={spec.sign} accent={spec.accent} sub="SUMARIO SECRETO" />
          <rect y="264" width={W} height={H - 264} fill="#2a1f18" />
        </g>
      );
  }
}

// -----------------------------------------------------------------------------
// Pruebas incautadas
// -----------------------------------------------------------------------------

function renderProp(prop: SceneProp, x: number, base: number, spec: SceneSpec, rng: Rng): ReactNode {
  const screenText = truncate(spec.screen, 22);
  switch (prop) {
    case 'briefcase':
      return (
        <g transform={`translate(${x - 60} ${base - 78})`}>
          <path d="M 42 14 v -10 h 36 v 10" stroke="#2b1a0c" strokeWidth="6" fill="none" />
          <rect x="22" y="2" width="20" height="16" fill="#3f9c4f" transform="rotate(-18 32 10)" />
          <rect x="70" y="0" width="22" height="16" fill="#3f9c4f" transform="rotate(14 80 8)" />
          <rect x="0" y="14" width="120" height="64" rx="7" fill="#6b4423" stroke="#2b1a0c" strokeWidth="3" />
          <rect x="0" y="38" width="120" height="4" fill="#2b1a0c" opacity="0.4" />
          <rect x="24" y="34" width="12" height="12" rx="2" fill="#d4a017" />
          <rect x="84" y="34" width="12" height="12" rx="2" fill="#d4a017" />
          <text x="60" y="68" textAnchor="middle" fontFamily="Oswald, sans-serif" fontSize="12" fill="#f5deb3" opacity="0.8">B</text>
        </g>
      );
    case 'envelopes':
      return (
        <g transform={`translate(${x} ${base - 34})`}>
          {[-16, 6, 22].map((a, i) => (
            <g key={i} transform={`translate(${(i - 1) * 34} ${-i * 8}) rotate(${a})`}>
              <rect x="-44" y="-26" width="88" height="54" fill="#efe3c2" stroke="#a89060" strokeWidth="2" />
              <polyline points="-44,-26 0,6 44,-26" fill="none" stroke="#a89060" strokeWidth="2" />
              {i === 2 && (
                <g>
                  <circle cx="22" cy="12" r="11" fill="none" stroke="#c0392b" strokeWidth="2.5" />
                  <text x="22" y="17" textAnchor="middle" fontFamily="Oswald, sans-serif" fontSize="13" fill="#c0392b">€</text>
                </g>
              )}
            </g>
          ))}
        </g>
      );
    case 'servers':
      return (
        <g transform={`translate(${x - 38} ${base - 112})`}>
          <rect width="76" height="112" rx="3" fill="#1b2433" stroke="#46587a" strokeWidth="2" />
          {Array.from({ length: 7 }, (_, i) => (
            <g key={i}>
              <rect x="6" y={6 + i * 15} width="64" height="11" fill="#263247" />
              <circle cx="58" cy={11.5 + i * 15} r="2" fill={i % 3 === 0 ? spec.accent : '#2ecc71'}>
                <animate attributeName="opacity" values="1;0.2;1" dur={`${0.5 + rng()}s`} repeatCount="indefinite" />
              </circle>
            </g>
          ))}
          <rect x="4" y="50" width="68" height="16" fill="#ffd400" transform="rotate(-8 38 58)" />
          <text x="38" y="62" textAnchor="middle" fontFamily="Oswald, sans-serif" fontSize="9" fill="#111" transform="rotate(-8 38 58)">PRUEBA Nº {Math.floor(rng() * 900 + 100)}</text>
        </g>
      );
    case 'money':
      return (
        <g transform={`translate(${x - 60} ${base})`}>
          {[0, 1, 2].map((s) =>
            Array.from({ length: 4 + s }, (_, i) => (
              <g key={`${s}-${i}`} transform={`translate(${s * 42} ${-12 - i * 11})`}>
                <rect width="58" height="11" rx="1" fill={i % 2 ? '#3e9b4f' : '#47ad59'} stroke="#25683a" />
                {i === 0 && <rect x="24" width="10" height="11" fill="#e8d38a" />}
              </g>
            )),
          )}
          <text x="60" y="-82" textAnchor="middle" fontFamily="Oswald, sans-serif" fontSize="18" fill="#9fffb0" opacity="0.9">€€€</text>
        </g>
      );
    case 'laptop':
      return (
        <g transform={`translate(${x - 64} ${base - 92})`}>
          <rect x="8" y="0" width="112" height="74" rx="4" fill="#2b2f3a" />
          <rect x="14" y="6" width="100" height="62" fill="#0b0f1a" />
          <text x="20" y="24" fontFamily="JetBrains Mono, monospace" fontSize={fitFont(screenText, 90, 9, 0.62)} fill={spec.accent}>
            {screenText}
          </text>
          <text x="20" y="40" fontFamily="JetBrains Mono, monospace" fontSize="8" fill="#9ef0b0">$ git push --force</text>
          <rect x="20" y="48" width="6" height="9" fill="#9ef0b0">
            <animate attributeName="opacity" values="1;0;1" dur="1s" repeatCount="indefinite" />
          </rect>
          <path d="M 0 78 h 128 l -8 14 h -112 z" fill="#9aa0ad" />
        </g>
      );
    case 'boxes':
      return (
        <g transform={`translate(${x - 70} ${base - 84})`}>
          {[
            [0, 30, 76, 54],
            [70, 20, 70, 64],
            [26, -16, 70, 46],
          ].map(([bx, by, bw, bh], i) => (
            <g key={i}>
              <rect x={bx} y={by} width={bw} height={bh} fill={i === 2 ? '#c99a5b' : '#b98a4e'} stroke="#7a5a30" strokeWidth="2" />
              <rect x={bx + bw / 2 - 5} y={by} width="10" height={bh} fill="#d9c08a" opacity="0.7" />
              <rect x={bx + 8} y={by + bh / 2 - 7} width={bw - 16} height="14" fill="#fff" opacity="0.85" />
              <text x={bx + bw / 2} y={by + bh / 2 + 4} textAnchor="middle" fontFamily="Oswald, sans-serif" fontSize="9" fill="#c0392b">
                {i === 2 ? 'node_modules' : 'PRUEBAS'}
              </text>
            </g>
          ))}
        </g>
      );
    case 'pods': {
      const hex = (cx: number, cy: number, r: number) =>
        Array.from({ length: 6 }, (_, i) => {
          const a = (Math.PI / 3) * i + Math.PI / 6;
          return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
        }).join(' ');
      const cells = [
        [0, 0],
        [-36, -20],
        [36, -20],
        [0, -40],
        [-36, -60],
        [36, -60],
        [0, -80],
      ];
      return (
        <g transform={`translate(${x} ${base - 22})`}>
          {cells.map(([cx, cy], i) => (
            <g key={i}>
              <polygon points={hex(cx, cy, 21)} fill={spec.accent} stroke="#fff" strokeOpacity="0.7" strokeWidth="2" opacity={0.75 + rng() * 0.25} />
              <text x={cx} y={cy + 4} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="9" fill="#fff">pod</text>
            </g>
          ))}
        </g>
      );
    }
    case 'monitor':
      return (
        <g transform={`translate(${x - 70} ${base - 112})`}>
          <rect width="140" height="92" rx="5" fill="#1d1f26" />
          <rect x="7" y="7" width="126" height="74" fill="#070b14" />
          <text x="14" y="26" fontFamily="JetBrains Mono, monospace" fontSize={fitFont(screenText, 116, 10, 0.62)} fill={spec.accent}>
            {screenText}
          </text>
          {[38, 50, 62].map((y, i) => (
            <rect key={y} x="14" y={y} width={40 + rng() * 70} height="4" fill="#9ef0b0" opacity={0.6 - i * 0.15} />
          ))}
          <rect x="62" y="92" width="16" height="12" fill="#2a2d36" />
          <rect x="40" y="104" width="60" height="6" rx="2" fill="#2a2d36" />
        </g>
      );
    case 'champagne':
      return (
        <g transform={`translate(${x - 60} ${base - 112})`}>
          {/* Cubitera con botella de cava */}
          <path d="M 4 62 L 60 62 L 54 112 L 10 112 Z" fill="#b8bfc9" stroke="#6d7480" strokeWidth="2" />
          <rect x="2" y="58" width="60" height="7" rx="3" fill="#d6dbe2" />
          <g transform="rotate(-12 32 60)">
            <rect x="22" y="14" width="20" height="54" rx="7" fill="#1f5c2e" />
            <rect x="27" y="0" width="10" height="20" rx="3" fill="#1f5c2e" />
            <rect x="26" y="0" width="12" height="10" rx="2" fill="#d4a017" />
            <rect x="22" y="30" width="20" height="16" fill="#f3e6c0" />
            <text x="32" y="41" textAnchor="middle" fontFamily="Oswald, sans-serif" fontSize="7" fill="#7a1f3d">GRAN RESERVA</text>
          </g>
          {/* Copas */}
          {[78, 104].map((cx, i) => (
            <g key={cx} transform={`rotate(${i ? 8 : -6} ${cx} 112)`}>
              <path d={`M ${cx - 9} 52 L ${cx + 9} 52 L ${cx + 4} 84 L ${cx - 4} 84 Z`} fill="#fff" fillOpacity="0.25" stroke="#fff" strokeOpacity="0.8" strokeWidth="1.5" />
              <path d={`M ${cx - 7} 60 L ${cx + 7} 60 L ${cx + 4} 82 L ${cx - 4} 82 Z`} fill="#f7d774" opacity="0.85" />
              <line x1={cx} y1="84" x2={cx} y2="106" stroke="#fff" strokeOpacity="0.8" strokeWidth="2" />
              <ellipse cx={cx} cy="108" rx="9" ry="3" fill="#fff" fillOpacity="0.6" />
            </g>
          ))}
          <text x="92" y="44" textAnchor="middle" fontFamily="Oswald, sans-serif" fontSize="12" fill="#ff8fb1" opacity="0.9">♥</text>
        </g>
      );
    case 'police':
      return (
        <g transform={`translate(${x - 85} ${base - 70})`}>
          <path d="M 10 40 L 40 14 L 120 14 L 150 40 L 166 44 L 166 62 L 4 62 L 4 44 Z" fill="#f4f4f4" stroke="#333" strokeWidth="2" />
          <path d="M 46 18 L 70 18 L 70 38 L 26 38 Z" fill="#7fa6d6" />
          <path d="M 76 18 L 116 18 L 136 38 L 76 38 Z" fill="#7fa6d6" />
          <rect x="4" y="46" width="162" height="8" fill="#1e4fd8" />
          <text x="85" y="53" textAnchor="middle" fontFamily="Oswald, sans-serif" fontSize="8" fill="#fff" letterSpacing="2">POLICÍA · UCO</text>
          <rect x="66" y="6" width="14" height="8" fill="#ff1f3d">
            <animate attributeName="opacity" values="1;0.2;1" dur="0.5s" repeatCount="indefinite" />
          </rect>
          <rect x="80" y="6" width="14" height="8" fill="#2f6bff">
            <animate attributeName="opacity" values="0.2;1;0.2" dur="0.5s" repeatCount="indefinite" />
          </rect>
          <circle cx="40" cy="64" r="12" fill="#111" />
          <circle cx="132" cy="64" r="12" fill="#111" />
          <circle cx="40" cy="64" r="5" fill="#777" />
          <circle cx="132" cy="64" r="5" fill="#777" />
        </g>
      );
  }
}
