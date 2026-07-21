function buildLanes(log, processCount) {
  const lanes = {};
  for (let i = 1; i <= processCount; i++) {
    lanes[i] = { segments: [], violations: [], pendingAcquire: null };
  }

  for (const entry of log) {
    const lane = lanes[entry.process];
    if (!lane) continue;

    if (entry.event === 'SPIN') {
      lane.segments.push({ start: entry.time, end: entry.time + 15, type: 'spin' });
    } else if (entry.event === 'ACQUIRED') {
      lane.pendingAcquire = entry.time;
    } else if (entry.event === 'RELEASED') {
      if (lane.pendingAcquire !== null) {
        lane.segments.push({ start: lane.pendingAcquire, end: entry.time, type: 'critical' });
        lane.pendingAcquire = null;
      }
    } else if (entry.event === 'RACE_VIOLATION') {
      lane.violations.push(entry.time);
    }
  }

  return lanes;
}

export default function ProcessTimeline({ log, processCount, durationMs }) {
  if (!log || log.length === 0) return null;
  const lanes = buildLanes(log, processCount);
  const total = Math.max(durationMs, 1);
  const pct = (t) => `${Math.min((t / total) * 100, 100)}%`;

  return (
    <div className="timeline-wrap">
      <div className="section-title">Bus Timeline</div>
      {Object.entries(lanes).map(([pid, lane]) => (
        <div className="timeline-lane" key={pid}>
          <div className="lane-label">P{pid}</div>
          <div className="lane-track">
            {lane.segments.map((seg, i) => (
              <div
                key={i}
                className={`segment ${seg.type}`}
                style={{ left: pct(seg.start), width: `calc(${pct(seg.end)} - ${pct(seg.start)})` }}
                title={`${seg.type} ${seg.start}ms–${seg.end}ms`}
              />
            ))}
            {lane.violations.map((t, i) => (
              <div key={`v${i}`} className="marker" style={{ left: pct(t) }} title={`race violation @ ${t}ms`} />
            ))}
          </div>
        </div>
      ))}
      <div className="timeline-axis">
        <div />
        <div className="axis-track">
          <span>0ms</span>
          <span>{Math.round(total / 2)}ms</span>
          <span>{total}ms</span>
        </div>
      </div>
      <div className="timeline-legend">
        <span>
          <span className="swatch" style={{ background: 'var(--led-green-dim)', border: '1px solid var(--led-green)' }} />
          critical section
        </span>
        <span>
          <span className="swatch" style={{ background: 'rgba(255,93,93,0.35)' }} />
          spin-wait
        </span>
        <span>
          <span className="swatch" style={{ background: 'var(--led-red)' }} />
          mutual-exclusion violation
        </span>
      </div>
    </div>
  );
}
