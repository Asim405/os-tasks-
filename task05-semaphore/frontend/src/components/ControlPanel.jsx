export default function ControlPanel({
  running,
  connected,
  speed,
  onStart,
  onPause,
  onReset,
  onSpeedChange,
}) {
  return (
    <div className="panel">
      <div className="panel-status">
        <span className={`dot ${connected ? "dot-live" : "dot-off"}`} />
        <span className="panel-status-text">
          {connected ? (running ? "Running" : "Connected · idle") : "Connecting…"}
        </span>
      </div>

      <div className="panel-controls">
        <button className="btn btn-go" onClick={onStart} disabled={!connected || running}>
          Start
        </button>
        <button className="btn btn-hold" onClick={onPause} disabled={!connected || !running}>
          Pause
        </button>
        <button className="btn btn-reset" onClick={onReset} disabled={!connected}>
          Reset
        </button>
      </div>

      <label className="panel-speed">
        <span>Speed</span>
        <input
          type="range"
          min="0.25"
          max="4"
          step="0.25"
          value={speed}
          onChange={(e) => onSpeedChange(Number(e.target.value))}
          disabled={!connected}
        />
        <span className="panel-speed-value">{speed.toFixed(2)}×</span>
      </label>
    </div>
  );
}
