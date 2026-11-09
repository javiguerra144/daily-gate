import { useEffect, useState } from 'react';
import { drawGovernment } from './engine/draw';
import type { SessionSummary } from './engine/summary';
import { toRecord } from './engine/summary';
import { DrawScreen } from './screens/DrawScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { SessionScreen } from './screens/SessionScreen';
import { SetupScreen } from './screens/SetupScreen';
import { SummaryScreen } from './screens/SummaryScreen';
import { loadConfig, loadHistory, saveConfig, saveHistory } from './storage';
import type { Config, LegislatureRecord } from './types';

type Screen =
  | { name: 'setup' }
  | { name: 'draw'; drawId: number; government: Config }
  | { name: 'session'; runId: number; government: Config }
  | { name: 'summary'; summary: SessionSummary }
  | { name: 'history' };

export function App() {
  const [config, setConfig] = useState<Config>(loadConfig);
  const [history, setHistory] = useState<LegislatureRecord[]>(loadHistory);
  const [screen, setScreen] = useState<Screen>({ name: 'setup' });

  useEffect(() => saveConfig(config), [config]);
  useEffect(() => saveHistory(history), [history]);

  /** Sortea cargos y orden de intervención a partir de la convocatoria actual. */
  const newDraw = () => setScreen({ name: 'draw', drawId: Date.now(), government: drawGovernment(config) });

  const onFinish = (summary: SessionSummary) => {
    if (summary.turns.some((t) => t.status === 'done')) {
      setHistory((h) => [...h, toRecord(summary)]);
    }
    setScreen({ name: 'summary', summary });
  };

  switch (screen.name) {
    case 'setup':
      return (
        <SetupScreen
          config={config}
          onChange={setConfig}
          onStart={newDraw}
          onHistory={() => setScreen({ name: 'history' })}
          historyCount={history.length}
        />
      );
    case 'draw':
      return (
        <DrawScreen
          key={screen.drawId}
          config={screen.government}
          onBegin={() => setScreen({ name: 'session', runId: Date.now(), government: screen.government })}
          onRedraw={newDraw}
          onBack={() => setScreen({ name: 'setup' })}
        />
      );
    case 'session':
      return (
        <SessionScreen
          key={screen.runId}
          config={screen.government}
          history={history}
          onFinish={onFinish}
          onAbort={() => setScreen({ name: 'setup' })}
        />
      );
    case 'summary':
      return (
        <SummaryScreen
          summary={screen.summary}
          sounds={config.sounds}
          onRestart={newDraw}
          onSetup={() => setScreen({ name: 'setup' })}
          onHistory={() => setScreen({ name: 'history' })}
        />
      );
    case 'history':
      return (
        <HistoryScreen
          history={history}
          onClear={() => setHistory([])}
          onBack={() => setScreen({ name: 'setup' })}
        />
      );
  }
}
