import { useMemo } from "react";
import { useSimSocket } from "./hooks/useSimSocket";
import SignalMast from "./components/SignalMast";
import TrainCar from "./components/TrainCar";
import EventTicker from "./components/EventTicker";
import ControlPanel from "./components/ControlPanel";
import "./App.css";

export default function App() {
  const { state, connected, start, pause, reset, setSpeed } = useSimSocket();

  const queuePositions = useMemo(() => {
    if (!state) return {};
    const map = {};
    state.semaphore.queue.forEach((pid, i) => {
      map[pid] = i;
    });
    return map;
  }, [state]);

  const platformLabelFor = (resource) => {
    if (resource.ownerId === null || !state) return null;
    const owner = state.processes.find((p) => p.id === resource.ownerId);
    return owner ? owner.label : null;
  };

  return (
    <div className="app">
      <header className="masthead">
        <div className="masthead-title">
          <span className="eyebrow">Process synchronization · counting semaphore</span>
          <h1>Signal Box</h1>
          <p className="subtitle">
            5 trains share 3 platforms. A single counting semaphore, starting
            at 3, decides who gets a platform and who waits at the signal.
          </p>
        </div>

        {state && (
          <div className="semaphore-readout">
            <span className="readout-label">Semaphore value</span>
            <span className="readout-value">
              {state.semaphore.value}
              <span className="readout-max">/{state.semaphore.max}</span>
            </span>
            <span className="readout-sub">
              {state.semaphore.queue.length} waiting
            </span>
          </div>
        )}
      </header>

      <ControlPanel
        running={state?.running ?? false}
        connected={connected}
        speed={state?.speed ?? 1}
        onStart={start}
        onPause={pause}
        onReset={reset}
        onSpeedChange={setSpeed}
      />

      {!connected && (
        <div className="connect-notice">
          Waiting for the backend at <code>{import.meta.env.VITE_WS_URL || "ws://localhost:4000/ws"}</code>.
          Start the server in <code>/backend</code> with <code>npm start</code>.
        </div>
      )}

      {state && (
        <>
          <section className="masts-row" aria-label="Platforms (resources)">
            {state.resources.map((r, i) => (
              <SignalMast key={r.id} index={i} occupantLabel={platformLabelFor(r)} />
            ))}
          </section>

          <section className="track" aria-label="Trains (processes)">
            {state.processes.map((p) => (
              <TrainCar
                key={p.id}
                process={p}
                queuePosition={queuePositions[p.id]}
              />
            ))}
          </section>

          <section className="lower-grid">
            <EventTicker log={state.log} />

            <div className="legend">
              <div className="legend-title">How to read this</div>
              <ul>
                <li>
                  <span className="swatch swatch-thinking" /> En route — the
                  train hasn&rsquo;t requested a platform yet.
                </li>
                <li>
                  <span className="swatch swatch-waiting" /> Held at signal —
                  blocked on <code>wait()</code>, queued in FIFO order because
                  all 3 platforms are taken.
                </li>
                <li>
                  <span className="swatch swatch-using" /> On platform — holds
                  the resource inside the critical section.
                </li>
              </ul>
              <p className="legend-note">
                Releasing a platform calls <code>signal()</code>: if a train
                is queued, the permit passes straight to the head of the
                queue rather than going back to the free pool first —
                the classic hand-off that keeps this starvation-free.
              </p>
            </div>
          </section>
        </>
      )}

      <footer className="foot">
        Backend: Express + ws, one <code>CountingSemaphore</code> instance.
        Frontend: React, live over WebSocket.
      </footer>
    </div>
  );
}
