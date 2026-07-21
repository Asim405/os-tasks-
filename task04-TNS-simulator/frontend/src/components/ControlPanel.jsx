export default function ControlPanel({ config, onChange, onRun, running }) {
  const set = (key) => (e) => {
    const val = e.target.type === 'number' || e.target.type === 'range' ? Number(e.target.value) : e.target.value;
    onChange({ ...config, [key]: val });
  };

  return (
    <div className="control-panel">
      <div className="control-grid">
        <div className="field">
          <label>
            Processes <span className="value">{config.processCount}</span>
          </label>
          <input
            type="range"
            min={2}
            max={8}
            value={config.processCount}
            onChange={set('processCount')}
          />
        </div>

        <div className="field">
          <label>
            Critical section (ms) <span className="value">{config.criticalSectionTime}</span>
          </label>
          <input
            type="range"
            min={50}
            max={600}
            step={10}
            value={config.criticalSectionTime}
            onChange={set('criticalSectionTime')}
          />
        </div>

        <div className="field">
          <label>
            Attempts / process <span className="value">{config.attemptsPerProcess}</span>
          </label>
          <input
            type="range"
            min={1}
            max={3}
            value={config.attemptsPerProcess}
            onChange={set('attemptsPerProcess')}
          />
        </div>

        <div className="field">
          <label>Instruction mode</label>
          <div className="mode-switch">
            <button
              type="button"
              className={config.mode === 'atomic' ? 'active' : ''}
              onClick={() => onChange({ ...config, mode: 'atomic' })}
            >
              ATOMIC
            </button>
            <button
              type="button"
              className={config.mode === 'naive' ? 'active' : ''}
              onClick={() => onChange({ ...config, mode: 'naive' })}
            >
              NAIVE
            </button>
          </div>
        </div>
      </div>

      <div className="control-footer">
        <p className="mode-note">
          {config.mode === 'atomic'
            ? 'Atomic mode runs the real Test-and-Set instruction — the read and write of the lock happen with no gap between them, so mutual exclusion always holds.'
            : 'Naive mode reads the lock, yields control, then writes it — reopening the gap Test-and-Set is designed to close. Run it a few times and watch for violations.'}
        </p>
        <button className="run-button" onClick={onRun} disabled={running}>
          {running ? 'RUNNING…' : 'RUN SIMULATION'}
        </button>
      </div>
    </div>
  );
}
