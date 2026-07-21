import { useEffect, useRef, useState } from 'react';
import RegisterDisplay from './components/RegisterDisplay.jsx';
import ControlPanel from './components/ControlPanel.jsx';
import ProcessTimeline from './components/ProcessTimeline.jsx';
import EventLog from './components/EventLog.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'https://os-tasks-whmi.vercel.app/';
const MAX_PLAYBACK_MS = 5000;

export default function App() {
  const [config, setConfig] = useState({
    processCount: 4,
    mode: 'atomic',
    minDelay: 50,
    maxDelay: 300,
    criticalSectionTime: 200,
    attemptsPerProcess: 1,
  });

  const [algorithmInfo, setAlgorithmInfo] = useState(null);
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const [locked, setLocked] = useState(false);
  const [visibleCount, setVisibleCount] = useState(0);
  const timers = useRef([]);

  useEffect(() => {
    fetch(`${API_URL}/api/algorithm-info`)
      .then((r) => r.json())
      .then(setAlgorithmInfo)
      .catch(() => {
        // Info panel is non-critical — the simulator still works without it.
      });
  }, []);

  const clearTimers = () => {
    timers.current.forEach((id) => clearTimeout(id));
    timers.current = [];
  };

  useEffect(() => clearTimers, []);

  async function runSimulation() {
    clearTimers();
    setError(null);
    setRunning(true);
    setResult(null);
    setVisibleCount(0);
    setLocked(false);

    try {
      const res = await fetch(`${API_URL}/api/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error(`Backend responded ${res.status}`);
      const data = await res.json();
      setResult(data);
      playback(data);
    } catch (err) {
      setError(
        err.message === 'Failed to fetch'
          ? `Couldn't reach the simulation backend at ${API_URL}. Is it running?`
          : err.message
      );
      setRunning(false);
    }
  }

  function playback(data) {
    const log = data.log;
    const duration = Math.max(data.summary.durationMs, 1);
    const scale = Math.min(1, MAX_PLAYBACK_MS / duration);

    log.forEach((entry, i) => {
      const id = setTimeout(() => {
        setVisibleCount(i + 1);
        setLocked(!!entry.lockValue);
        if (i === log.length - 1) setRunning(false);
      }, entry.time * scale);
      timers.current.push(id);
    });

    if (log.length === 0) setRunning(false);
  }

  const visibleLog = result ? result.log.slice(0, visibleCount) : [];

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <div className="brand">OS Coursework // Synchronization Primitives</div>
          <h1>
            TEST<span>-AND-</span>SET
          </h1>
        </div>
        <div className="subtitle">
          A live simulation of the hardware spinlock instruction, and what breaks when you take
          away its atomicity.
        </div>
      </header>

      <RegisterDisplay locked={locked} algorithmInfo={algorithmInfo} />

      <ControlPanel config={config} onChange={setConfig} onRun={runSimulation} running={running} />

      {error && <div className="error-banner">⚠ {error}</div>}

      {result && (
        <div className="summary-row">
          <div className="stat-card">
            <div className="label">Mode</div>
            <div className="value">{result.mode.toUpperCase()}</div>
          </div>
          <div className="stat-card">
            <div className="label">Processes</div>
            <div className="value">{result.processCount}</div>
          </div>
          <div className="stat-card">
            <div className="label">Events</div>
            <div className="value">{result.summary.totalEvents}</div>
          </div>
          <div className={`stat-card ${result.summary.mutualExclusionViolations > 0 ? 'violations' : 'clean'}`}>
            <div className="label">Violations</div>
            <div className="value">{result.summary.mutualExclusionViolations}</div>
          </div>
        </div>
      )}

      {result && (
        <ProcessTimeline log={result.log} processCount={result.processCount} durationMs={result.summary.durationMs} />
      )}

      <EventLog log={visibleLog} />

      <footer className="app-footer">
        test-and-set simulator — frontend on netlify, simulation engine on vercel
      </footer>
    </div>
  );
}
