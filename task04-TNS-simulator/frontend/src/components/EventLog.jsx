export default function EventLog({ log }) {
  return (
    <div>
      <div className="section-title">Event Log</div>
      <div className="log-wrap">
        {!log || log.length === 0 ? (
          <div className="empty-state">Run the simulation to generate a trace.</div>
        ) : (
          log.map((entry, i) => (
            <div className={`log-row evt-${entry.event}`} key={i}>
              <span className="t">{entry.time}ms</span>
              <span className="p">P{entry.process}</span>
              <span className="e">
                {entry.event}
                {entry.spins ? ` (×${entry.spins})` : ''}
                {entry.concurrentHolders ? ` — ${entry.concurrentHolders} holders` : ''}
              </span>
              <span className="lock">{entry.lockValue ? '1' : '0'}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
